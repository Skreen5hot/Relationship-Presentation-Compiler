import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  phase5Inputs,
  repositoryRoot,
} from "../phase5/phase5-fixture.mjs";

export async function phase6Inputs() {
  return phase5Inputs();
}

export async function expectedPhase6Artifacts() {
  return Object.fromEntries(
    await Promise.all(
      [
        "01-request.jsonld",
        "02-resolution.jsonld",
        "03-contract-validation.jsonld",
        "04-content-manifest.jsonld",
        "05-narrative.jsonld",
        "06-presentation.jsonld",
      ].map(async (name) => [
        name,
        new Uint8Array(
          await readFile(resolve(repositoryRoot, "expected/relationship-42", name)),
        ),
      ]),
    ),
  );
}
