globalThis.addEventListener("message", () => {
  globalThis.postMessage({
    kind: "core-result",
    result: {
      status: "error",
      statusLine: "status=error code=INVALID_CORE_REQUEST\r\n",
      code: "INVALID_CORE_REQUEST",
      errorReport: new TextEncoder().encode(
        '{\n  "errorVersion": "error-report-v1.0",\n  "code": "INVALID_CORE_REQUEST",\n  "violations": []\n}\n',
      ),
    },
  });
});
