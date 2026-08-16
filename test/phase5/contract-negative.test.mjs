import assert from "node:assert/strict";
import test from "node:test";

import {
  canonicalCoreRequest,
  cloneCoreRequest,
} from "../phase2/core-request-fixture.mjs";
import { clone, encodeJson, phase5Inputs, sourceNode } from "./phase5-fixture.mjs";

const { compileCore } = await import(
  "../../build/phase2/relationship-presentation-core.skeleton.bundle.mjs"
);

async function resultFor(mutator) {
  const { parsed } = await phase5Inputs();
  const source = clone(parsed.source);
  mutator(source);
  const request = cloneCoreRequest(await canonicalCoreRequest());
  request.inputs.source = encodeJson(source);
  return compileCore(request);
}

function assertCode(result, code) {
  assert.equal(result.code, code);
  assert.equal(result.statusLine, `status=error code=${code}\n`);
  return JSON.parse(new TextDecoder().decode(result.errorReport));
}

function removeType(node, type) {
  node["@type"] = (Array.isArray(node["@type"])
    ? node["@type"]
    : [node["@type"]]
  ).filter((value) => value !== type);
}

test("resolution cardinality and direct association types are closed-world checks", async () => {
  let report = assertCode(
    await resultFor((source) => {
      sourceNode(source, "/relationship-42-identifier").label = "Other";
    }),
    "FIXTURE_CONTRACT_FAILED",
  );
  assert.equal(report.contractVersion, "person-association-contract-v1.0");
  assert.equal(report.violations[0].code, "EXACTLY_ONE_RESOLVING_DESIGNATOR");

  report = assertCode(
    await resultFor((source) => {
      const duplicate = clone(sourceNode(source, "/relationship-42-identifier"));
      duplicate["@id"] = "https://fixtures.example.test/second-identifier";
      source["@graph"].push(duplicate);
    }),
    "FIXTURE_CONTRACT_FAILED",
  );
  assert.equal(report.violations[0].code, "EXACTLY_ONE_RESOLVING_DESIGNATOR");

  for (const values of [[], [
    "https://example.org/relationship-presentation-poc/kg/relationship-42",
    "https://fixtures.example.test/other-root",
  ]]) {
    report = assertCode(
      await resultFor((source) => {
        sourceNode(source, "/relationship-42-identifier").designates = values;
      }),
      "FIXTURE_CONTRACT_FAILED",
    );
    assert.equal(report.violations[0].code, "RESOLVING_DESIGNATOR_IS_VALID");
  }

  report = assertCode(
    await resultFor((source) => {
      removeType(sourceNode(source, "/relationship-42"), "PersonAssociation");
    }),
    "FIXTURE_CONTRACT_FAILED",
  );
  assert.equal(report.violations[0].code, "RESOLVED_ENTITY_IS_PERSON_ASSOCIATION");

  report = assertCode(
    await resultFor((source) => {
      removeType(sourceNode(source, "/relationship-42"), "RelationalQuality");
    }),
    "FIXTURE_CONTRACT_FAILED",
  );
  assert.equal(
    report.violations[0].code,
    "RESOLVED_ENTITY_IS_BFO_RELATIONAL_QUALITY",
  );
});

test("participant count, Person typing, difference evidence, and names are required", async () => {
  for (const participants of [
    ["https://example.org/relationship-presentation-poc/kg/alice"],
    [
      "https://example.org/relationship-presentation-poc/kg/alice",
      "https://example.org/relationship-presentation-poc/kg/bob",
      "https://fixtures.example.test/third-person",
    ],
  ]) {
    const report = assertCode(
      await resultFor((source) => {
        sourceNode(source, "/relationship-42").specificallyDependsOn = participants;
      }),
      "FIXTURE_CONTRACT_FAILED",
    );
    assert.ok(
      report.violations.some(
        (entry) => entry.code === "EXACTLY_TWO_PERSON_PARTICIPANTS",
      ),
    );
  }

  let report = assertCode(
    await resultFor((source) => {
      removeType(sourceNode(source, "/alice"), "Person");
    }),
    "FIXTURE_CONTRACT_FAILED",
  );
  assert.ok(report.violations.some((entry) => entry.source.endsWith("/alice")));

  report = assertCode(
    await resultFor((source) => {
      delete sourceNode(source, "/alice").differentFrom;
    }),
    "FIXTURE_CONTRACT_FAILED",
  );
  assert.ok(
    report.violations.some(
      (entry) => entry.code === "PARTICIPANTS_ASSERTED_DIFFERENT",
    ),
  );

  report = assertCode(
    await resultFor((source) => {
      source["@graph"] = source["@graph"].filter(
        (node) => !node["@id"].endsWith("/alice-name"),
      );
    }),
    "FIXTURE_CONTRACT_FAILED",
  );
  assert.ok(
    report.violations.some(
      (entry) => entry.code === "EXACTLY_ONE_NAME_PER_PARTICIPANT",
    ),
  );

  report = assertCode(
    await resultFor((source) => {
      sourceNode(source, "/alice-name").designates = [
        "https://example.org/relationship-presentation-poc/kg/alice",
        "https://example.org/relationship-presentation-poc/kg/bob",
      ];
    }),
    "FIXTURE_CONTRACT_FAILED",
  );
  assert.ok(
    report.violations.some(
      (entry) => entry.code === "EXACTLY_ONE_NAME_PER_PARTICIPANT",
    ),
  );

  report = assertCode(
    await resultFor((source) => {
      sourceNode(source, "/alice-name").label = ["Alice", "Alicia"];
    }),
    "FIXTURE_CONTRACT_FAILED",
  );
  assert.ok(
    report.violations.some(
      (entry) => entry.code === "EXACTLY_ONE_NAME_PER_PARTICIPANT",
    ),
  );

  report = assertCode(
    await resultFor((source) => {
      const duplicate = clone(sourceNode(source, "/alice-name"));
      duplicate["@id"] = "https://fixtures.example.test/second-alice-name";
      source["@graph"].push(duplicate);
    }),
    "FIXTURE_CONTRACT_FAILED",
  );
  assert.ok(
    report.violations.some(
      (entry) => entry.code === "EXACTLY_ONE_NAME_PER_PARTICIPANT",
    ),
  );

  report = assertCode(
    await resultFor((source) => {
      sourceNode(source, "/alice-name").label = "";
    }),
    "FIXTURE_CONTRACT_FAILED",
  );
  assert.ok(
    report.violations.some(
      (entry) => entry.code === "EXACTLY_ONE_NAME_PER_PARTICIPANT",
    ),
  );
});

test("selected identities, owl:sameAs, and critical-label rules are enforced", async () => {
  let report = assertCode(
    await resultFor((source) => {
      sourceNode(source, "/relationship-42-identifier")["@id"] =
        "https://example.org/relationship-presentation-poc/kg/relationship-42";
    }),
    "FIXTURE_CONTRACT_FAILED",
  );
  assert.ok(
    report.violations.some(
      (entry) => entry.code === "SELECTED_INDIVIDUALS_PAIRWISE_DISTINCT",
    ),
  );

  report = assertCode(
    await resultFor((source) => {
      sourceNode(source, "/alice")["owl:sameAs"] = {
        "@id": "https://example.org/relationship-presentation-poc/kg/bob",
      };
    }),
    "FIXTURE_CONTRACT_FAILED",
  );
  assert.ok(
    report.violations.some(
      (entry) => entry.code === "NO_OWL_SAMEAS_AMONG_SELECTED",
    ),
  );

  assertCode(
    await resultFor((source) => {
      sourceNode(source, "/alice-name").label = "a".repeat(257);
    }),
    "LABEL_TOO_LONG",
  );
  assertCode(
    await resultFor((source) => {
      sourceNode(source, "/alice-name").label = "A\u202eB";
    }),
    "INVALID_CRITICAL_STRING",
  );

  report = assertCode(
    await resultFor((source) => {
      sourceNode(source, "/alice-name").label = {
        "@value": "Alice",
        "@language": "en",
      };
    }),
    "FIXTURE_CONTRACT_FAILED",
  );
  assert.ok(
    report.violations.some(
      (entry) => entry.code === "EXACTLY_ONE_NAME_PER_PARTICIPANT",
    ),
  );
});

test("source contamination is positional and generated content is forbidden", async () => {
  const mutations = [
    (source) => {
      source["@graph"].push({
        "@id": "https://example.org/relationship-presentation-poc/projection/source",
        label: "contaminated subject",
      });
    },
    (source) => {
      sourceNode(source, "/alice")["projection:badPredicate"] = "value";
    },
    (source) => {
      sourceNode(source, "/alice").differentFrom = {
        "@id": "https://example.org/relationship-presentation-poc/run/object",
      };
    },
    (source) => {
      sourceNode(source, "/alice")["@type"] = ["Person", "profile:BadType"];
    },
    (source) => {
      sourceNode(source, "/alice").comment = {
        "@value": "typed",
        "@type": "html:UnsafeDatatype",
      };
    },
    (source) => {
      sourceNode(source, "/relationship-42").comment =
        "Alice is associated with Bob.";
    },
  ];
  for (const mutate of mutations) {
    assertCode(await resultFor(mutate), "SOURCE_GRAPH_CONTAMINATED");
  }

  assertCode(
    await resultFor((source) => {
      sourceNode(source, "/alice")["https://vocabulary.example.test/p"] = "x";
    }),
    "SOURCE_NAMESPACE_NOT_ALLOWED",
  );
  assertCode(
    await resultFor((source) => {
      sourceNode(source, "/alice").comment = {
        "@value": "typed",
        "@type": "https://datatype.example.test/Unknown",
      };
    }),
    "SOURCE_NAMESPACE_NOT_ALLOWED",
  );
  assertCode(
    await resultFor((source) => {
      sourceNode(source, "/alice")["rp:misused"] = "x";
    }),
    "LOCAL_CONTRACT_VOCABULARY_VIOLATION",
  );
});

test("more than 100 independently reportable violations truncates deterministically", async () => {
  const report = assertCode(
    await resultFor((source) => {
      const association = sourceNode(source, "/relationship-42");
      association.specificallyDependsOn = Array.from(
        { length: 101 },
        (_, index) => `https://many.example.test/person-${index}`,
      );
      source["@graph"].push(
        ...association.specificallyDependsOn.map((id) => ({
          "@id": id,
          "@type": "Person",
        })),
      );
    }),
    "TOO_MANY_VIOLATIONS",
  );
  assert.equal(report.code, "TOO_MANY_VIOLATIONS");
  assert.equal(report.contractVersion, "person-association-contract-v1.0");
  assert.equal(report.violations.length, 100);
});
