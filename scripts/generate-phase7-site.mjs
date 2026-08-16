import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { parseJsonBytes } from "../src/core/json-scan.js";
import { runPhase7 } from "../src/core/phase7.js";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const siteDirectory = resolve(repositoryRoot, "site");

async function bytes(path) {
  return new Uint8Array(await readFile(resolve(repositoryRoot, path)));
}

const [context, contract, profile, source, request, carrierStyle, carrierNavigation] =
  await Promise.all(
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
const decoder = new TextDecoder("utf-8", { fatal: true });
const result = await runPhase7({
  context: parseJsonBytes(context).value,
  contract: parseJsonBytes(contract).value,
  canonicalProfile: parseJsonBytes(profile).value,
  userProfile: parseJsonBytes(profile).value,
  source: parseJsonBytes(source).value,
  request: decoder.decode(request),
  carrierStyle: decoder.decode(carrierStyle),
  carrierNavigation: decoder.decode(carrierNavigation),
});

await rm(siteDirectory, { force: true, recursive: true });
await mkdir(siteDirectory, { recursive: true });
await Promise.all([
  writeFile(resolve(siteDirectory, ".nojekyll"), new Uint8Array()),
  writeFile(resolve(siteDirectory, "poc.context.jsonld"), context),
  ...Object.entries(result.artifacts).map(([name, artifactBytes]) =>
    writeFile(resolve(siteDirectory, name), artifactBytes)
  ),
  writeFile(resolve(siteDirectory, "index.html"), result.artifacts["demo.html"]),
]);

console.log("Generated the deterministic Phase 7 GitHub Pages site.");
