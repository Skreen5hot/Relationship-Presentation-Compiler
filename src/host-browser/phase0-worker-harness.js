import { runPhase0ExpansionProbe } from "../core/phase0-jsonld-adapter.js";

globalThis.onmessage = async (event) => {
  try {
    if (event.data.poisonNetwork) {
      for (const name of ["EventSource", "WebSocket", "XMLHttpRequest", "fetch"]) {
        Object.defineProperty(globalThis, name, {
          configurable: true,
          value() {
            throw new Error(`CPS poison activated: ${name}`);
          }
        });
      }
    }

    const result = await runPhase0ExpansionProbe(
      event.data.document,
      event.data.contextDocument
    );
    globalThis.postMessage({ status: "ok", result });
  } catch (error) {
    globalThis.postMessage({
      status: "error",
      message: error instanceof Error ? error.message : String(error)
    });
  }
};
