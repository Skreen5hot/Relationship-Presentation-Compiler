import { compileCore } from "../../browser/relationship-presentation-core.bundle.mjs";
import { hostFailure } from "./host-failure.js";

globalThis.addEventListener("message", async (event) => {
  if (event.data?.kind !== "compile-core") {
    return;
  }

  let result;
  try {
    result = await compileCore(event.data.coreRequest);
  } catch {
    result = hostFailure("INTERNAL_COMPILER_ERROR");
  }
  globalThis.postMessage({ kind: "core-result", result });
});
