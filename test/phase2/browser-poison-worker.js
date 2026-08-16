import {
  completeCpsPoison,
  installCpsPoison,
} from "./poisoned-globals-harness.mjs";

const send = globalThis.postMessage.bind(globalThis);
const coreModule = import("./relationship-presentation-core.skeleton.bundle.mjs");

globalThis.onmessage = async (event) => {
  try {
    const { compileCore } = await coreModule;
    await globalThis.crypto.subtle.digest("SHA-256", new Uint8Array());
    const observations = installCpsPoison();
    await globalThis.crypto.subtle.digest("SHA-256", new Uint8Array());
    observations.decoders.length = 0;
    observations.digests.length = 0;
    observations.encoders = 0;
    completeCpsPoison();
    const result = await compileCore(event.data);
    send({ observations, result });
  } catch (error) {
    send({
      harnessError: error instanceof Error ? error.message : String(error),
    });
  }
};
