import assert from "node:assert/strict";
import test from "node:test";
import { Worker } from "node:worker_threads";

import {
  bytes,
  canonicalCoreRequest,
  cloneCoreRequest,
  comparableResult,
} from "./core-request-fixture.mjs";

const { compileCore } = await import(
  "../../build/phase2/relationship-presentation-core.skeleton.bundle.mjs"
);

function runPoisoned(coreRequest) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./node-poison-worker.mjs", import.meta.url), {
      type: "module",
      workerData: coreRequest,
    });
    worker.once("error", reject);
    worker.once("message", (message) => {
      worker.terminate();
      resolve(message);
    });
  });
}

function assertObservations(observations, digests, decoders, encoders = 1) {
  assert.deepEqual(observations.digests, Array(digests).fill("SHA-256"));
  assert.equal(
    observations.decoders.filter(({ fatal }) => fatal === true).length,
    decoders,
  );
  assert.equal(observations.encoders, encoders);
}

test("the Phase 2 corpus is deterministic under poisoned Node globals", async () => {
  const canonical = await canonicalCoreRequest();
  const missingInput = cloneCoreRequest(canonical);
  delete missingInput.inputs.source;
  const unknownInput = cloneCoreRequest(canonical);
  unknownInput.inputs.extra = new Uint8Array();
  const nonByteInput = cloneCoreRequest(canonical);
  nonByteInput.inputs.source = "not bytes";
  const lockedRoles = [
    "context",
    "contract",
    "canonicalProfile",
    "carrierStyle",
    "carrierNavigation",
  ];
  const lockedMutations = lockedRoles.map((role, index) => {
    const request = cloneCoreRequest(canonical);
    request.inputs[role][0] ^= 1;
    return [request, index + 1, 0];
  });
  const duplicateSource = cloneCoreRequest(canonical);
  duplicateSource.inputs.source = bytes('{"x":1,"\\u0078":2}');
  const deepSource = cloneCoreRequest(canonical);
  deepSource.inputs.source = bytes(`${"[".repeat(65)}0${"]".repeat(65)}`);
  const invalidRequestUtf8 = cloneCoreRequest(canonical);
  invalidRequestUtf8.inputs.request = new Uint8Array([0xff]);

  const corpus = [
    [canonical, 5, 8, 4],
    [missingInput, 0, 0],
    [unknownInput, 0, 0],
    [nonByteInput, 0, 0],
    ...lockedMutations,
    [duplicateSource, 5, 5],
    [deepSource, 5, 5],
    [invalidRequestUtf8, 5, 6],
  ];

  for (const [coreRequest, digestCount, decoderCount, encoderCount] of corpus) {
    const expected = comparableResult(await compileCore(coreRequest));
    const poisoned = await runPoisoned(coreRequest);
    assert.equal(poisoned.harnessError, undefined);
    assert.deepEqual(comparableResult(poisoned.result), expected);
    assertObservations(
      poisoned.observations,
      digestCount,
      decoderCount,
      encoderCount,
    );
  }
});
