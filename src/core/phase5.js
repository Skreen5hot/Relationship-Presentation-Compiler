import { expandTrustedDocument } from "./jsonld-load.js";
import { normalizeRequest } from "./normalize-request.js";
import { serializeJsonLd } from "./stable-jsonld.js";
import { validateProfile } from "./validate-profile.js";
import { resolveAndValidate } from "./validate-resolved-neighborhood.js";
import { PROJECTION } from "./vocabulary.js";

const PASSED_CHECKS = [
  "EXACTLY_ONE_NAME_PER_PARTICIPANT",
  "EXACTLY_TWO_PERSON_PARTICIPANTS",
  "NO_OWL_SAMEAS_AMONG_SELECTED",
  "NO_SOURCE_GRAPH_CONTAMINATION",
  "PARTICIPANTS_ASSERTED_DIFFERENT",
  "RESOLVED_ENTITY_IS_BFO_RELATIONAL_QUALITY",
  "RESOLVED_ENTITY_IS_PERSON_ASSOCIATION",
  "SELECTED_INDIVIDUALS_PAIRWISE_DISTINCT",
];

function checkId(code) {
  return `run:check-${code.toLowerCase().replaceAll("_", "-")}`;
}

function buildRequestStage(designator, profile) {
  return {
    "@context": "./poc.context.jsonld",
    "@id": "run:request",
    "@type": "projection:ProjectionRequest",
    targetArtifact: "projection:Presentation",
    requestedDesignatorText: designator,
    communicativeGoal: "projection:Explain",
    audience: "projection:GeneralAudience",
    slideLimit: profile.slideCount,
    outputFormat: `projection:${profile.outputFormat.slice(PROJECTION.length)}`,
    normalizedBy: "rule:controlled-request-v1-0",
  };
}

function buildResolutionStage(designator, selection) {
  return {
    "@context": "./poc.context.jsonld",
    "@id": "run:resolution",
    "@type": "projection:ScopeResolution",
    requestedDesignatorText: designator,
    sourceScope: selection.root,
    resolvedBy: selection.designatorNode,
    resolutionStatus: "projection:UniqueMatch",
    resolutionRule: "rule:exact-designator-match-v1-0",
  };
}

function buildValidationStage(selection) {
  return {
    "@context": "./poc.context.jsonld",
    "@id": "run:contract-validation",
    "@type": "projection:ContractValidation",
    contractVersion: "person-association-contract-v1.0",
    validatedRoot: selection.root,
    status: "projection:Passed",
    check: PASSED_CHECKS.map((code) => ({
      "@id": checkId(code),
      "@type": "projection:ValidationCheck",
      code,
      passed: true,
    })),
  };
}

export async function runPhase5(parsedInputs) {
  const contractGraph = await expandTrustedDocument(
    parsedInputs.contract,
    parsedInputs.context,
    "contract",
  );
  const canonicalProfileGraph = await expandTrustedDocument(
    parsedInputs.canonicalProfile,
    parsedInputs.context,
    "canonicalProfile",
  );
  const userProfileGraph = await expandTrustedDocument(
    parsedInputs.userProfile,
    parsedInputs.context,
    "userProfile",
  );
  const sourceGraph = await expandTrustedDocument(
    parsedInputs.source,
    parsedInputs.context,
    "source",
  );

  const designator = normalizeRequest(parsedInputs.request);
  const profile = validateProfile(canonicalProfileGraph, userProfileGraph);
  const selection = resolveAndValidate(sourceGraph, designator, profile);
  const request = buildRequestStage(designator, profile);
  const resolution = buildResolutionStage(designator, selection);
  const contractValidation = buildValidationStage(selection);

  return {
    artifacts: {
      "01-request.jsonld": serializeJsonLd(request),
      "02-resolution.jsonld": serializeJsonLd(resolution),
      "03-contract-validation.jsonld": serializeJsonLd(contractValidation),
    },
    contractGraph,
    profile,
    selection,
    sourceGraph,
    stages: { request, resolution, contractValidation },
  };
}
