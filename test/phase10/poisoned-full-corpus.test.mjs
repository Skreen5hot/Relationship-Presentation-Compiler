import assert from "node:assert/strict";
import test from "node:test";
import { Worker } from "node:worker_threads";

import { comparableResult } from "../phase2/core-request-fixture.mjs";
import { buildConformanceCorpus } from "./conformance-corpus.mjs";

const { compileCore } = await import(
  "../../build/phase2/relationship-presentation-core.skeleton.bundle.mjs"
);

function runPoisoned(corpus) {
  return new Promise((resolveResult, reject) => {
    const worker = new Worker(
      new URL("./node-poison-corpus-worker.mjs", import.meta.url),
      { execArgv: [], workerData: corpus },
    );
    worker.once("error", reject);
    worker.once("message", (message) => {
      worker.terminate();
      resolveResult(message);
    });
  });
}

test("the full corpus stays inside the CPS under poisoned Node globals", async () => {
  const corpus = await buildConformanceCorpus();
  const expected = [];
  for (const entry of corpus) {
    expected.push(comparableResult(await compileCore(entry.coreRequest)));
  }
  const poisoned = await runPoisoned(corpus.map(({ coreRequest }) => coreRequest));
  assert.equal(poisoned.harnessError, undefined);
  assert.deepEqual(poisoned.results.map(comparableResult), expected);
  assert.ok(poisoned.observations.digests.length > 0);
  assert.equal(
    poisoned.observations.digests.every((algorithm) => algorithm === "SHA-256"),
    true,
  );
  assert.ok(poisoned.observations.decoders.length > 0);
  assert.equal(
    poisoned.observations.decoders.every(({ fatal }) => fatal === true),
    true,
  );
  assert.ok(poisoned.observations.encoders > 0);
});
