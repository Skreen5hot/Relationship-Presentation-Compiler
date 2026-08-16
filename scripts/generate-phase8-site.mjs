import assert from "node:assert/strict";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { compileCore } from "../build/phase2/relationship-presentation-core.skeleton.bundle.mjs";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const siteDirectory = resolve(repositoryRoot, "site");

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
const sentinel = result.artifacts[".relationship-presentation-poc-owned"];
const demoText = new TextDecoder("utf-8", { fatal: true }).decode(
  result.artifacts["demo.html"],
);
const pagesIndexText = demoText.replace(
  'href=".relationship-presentation-poc-owned"',
  'href="ownership-sentinel.json"',
);
assert.notEqual(pagesIndexText, demoText);
const pagesIndex = new TextEncoder().encode(pagesIndexText);

await rm(siteDirectory, { force: true, recursive: true });
await mkdir(siteDirectory, { recursive: true });
await Promise.all([
  writeFile(resolve(siteDirectory, ".nojekyll"), new Uint8Array()),
  ...Object.entries(result.artifacts).map(([name, artifactBytes]) =>
    writeFile(resolve(siteDirectory, name), artifactBytes),
  ),
  // GitHub Pages deliberately does not serve dot-prefixed paths. The canonical
  // sentinel remains present; this byte-identical alias keeps its homepage link usable.
  writeFile(resolve(siteDirectory, "ownership-sentinel.json"), sentinel),
  writeFile(resolve(siteDirectory, "index.html"), pagesIndex),
]);

console.log(
  `Generated the verified Phase 8 site (${result.coreFingerprint}, ${result.distributionFingerprint}).`,
);
