import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  bytes,
  canonicalCoreRequest,
  cloneCoreRequest,
} from "../phase2/core-request-fixture.mjs";
import {
  clone,
  encodeJson,
  phase5Inputs,
  repositoryRoot,
  sourceNode,
} from "../phase5/phase5-fixture.mjs";
import { generatedFixture } from "./generated-fixture.mjs";

const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { fatal: true });

function removeType(node, type) {
  node["@type"] = (Array.isArray(node["@type"])
    ? node["@type"]
    : [node["@type"]]
  ).filter((value) => value !== type);
}

function requestText(designator) {
  return `Create a two-slide presentation explaining ${designator} to a general audience.\n`;
}

export async function buildConformanceCorpus() {
  const canonical = await canonicalCoreRequest();
  const { parsed } = await phase5Inputs();
  const cases = [];

  function add(name, coreRequest, expected) {
    cases.push({ coreRequest, expected, name });
  }

  function sourceCase(name, mutate, expected, request = undefined) {
    const coreRequest = cloneCoreRequest(canonical);
    const source = clone(parsed.source);
    mutate(source);
    coreRequest.inputs.source = encodeJson(source);
    if (request !== undefined) {
      coreRequest.inputs.request = encoder.encode(request);
    }
    add(name, coreRequest, expected);
  }

  function profileCase(name, mutate, expected) {
    const coreRequest = cloneCoreRequest(canonical);
    const profile = clone(parsed.userProfile);
    mutate(profile);
    coreRequest.inputs.userProfile = encodeJson(profile);
    add(name, coreRequest, expected);
  }

  function rawCase(name, role, rawBytes, expected) {
    const coreRequest = cloneCoreRequest(canonical);
    coreRequest.inputs[role] = rawBytes;
    add(name, coreRequest, expected);
  }

  add("positive:canonical", cloneCoreRequest(canonical), "success");

  const lateBound = cloneCoreRequest(canonical);
  lateBound.inputs.source = new Uint8Array(
    await readFile(resolve(repositoryRoot, "fixtures/late-bound-example.jsonld")),
  );
  lateBound.inputs.request = encoder.encode(requestText("Alliance Omega"));
  add("positive:late-bound", lateBound, "success");

  for (const seed of [0, 1, 2, 3, 5, 8, 13, 21]) {
    add(
      `positive:generated:${seed}`,
      (await generatedFixture(seed)).coreRequest,
      "success",
    );
  }

  sourceCase(
    "positive:participant-label-swap",
    (source) => {
      sourceNode(source, "/alice-name").label = "Zulu";
      sourceNode(source, "/bob-name").label = "Alpha";
    },
    "success",
  );
  sourceCase(
    "positive:unrelated-fact",
    (source) => {
      source["@graph"].push({
        "@id": "https://unrelated.example.test/person",
        "@type": "Person",
        comment: "Unselected and non-contaminating.",
      });
    },
    "success",
  );
  sourceCase(
    "positive:duplicate-triples",
    (source) => {
      sourceNode(source, "/alice")["@type"] = ["Person", "Person"];
    },
    "success",
  );
  sourceCase(
    "positive:reciprocal-difference",
    (source) => {
      sourceNode(source, "/bob").differentFrom =
        "https://example.org/relationship-presentation-poc/kg/alice";
    },
    "success",
  );
  sourceCase(
    "positive:input-order-reversed",
    (source) => source["@graph"].reverse(),
    "success",
  );
  const suffixDesignator = "Alpha to a general audience. Beta";
  sourceCase(
    "positive:designator-containing-suffix",
    (source) => {
      sourceNode(source, "/relationship-42-identifier").label = suffixDesignator;
    },
    "success",
    requestText(suffixDesignator),
  );
  const hostile =
    'A & B <Mira> "quoted" </script><script>alert(1)</script> {participant2} 50% off & more {relationshipTitle}';
  sourceCase(
    "positive:hostile-label",
    (source) => {
      sourceNode(source, "/relationship-42-identifier").label = hostile;
      sourceNode(source, "/alice-name").label = hostile;
    },
    "success",
    requestText(hostile),
  );
  for (const role of ["userProfile", "source", "request"]) {
    const coreRequest = cloneCoreRequest(canonical);
    coreRequest.inputs[role] = new Uint8Array([
      0xef,
      0xbb,
      0xbf,
      ...coreRequest.inputs[role],
    ]);
    add(`positive:bom:${role}`, coreRequest, "success");
  }

  sourceCase(
    "negative:zero-matching-identifiers",
    (source) => {
      sourceNode(source, "/relationship-42-identifier").label = "Other";
    },
    "FIXTURE_CONTRACT_FAILED",
  );
  sourceCase(
    "negative:two-matching-identifiers",
    (source) => {
      const duplicate = clone(sourceNode(source, "/relationship-42-identifier"));
      duplicate["@id"] = "https://fixtures.example.test/second-identifier";
      source["@graph"].push(duplicate);
    },
    "FIXTURE_CONTRACT_FAILED",
  );
  for (const [label, designates] of [
    ["zero", []],
    [
      "two",
      [
        "https://example.org/relationship-presentation-poc/kg/relationship-42",
        "https://fixtures.example.test/other-root",
      ],
    ],
  ]) {
    sourceCase(
      `negative:designator-resolves-${label}`,
      (source) => {
        sourceNode(source, "/relationship-42-identifier").designates = designates;
      },
      "FIXTURE_CONTRACT_FAILED",
    );
  }
  sourceCase(
    "negative:generic-relational-quality",
    (source) => removeType(sourceNode(source, "/relationship-42"), "PersonAssociation"),
    "FIXTURE_CONTRACT_FAILED",
  );
  sourceCase(
    "negative:missing-bfo-relational-quality",
    (source) => removeType(sourceNode(source, "/relationship-42"), "RelationalQuality"),
    "FIXTURE_CONTRACT_FAILED",
  );
  const alice = "https://example.org/relationship-presentation-poc/kg/alice";
  const bob = "https://example.org/relationship-presentation-poc/kg/bob";
  const third = "https://fixtures.example.test/third-person";
  for (const [label, participants] of [
    ["one", [alice]],
    ["three", [alice, bob, third]],
    ["duplicate", [alice, alice]],
  ]) {
    sourceCase(
      `negative:participants-${label}`,
      (source) => {
        sourceNode(source, "/relationship-42").specificallyDependsOn = participants;
        if (label === "three") {
          source["@graph"].push({ "@id": third, "@type": "Person" });
        }
      },
      "FIXTURE_CONTRACT_FAILED",
    );
  }
  sourceCase(
    "negative:missing-person-type",
    (source) => removeType(sourceNode(source, "/alice"), "Person"),
    "FIXTURE_CONTRACT_FAILED",
  );
  sourceCase(
    "negative:missing-different-from",
    (source) => delete sourceNode(source, "/alice").differentFrom,
    "FIXTURE_CONTRACT_FAILED",
  );
  for (const [label, mutate] of [
    [
      "d-equals-r",
      (source) => {
        sourceNode(source, "/relationship-42-identifier")["@id"] =
          "https://example.org/relationship-presentation-poc/kg/relationship-42";
      },
    ],
    [
      "d-equals-p1",
      (source) => {
        sourceNode(source, "/relationship-42-identifier")["@id"] = alice;
      },
    ],
    [
      "p1-equals-n1",
      (source) => {
        sourceNode(source, "/alice-name")["@id"] = alice;
      },
    ],
  ]) {
    sourceCase(`negative:identity-collapse:${label}`, mutate, "FIXTURE_CONTRACT_FAILED");
  }
  for (const [label, subject, object] of [
    ["forward", "/alice", bob],
    ["reverse", "/bob", alice],
  ]) {
    sourceCase(
      `negative:same-as:${label}`,
      (source) => {
        sourceNode(source, subject)["owl:sameAs"] = { "@id": object };
      },
      "FIXTURE_CONTRACT_FAILED",
    );
  }
  sourceCase(
    "negative:zero-names",
    (source) => {
      source["@graph"] = source["@graph"].filter(
        (node) => !node["@id"].endsWith("/alice-name"),
      );
    },
    "FIXTURE_CONTRACT_FAILED",
  );
  sourceCase(
    "negative:two-names",
    (source) => {
      const duplicate = clone(sourceNode(source, "/alice-name"));
      duplicate["@id"] = "https://fixtures.example.test/second-alice-name";
      source["@graph"].push(duplicate);
    },
    "FIXTURE_CONTRACT_FAILED",
  );
  sourceCase(
    "negative:name-designates-two",
    (source) => {
      sourceNode(source, "/alice-name").designates = [alice, bob];
    },
    "FIXTURE_CONTRACT_FAILED",
  );
  sourceCase(
    "negative:name-has-two-labels",
    (source) => {
      sourceNode(source, "/alice-name").label = ["Alice", "Alicia"];
    },
    "FIXTURE_CONTRACT_FAILED",
  );
  sourceCase(
    "negative:language-tagged-label",
    (source) => {
      sourceNode(source, "/alice-name").label = {
        "@language": "en",
        "@value": "Alice",
      };
    },
    "FIXTURE_CONTRACT_FAILED",
  );
  sourceCase(
    "negative:empty-label",
    (source) => {
      sourceNode(source, "/alice-name").label = "";
    },
    "FIXTURE_CONTRACT_FAILED",
  );
  sourceCase(
    "negative:overlength-label",
    (source) => {
      sourceNode(source, "/alice-name").label = "x".repeat(257);
    },
    "LABEL_TOO_LONG",
  );
  const longDesignator = "d".repeat(257);
  sourceCase(
    "negative:overlength-designator",
    (source) => {
      sourceNode(source, "/relationship-42-identifier").label = longDesignator;
    },
    "DESIGNATOR_TOO_LONG",
    requestText(longDesignator),
  );
  for (const [label, value] of [
    ["control", "A\u0007B"],
    ["bidirectional", "A\u202eB"],
    ["noncharacter", "A\uffffB"],
  ]) {
    sourceCase(
      `negative:critical-label:${label}`,
      (source) => {
        sourceNode(source, "/alice-name").label = value;
      },
      "INVALID_CRITICAL_STRING",
    );
  }
  sourceCase(
    "negative:generated-sentence-in-source",
    (source) => {
      sourceNode(source, "/relationship-42").comment =
        "Alice is associated with Bob.";
    },
    "SOURCE_GRAPH_CONTAMINATED",
  );
  for (const [label, mutate] of [
    [
      "predicate",
      (source) => {
        sourceNode(source, "/alice")["projection:bad"] = "value";
      },
    ],
    [
      "object",
      (source) => {
        sourceNode(source, "/alice").differentFrom = {
          "@id": "https://example.org/relationship-presentation-poc/run/object",
        };
      },
    ],
    [
      "subject",
      (source) =>
        source["@graph"].push({
          "@id": "https://example.org/relationship-presentation-poc/layout/subject",
          label: "Subject",
        }),
    ],
    [
      "type",
      (source) => {
        sourceNode(source, "/alice")["@type"] = ["Person", "profile:BadType"];
      },
    ],
    [
      "datatype",
      (source) => {
        sourceNode(source, "/alice").comment = {
          "@type": "html:UnsafeDatatype",
          "@value": "typed",
        };
      },
    ],
  ]) {
    sourceCase(
      `negative:prohibited-namespace:${label}`,
      mutate,
      "SOURCE_GRAPH_CONTAMINATED",
    );
  }
  sourceCase(
    "negative:unknown-predicate-namespace",
    (source) => {
      sourceNode(source, "/alice")["https://vocabulary.example.test/p"] = "x";
    },
    "SOURCE_NAMESPACE_NOT_ALLOWED",
  );
  sourceCase(
    "negative:unknown-datatype-namespace",
    (source) => {
      sourceNode(source, "/alice").comment = {
        "@type": "https://datatype.example.test/Unknown",
        "@value": "typed",
      };
    },
    "SOURCE_NAMESPACE_NOT_ALLOWED",
  );
  sourceCase(
    "negative:contract-vocabulary-misuse",
    (source) => {
      sourceNode(source, "/alice")["rp:misused"] = "x";
    },
    "LOCAL_CONTRACT_VOCABULARY_VIOLATION",
  );

  const sourceText = decoder.decode(canonical.inputs.source);
  rawCase(
    "negative:duplicate-source-member",
    "source",
    encoder.encode(
      sourceText.replace('  "@graph": [', '  "@graph": [],\n  "@graph": ['),
    ),
    "DUPLICATE_JSON_MEMBER",
  );
  const profileText = decoder.decode(canonical.inputs.userProfile);
  rawCase(
    "negative:duplicate-profile-member",
    "userProfile",
    encoder.encode(
      profileText.replace(
        '  "@id": "profile:two-slide-explainer-v3",',
        '  "@id": "profile:two-slide-explainer-v3",\n  "@id": "profile:two-slide-explainer-v3",',
      ),
    ),
    "DUPLICATE_JSON_MEMBER",
  );
  const inlineContext = clone(parsed.source);
  inlineContext["@context"] = clone(parsed.context["@context"]);
  rawCase(
    "negative:duplicate-inline-context-member",
    "source",
    encoder.encode(
      `${JSON.stringify(inlineContext, null, 2).replace(
        '    "label": "rdfs:label",',
        '    "label": "rdfs:label",\n    "label": "rdfs:label",',
      )}\n`,
    ),
    "DUPLICATE_JSON_MEMBER",
  );
  sourceCase(
    "negative:blank-node",
    (source) => source["@graph"].push({ "@type": "Person", label: "Blank" }),
    "BLANK_NODE_NOT_SUPPORTED",
  );
  const namedGraph = cloneCoreRequest(canonical);
  namedGraph.inputs.source = encodeJson({
    "@context": "../contexts/poc.context.jsonld",
    "@graph": clone(parsed.source["@graph"]),
    "@id": "https://fixtures.example.test/named-graph",
  });
  add("negative:named-graph", namedGraph, "NAMED_GRAPH_NOT_SUPPORTED");
  sourceCase(
    "negative:remote-context",
    (source) => {
      source["@context"] = "https://contexts.example.test/remote";
    },
    "REMOTE_CONTEXT_NOT_SUPPORTED",
  );
  sourceCase(
    "negative:jsonld-import",
    (source) => {
      source["@context"] = {
        ...clone(parsed.context["@context"]),
        "@import": "https://contexts.example.test/import",
      };
    },
    "JSONLD_IMPORT_NOT_SUPPORTED",
  );
  sourceCase(
    "negative:owl-imports",
    (source) => {
      sourceNode(source, "/relationship-42")["owl:imports"] = {
        "@id": "https://ontology.example.test/imported",
      };
    },
    "OWL_IMPORTS_NOT_SUPPORTED",
  );
  for (const [label, request] of [
    ["wrong-slide-count", "Create a three-slide presentation explaining Relationship 42 to a general audience.\n"],
    ["missing-suffix", "Create a two-slide presentation explaining Relationship 42"],
    ["internal-whitespace", "Create  a two-slide presentation explaining Relationship 42 to a general audience.\n"],
    ["empty-designator", "Create a two-slide presentation explaining  to a general audience.\n"],
  ]) {
    rawCase(
      `negative:grammar:${label}`,
      "request",
      encoder.encode(request),
      "REQUEST_GRAMMAR_MISMATCH",
    );
  }
  profileCase(
    "negative:unsupported-profile-id",
    (profile) => {
      profile["@id"] = "profile:not-supported";
    },
    "UNSUPPORTED_PROFILE",
  );
  profileCase(
    "negative:altered-profile-triples",
    (profile) => {
      profile["projection:advanceLabel"] = "Continue";
    },
    "UNSUPPORTED_PROFILE_CONTRACT",
  );
  profileCase(
    "negative:unknown-participant-order",
    (profile) => {
      profile["projection:participantOrder"] = "locale-dependent";
    },
    "UNSUPPORTED_PROFILE_CONTRACT",
  );
  rawCase(
    "negative:source-too-large",
    "source",
    bytes(`{}${" ".repeat(1024 * 1024 - 1)}`),
    "SOURCE_TOO_LARGE",
  );
  rawCase(
    "negative:request-too-large",
    "request",
    bytes("x".repeat(4 * 1024 + 1)),
    "REQUEST_TOO_LARGE",
  );
  rawCase(
    "negative:profile-too-large",
    "userProfile",
    bytes(`{}${" ".repeat(64 * 1024 - 1)}`),
    "PROFILE_TOO_LARGE",
  );
  rawCase(
    "negative:json-too-deep",
    "source",
    bytes(`${"[".repeat(65)}0${"]".repeat(65)}`),
    "JSON_TOO_DEEP",
  );
  const tripleHeavy = {
    "@context": "../contexts/poc.context.jsonld",
    "@graph": Array.from({ length: 1667 }, (_, index) => ({
      "@id": `https://many.example.test/person-${index}`,
      "@type": "Person",
      comment: "Allowed documentation",
      label: `Person ${index}`,
    })),
  };
  rawCase(
    "negative:too-many-triples",
    "source",
    encodeJson(tripleHeavy),
    "TOO_MANY_TRIPLES",
  );
  const contextHeavy = clone(parsed.source);
  contextHeavy["@context"] = clone(parsed.context["@context"]);
  let contextIndex = 0;
  while (Object.keys(contextHeavy["@context"]).length <= 250) {
    contextHeavy["@context"][`fixture${contextIndex}`] = {
      "@id": `https://fixture-${contextIndex}.example.test/`,
      "@prefix": true,
    };
    contextIndex += 1;
  }
  rawCase(
    "negative:too-many-context-terms",
    "source",
    encodeJson(contextHeavy),
    "TOO_MANY_CONTEXT_TERMS",
  );
  const tooManyViolations = clone(parsed.source);
  const association = sourceNode(tooManyViolations, "/relationship-42");
  association.specificallyDependsOn = Array.from(
    { length: 101 },
    (_, index) => `https://many.example.test/participant-${index}`,
  );
  tooManyViolations["@graph"].push(
    ...association.specificallyDependsOn.map((id) => ({
      "@id": id,
      "@type": "Person",
    })),
  );
  rawCase(
    "negative:too-many-violations",
    "source",
    encodeJson(tooManyViolations),
    "TOO_MANY_VIOLATIONS",
  );
  for (const [label, coreRequest] of [
    ["missing-member", {
      inputs: Object.fromEntries(
        Object.entries(canonical.inputs).filter(([role]) => role !== "source"),
      ),
    }],
    ["extra-member", {
      inputs: { ...canonical.inputs, extra: new Uint8Array() },
    }],
    ["non-byte-member", {
      inputs: { ...canonical.inputs, source: "not bytes" },
    }],
  ]) {
    add(`negative:core-request:${label}`, coreRequest, "INVALID_CORE_REQUEST");
  }
  const carrierMutation = cloneCoreRequest(canonical);
  carrierMutation.inputs.carrierStyle[0] ^= 1;
  add(
    "negative:mutated-locked-carrier",
    carrierMutation,
    "ARTIFACT_LOCK_MISMATCH",
  );
  for (const role of ["userProfile", "source", "request"]) {
    rawCase(
      `negative:invalid-utf8:${role}`,
      role,
      new Uint8Array([0xff]),
      "INVALID_UTF8",
    );
  }

  return cases;
}
