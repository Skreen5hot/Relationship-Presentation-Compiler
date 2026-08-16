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
    "src/host-browser/embed.js",
    "src/host-browser/host-failure.js",
    "src/host-browser/worker-harness.js",
    "src/core/error-codes.js",
    "src/core/status-line.js",
  ].map((path) => [`/${path}`, resolve(repositoryRoot, path)]),
);

function listen(server) {
  return new Promise((resolveListen, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolveListen(server.address()));
  });
}

function close(server) {
  return new Promise((resolveClose, reject) => {
    server.close((error) => (error ? reject(error) : resolveClose()));
  });
}

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

test("the complete release corpus is byte-identical through real Chromium", async () => {
  const server = createServer(async (request, response) => {
    if (request.url === "/") {
      response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      response.end("<!doctype html><title>Phase 10 full equivalence</title>");
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

  const address = await listen(server);
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
      expected.push({
        name: entry.name,
        result: comparableResult(await core.compileCore(entry.coreRequest)),
      });
    }

    const actual = await page.evaluate(async (serializedCorpus) => {
      const { createRelationshipPresentationCompiler } = await import(
        "/src/host-browser/embed.js"
      );
      const compiler = createRelationshipPresentationCompiler();
      const results = [];
      try {
        for (const entry of serializedCorpus) {
          const request =
            entry.coreRequest?.inputs === undefined
              ? entry.coreRequest
              : {
                  inputs: Object.fromEntries(
                    Object.entries(entry.coreRequest.inputs).map(
                      ([role, encoded]) => [
                        role,
                        encoded.kind === "bytes"
                          ? new Uint8Array(encoded.value)
                          : encoded.value,
                      ],
                    ),
                  ),
                };
          const result = await compiler.compile(request);
          results.push({
            name: entry.name,
            result: {
              ...result,
              ...(result.artifacts === undefined
                ? {}
                : {
                    artifacts: Object.fromEntries(
                      Object.entries(result.artifacts).map(([name, value]) => [
                        name,
                        [...value],
                      ]),
                    ),
                  }),
              ...(result.errorReport === undefined
                ? {}
                : { errorReport: [...result.errorReport] }),
            },
          });
        }
      } finally {
        await compiler.close();
      }
      return results;
    }, corpus.map((entry) => ({
      coreRequest: serializeRequest(entry.coreRequest),
      name: entry.name,
    })));

    assert.deepEqual(actual, expected);
  } finally {
    await browser?.close();
    server.closeAllConnections();
    await close(server);
  }
});
