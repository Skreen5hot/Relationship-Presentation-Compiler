import {
  CANONICAL_ARTIFACT_NAMES,
  CORE_OUTPUTS,
  DISTRIBUTION_FILES,
} from "./artifact-set.js";
import { formatSuccessStatusLine } from "./status-line.js";
import {
  COMPILER_NAME,
  COMPILER_VERSION,
  EMBEDDED_ARTIFACT_DIGESTS,
  SOURCE_COMMIT,
} from "./build-constants.js";
import { buildDemoHtml } from "./build-demo.js";
import {
  serializeCanonicalJson,
  serializePlainJson,
} from "./canonical-json.js";
import { sha256 } from "./hash.js";
import { runPhase7 } from "./phase7.js";
import { verifyDistributionArtifacts } from "./verify-distribution.js";

const INPUTS = [
  ["source", "source", "source.jsonld"],
  ["request", "request", "request.txt"],
  ["profile", "userProfile", "profile.jsonld"],
  ["canonical-profile", "canonicalProfile", "two-slide-explainer.jsonld"],
  ["context", "context", "poc.context.jsonld"],
  ["contract", "contract", "person-association-contract.jsonld"],
  ["carrier-style", "carrierStyle", "presentation.css"],
  ["carrier-navigation", "carrierNavigation", "navigation.js"],
];
const LOCKED_ARTIFACTS = [
  ["context", "context"],
  ["contract", "contract"],
  ["supported-profile", "canonicalProfile"],
  ["carrier-style", "carrierStyle"],
  ["carrier-navigation", "carrierNavigation"],
];

async function hashedEntries(entries, artifacts, pathMember) {
  const result = [];
  for (const [role, path] of entries) {
    result.push({
      role,
      [pathMember]: path,
      sha256: await sha256(artifacts[path]),
    });
  }
  return result;
}

export async function runPhase8(parsedInputs, inputBytes) {
  const phase7 = await runPhase7(parsedInputs, { includeDemo: false });

  // Stage 8 steps 3–5: assemble and hash only the core-fingerprinted files.
  const coreArtifacts = {
    "poc.context.jsonld": inputBytes.context,
    ...phase7.artifacts,
  };
  const outputs = await hashedEntries(CORE_OUTPUTS, coreArtifacts, "path");
  const inputs = [];
  for (const [role, inputRole, name] of INPUTS) {
    inputs.push({ role, name, sha256: await sha256(inputBytes[inputRole]) });
  }
  const coreManifestBase = {
    manifestVersion: "core-manifest-v1.0",
    compiler: {
      name: COMPILER_NAME,
      version: COMPILER_VERSION,
      sourceCommit: SOURCE_COMMIT,
    },
    lockedArtifacts: LOCKED_ARTIFACTS.map(([role, digestRole]) => ({
      role,
      sha256: EMBEDDED_ARTIFACT_DIGESTS[digestRole],
    })),
    inputs,
    outputs,
  };
  const coreFingerprint = await sha256(
    serializeCanonicalJson(coreManifestBase),
  );
  const coreManifest = serializeCanonicalJson({
    ...coreManifestBase,
    coreFingerprint,
  });

  // Stage 8 steps 6–8: outer evidence may depend on the core fingerprint.
  const validationReport = serializePlainJson({
    reportVersion: "validation-report-v1.0",
    requestGrammarMatched: true,
    designatorResolved: true,
    resolutionStatus: "UniqueMatch",
    fixtureContractSatisfied: true,
    selectedIndividualsPairwiseDistinct: true,
    profileSupported: true,
    sourceContaminationDetected: false,
    escapingApplied: true,
    renderedDocumentValidated: true,
    accessibilityStructureValidated: true,
    artifactHashesRecorded: true,
    coreFingerprint,
  });
  const demo = buildDemoHtml(
    phase7.stages.narrative,
    coreArtifacts["presentation.html"],
    { coreFingerprint },
  );
  const sentinel = serializePlainJson({
    sentinelVersion: "owned-output-v1.0",
    owner: COMPILER_NAME,
    purpose:
      "Marks this directory as compiler-owned output eligible for replacement.",
  });

  // Stage 8 step 9: the distribution fingerprint closes the outer manifest.
  const distributionArtifacts = {
    ".relationship-presentation-poc-owned": sentinel,
    "08-core-manifest.json": coreManifest,
    "validation-report.json": validationReport,
    "demo.html": demo,
  };
  const files = await hashedEntries(
    DISTRIBUTION_FILES,
    distributionArtifacts,
    "path",
  );
  const coreManifestHash = files[1].sha256;
  const distributionManifestBase = {
    manifestVersion: "distribution-manifest-v1.0",
    coreManifest: {
      path: "08-core-manifest.json",
      sha256: coreManifestHash,
    },
    files,
  };
  const distributionFingerprint = await sha256(
    serializeCanonicalJson(distributionManifestBase),
  );
  const distributionManifest = serializeCanonicalJson({
    ...distributionManifestBase,
    distributionFingerprint,
  });

  const produced = {
    ".relationship-presentation-poc-owned": sentinel,
    ...coreArtifacts,
    "08-core-manifest.json": coreManifest,
    "09-distribution-manifest.json": distributionManifest,
    "demo.html": demo,
    "validation-report.json": validationReport,
  };
  const artifacts = Object.fromEntries(
    CANONICAL_ARTIFACT_NAMES.map((name) => [name, produced[name]]),
  );
  await verifyDistributionArtifacts(artifacts);

  const statusLine = formatSuccessStatusLine(
    coreFingerprint,
    distributionFingerprint,
  );
  return {
    status: "success",
    statusLine,
    coreFingerprint,
    distributionFingerprint,
    artifacts,
  };
}
