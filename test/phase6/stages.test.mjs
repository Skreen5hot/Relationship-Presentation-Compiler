import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import {
  buildNarrative,
  validateNarrativeProvenance,
} from "../../src/core/build-narrative.js";
import { buildPresentation } from "../../src/core/build-presentation.js";
import { CoreFailure } from "../../src/core/core-failure.js";
import { parseJsonBytes } from "../../src/core/json-scan.js";
import { runPhase6 } from "../../src/core/phase6.js";
import {
  clone,
  repositoryRoot,
  sourceNode,
} from "../phase5/phase5-fixture.mjs";
import {
  expectedPhase6Artifacts,
  phase6Inputs,
} from "./phase6-fixture.mjs";

function allTextContent(narrative) {
  return [
    ...narrative.hasDocumentContent,
    ...narrative.hasUnit.flatMap((unit) => unit.hasContent),
  ];
}

function replaceIri(value, from, to) {
  if (typeof value === "string") {
    return value === from ? to : value;
  }
  if (Array.isArray(value)) {
    return value.map((entry) => replaceIri(entry, from, to));
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        replaceIri(entry, from, to),
      ]),
    );
  }
  return value;
}

function assertInternalFailure(callback) {
  assert.throws(
    callback,
    (error) =>
      error instanceof CoreFailure && error.code === "INTERNAL_COMPILER_ERROR",
  );
}

test("canonical Stages 01–06 match the normative golden bytes", async () => {
  const { parsed } = await phase6Inputs();
  const result = await runPhase6(parsed);
  assert.deepEqual(result.artifacts, await expectedPhase6Artifacts());

  const manifest = result.stages.contentManifest;
  assert.equal(manifest.selectedSource.length, 6);
  assert.equal(new Set(manifest.selectedSource).size, 6);
  assert.deepEqual(
    manifest.selectionTrace.map((trace) => trace.source),
    manifest.selectedSource,
  );
  assert.deepEqual(
    manifest.selectionTrace.map((trace) => trace.sequence),
    [1, 2, 3, 4, 5, 6],
  );
  validateNarrativeProvenance(
    result.stages.narrative,
    result.selection,
    result.profile,
  );
});

test("late-bound labels, IRIs, and participant order drive all three stages", async () => {
  const { parsed } = await phase6Inputs();
  parsed.source = parseJsonBytes(
    new Uint8Array(
      await readFile(resolve(repositoryRoot, "fixtures/late-bound-example.jsonld")),
    ),
  ).value;
  parsed.request =
    "Create a two-slide presentation explaining Alliance Omega to a general audience.\n";
  const result = await runPhase6(parsed);

  assert.deepEqual(result.stages.contentManifest.selectedSource, [
    "https://fixtures.example.test/late/association-omega",
    "https://fixtures.example.test/late/identifier-omega",
    "https://fixtures.example.test/late/person-mira",
    "https://fixtures.example.test/late/name-mira",
    "https://fixtures.example.test/late/person-zed",
    "https://fixtures.example.test/late/name-zed",
  ]);
  assert.deepEqual(
    allTextContent(result.stages.narrative).map((content) => content.textValue),
    [
      "Alliance Omega presentation",
      "Alliance Omega",
      "Mira is associated with Zed.",
      "Participants",
      "Mira",
      "Zed",
    ],
  );
  assert.deepEqual(
    result.stages.presentation.hasSlide.map(
      (slide) => slide.hasRegion[slide.hasRegion.length - 1].buttonLabel,
    ),
    ["Next", "Previous"],
  );
});

test("duplicate triples, source order, and unrelated facts are inert through Stage 06", async () => {
  const { parsed } = await phase6Inputs();
  const baseline = await runPhase6(parsed);
  const changed = clone(parsed);
  const association = sourceNode(changed.source, "/relationship-42");
  association["@type"].push("PersonAssociation");
  association.specificallyDependsOn.reverse();
  association.specificallyDependsOn.push(association.specificallyDependsOn[0]);
  sourceNode(changed.source, "/bob").differentFrom =
    "https://example.org/relationship-presentation-poc/kg/alice";
  changed.source["@graph"].unshift({
    "@id": "https://unrelated.example.test/documentation",
    label: "Unselected documentation",
  });
  const result = await runPhase6(changed);
  assert.deepEqual(result.artifacts, baseline.artifacts);
});

test("participant sorting uses normalized label and IRI as the deterministic tie break", async () => {
  const { parsed } = await phase6Inputs();
  const changed = clone(parsed);
  sourceNode(changed.source, "/alice-name").label = "Same";
  sourceNode(changed.source, "/bob-name").label = "Same";
  const result = await runPhase6(changed);
  assert.deepEqual(
    result.selection.participants.map((participant) => participant.participant),
    [
      "https://example.org/relationship-presentation-poc/kg/alice",
      "https://example.org/relationship-presentation-poc/kg/bob",
    ],
  );
  assert.equal(
    result.stages.narrative.hasUnit[0].hasContent[1].textValue,
    "Same is associated with Same.",
  );
});

test("IRI renaming changes provenance but not user-perceivable text or presentation", async () => {
  const { parsed } = await phase6Inputs();
  const baseline = await runPhase6(parsed);
  const from = "https://example.org/relationship-presentation-poc/kg/alice-name";
  const to = "https://fixtures.example.test/renamed/alice-name";
  const changed = clone(parsed);
  changed.source = replaceIri(changed.source, from, to);
  const result = await runPhase6(changed);

  assert.deepEqual(
    allTextContent(result.stages.narrative).map((content) => content.textValue),
    allTextContent(baseline.stages.narrative).map((content) => content.textValue),
  );
  assert.deepEqual(result.stages.presentation, baseline.stages.presentation);
  assert.notDeepEqual(
    result.stages.contentManifest,
    baseline.stages.contentManifest,
  );
  assert.equal(
    result.stages.narrative.hasUnit[0].hasContent[1].derivedFrom[0],
    to,
  );
});

test("profile substitution is nonrecursive for source labels", async () => {
  const { parsed } = await phase6Inputs();
  const changed = clone(parsed);
  sourceNode(changed.source, "/relationship-42-identifier").label =
    "Bond {relationshipTitle}";
  sourceNode(changed.source, "/alice-name").label = "A {participant2}";
  changed.request =
    "Create a two-slide presentation explaining Bond {relationshipTitle} to a general audience.\n";
  const result = await runPhase6(changed);
  const content = allTextContent(result.stages.narrative);
  assert.equal(content[0].textValue, "Bond {relationshipTitle} presentation");
  assert.equal(content[1].textValue, "Bond {relationshipTitle}");
  assert.equal(
    content[2].textValue,
    "A {participant2} is associated with Bob.",
  );
});

test("the renderer-independent validator rejects false character provenance", async () => {
  const { parsed } = await phase6Inputs();
  const result = await runPhase6(parsed);
  const corrupted = clone(result.stages.narrative);
  corrupted.hasUnit[0].hasContent[1].derivedFrom = [result.selection.root];
  assertInternalFailure(() =>
    validateNarrativeProvenance(corrupted, result.selection, result.profile),
  );

  const profileTextCorruption = clone(result.stages.narrative);
  profileTextCorruption.hasUnit[1].hasContent[0].derivedFrom = [
    result.selection.designatorNode,
  ];
  assertInternalFailure(() =>
    validateNarrativeProvenance(
      profileTextCorruption,
      result.selection,
      result.profile,
    ),
  );
});

test("every Phase 6 profile parameter is load-bearing", async () => {
  const { parsed } = await phase6Inputs();
  const result = await runPhase6(parsed);
  const profile = {
    ...result.profile,
    id: "https://example.org/relationship-presentation-poc/profile/test-profile",
    overviewRule:
      "https://example.org/relationship-presentation-poc/rule/test-overview",
    associationTemplate: "Pair: {participant1} + {participant2}",
    documentTitleTemplate: "Brief: {relationshipTitle}",
    participantSlideTitle: "People",
    advanceLabel: "Continue",
    backLabel: "Return",
  };
  const narrative = buildNarrative(result.selection, profile);
  const presentation = buildPresentation(narrative, profile);
  const content = allTextContent(narrative);

  assert.equal(content[0].textValue, "Brief: Relationship 42");
  assert.equal(content[2].textValue, "Pair: Alice + Bob");
  assert.equal(content[2].generatedBy, "rule:test-overview");
  assert.equal(content[3].textValue, "People");
  assert.equal(presentation.profileRef, "profile:test-profile");
  assert.equal(presentation.hasSlide[0].hasRegion[2].buttonLabel, "Continue");
  assert.equal(presentation.hasSlide[1].hasRegion[2].buttonLabel, "Return");

  assertInternalFailure(() =>
    buildNarrative(result.selection, { ...profile, slideCount: 3 }),
  );
});

test("Stage 06 is ordered and contains no HTML projection vocabulary", async () => {
  const { parsed } = await phase6Inputs();
  const { stages } = await runPhase6(parsed);
  const presentation = stages.presentation;
  assert.deepEqual(
    presentation.hasSlide.map((slide) => slide.sequence),
    [1, 2],
  );
  for (const slide of presentation.hasSlide) {
    assert.deepEqual(
      slide.hasRegion.map((region) => region.sequence),
      [1, 2, 3],
    );
  }
  assert.deepEqual(
    presentation.hasSlide[1].hasRegion[1].hasItem.map((item) => item.sequence),
    [1, 2],
  );

  const serialized = JSON.stringify(presentation);
  for (const prohibited of [
    "elementName",
    "attributeName",
    "htmlIntent",
    "domOrder",
    "html:",
    "aria-",
    "onclick",
  ]) {
    assert.equal(serialized.includes(prohibited), false, prohibited);
  }
});
