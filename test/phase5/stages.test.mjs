import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import { parseJsonBytes } from "../../src/core/json-scan.js";
import { runPhase5 } from "../../src/core/phase5.js";
import {
  clone,
  expectedPhase5Artifacts,
  phase5Inputs,
  repositoryRoot,
  sourceNode,
} from "./phase5-fixture.mjs";

test("canonical Stages 01–03 match the derived golden bytes", async () => {
  const { parsed } = await phase5Inputs();
  const result = await runPhase5(parsed);
  assert.deepEqual(result.artifacts, await expectedPhase5Artifacts());
  assert.equal(result.selection.associationSentence, "Alice is associated with Bob.");
  assert.deepEqual(
    result.selection.participants.map((participant) => participant.label),
    ["Alice", "Bob"],
  );
  assert.deepEqual(
    result.stages.contractValidation.check.map((check) => check.code),
    [...result.stages.contractValidation.check.map((check) => check.code)].sort(),
  );
});

test("late-bound identifiers and labels drive resolution without golden assumptions", async () => {
  const { parsed } = await phase5Inputs();
  parsed.source = parseJsonBytes(
    new Uint8Array(await readFile(resolve(repositoryRoot, "fixtures/late-bound-example.jsonld"))),
  ).value;
  parsed.request =
    "Create a two-slide presentation explaining Alliance Omega to a general audience.\n";
  const result = await runPhase5(parsed);
  assert.equal(result.stages.request.requestedDesignatorText, "Alliance Omega");
  assert.equal(
    result.stages.resolution.sourceScope,
    "https://fixtures.example.test/late/association-omega",
  );
  assert.equal(result.selection.associationSentence, "Mira is associated with Zed.");
  assert.deepEqual(
    result.selection.participants.map((participant) => participant.label),
    ["Mira", "Zed"],
  );
});

test("duplicate triples, reciprocal difference, input order, and unrelated facts are inert", async () => {
  const { parsed } = await phase5Inputs();
  const baseline = await runPhase5(parsed);
  const changed = clone(parsed);
  const association = sourceNode(changed.source, "/relationship-42");
  association["@type"].push("PersonAssociation");
  association.specificallyDependsOn.reverse();
  association.specificallyDependsOn.push(association.specificallyDependsOn[0]);
  const bob = sourceNode(changed.source, "/bob");
  bob.differentFrom =
    "https://example.org/relationship-presentation-poc/kg/alice";
  changed.source["@graph"].push({
    "@id": "https://unrelated.example.test/fact",
    label: "Unselected documentation",
  });
  const result = await runPhase5(changed);
  assert.deepEqual(result.artifacts, baseline.artifacts);
});

test("association-template substitution is single-pass and nonrecursive", async () => {
  const { parsed } = await phase5Inputs();
  const changed = clone(parsed);
  sourceNode(changed.source, "/alice-name").label = "A {participant2}";
  const result = await runPhase5(changed);
  assert.equal(
    result.selection.associationSentence,
    "A {participant2} is associated with Bob.",
  );
});

test("core source contains no canonical fixture values", async () => {
  const coreDirectory = resolve(repositoryRoot, "src/core");
  const names = await readdir(coreDirectory);
  const source = (
    await Promise.all(
      names
        .filter((name) => /\.(?:js|cjs)$/u.test(name))
        .map((name) => readFile(resolve(coreDirectory, name), "utf8")),
    )
  ).join("\n");
  for (const prohibited of [
    "Relationship 42",
    "/relationship-42",
    "Alice",
    "Bob",
    "Alice is associated with Bob.",
  ]) {
    assert.equal(source.includes(prohibited), false, prohibited);
  }
});
