import { Worker } from "node:worker_threads";

import { buildNodeHostFailure, mapNodeResultToTerminal } from "./failure-surface.js";

const DEFAULT_TIMEOUT_MS = 40_000;
const DEFAULT_WORKER_URL = new URL("./compiler-worker.js", import.meta.url);

function hostFailure(code) {
  return buildNodeHostFailure({ code, violations: [] });
}

export function runSupervisedCore(
  coreRequest,
  {
    resourceLimits = { maxOldGenerationSizeMb: 256 },
    timeoutMs = DEFAULT_TIMEOUT_MS,
    workerUrl = DEFAULT_WORKER_URL,
  } = {},
) {
  if (
    typeof timeoutMs !== "number" ||
    !Number.isFinite(timeoutMs) ||
    timeoutMs <= 0
  ) {
    throw new TypeError("timeoutMs must be a positive finite number");
  }

  return new Promise((resolveResult) => {
    let worker;
    let timer;
    let settled = false;

    function settle(result) {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      resolveResult(result);
    }

    try {
      worker = new Worker(workerUrl, {
        execArgv: [],
        resourceLimits,
        workerData: { coreRequest },
      });
    } catch {
      settle(hostFailure("INTERNAL_COMPILER_ERROR"));
      return;
    }

    worker.once("message", (message) => {
      if (message?.kind !== "core-result") {
        settle(hostFailure("INTERNAL_COMPILER_ERROR"));
        worker.terminate();
        return;
      }
      try {
        mapNodeResultToTerminal(message.result);
        settle(message.result);
      } catch {
        settle(hostFailure("INTERNAL_COMPILER_ERROR"));
      }
      worker.terminate();
    });
    worker.once("error", (error) => {
      settle(
        hostFailure(
          error?.code === "ERR_WORKER_OUT_OF_MEMORY"
            ? "MEMORY_LIMIT_EXCEEDED"
            : "INTERNAL_COMPILER_ERROR",
        ),
      );
    });
    worker.once("exit", (code) => {
      if (!settled) {
        settle(hostFailure("INTERNAL_COMPILER_ERROR"));
      }
    });

    timer = setTimeout(() => {
      settle(hostFailure("BUILD_TIMEOUT"));
      worker.terminate();
    }, timeoutMs);
  });
}
