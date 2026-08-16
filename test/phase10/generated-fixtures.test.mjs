import assert from "node:assert/strict";
import test from "node:test";

import { JSDOM } from "jsdom";

import { revalidateHtmlSubset } from "../../src/core/revalidate-html.js";
import { verifyDistributionArtifacts } from "../../src/core/verify-distribution.js";
import { generatedFixture, parseArtifact } from "./generated-fixture.mjs";

const { compileCore } = await import(
  "../../build/phase2/relationship-presentation-core.skeleton.bundle.mjs"
);
const decoder = new TextDecoder("utf-8", { fatal: true });

test("seeded runtime-generated fixtures satisfy the full deterministic contract", async () => {
  const fingerprints = new Set();
  for (const seed of [0, 1, 2, 3, 5, 8, 13, 21]) {
    const generated = await generatedFixture(seed);
    const repeat = await generatedFixture(seed);
    assert.deepEqual(repeat.sourceBytes, generated.sourceBytes);
    assert.equal(repeat.requestText, generated.requestText);

    const result = await compileCore(generated.coreRequest);
    assert.equal(result.status, "success", `seed ${seed}`);
    await verifyDistributionArtifacts(result.artifacts);
    fingerprints.add(result.coreFingerprint);

    const html = decoder.decode(result.artifacts["presentation.html"]);
    const document = new JSDOM(html).window.document;
    assert.equal(document.querySelector("h1").textContent, generated.expected.relationshipTitle);
    assert.equal(document.querySelector("p").textContent, generated.expected.sentence);
    assert.deepEqual(
      [...document.querySelectorAll("li")].map((item) => item.textContent),
      generated.expected.participantLabels,
    );
    assert.equal(html.includes("relationship-42"), false);

    assert.equal(
      revalidateHtmlSubset({
        bytes: result.artifacts["presentation.html"],
        carrierNavigation: decoder.decode(
          generated.coreRequest.inputs.carrierNavigation,
        ),
        carrierStyle: decoder.decode(generated.coreRequest.inputs.carrierStyle),
        htmlProjection: parseArtifact(result, "07-html-projection.jsonld"),
        narrative: parseArtifact(result, "05-narrative.jsonld"),
        presentation: parseArtifact(result, "06-presentation.jsonld"),
      }),
      true,
    );
  }
  assert.equal(fingerprints.size, 8);
});
