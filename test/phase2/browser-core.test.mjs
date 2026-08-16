import assert from "node:assert/strict";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

import {
  bytes,
  canonicalCoreRequest,
  cloneCoreRequest,
  comparableResult,
} from "./core-request-fixture.mjs";

const repositoryRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const buildDirectory = resolve(repositoryRoot, "build", "phase2");
const { compileCore } = await import(
  "../../build/phase2/relationship-presentation-core.skeleton.bundle.mjs"
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

function browserRequest(coreRequest) {
  return {
    inputs: Object.fromEntries(
      Object.entries(coreRequest.inputs).map(([role, value]) => [
        role,
        value instanceof Uint8Array ? [...value] : value,
      ]),
    ),
  };
}

test("Chromium matches Node for the poisoned Phase 2 core corpus", async () => {
  const canonical = await canonicalCoreRequest();
  const missingInput = cloneCoreRequest(canonical);
  delete missingInput.inputs.source;
  const unknownInput = cloneCoreRequest(canonical);
  unknownInput.inputs.extra = new Uint8Array();
  const nonByteInput = cloneCoreRequest(canonical);
  nonByteInput.inputs.source = "not bytes";
  const lockedRoles = [
    "context",
    "contract",
    "canonicalProfile",
    "carrierStyle",
    "carrierNavigation",
  ];
  const lockedMutations = lockedRoles.map((role, index) => {
    const request = cloneCoreRequest(canonical);
    request.inputs[role][0] ^= 1;
    return [request, index + 1, 0];
  });
  const duplicateSource = cloneCoreRequest(canonical);
  duplicateSource.inputs.source = bytes('{"x":1,"\\u0078":2}');
  const deepSource = cloneCoreRequest(canonical);
  deepSource.inputs.source = bytes(`${"[".repeat(65)}0${"]".repeat(65)}`);
  const invalidRequestUtf8 = cloneCoreRequest(canonical);
  invalidRequestUtf8.inputs.request = new Uint8Array([0xff]);
  const corpus = [
    [canonical, 5, 6],
    [missingInput, 0, 0],
    [unknownInput, 0, 0],
    [nonByteInput, 0, 0],
    ...lockedMutations,
    [duplicateSource, 5, 5],
    [deepSource, 5, 5],
    [invalidRequestUtf8, 5, 6],
  ];

  const server = (await import("node:http")).createServer(async (request, response) => {
    if (request.url === "/") {
      response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      response.end("<!doctype html><title>Phase 2 core corpus</title>");
      return;
    }
    const filename = request.url?.slice(1);
    if (
      ![
        "poison-worker.bundle.mjs",
        "relationship-presentation-core.skeleton.bundle.mjs",
      ].includes(filename)
    ) {
      response.writeHead(404);
      response.end();
      return;
    }
    const fullPath = resolve(buildDirectory, filename);
    const metadata = await stat(fullPath);
    response.writeHead(200, {
      "content-length": metadata.size,
      "content-type": "text/javascript; charset=utf-8",
    });
    createReadStream(fullPath).pipe(response);
  });

  const address = await listen(server);
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${address.port}/`);

    for (const [coreRequest, digestCount, decoderCount] of corpus) {
      const expected = comparableResult(await compileCore(coreRequest));
      const browserResult = await page.evaluate(
        (serializedRequest) =>
          new Promise((resolveResult, reject) => {
            const worker = new Worker("/poison-worker.bundle.mjs", {
              type: "module",
            });
            worker.onerror = (event) => reject(new Error(event.message));
            worker.onmessage = (event) => {
              worker.terminate();
              const message = event.data;
              if (message.harnessError !== undefined) {
                reject(new Error(message.harnessError));
                return;
              }
              resolveResult({
                observations: message.observations,
                result: {
                  ...message.result,
                  errorReport: [...message.result.errorReport],
                },
              });
            };
            worker.postMessage({
              inputs: Object.fromEntries(
                Object.entries(serializedRequest.inputs).map(([role, value]) => [
                  role,
                  Array.isArray(value) ? new Uint8Array(value) : value,
                ]),
              ),
            });
          }),
        browserRequest(coreRequest),
      );

      assert.deepEqual(browserResult.result, expected);
      assert.deepEqual(
        browserResult.observations.digests,
        Array(digestCount).fill("SHA-256"),
      );
      assert.equal(
        browserResult.observations.decoders.filter(({ fatal }) => fatal === true)
          .length,
        decoderCount,
      );
      assert.equal(browserResult.observations.encoders, 1);
    }
  } finally {
    await browser?.close();
    server.closeAllConnections();
    await close(server);
  }
});
