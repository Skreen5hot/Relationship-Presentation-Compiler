import assert from "node:assert/strict";
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { verifyNodeHostLocks } from "../../src/host-node/locks.js";
import { runNodeCompilation } from "../../src/host-node/node-host.js";
import { comparableResult } from "../phase2/core-request-fixture.mjs";
import { buildConformanceCorpus } from "./conformance-corpus.mjs";

const repositoryRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const { compileCore } = await import(
  "../../browser/relationship-presentation-core.bundle.mjs"
);

function isC0Case(entry) {
  return entry.expected === "INVALID_CORE_REQUEST";
}

function isCarrierMutation(entry) {
  return entry.name === "negative:mutated-locked-carrier";
}

test("the full corpus is byte-identical through the Node host end to end", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "rpc-phase10-node-corpus-"));
  t.after(() => rm(root, { force: true, recursive: true }));
  const inputsRoot = join(root, "inputs");
  const outputsRoot = join(root, "outputs");
  await mkdir(inputsRoot);
  await mkdir(outputsRoot);

  const corpus = await buildConformanceCorpus();
  const lockEvidence = await verifyNodeHostLocks({ packageRoot: repositoryRoot });
  for (const [index, entry] of corpus.entries()) {
    await t.test(entry.name, async () => {
      const expected = comparableResult(await compileCore(entry.coreRequest));
      if (isC0Case(entry)) {
        assert.equal(expected.code, "INVALID_CORE_REQUEST");
        return;
      }

      const caseName = `${String(index).padStart(3, "0")}-${entry.name.replaceAll(/[^a-z0-9-]/giu, "-")}`;
      const inputDirectory = join(inputsRoot, caseName);
      await mkdir(inputDirectory);
      const sourcePath = join(inputDirectory, "source.jsonld");
      const requestPath = join(inputDirectory, "request.txt");
      const profilePath = join(inputDirectory, "profile.jsonld");
      await Promise.all([
        writeFile(sourcePath, entry.coreRequest.inputs.source),
        writeFile(requestPath, entry.coreRequest.inputs.request),
        writeFile(profilePath, entry.coreRequest.inputs.userProfile),
      ]);
      const options = {
        defaultMode: false,
        out: join(outputsRoot, caseName),
        profile: profilePath,
        replace: false,
        request: requestPath,
        source: sourcePath,
      };

      let actual;
      if (isCarrierMutation(entry)) {
        const carrierPath = resolve(repositoryRoot, "carrier/presentation.css");
        const mutatedCarrier = new Uint8Array(await readFile(carrierPath));
        mutatedCarrier[0] ^= 1;
        actual = await runNodeCompilation(options, {
          lockOptions: {
            readFile: async (path) =>
              resolve(path) === carrierPath ? mutatedCarrier : readFile(path),
            verifyGraph: false,
          },
          packageRoot: repositoryRoot,
        });
      } else {
        actual = await runNodeCompilation(options, {
          lockEvidence,
          packageRoot: repositoryRoot,
        });
      }
      assert.deepEqual(comparableResult(actual), expected);
    });
  }
});
