import assert from "node:assert/strict";
import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

import { parseJsonBytes } from "../../src/core/json-scan.js";
import {
  canonicalCoreRequest,
  cloneCoreRequest,
  comparableResult,
} from "../phase2/core-request-fixture.mjs";

const repositoryRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const servedFiles = new Map(
  [
    "browser/relationship-presentation-core.bundle.mjs",
    "src/host-browser/embed.js",
    "src/host-browser/worker-harness.js",
    "test/phase4/never-reply-worker.js",
    "test/phase4/throw-on-load-worker.js",
    "test/phase4/malformed-result-worker.js",
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

function serializeCoreRequest(coreRequest) {
  return {
    inputs: Object.fromEntries(
      Object.entries(coreRequest.inputs).map(([role, value]) => [
        role,
        value instanceof Uint8Array ? [...value] : value,
      ]),
    ),
  };
}

async function browserCompile(page, coreRequest, options = {}) {
  return page.evaluate(
    async ({ options, serializedRequest }) => {
      const { createRelationshipPresentationCompiler } = await import(
        "/src/host-browser/embed.js"
      );
      const handle = createRelationshipPresentationCompiler(options);
      try {
        const request = {
          inputs: Object.fromEntries(
            Object.entries(serializedRequest.inputs).map(([role, value]) => [
              role,
              Array.isArray(value) ? new Uint8Array(value) : value,
            ]),
          ),
        };
        const result = await handle.compile(request, options.supervision);
        return {
          ...result,
          ...(result.artifacts === undefined
            ? {}
            : {
                artifacts: Object.fromEntries(
                  Object.entries(result.artifacts).map(([name, bytes]) => [
                    name,
                    [...bytes],
                  ]),
                ),
              }),
          ...(result.errorReport === undefined
            ? {}
            : { errorReport: [...result.errorReport] }),
        };
      } finally {
        await handle.close();
      }
    },
    { options, serializedRequest: serializeCoreRequest(coreRequest) },
  );
}

test("the Phase 4 reference host matches Node and supervises Worker failure", async () => {
  const server = createServer(async (request, response) => {
    if (request.url === "/") {
      response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      response.end("<!doctype html><title>Phase 4 browser host</title>");
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

    const lock = parseJsonBytes(
      new Uint8Array(await readFile(resolve(repositoryRoot, "browser-host.lock.json"))),
    ).value;
    assert.equal(browser.version(), lock.engineBaselines[0].version);

    const coreModule = await import(
      "../../browser/relationship-presentation-core.bundle.mjs"
    );
    const canonical = await canonicalCoreRequest();
    const mutated = cloneCoreRequest(canonical);
    mutated.inputs.carrierStyle[0] ^= 1;
    const invalid = cloneCoreRequest(canonical);
    invalid.inputs.source = "not bytes";

    for (const coreRequest of [canonical, mutated, invalid]) {
      const expected = comparableResult(
        await coreModule.compileCore(coreRequest),
      );
      assert.deepEqual(await browserCompile(page, coreRequest), expected);
    }

    const timeout = await browserCompile(page, canonical, {
      supervision: { timeoutMs: 25 },
      workerUrl: "/test/phase4/never-reply-worker.js",
    });
    assert.deepEqual(
      timeout,
      comparableResult({
        status: "error",
        statusLine: "status=error code=BUILD_TIMEOUT\n",
        code: "BUILD_TIMEOUT",
        errorReport: coreModule.buildErrorReport({
          code: "BUILD_TIMEOUT",
          violations: [],
        }),
      }),
    );

    for (const workerUrl of [
      "/test/phase4/throw-on-load-worker.js",
      "/test/phase4/malformed-result-worker.js",
    ]) {
      const abnormal = await browserCompile(page, canonical, {
        supervision: { timeoutMs: 1_000 },
        workerUrl,
      });
      assert.deepEqual(
        abnormal,
        comparableResult({
          status: "error",
          statusLine: "status=error code=INTERNAL_COMPILER_ERROR\n",
          code: "INTERNAL_COMPILER_ERROR",
          errorReport: coreModule.buildErrorReport({
            code: "INTERNAL_COMPILER_ERROR",
            violations: [],
          }),
        }),
      );
    }

    const cloneFailure = await page.evaluate(async () => {
      const { createRelationshipPresentationCompiler } = await import(
        "/src/host-browser/embed.js"
      );
      const handle = createRelationshipPresentationCompiler();
      try {
        const result = await handle.compile({
          inputs: { source: () => "not structured-cloneable" },
        });
        return {
          ...result,
          errorReport: [...result.errorReport],
        };
      } finally {
        await handle.close();
      }
    });
    assert.equal(cloneFailure.code, "INVALID_CORE_REQUEST");
    assert.deepEqual(
      cloneFailure.errorReport,
      [
        ...coreModule.buildErrorReport({
          code: "INVALID_CORE_REQUEST",
          violations: [],
        }),
      ],
    );

    const closeResult = await page.evaluate(async (serializedRequest) => {
      const { createRelationshipPresentationCompiler } = await import(
        "/src/host-browser/embed.js"
      );
      const handle = createRelationshipPresentationCompiler({
        workerUrl: "/test/phase4/never-reply-worker.js",
      });
      const request = {
        inputs: Object.fromEntries(
          Object.entries(serializedRequest.inputs).map(([role, value]) => [
            role,
            new Uint8Array(value),
          ]),
        ),
      };
      const pending = handle.compile(request, { timeoutMs: 1_000 });
      await handle.close();
      const result = await pending;
      let closedError;
      try {
        handle.compile(request);
      } catch (error) {
        closedError = error instanceof TypeError;
      }
      return {
        closedError,
        result: {
          ...result,
          errorReport: [...result.errorReport],
        },
      };
    }, serializeCoreRequest(canonical));
    assert.equal(closeResult.closedError, true);
    assert.equal(closeResult.result.code, "INTERNAL_COMPILER_ERROR");
  } finally {
    await browser?.close();
    server.closeAllConnections();
    await close(server);
  }
});
