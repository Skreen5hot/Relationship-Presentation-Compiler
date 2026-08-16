import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

import { ARTIFACT_FILENAMES } from "../../src/host-node/publication.js";

const encoder = new TextEncoder();

function jsonBytes(value) {
  return encoder.encode(`${JSON.stringify(value, null, 2)}\n`);
}

export function phase3ArtifactSet(marker) {
  const artifacts = Object.fromEntries(
    ARTIFACT_FILENAMES.map((filename) => [
      filename,
      encoder.encode(`phase-3-substrate ${marker} ${filename}\n`),
    ]),
  );
  artifacts[".relationship-presentation-poc-owned"] = jsonBytes({
    sentinelVersion: "owned-output-v1.0",
    owner: "relationship-presentation-poc",
    purpose:
      "Marks this directory as compiler-owned output eligible for replacement.",
  });
  artifacts["09-distribution-manifest.json"] = jsonBytes({
    manifestVersion: "distribution-manifest-v1.0",
    phase3SubstrateFixture: marker,
  });
  return artifacts;
}

export async function assertPublishedArtifactSet(outputPath, expectedArtifacts) {
  assert.deepEqual(
    (await readdir(outputPath)).sort(),
    [...ARTIFACT_FILENAMES].sort(),
  );
  for (const filename of ARTIFACT_FILENAMES) {
    assert.deepEqual(
      new Uint8Array(await readFile(join(outputPath, filename))),
      expectedArtifacts[filename],
      `${filename} did not preserve its supplied bytes`,
    );
  }
}
