import {
  buildErrorReport,
  compileCore,
} from "../../browser/relationship-presentation-core.bundle.mjs";

function hostFailure(code) {
  return {
    status: "error",
    statusLine: `status=error code=${code}\n`,
    code,
    errorReport: buildErrorReport({ code, violations: [] }),
  };
}

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
