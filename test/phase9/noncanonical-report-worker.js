globalThis.addEventListener("message", () => {
  globalThis.postMessage({
    kind: "core-result",
    result: {
      status: "error",
      statusLine: "status=error code=INVALID_CORE_REQUEST\n",
      code: "INVALID_CORE_REQUEST",
      errorReport: new TextEncoder().encode("{}\n"),
    },
  });
});
