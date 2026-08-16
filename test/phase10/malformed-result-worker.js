import { parentPort } from "node:worker_threads";

parentPort.postMessage({ kind: "core-result", result: null });
