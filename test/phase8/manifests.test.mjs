import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import { CANONICAL_ARTIFACT_NAMES } from "../../src/core/artifact-set.js";
import { serializeCanonicalJson } from "../../src/core/canonical-json.js";
import { sha256 } from "../../src/core/hash.js";
import { parseJsonBytes } from "../../src/core/json-scan.js";
import {
  DistributionVerificationError,
  verifyDistributionArtifacts,
} from "../../src/core/verify-distribution.js";
import { repositoryRoot } from "../phase5/phase5-fixture.mjs";
import {
  canonicalPhase8Result,
  expectedPhase8Artifacts,
} from "./phase8-fixture.mjs";

const decoder = new TextDecoder("utf-8", { fatal: true });
const encoder = new TextEncoder();

function cloneArtifacts(artifacts) {
  return Object.fromEntries(
    Object.entries(artifacts).map(([name, bytes]) => [
      name,
      new Uint8Array(bytes),
    ]),
  );
}

test("canonical JSON uses RFC 8785 member order and LF termination", () => {
  assert.equal(
    decoder.decode(
      serializeCanonicalJson({
        z: 0,
        a: { "\ud83d\ude00": 2, A: 1 },
        list: [true, null],
      }),
    ),
    '{"a":{"A":1,"😀":2},"list":[true,null],"z":0}\n',
  );
  assert.throws(() => serializeCanonicalJson({ value: -1 }), TypeError);
  assert.throws(
    () => serializeCanonicalJson({ value: Number.MAX_SAFE_INTEGER + 1 }),
    TypeError,
  );
});

test("the canonical request returns the exact fourteen-file golden result", async () => {
  const result = await canonicalPhase8Result();
  const expected = await expectedPhase8Artifacts();
  assert.equal(result.status, "success");
  assert.match(result.coreFingerprint, /^[0-9a-f]{64}$/u);
  assert.match(result.distributionFingerprint, /^[0-9a-f]{64}$/u);
  assert.equal(
    result.statusLine,
    `status=success artifact=relationship-presentation coreFingerprint=${result.coreFingerprint} distributionFingerprint=${result.distributionFingerprint}\n`,
  );
  assert.deepEqual(Object.keys(result.artifacts), CANONICAL_ARTIFACT_NAMES);
  assert.deepEqual(result.artifacts, expected);
  assert.equal(await verifyDistributionArtifacts(result.artifacts), true);
});

test("manifests record the normative graph without host evidence", async () => {
  const result = await canonicalPhase8Result();
  const coreBytes = result.artifacts["08-core-manifest.json"];
  const distributionBytes = result.artifacts["09-distribution-manifest.json"];
  const core = parseJsonBytes(coreBytes).value;
  const distribution = parseJsonBytes(distributionBytes).value;
  const report = parseJsonBytes(
    result.artifacts["validation-report.json"],
  ).value;
  const sentinel = parseJsonBytes(
    result.artifacts[".relationship-presentation-poc-owned"],
  ).value;

  assert.deepEqual(core.compiler, {
    name: "relationship-presentation-poc",
    sourceCommit: "0".repeat(40),
    version: "1.0.0",
  });
  assert.deepEqual(
    core.lockedArtifacts.map(({ role }) => role),
    [
      "context",
      "contract",
      "supported-profile",
      "carrier-style",
      "carrier-navigation",
    ],
  );
  assert.deepEqual(
    core.outputs.map(({ path }) => path),
    CANONICAL_ARTIFACT_NAMES.slice(1, 9).concat("presentation.html"),
  );
  assert.equal(JSON.stringify(core).includes("ontology"), false);
  assert.equal(JSON.stringify(core).includes("browser"), false);
  assert.equal(JSON.stringify(core).includes("runtime"), false);
  assert.equal(distribution.coreManifest.sha256, await sha256(coreBytes));
  assert.equal(core.coreFingerprint, result.coreFingerprint);
  assert.equal(
    distribution.distributionFingerprint,
    result.distributionFingerprint,
  );
  assert.equal(report.coreFingerprint, result.coreFingerprint);
  assert.equal(Object.hasOwn(report, "distributionFingerprint"), false);
  assert.deepEqual(sentinel, {
    sentinelVersion: "owned-output-v1.0",
    owner: "relationship-presentation-poc",
    purpose:
      "Marks this directory as compiler-owned output eligible for replacement.",
  });

  const fingerprintedNames = [
    "poc.context.jsonld",
    ...CANONICAL_ARTIFACT_NAMES.slice(2, 9),
    "presentation.html",
  ];
  for (const name of fingerprintedNames) {
    assert.equal(
      decoder.decode(result.artifacts[name]).includes(result.coreFingerprint),
      false,
      name,
    );
  }
  for (const [name, bytes] of Object.entries(result.artifacts)) {
    assert.equal(
      decoder.decode(bytes).includes(result.distributionFingerprint),
      name === "09-distribution-manifest.json",
      name,
    );
  }
});

test("the byte-map verifier rejects a mutation in every artifact and set drift", async () => {
  const { artifacts } = await canonicalPhase8Result();
  for (const name of CANONICAL_ARTIFACT_NAMES) {
    const mutated = cloneArtifacts(artifacts);
    const index = Math.floor(mutated[name].byteLength / 2);
    mutated[name][index] ^= 1;
    await assert.rejects(
      verifyDistributionArtifacts(mutated),
      DistributionVerificationError,
      name,
    );
  }

  const missing = cloneArtifacts(artifacts);
  delete missing["04-content-manifest.jsonld"];
  await assert.rejects(
    verifyDistributionArtifacts(missing),
    DistributionVerificationError,
  );
  const extra = cloneArtifacts(artifacts);
  extra["unexpected.txt"] = encoder.encode("unexpected\n");
  await assert.rejects(
    verifyDistributionArtifacts(extra),
    DistributionVerificationError,
  );

  const duplicateMember = cloneArtifacts(artifacts);
  duplicateMember["09-distribution-manifest.json"] = encoder.encode(
    decoder
      .decode(duplicateMember["09-distribution-manifest.json"])
      .replace("{", '{"manifestVersion":"duplicate",'),
  );
  await assert.rejects(
    verifyDistributionArtifacts(duplicateMember),
    DistributionVerificationError,
  );
});

test("the Phase 8 Pages directory is a byte-preserving projection", async () => {
  const result = await canonicalPhase8Result();
  for (const [name, bytes] of Object.entries(result.artifacts)) {
    assert.deepEqual(
      new Uint8Array(await readFile(resolve(repositoryRoot, "site", name))),
      bytes,
      name,
    );
  }
  const sentinel = result.artifacts[".relationship-presentation-poc-owned"];
  assert.deepEqual(
    new Uint8Array(
      await readFile(resolve(repositoryRoot, "site/ownership-sentinel.json")),
    ),
    sentinel,
  );
  const index = decoder.decode(
    new Uint8Array(await readFile(resolve(repositoryRoot, "site/index.html"))),
  );
  const demo = decoder.decode(result.artifacts["demo.html"]);
  assert.equal(
    index,
    demo.replace(
      'href=".relationship-presentation-poc-owned"',
      'href="ownership-sentinel.json"',
    ),
  );
});
