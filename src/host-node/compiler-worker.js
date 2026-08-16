import { parentPort, workerData } from "node:worker_threads";

import { compileCore } from "../../browser/relationship-presentation-core.bundle.mjs";

const result = await compileCore(workerData.coreRequest);
parentPort.postMessage({ kind: "core-result", result });
