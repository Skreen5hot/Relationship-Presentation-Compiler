import assert from "node:assert/strict";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { chromium } from "playwright";

import { contextDocument, document } from "./probe-fixture.mjs";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const buildDirectory = resolve(packageRoot, "build", "phase0");
const { runPhase0ExpansionProbe } = await import(
  "../../build/phase0/core-edge-smoke.bundle.mjs"
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

test("Chromium Worker produces the Node-equivalent expansion and digest", async () => {
  const server = createServer(async (request, response) => {
    if (request.url === "/") {
      response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      response.end("<!doctype html><title>Phase 0 worker probe</title>");
      return;
    }

    const filename = request.url?.slice(1);
    if (!filename || !["worker-smoke.bundle.mjs"].includes(filename)) {
      response.writeHead(404);
      response.end();
      return;
    }

    const fullPath = resolve(buildDirectory, filename);
    const metadata = await stat(fullPath);
    response.writeHead(200, {
      "content-length": metadata.size,
      "content-type": "text/javascript; charset=utf-8"
    });
    createReadStream(fullPath).pipe(response);
  });

  const address = await listen(server);
  let browser;

  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${address.port}/`);
    const browserResult = await page.evaluate(
      ({ inputDocument, inputContext }) =>
        new Promise((resolveResult, reject) => {
          const worker = new Worker("/worker-smoke.bundle.mjs", { type: "module" });
          worker.onerror = (event) => reject(new Error(event.message));
          worker.onmessage = (event) => {
            worker.terminate();
            if (event.data.status === "error") {
              reject(new Error(event.data.message));
            } else {
              resolveResult(event.data.result);
            }
          };
          worker.postMessage({
            contextDocument: inputContext,
            document: inputDocument,
            poisonNetwork: true
          });
        }),
      { inputContext: contextDocument, inputDocument: document }
    );
    const nodeResult = await runPhase0ExpansionProbe(document, contextDocument);

    assert.deepEqual(browserResult, nodeResult);
  } finally {
    await browser?.close();
    server.closeAllConnections();
    await close(server);
  }
});
