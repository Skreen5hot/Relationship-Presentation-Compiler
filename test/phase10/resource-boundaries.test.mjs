import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

import { build } from "esbuild";

import { buildFailureResult } from "../../src/core/error-report.js";
import { parseJsonBytes } from "../../src/core/json-scan.js";
import {
  bytes,
  canonicalCoreRequest,
  cloneCoreRequest,
} from "../phase2/core-request-fixture.mjs";
import { repositoryRoot } from "../phase5/phase5-fixture.mjs";

const LOCKED_ROLES = [
  "context",
  "contract",
  "canonicalProfile",
  "carrierStyle",
  "carrierNavigation",
];

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function padTo(bytes_, length) {
  assert.ok(bytes_.byteLength <= length);
  return new Uint8Array([...bytes_, ...new Uint8Array(length - bytes_.byteLength).fill(0x20)]);
}

async function alternateCore(root, canonical, role, replacement, label) {
  const digests = Object.fromEntries(
    LOCKED_ROLES.map((lockedRole) => [
      lockedRole,
      sha256(lockedRole === role ? replacement : canonical.inputs[lockedRole]),
    ]),
  );
  const buildResult = await build({
    absWorkingDir: repositoryRoot,
    alias: {
      "lru-cache": resolve(
        repositoryRoot,
        "src/core/phase0-shims/deterministic-lru.cjs",
      ),
      "rdf-canonize": resolve(
        repositoryRoot,
        "src/core/phase0-shims/identifier-issuer.cjs",
      ),
    },
    bundle: true,
    charset: "utf8",
    define: {
      __RPC_ARTIFACT_DIGESTS__: JSON.stringify(digests),
      __RPC_COMPILER_NAME__: JSON.stringify("relationship-presentation-poc"),
      __RPC_COMPILER_VERSION__: JSON.stringify("1.0.0"),
      __RPC_SOURCE_COMMIT__: JSON.stringify(
        "0000000000000000000000000000000000000000",
      ),
    },
    entryPoints: [resolve(repositoryRoot, "src/core/core.js")],
    format: "esm",
    legalComments: "none",
    platform: "browser",
    plugins: [
      {
        name: "phase10-jsonld-events-shim",
        setup(buildContext) {
          buildContext.onResolve({ filter: /^\.\/events$/ }, (arguments_) => {
            if (
              arguments_.resolveDir
                .replaceAll("\\", "/")
                .endsWith("/node_modules/jsonld/lib")
            ) {
              return {
                path: resolve(
                  repositoryRoot,
                  "src/core/phase0-shims/fail-closed-events.cjs",
                ),
              };
            }
            return undefined;
          });
        },
      },
    ],
    target: "es2023",
    treeShaking: true,
    write: false,
  });
  const bundlePath = join(root, `${label}.mjs`);
  await writeFile(bundlePath, buildResult.outputFiles[0].contents);
  return import(`${pathToFileURL(bundlePath).href}?case=${label}`);
}

test("every locked byte role accepts its exact boundary and rejects one byte over", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "rpc-phase10-boundaries-"));
  t.after(() => rm(root, { force: true, recursive: true }));
  const canonical = await canonicalCoreRequest();
  for (const [role, limit, code] of [
    ["context", 64 * 1024, "CONTEXT_TOO_LARGE"],
    ["contract", 64 * 1024, "CONTRACT_TOO_LARGE"],
    ["canonicalProfile", 64 * 1024, "PROFILE_TOO_LARGE"],
  ]) {
    const exact = padTo(canonical.inputs[role], limit);
    const exactCore = await alternateCore(root, canonical, role, exact, `${role}-exact`);
    const exactRequest = cloneCoreRequest(canonical);
    exactRequest.inputs[role] = exact;
    assert.equal((await exactCore.compileCore(exactRequest)).status, "success", role);

    const oversized = padTo(canonical.inputs[role], limit + 1);
    const oversizedCore = await alternateCore(
      root,
      canonical,
      role,
      oversized,
      `${role}-oversized`,
    );
    const oversizedRequest = cloneCoreRequest(canonical);
    oversizedRequest.inputs[role] = oversized;
    assert.equal((await oversizedCore.compileCore(oversizedRequest)).code, code, role);
  }
});

test("user-controlled byte roles distinguish the exact limit from one byte over", async () => {
  const { compileCore } = await import(
    "../../browser/relationship-presentation-core.bundle.mjs"
  );
  const canonical = await canonicalCoreRequest();
  for (const [role, exact, oversized, code] of [
    [
      "source",
      bytes(`{}${" ".repeat(1024 * 1024 - 2)}`),
      bytes(`{}${" ".repeat(1024 * 1024 - 1)}`),
      "SOURCE_TOO_LARGE",
    ],
    [
      "request",
      bytes("x".repeat(4 * 1024)),
      bytes("x".repeat(4 * 1024 + 1)),
      "REQUEST_TOO_LARGE",
    ],
    [
      "userProfile",
      padTo(canonical.inputs.userProfile, 64 * 1024),
      padTo(canonical.inputs.userProfile, 64 * 1024 + 1),
      "PROFILE_TOO_LARGE",
    ],
  ]) {
    const exactRequest = cloneCoreRequest(canonical);
    exactRequest.inputs[role] = exact;
    assert.notEqual((await compileCore(exactRequest)).code, code, role);
    const oversizedRequest = cloneCoreRequest(canonical);
    oversizedRequest.inputs[role] = oversized;
    assert.equal((await compileCore(oversizedRequest)).code, code, role);
  }
});

test("the violation-report limit preserves 100 and maps 101 to the cap code", () => {
  const violations = Array.from({ length: 101 }, (_, index) => ({
    code: "BOUNDARY",
    message: String(index).padStart(3, "0"),
  }));
  const exact = buildFailureResult({
    code: "FIXTURE_CONTRACT_FAILED",
    violations: violations.slice(0, 100),
  });
  assert.equal(exact.code, "FIXTURE_CONTRACT_FAILED");
  assert.equal(parseJsonBytes(exact.errorReport).value.violations.length, 100);

  const oversized = buildFailureResult({
    code: "FIXTURE_CONTRACT_FAILED",
    violations,
  });
  assert.equal(oversized.code, "TOO_MANY_VIOLATIONS");
  assert.equal(
    parseJsonBytes(oversized.errorReport).value.violations.length,
    100,
  );
});
