import assert from "node:assert/strict";
import { closeSync, openSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { fork } from "node:child_process";
import test from "node:test";

import { tryLock, unlock } from "fs-native-extensions";

function onceMessage(child) {
  return new Promise((resolve, reject) => {
    let standardError = "";
    child.stderr.on("data", (chunk) => {
      standardError += chunk.toString("utf8");
    });
    const timeout = setTimeout(
      () => reject(new Error("lock holder did not report within 10 seconds")),
      10_000
    );
    child.once("message", (message) => {
      clearTimeout(timeout);
      resolve(message);
    });
    child.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.once("exit", (code) => {
      clearTimeout(timeout);
      reject(
        new Error(
          `lock holder exited before reporting (code ${code}): ${standardError}`
        )
      );
    });
  });
}

function onceExit(child) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("lock holder did not exit within 10 seconds")),
      10_000
    );
    child.once("exit", (code) => {
      clearTimeout(timeout);
      resolve(code);
    });
    child.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

test("native advisory lock excludes another process and releases on death", async () => {
  const directory = await mkdtemp(join(tmpdir(), "rpc-phase0-lock-"));
  const lockPath = join(directory, "publication.lock");
  const holderScript = fileURLToPath(
    new URL("./filesystem-lock-holder.mjs", import.meta.url)
  );
  const holder = fork(holderScript, [lockPath], {
    stdio: ["ignore", "ignore", "pipe", "ipc"]
  });
  let descriptor;

  try {
    const message = await onceMessage(holder);
    assert.deepEqual(message, { acquired: true });

    descriptor = openSync(lockPath, "a+");
    assert.equal(tryLock(descriptor), false, "second process acquired held lock");

    const exited = onceExit(holder);
    holder.send("exit-without-unlock");
    assert.equal(await exited, 73, "holder did not take the abnormal-exit path");

    assert.equal(
      tryLock(descriptor),
      true,
      "operating system did not release the lock when its holder died"
    );
    unlock(descriptor);
  } finally {
    if (descriptor !== undefined) {
      closeSync(descriptor);
    }
    if (holder.exitCode === null) {
      holder.send("exit-without-unlock");
      await onceExit(holder);
    }
    await rm(directory, { recursive: true, force: true });
  }
});
