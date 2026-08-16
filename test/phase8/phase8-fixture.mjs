import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { CANONICAL_ARTIFACT_NAMES } from "../../src/core/artifact-set.js";
import { canonicalCoreRequest } from "../phase2/core-request-fixture.mjs";
import { repositoryRoot } from "../phase5/phase5-fixture.mjs";

export async function canonicalPhase8Result() {
  const { compileCore } = await import(
    "../../build/phase2/relationship-presentation-core.skeleton.bundle.mjs"
  );
  return compileCore(await canonicalCoreRequest());
}

export async function expectedPhase8Artifacts() {
  return Object.fromEntries(
    await Promise.all(
      CANONICAL_ARTIFACT_NAMES.map(async (name) => [
        name,
        new Uint8Array(
          await readFile(resolve(repositoryRoot, "expected/relationship-42", name)),
        ),
      ]),
    ),
  );
}
