import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { compileCore } from "../build/phase2/relationship-presentation-core.skeleton.bundle.mjs";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = resolve(repositoryRoot, "expected", "relationship-42");

async function bytes(path) {
  return new Uint8Array(await readFile(resolve(repositoryRoot, path)));
}

const [
  context,
  contract,
  canonicalProfile,
  source,
  request,
  carrierStyle,
  carrierNavigation,
] = await Promise.all(
  [
    "contexts/poc.context.jsonld",
    "contract/person-association-contract.jsonld",
    "profiles/two-slide-explainer.jsonld",
    "fixtures/relationship-42.jsonld",
    "fixtures/relationship-42-request.txt",
    "carrier/presentation.css",
    "carrier/navigation.js",
  ].map(bytes),
);
const result = await compileCore({
  inputs: {
    context,
    contract,
    canonicalProfile,
    userProfile: new Uint8Array(canonicalProfile),
    source,
    request,
    carrierStyle,
    carrierNavigation,
  },
});
assert.equal(result.status, "success", result.statusLine);

await mkdir(outputDirectory, { recursive: true });
await Promise.all(
  Object.entries(result.artifacts).map(([name, artifactBytes]) =>
    writeFile(resolve(outputDirectory, name), artifactBytes),
  ),
);
console.log("Regenerated all fourteen canonical Phase 8 golden artifacts.");
