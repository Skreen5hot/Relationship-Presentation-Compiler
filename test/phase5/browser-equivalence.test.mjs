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
import { clone, encodeJson, phase5Inputs, repositoryRoot, sourceNode } from "./phase5-fixture.mjs";

const servedFiles = new Map(
  [
    "browser/relationship-presentation-core.bundle.mjs",
    "src/host-browser/embed.js",
    "src/host-browser/worker-harness.js",
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
      Object.entries(coreRequest.inputs).map(([role, value]) => [role, [...value]]),
    ),
  };
}

async function browserCompile(page, coreRequest) {
  return page.evaluate(async (serializedRequest) => {
    const { createRelationshipPresentationCompiler } = await import(
      "/src/host-browser/embed.js"
    );
    const compiler = createRelationshipPresentationCompiler();
    try {
      const request = {
        inputs: Object.fromEntries(
          Object.entries(serializedRequest.inputs).map(([role, value]) => [
            role,
            new Uint8Array(value),
          ]),
        ),
      };
      const result = await compiler.compile(request);
      return {
        ...result,
        errorReport: [...result.errorReport],
      };
    } finally {
      await compiler.close();
    }
  }, serializeCoreRequest(coreRequest));
}

test("Phase 5 C3–C6 failures are byte-identical through the Chromium Worker host", async () => {
  const server = createServer(async (request, response) => {
    if (request.url === "/") {
      response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      response.end("<!doctype html><title>Phase 5 equivalence</title>");
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

    const invalidRequest = cloneCoreRequest(canonical);
    invalidRequest.inputs.request = new TextEncoder().encode("Explain it.");

    const unknownProfile = cloneCoreRequest(canonical);
    const profile = clone(parsed.userProfile);
    profile["@id"] = "profile:not-supported";
    unknownProfile.inputs.userProfile = encodeJson(profile);

    const remoteContext = cloneCoreRequest(canonical);
    const remoteSource = clone(parsed.source);
    remoteSource["@context"] = "https://contexts.example.test/remote";
    remoteContext.inputs.source = encodeJson(remoteSource);

    const missingType = cloneCoreRequest(canonical);
    const missingTypeSource = clone(parsed.source);
    sourceNode(missingTypeSource, "/relationship-42")["@type"] = [
      "RelationalQuality",
    ];
    missingType.inputs.source = encodeJson(missingTypeSource);

    const contaminated = cloneCoreRequest(canonical);
    const contaminatedSource = clone(parsed.source);
    sourceNode(contaminatedSource, "/alice")["projection:bad"] = "value";
    contaminated.inputs.source = encodeJson(contaminatedSource);

    for (const coreRequest of [
      canonical,
      invalidRequest,
      unknownProfile,
      remoteContext,
      missingType,
      contaminated,
    ]) {
      const expected = comparableResult(await core.compileCore(coreRequest));
      assert.deepEqual(await browserCompile(page, coreRequest), expected);
    }
  } finally {
    await browser?.close();
    server.closeAllConnections();
    await close(server);
  }
});
