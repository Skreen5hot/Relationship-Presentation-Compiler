import { parseJsonBytes } from "../../src/core/json-scan.js";
import {
  canonicalCoreRequest,
  cloneCoreRequest,
} from "../phase2/core-request-fixture.mjs";
import { clone, encodeJson, phase5Inputs } from "../phase5/phase5-fixture.mjs";

const encoder = new TextEncoder();
const CANONICAL_IDS = [
  "https://example.org/relationship-presentation-poc/kg/relationship-42",
  "https://example.org/relationship-presentation-poc/kg/alice",
  "https://example.org/relationship-presentation-poc/kg/bob",
  "https://example.org/relationship-presentation-poc/kg/relationship-42-identifier",
  "https://example.org/relationship-presentation-poc/kg/alice-name",
  "https://example.org/relationship-presentation-poc/kg/bob-name",
];

function replaceStrings(value, replacements) {
  if (typeof value === "string") {
    return replacements.get(value) ?? value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => replaceStrings(item, replacements));
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        replaceStrings(item, replacements),
      ]),
    );
  }
  return value;
}

function generator(seed) {
  let state = (seed + 1) >>> 0;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return state >>> 0;
  };
}

export async function generatedFixture(seed) {
  if (!Number.isInteger(seed) || seed < 0) {
    throw new TypeError("Generated fixture seed must be a nonnegative integer");
  }
  const next = generator(seed);
  const token = `${seed.toString(16).padStart(4, "0")}-${next().toString(16)}`;
  const namespace = `https://generated-${token}.example.test/knowledge/`;
  const generatedIds = [
    `${namespace}association`,
    `${namespace}participant-z`,
    `${namespace}participant-a`,
    `${namespace}association-identifier`,
    `${namespace}participant-z-name`,
    `${namespace}participant-a-name`,
  ];
  const replacements = new Map(
    CANONICAL_IDS.map((id, index) => [id, generatedIds[index]]),
  );
  const { parsed } = await phase5Inputs();
  const source = replaceStrings(clone(parsed.source), replacements);
  const relationshipTitle = `Generated Association ${seed}`;
  const participant1 = `Zulu ${String(next() % 10_000).padStart(4, "0")}`;
  const participant2 = `Alpha ${String(next() % 10_000).padStart(4, "0")}`;
  source["@graph"].find(
    (node) => node["@id"] === generatedIds[3],
  ).label = relationshipTitle;
  source["@graph"].find(
    (node) => node["@id"] === generatedIds[4],
  ).label = participant1;
  source["@graph"].find(
    (node) => node["@id"] === generatedIds[5],
  ).label = participant2;
  const requestText =
    `Create a two-slide presentation explaining ${relationshipTitle} ` +
    "to a general audience.\n";
  const coreRequest = cloneCoreRequest(await canonicalCoreRequest());
  coreRequest.inputs.source = encodeJson(source);
  coreRequest.inputs.request = encoder.encode(requestText);
  const orderedParticipants = [participant1, participant2].sort((left, right) =>
    left < right ? -1 : left > right ? 1 : 0,
  );
  return {
    coreRequest,
    expected: {
      associationIri: generatedIds[0],
      participantIris: generatedIds.slice(1, 3),
      participantLabels: orderedParticipants,
      relationshipTitle,
      sentence: `${orderedParticipants[0]} is associated with ${orderedParticipants[1]}.`,
    },
    requestText,
    seed,
    source,
    sourceBytes: coreRequest.inputs.source,
  };
}

export function parseArtifact(result, name) {
  return parseJsonBytes(result.artifacts[name]).value;
}
