import { buildErrorReport } from "../../browser/relationship-presentation-core.bundle.mjs";

const DEFAULT_TIMEOUT_MS = 40_000;
const DEFAULT_WORKER_URL = new URL("./worker-harness.js", import.meta.url);

function hostFailure(code) {
  return {
    status: "error",
    statusLine: `status=error code=${code}\n`,
    code,
    errorReport: buildErrorReport({ code, violations: [] }),
  };
}

function timeoutMilliseconds(supervision) {
  const timeoutMs = supervision?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  if (
    typeof timeoutMs !== "number" ||
    !Number.isFinite(timeoutMs) ||
    timeoutMs <= 0
  ) {
    throw new TypeError("supervision.timeoutMs must be a positive number");
  }
  return timeoutMs;
}

function isByteMap(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  return Object.values(value).every(
    (bytes) =>
      Object.prototype.toString.call(bytes) === "[object Uint8Array]",
  );
}

function isCoreResult(result) {
  if (result === null || typeof result !== "object" || Array.isArray(result)) {
    return false;
  }
  if (result.status === "error") {
    return (
      typeof result.statusLine === "string" &&
      typeof result.code === "string" &&
      Object.prototype.toString.call(result.errorReport) ===
        "[object Uint8Array]"
    );
  }
  if (result.status === "success") {
    return (
      typeof result.statusLine === "string" &&
      typeof result.coreFingerprint === "string" &&
      typeof result.distributionFingerprint === "string" &&
      isByteMap(result.artifacts)
    );
  }
  return false;
}

export function createRelationshipPresentationCompiler(options = {}) {
  const workerUrl = options.workerUrl ?? DEFAULT_WORKER_URL;
  const activeInvocations = new Set();
  let closed = false;

  function compile(coreRequest, supervision) {
    if (closed) {
      throw new TypeError("The browser compiler handle is closed");
    }
    const timeoutMs = timeoutMilliseconds(supervision);

    return new Promise((resolveResult) => {
      let worker;
      let timer;
      let settled = false;
      const invocation = {
        settle(result) {
          if (settled) {
            return;
          }
          settled = true;
          if (timer !== undefined) {
            clearTimeout(timer);
          }
          activeInvocations.delete(invocation);
          worker?.terminate();
          resolveResult(result);
        },
      };

      try {
        worker = new Worker(workerUrl, {
          name: "relationship-presentation-compiler",
          type: "module",
        });
      } catch {
        invocation.settle(hostFailure("INTERNAL_COMPILER_ERROR"));
        return;
      }

      activeInvocations.add(invocation);
      worker.addEventListener("message", (event) => {
        if (
          event.data?.kind !== "core-result" ||
          !isCoreResult(event.data.result)
        ) {
          invocation.settle(hostFailure("INTERNAL_COMPILER_ERROR"));
          return;
        }
        invocation.settle(event.data.result);
      });
      worker.addEventListener("messageerror", () => {
        invocation.settle(hostFailure("INTERNAL_COMPILER_ERROR"));
      });
      worker.addEventListener("error", (event) => {
        event.preventDefault();
        invocation.settle(hostFailure("INTERNAL_COMPILER_ERROR"));
      });

      timer = setTimeout(() => {
        invocation.settle(hostFailure("BUILD_TIMEOUT"));
      }, timeoutMs);

      try {
        worker.postMessage({ kind: "compile-core", coreRequest });
      } catch {
        invocation.settle(hostFailure("INVALID_CORE_REQUEST"));
      }
    });
  }

  async function close() {
    if (closed) {
      return;
    }
    closed = true;
    for (const invocation of [...activeInvocations]) {
      invocation.settle(hostFailure("INTERNAL_COMPILER_ERROR"));
    }
  }

  return Object.freeze({ close, compile });
}
