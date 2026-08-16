import {
  CANONICAL_ARTIFACT_NAMES,
  CORE_OUTPUTS,
  DISTRIBUTION_FILES,
} from "./artifact-set.js";
import { serializeCanonicalJson } from "./canonical-json.js";
import { sha256 } from "./hash.js";
import { parseJsonBytes } from "./json-scan.js";

const CORE_INPUTS = [
  ["source", "source.jsonld"],
  ["request", "request.txt"],
  ["profile", "profile.jsonld"],
  ["canonical-profile", "two-slide-explainer.jsonld"],
  ["context", "poc.context.jsonld"],
  ["contract", "person-association-contract.jsonld"],
  ["carrier-style", "presentation.css"],
  ["carrier-navigation", "navigation.js"],
];
const LOCKED_ROLES = [
  "context",
  "contract",
  "supported-profile",
  "carrier-style",
  "carrier-navigation",
];

export class DistributionVerificationError extends Error {
  constructor(reason) {
    super(reason);
    this.name = "DistributionVerificationError";
    this.reason = reason;
  }
}

function reject(reason) {
  throw new DistributionVerificationError(reason);
}

function isPlainObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasExactMembers(value, members) {
  return (
    isPlainObject(value) &&
    Object.keys(value).length === members.length &&
    members.every((member) => Object.hasOwn(value, member))
  );
}

function isSha256(value) {
  return typeof value === "string" && /^[0-9a-f]{64}$/u.test(value);
}

function sameBytes(left, right) {
  if (left.byteLength !== right.byteLength) {
    return false;
  }
  for (let index = 0; index < left.byteLength; index += 1) {
    if (left[index] !== right[index]) {
      return false;
    }
  }
  return true;
}

function parseManifest(bytes, label) {
  try {
    const manifest = parseJsonBytes(bytes).value;
    if (!isPlainObject(manifest)) {
      reject(`${label}:not-object`);
    }
    if (!sameBytes(serializeCanonicalJson(manifest), bytes)) {
      reject(`${label}:not-canonical`);
    }
    return manifest;
  } catch (error) {
    if (error instanceof DistributionVerificationError) {
      throw error;
    }
    reject(`${label}:invalid-json`);
  }
}

function withoutMember(value, member) {
  return Object.fromEntries(
    Object.entries(value).filter(([name]) => name !== member),
  );
}

function assertEntry(entry, expectedRole, expectedName, nameMember, label) {
  if (
    !hasExactMembers(entry, ["role", nameMember, "sha256"]) ||
    entry.role !== expectedRole ||
    entry[nameMember] !== expectedName ||
    !isSha256(entry.sha256)
  ) {
    reject(`${label}:invalid-entry`);
  }
}

function assertDistributionShape(manifest) {
  if (
    !hasExactMembers(manifest, [
      "manifestVersion",
      "coreManifest",
      "files",
      "distributionFingerprint",
    ]) ||
    manifest.manifestVersion !== "distribution-manifest-v1.0" ||
    !isSha256(manifest.distributionFingerprint) ||
    !hasExactMembers(manifest.coreManifest, ["path", "sha256"]) ||
    manifest.coreManifest.path !== "08-core-manifest.json" ||
    !isSha256(manifest.coreManifest.sha256) ||
    !Array.isArray(manifest.files) ||
    manifest.files.length !== DISTRIBUTION_FILES.length
  ) {
    reject("distribution-manifest:invalid-shape");
  }
  for (let index = 0; index < DISTRIBUTION_FILES.length; index += 1) {
    assertEntry(
      manifest.files[index],
      DISTRIBUTION_FILES[index][0],
      DISTRIBUTION_FILES[index][1],
      "path",
      "distribution-manifest",
    );
  }
}

function assertCoreShape(manifest) {
  if (
    !hasExactMembers(manifest, [
      "manifestVersion",
      "compiler",
      "lockedArtifacts",
      "inputs",
      "outputs",
      "coreFingerprint",
    ]) ||
    manifest.manifestVersion !== "core-manifest-v1.0" ||
    !isSha256(manifest.coreFingerprint) ||
    !hasExactMembers(manifest.compiler, ["name", "version", "sourceCommit"]) ||
    manifest.compiler.name !== "relationship-presentation-poc" ||
    manifest.compiler.version !== "1.0.0" ||
    typeof manifest.compiler.sourceCommit !== "string" ||
    !/^[0-9a-f]{40}$/u.test(manifest.compiler.sourceCommit) ||
    !Array.isArray(manifest.lockedArtifacts) ||
    manifest.lockedArtifacts.length !== LOCKED_ROLES.length ||
    !Array.isArray(manifest.inputs) ||
    manifest.inputs.length !== CORE_INPUTS.length ||
    !Array.isArray(manifest.outputs) ||
    manifest.outputs.length !== CORE_OUTPUTS.length
  ) {
    reject("core-manifest:invalid-shape");
  }
  for (let index = 0; index < LOCKED_ROLES.length; index += 1) {
    const entry = manifest.lockedArtifacts[index];
    if (
      !hasExactMembers(entry, ["role", "sha256"]) ||
      entry.role !== LOCKED_ROLES[index] ||
      !isSha256(entry.sha256)
    ) {
      reject("core-manifest:invalid-locked-entry");
    }
  }
  for (let index = 0; index < CORE_INPUTS.length; index += 1) {
    assertEntry(
      manifest.inputs[index],
      CORE_INPUTS[index][0],
      CORE_INPUTS[index][1],
      "name",
      "core-manifest",
    );
  }
  for (let index = 0; index < CORE_OUTPUTS.length; index += 1) {
    assertEntry(
      manifest.outputs[index],
      CORE_OUTPUTS[index][0],
      CORE_OUTPUTS[index][1],
      "path",
      "core-manifest",
    );
  }
}

async function assertHash(bytes, expected, label) {
  if (Object.prototype.toString.call(bytes) !== "[object Uint8Array]") {
    reject(`${label}:missing`);
  }
  if ((await sha256(bytes)) !== expected) {
    reject(`${label}:hash-mismatch`);
  }
}

export async function verifyDistributionArtifacts(artifacts) {
  if (!isPlainObject(artifacts)) {
    reject("artifact-set:not-object");
  }

  const distributionBytes = artifacts["09-distribution-manifest.json"];
  if (
    Object.prototype.toString.call(distributionBytes) !== "[object Uint8Array]"
  ) {
    reject("distribution-manifest:missing");
  }

  // Section 39 verification order is deliberately visible here.
  const distribution = parseManifest(distributionBytes, "distribution-manifest");
  assertDistributionShape(distribution);
  const calculatedDistributionFingerprint = await sha256(
    serializeCanonicalJson(
      withoutMember(distribution, "distributionFingerprint"),
    ),
  );
  if (
    calculatedDistributionFingerprint !== distribution.distributionFingerprint
  ) {
    reject("distribution-manifest:fingerprint-mismatch");
  }

  for (const entry of distribution.files) {
    await assertHash(artifacts[entry.path], entry.sha256, entry.path);
  }

  const coreBytes = artifacts["08-core-manifest.json"];
  await assertHash(
    coreBytes,
    distribution.coreManifest.sha256,
    "08-core-manifest.json",
  );
  const coreEntry = distribution.files[1];
  if (coreEntry.sha256 !== distribution.coreManifest.sha256) {
    reject("distribution-manifest:core-hash-disagrees");
  }
  const core = parseManifest(coreBytes, "core-manifest");
  assertCoreShape(core);
  const calculatedCoreFingerprint = await sha256(
    serializeCanonicalJson(withoutMember(core, "coreFingerprint")),
  );
  if (calculatedCoreFingerprint !== core.coreFingerprint) {
    reject("core-manifest:fingerprint-mismatch");
  }

  for (const output of core.outputs) {
    await assertHash(artifacts[output.path], output.sha256, output.path);
  }

  const names = Object.keys(artifacts);
  if (
    names.length !== CANONICAL_ARTIFACT_NAMES.length ||
    CANONICAL_ARTIFACT_NAMES.some((name) => !Object.hasOwn(artifacts, name))
  ) {
    reject("artifact-set:name-mismatch");
  }
  for (const name of CANONICAL_ARTIFACT_NAMES) {
    if (
      Object.prototype.toString.call(artifacts[name]) !== "[object Uint8Array]"
    ) {
      reject(`${name}:not-bytes`);
    }
  }

  return true;
}
