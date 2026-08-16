import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { phase5Inputs, repositoryRoot } from "../phase5/phase5-fixture.mjs";

export async function phase7Inputs() {
  const [{ parsed }, carrierStyleBytes, carrierNavigationBytes] =
    await Promise.all([
      phase5Inputs(),
      readFile(resolve(repositoryRoot, "carrier/presentation.css")),
      readFile(resolve(repositoryRoot, "carrier/navigation.js")),
    ]);
  const decoder = new TextDecoder("utf-8", { fatal: true });
  return {
    ...parsed,
    carrierStyle: decoder.decode(carrierStyleBytes),
    carrierNavigation: decoder.decode(carrierNavigationBytes),
  };
}

export async function expectedPhase7Artifacts() {
  const names = [
    "01-request.jsonld",
    "02-resolution.jsonld",
    "03-contract-validation.jsonld",
    "04-content-manifest.jsonld",
    "05-narrative.jsonld",
    "06-presentation.jsonld",
    "07-html-projection.jsonld",
    "presentation.html",
  ];
  return Object.fromEntries(
    await Promise.all(
      names.map(async (name) => [
        name,
        new Uint8Array(
          await readFile(resolve(repositoryRoot, "expected/relationship-42", name)),
        ),
      ]),
    ),
  );
}
