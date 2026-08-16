import {
  completeCpsPoison,
  installCpsPoison,
} from "../phase2/poisoned-globals-harness.mjs";

const send = globalThis.postMessage.bind(globalThis);
const coreModule = import("../../browser/relationship-presentation-core.bundle.mjs");

globalThis.onmessage = async (event) => {
  try {
    const { compileCore } = await coreModule;
    const corpus = event.data.map((serializedRequest) =>
      serializedRequest?.inputs === undefined
        ? serializedRequest
        : {
            inputs: Object.fromEntries(
              Object.entries(serializedRequest.inputs).map(([role, encoded]) => [
                role,
                encoded.kind === "bytes"
                  ? new Uint8Array(encoded.value)
                  : encoded.value,
              ]),
            ),
          },
    );
    await globalThis.crypto.subtle.digest("SHA-256", new Uint8Array());
    const observations = installCpsPoison();
    await globalThis.crypto.subtle.digest("SHA-256", new Uint8Array());
    observations.decoders.length = 0;
    observations.digests.length = 0;
    observations.encoders = 0;
    completeCpsPoison();
    const results = [];
    for (const coreRequest of corpus) {
      results.push(await compileCore(coreRequest));
    }
    send({ observations, results });
  } catch (error) {
    send({
      harnessError: error instanceof Error ? error.message : "non-Error failure",
    });
  }
};
