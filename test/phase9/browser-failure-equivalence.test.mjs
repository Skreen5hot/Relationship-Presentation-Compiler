import assert from "node:assert/strict";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { resolve } from "node:path";
import test from "node:test";

import { chromium } from "playwright";

import {
  canonicalCoreRequest,
  cloneCoreRequest,
  comparableResult,
} from "../phase2/core-request-fixture.mjs";
import {
  clone,
  encodeJson,
  phase5Inputs,
  repositoryRoot,
  sourceNode,
} from "../phase5/phase5-fixture.mjs";

const servedFiles = new Map(
  [
    "browser/relationship-presentation-core.bundle.mjs",
    "src/host-browser/embed.js",
    "src/host-browser/host-failure.js",
    "src/host-browser/worker-harness.js",
    "src/core/error-codes.js",
    "src/core/status-line.js",
    "test/phase4/never-reply-worker.js",
    "test/phase4/throw-on-load-worker.js",
    "test/phase9/noncanonical-status-worker.js",
    "test/phase9/noncanonical-report-worker.js",
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
      Object.entries(coreRequest.inputs).map(([role, value]) => [role, [...value]]),
    ),
  };
}

async function browserCompile(page, coreRequest, options = {}) {
  return page.evaluate(
    async ({ options: browserOptions, serializedRequest }) => {
      const { createRelationshipPresentationCompiler } = await import(
        "/src/host-browser/embed.js"
      );
      const compiler = createRelationshipPresentationCompiler({
        ...(browserOptions.workerUrl === undefined
          ? {}
          : { workerUrl: browserOptions.workerUrl }),
      });
      try {
        const request =
          serializedRequest?.inputs === undefined
            ? serializedRequest
            : {
                inputs: Object.fromEntries(
                  Object.entries(serializedRequest.inputs).map(([role, value]) => [
                    role,
                    new Uint8Array(value),
                  ]),
                ),
              };
        const result = await compiler.compile(request, {
          ...(browserOptions.timeoutMs === undefined
            ? {}
            : { timeoutMs: browserOptions.timeoutMs }),
        });
        return {
          ...result,
          ...(result.errorReport === undefined
            ? {}
            : { errorReport: [...result.errorReport] }),
        };
      } finally {
        await compiler.close();
      }
    },
    { options, serializedRequest: serializeRequest(coreRequest) },
  );
}

test("C0 through C6 and supervision failures are exact through the Browser host", async () => {
  const server = createServer(async (request, response) => {
    if (request.url === "/") {
      response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      response.end("<!doctype html><title>Phase 9 failure equivalence</title>");
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
    const core = await import(
      "../../browser/relationship-presentation-core.bundle.mjs"
    );
    const canonical = await canonicalCoreRequest();
    const { parsed } = await phase5Inputs();
    const encoder = new TextEncoder();

    const c1 = cloneCoreRequest(canonical);
    c1.inputs.carrierStyle[0] ^= 1;

    const c2 = cloneCoreRequest(canonical);
    c2.inputs.source = new Uint8Array(1024 * 1024 + 1);

    const c3 = cloneCoreRequest(canonical);
    const remoteSource = clone(parsed.source);
    remoteSource["@context"] = "https://contexts.example.test/remote";
    c3.inputs.source = encodeJson(remoteSource);

    const c4 = cloneCoreRequest(canonical);
    c4.inputs.request = encoder.encode("invalid");

    const c5 = cloneCoreRequest(canonical);
    const unknownProfile = clone(parsed.userProfile);
    unknownProfile["@id"] = "profile:not-supported";
    c5.inputs.userProfile = encodeJson(unknownProfile);

    const c6 = cloneCoreRequest(canonical);
    const invalidFixture = clone(parsed.source);
    sourceNode(invalidFixture, "/relationship-42")["@type"] = [
      "RelationalQuality",
    ];
    c6.inputs.source = encodeJson(invalidFixture);

    for (const request of [{}, c1, c2, c3, c4, c5, c6]) {
      const expected = comparableResult(await core.compileCore(request));
      assert.deepEqual(await browserCompile(page, request), expected);
    }

    for (const [workerUrl, timeoutMs, code] of [
      ["/test/phase4/never-reply-worker.js", 25, "BUILD_TIMEOUT"],
      ["/test/phase4/throw-on-load-worker.js", 1_000, "INTERNAL_COMPILER_ERROR"],
      ["/test/phase9/noncanonical-status-worker.js", 1_000, "INTERNAL_COMPILER_ERROR"],
      ["/test/phase9/noncanonical-report-worker.js", 1_000, "INTERNAL_COMPILER_ERROR"],
    ]) {
      const actual = await browserCompile(page, canonical, {
        workerUrl,
        timeoutMs,
      });
      assert.deepEqual(
        actual,
        comparableResult({
          status: "error",
          statusLine: `status=error code=${code}\n`,
          code,
          errorReport: core.buildErrorReport({ code, violations: [] }),
        }),
      );
    }
  } finally {
    await browser?.close();
    server.closeAllConnections();
    await close(server);
  }
});
