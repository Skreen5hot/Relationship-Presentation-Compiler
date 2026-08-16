import { openSync } from "node:fs";

import { tryLock } from "fs-native-extensions";

const lockPath = process.argv[2];
const descriptor = openSync(lockPath, "a+");
const acquired = tryLock(descriptor);

if (process.send) {
  process.send({ acquired });
}

if (!acquired) {
  process.exitCode = 1;
} else {
  process.on("message", (message) => {
    if (message === "exit-without-unlock") {
      process.exit(73);
    }
  });
  setInterval(() => {}, 60_000);
}
