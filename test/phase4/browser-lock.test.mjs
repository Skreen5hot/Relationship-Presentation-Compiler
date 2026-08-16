import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import Ajv2020 from "ajv/dist/2020.js";

import { parseJsonBytes } from "../../src/core/json-scan.js";
import { assertCpsSource } from "../../scripts/scan-phase0-cps.mjs";
import {
  canonicalCoreRequest,
  cloneCoreRequest,
} from "../phase2/core-request-fixture.mjs";

const bundleUrl = new URL(
  "../../browser/relationship-presentation-core.bundle.mjs",
  import.meta.url,
);

async function readJson(relativeUrl) {
  return parseJsonBytes(
    new Uint8Array(await readFile(new URL(relativeUrl, import.meta.url))),
  ).value;
}

test("browser-host.lock.json binds the reproducible core bundle and toolchain", async () => {
  const [lock, schema, packageLock, browserPins, bundleBytes] =
    await Promise.all([
      readJson("../../browser-host.lock.json"),
      readJson("../../schemas/browser-host-lock.schema.json"),
      readJson("../../package-lock.json"),
      readJson("../../node_modules/playwright-core/browsers.json"),
      readFile(bundleUrl),
    ]);

  const validate = new Ajv2020({ allErrors: true, strict: true }).compile(
    schema,
  );
  assert.equal(validate(lock), true, JSON.stringify(validate.errors));
  assert.equal(
    lock.bundle.sha256,
    createHash("sha256").update(bundleBytes).digest("hex"),
  );
  assert.equal(
    lock.bundle.sriIntegrity,
    `sha384-${createHash("sha384").update(bundleBytes).digest("base64")}`,
  );

  const esbuildLock = packageLock.packages["node_modules/esbuild"];
  assert.deepEqual(lock.bundler, {
    package: "esbuild",
    version: esbuildLock.version,
    integrity: esbuildLock.integrity,
  });
  const expectedEngines = [
    ["Chromium", "chromium"],
    ["Firefox", "firefox"],
    ["WebKit", "webkit"],
  ].map(([engine, packageName]) => ({
    engine,
    version: browserPins.browsers.find(
      (browser) => browser.name === packageName,
    ).browserVersion,
  }));
  assert.deepEqual(lock.engineBaselines, expectedEngines);
});

test("the committed browser bundle is a CPS-conforming two-export core", async () => {
  const source = await readFile(bundleUrl, "utf8");
  assertCpsSource(source, "committed Phase 4 browser core bundle");
  assert.equal(source.includes("sourceMappingURL"), false);

  const coreModule = await import(bundleUrl);
  assert.deepEqual(Object.keys(coreModule).sort(), [
    "buildErrorReport",
    "compileCore",
  ]);
});

test("the committed bundle enforces every embedded locked-artifact digest", async () => {
  const { compileCore } = await import(bundleUrl);
  const canonical = await canonicalCoreRequest();
  for (const role of [
    "context",
    "contract",
    "canonicalProfile",
    "carrierStyle",
    "carrierNavigation",
  ]) {
    const request = cloneCoreRequest(canonical);
    request.inputs[role][0] ^= 1;
    const result = await compileCore(request);
    assert.equal(result.status, "error");
    assert.equal(result.code, "ARTIFACT_LOCK_MISMATCH");
    assert.equal(
      result.statusLine,
      "status=error code=ARTIFACT_LOCK_MISMATCH\n",
    );
  }
});
