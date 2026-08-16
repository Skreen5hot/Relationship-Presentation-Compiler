import { parentPort, workerData } from "node:worker_threads";

import {
  completeCpsPoison,
  installCpsPoison,
} from "./poisoned-globals-harness.mjs";

const send = parentPort.postMessage.bind(parentPort);
const { compileCore } = await import(
  "../../build/phase2/relationship-presentation-core.skeleton.bundle.mjs"
);
await globalThis.crypto.subtle.digest("SHA-256", new Uint8Array());
const observations = installCpsPoison();
await globalThis.crypto.subtle.digest("SHA-256", new Uint8Array());
observations.decoders.length = 0;
observations.digests.length = 0;
observations.encoders = 0;
completeCpsPoison();

try {
  send({ observations, result: await compileCore(workerData) });
} catch (error) {
  send({
    harnessError: error instanceof Error ? error.message : String(error),
    observations,
  });
}
