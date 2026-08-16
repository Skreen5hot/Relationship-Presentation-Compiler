globalThis.addEventListener("message", () => {
  globalThis.postMessage({ kind: "core-result", result: null });
});
