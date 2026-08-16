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

async function compileSource(source) {
  const request = cloneCoreRequest(await canonicalCoreRequest());
  request.inputs.source = encodeJson(source);
  return compileCore(request);
}

async function compileProfile(profile) {
  const request = cloneCoreRequest(await canonicalCoreRequest());
  request.inputs.userProfile = encodeJson(profile);
  return compileCore(request);
}

function assertCode(result, code) {
  assert.equal(result.code, code);
  assert.equal(result.statusLine, `status=error code=${code}\n`);
}

function assertSuccess(result) {
  assert.equal(result.status, "success");
  assert.match(result.coreFingerprint, /^[0-9a-f]{64}$/u);
}

test("C3 accepts only the approved token or a conforming inline context", async () => {
  const { parsed } = await phase5Inputs();
  for (const [context, code] of [
    ["https://contexts.example.test/remote", "REMOTE_CONTEXT_NOT_SUPPORTED"],
    ["file:///tmp/context.jsonld", "LOCAL_CONTEXT_NOT_APPROVED"],
    ["./other-context.jsonld", "LOCAL_CONTEXT_NOT_APPROVED"],
  ]) {
    const source = clone(parsed.source);
    source["@context"] = context;
    assertCode(await compileSource(source), code);
  }

  const inline = clone(parsed.source);
  inline["@context"] = {
    ...clone(parsed.context["@context"]),
    fixture: { "@id": "https://fixture-prefix.example.test/", "@prefix": true },
  };
  assertSuccess(await compileSource(inline));

  const redefined = clone(inline);
  redefined["@context"].label = "skos:prefLabel";
  assertCode(await compileSource(redefined), "CONTEXT_TERM_REDEFINITION");

  const scoped = clone(inline);
  scoped["@context"].fixture = {
    "@id": "https://fixture-prefix.example.test/",
    "@prefix": true,
    "@context": {},
  };
  assertCode(await compileSource(scoped), "LOCAL_CONTEXT_NOT_APPROVED");

  const remoteArray = clone(parsed.source);
  remoteArray["@context"] = [
    "../contexts/poc.context.jsonld",
    "HTTPS://contexts.example.test/remote",
  ];
  assertCode(await compileSource(remoteArray), "REMOTE_CONTEXT_NOT_SUPPORTED");

  const imported = clone(inline);
  imported["@context"]["@import"] = "https://contexts.example.test/import";
  assertCode(await compileSource(imported), "JSONLD_IMPORT_NOT_SUPPORTED");
});

test("C3 rejects named graphs, blank nodes, and owl:imports", async () => {
  const { parsed } = await phase5Inputs();
  const named = {
    "@context": "../contexts/poc.context.jsonld",
    "@id": "https://fixtures.example.test/named-graph",
    "@graph": clone(parsed.source["@graph"]),
  };
  assertCode(await compileSource(named), "NAMED_GRAPH_NOT_SUPPORTED");

  const blank = clone(parsed.source);
  blank["@graph"].push({ "@type": "Person", label: "Unidentified" });
  assertCode(await compileSource(blank), "BLANK_NODE_NOT_SUPPORTED");

  const imported = clone(parsed.source);
  sourceNode(imported, "/relationship-42")["owl:imports"] = {
    "@id": "https://ontology.example.test/imported",
  };
  assertCode(await compileSource(imported), "OWL_IMPORTS_NOT_SUPPORTED");
});

test("C3 enforces context-term and collapsed-triple limits at their boundaries", async () => {
  const { parsed } = await phase5Inputs();
  const contextHeavy = clone(parsed.source);
  const inline = clone(parsed.context["@context"]);
  let index = 0;
  while (Object.keys(inline).length <= 250) {
    inline[`fixture${index}`] = {
      "@id": `https://fixture-${index}.example.test/`,
      "@prefix": true,
    };
    index += 1;
  }
  contextHeavy["@context"] = inline;
  assertCode(await compileSource(contextHeavy), "TOO_MANY_CONTEXT_TERMS");

  const contextBoundary = clone(contextHeavy);
  delete contextBoundary["@context"][Object.keys(contextBoundary["@context"]).at(-1)];
  assert.equal(Object.keys(contextBoundary["@context"]).length, 250);
  assertSuccess(await compileSource(contextBoundary));

  const tripleHeavy = {
    "@context": "../contexts/poc.context.jsonld",
    "@graph": Array.from({ length: 1667 }, (_, item) => ({
      "@id": `https://many.example.test/person-${item}`,
      "@type": "Person",
      label: `Person ${item}`,
      comment: "Allowed documentation",
    })),
  };
  assert.ok(encodeJson(tripleHeavy).byteLength < 1024 * 1024);
  assertCode(await compileSource(tripleHeavy), "TOO_MANY_TRIPLES");

  const tripleBoundary = clone(tripleHeavy);
  tripleBoundary["@graph"].at(-1).comment = undefined;
  delete tripleBoundary["@graph"].at(-1).comment;
  assertCode(await compileSource(tripleBoundary), "FIXTURE_CONTRACT_FAILED");
});

test("C3 processing order precedes request grammar and profile validation", async () => {
  const { parsed } = await phase5Inputs();
  const profile = clone(parsed.userProfile);
  profile["@context"] = "https://contexts.example.test/remote";
  const request = cloneCoreRequest(await canonicalCoreRequest());
  request.inputs.userProfile = encodeJson(profile);
  request.inputs.request = new TextEncoder().encode("invalid request");
  assertCode(await compileCore(request), "REMOTE_CONTEXT_NOT_SUPPORTED");
});
