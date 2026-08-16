import assert from "node:assert/strict";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { resolve } from "node:path";
import test from "node:test";

import { chromium } from "playwright";

import { comparableResult } from "../phase2/core-request-fixture.mjs";
import { repositoryRoot } from "../phase5/phase5-fixture.mjs";
import { buildConformanceCorpus } from "./conformance-corpus.mjs";

const servedFiles = new Map(
  [
    "browser/relationship-presentation-core.bundle.mjs",
    "test/phase2/poisoned-globals-harness.mjs",
    "test/phase10/browser-poison-corpus-worker.js",
  ].map((path) => [`/${path}`, resolve(repositoryRoot, path)]),
);

function serializeRequest(coreRequest) {
  if (coreRequest?.inputs === undefined) {
    return coreRequest;
  }
  return {
    inputs: Object.fromEntries(
      Object.entries(coreRequest.inputs).map(([role, value]) => [
        role,
        Object.prototype.toString.call(value) === "[object Uint8Array]"
          ? { kind: "bytes", value: [...value] }
          : { kind: "raw", value },
      ]),
    ),
  };
}

test("the full corpus stays inside the CPS under poisoned Chromium globals", async () => {
  const server = createServer(async (request, response) => {
    if (request.url === "/") {
      response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      response.end("<!doctype html><title>Phase 10 poisoned corpus</title>");
      return;
    }
    const path = servedFiles.get(request.url);
    if (path === undefined) {
      response.writeHead(404);
      response.end();
      return;
    }
    const metadata = await stat(path);
    response.writeHead(200, {
      "content-length": metadata.size,
      "content-type": "text/javascript; charset=utf-8",
    });
    createReadStream(path).pipe(response);
  });
  const address = await new Promise((resolveListen, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolveListen(server.address()));
  });

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${address.port}/`);
    const corpus = await buildConformanceCorpus();
    const core = await import(
      "../../browser/relationship-presentation-core.bundle.mjs"
    );
    const expected = [];
    for (const entry of corpus) {
      expected.push(comparableResult(await core.compileCore(entry.coreRequest)));
    }
    const poisoned = await page.evaluate(
      (serializedCorpus) =>
        new Promise((resolveResult, reject) => {
          const worker = new Worker(
            "/test/phase10/browser-poison-corpus-worker.js",
            { type: "module" },
          );
          worker.onerror = (event) => reject(new Error(event.message));
          worker.onmessage = (event) => {
            worker.terminate();
            resolveResult(event.data);
          };
          worker.postMessage(serializedCorpus);
        }),
      corpus.map(({ coreRequest }) => serializeRequest(coreRequest)),
    );
    assert.equal(poisoned.harnessError, undefined);
    assert.deepEqual(
      poisoned.results.map((result) =>
        comparableResult({
          ...result,
          ...(result.artifacts === undefined
            ? {}
            : {
                artifacts: Object.fromEntries(
                  Object.entries(result.artifacts).map(([name, value]) => [
                    name,
                    new Uint8Array(value),
                  ]),
                ),
              }),
          ...(result.errorReport === undefined
            ? {}
            : { errorReport: new Uint8Array(result.errorReport) }),
        }),
      ),
      expected,
    );
    assert.ok(poisoned.observations.digests.length > 0);
    assert.equal(
      poisoned.observations.digests.every(
        (algorithm) => algorithm === "SHA-256",
      ),
      true,
    );
    assert.equal(
      poisoned.observations.decoders.every(({ fatal }) => fatal === true),
      true,
    );
  } finally {
    await browser?.close();
    server.closeAllConnections();
    await new Promise((resolveClose, reject) => {
      server.close((error) => (error ? reject(error) : resolveClose()));
    });
  }
});
