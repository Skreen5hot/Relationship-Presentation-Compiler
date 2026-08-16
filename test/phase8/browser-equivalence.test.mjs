import assert from "node:assert/strict";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { resolve } from "node:path";
import test from "node:test";

import { chromium } from "playwright";

import { CANONICAL_ARTIFACT_NAMES } from "../../src/core/artifact-set.js";
import {
  canonicalCoreRequest,
  comparableResult,
} from "../phase2/core-request-fixture.mjs";
import { repositoryRoot } from "../phase5/phase5-fixture.mjs";

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

test("the Browser Worker returns the exact Node Phase 8 success byte map", async () => {
  const server = createServer(async (request, response) => {
    if (request.url === "/") {
      response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      response.end("<!doctype html><title>Phase 8 equivalence</title>");
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
    const request = await canonicalCoreRequest();
    const core = await import(
      "../../browser/relationship-presentation-core.bundle.mjs"
    );
    const expected = comparableResult(await core.compileCore(request));
    const serializedInputs = Object.fromEntries(
      Object.entries(request.inputs).map(([role, bytes]) => [role, [...bytes]]),
    );
    const actual = await page.evaluate(async (inputs) => {
      const { createRelationshipPresentationCompiler } = await import(
        "/src/host-browser/embed.js"
      );
      const compiler = createRelationshipPresentationCompiler();
      try {
        const result = await compiler.compile({
          inputs: Object.fromEntries(
            Object.entries(inputs).map(([role, bytes]) => [
              role,
              new Uint8Array(bytes),
            ]),
          ),
        });
        return {
          ...result,
          artifacts: Object.fromEntries(
            Object.entries(result.artifacts).map(([name, bytes]) => [
              name,
              [...bytes],
            ]),
          ),
        };
      } finally {
        await compiler.close();
      }
    }, serializedInputs);

    assert.deepEqual(actual, expected);
    assert.deepEqual(Object.keys(actual.artifacts), CANONICAL_ARTIFACT_NAMES);
  } finally {
    await browser?.close();
    server.closeAllConnections();
    await close(server);
  }
});
