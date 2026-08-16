import assert from "node:assert/strict";
import { fork, spawn } from "node:child_process";
import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { buildErrorReport } from "../../src/core/error-report.js";
import {
  JOURNAL_STEPS,
  PublicationError,
  publishArtifactSet,
  validateOutputTarget,
  writeDetachedFailureReport,
} from "../../src/host-node/publication.js";

import {
  assertPublishedArtifactSet,
  phase3ArtifactSet,
} from "./publication-fixture.mjs";

const repositoryRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const crashChildPath = fileURLToPath(
  new URL("./publication-crash-child.mjs", import.meta.url),
);
const lockHolderPath = fileURLToPath(
  new URL("./publication-lock-holder.mjs", import.meta.url),
);

async function createCase(t, label) {
  const root = await mkdtemp(join(tmpdir(), `rpc-phase3-${label}-`));
  const parent = join(root, "publication-parent");
  const outputPath = join(parent, "presentation");
  await mkdir(parent);
  t.after(() => rm(root, { force: true, recursive: true }));
  return { outputPath, parent, root };
}

async function assertPublicationCode(action, code) {
  await assert.rejects(
    action,
    (error) => error instanceof PublicationError && error.code === code,
  );
}

async function publishInitial(t, label, marker = "initial") {
  const paths = await createCase(t, label);
  const preparedOutput = await validateOutputTarget({
    outputPath: paths.outputPath,
  });
  const artifacts = phase3ArtifactSet(marker);
  await publishArtifactSet({ artifacts, preparedOutput });
  return { ...paths, artifacts };
}

async function exists(path) {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

function waitForExit(child) {
  return new Promise((resolveExit, reject) => {
    let standardError = "";
    child.stderr?.on("data", (chunk) => {
      standardError += chunk.toString("utf8");
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      resolveExit({ code, signal, standardError });
    });
  });
}

function waitForMessage(child) {
  return new Promise((resolveMessage, reject) => {
    const timer = setTimeout(
      () => reject(new Error("publication lock holder did not respond")),
      10_000,
    );
    child.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.once("message", (message) => {
      clearTimeout(timer);
      resolveMessage(message);
    });
    child.once("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`publication lock holder exited with ${code}`));
    });
  });
}

test("fresh publication is byte-preserving, atomic, and staged beside the target", async (t) => {
  const { outputPath, parent } = await createCase(t, "fresh");
  const artifacts = phase3ArtifactSet("fresh");
  const preparedOutput = await validateOutputTarget({ outputPath });

  assert.deepEqual(
    await publishArtifactSet({ artifacts, preparedOutput }),
    { recovered: false, replaced: false },
  );
  await assertPublishedArtifactSet(outputPath, artifacts);
  assert.deepEqual((await readdir(parent)).sort(), [
    "presentation",
    "presentation.lock",
  ]);

  await assertPublicationCode(
    () => validateOutputTarget({ outputPath }),
    "OUTPUT_EXISTS",
  );
});

test("replacement accepts only complete v1.0-owned targets", async (t) => {
  await t.test("valid ownership is replaceable", async (t) => {
    const { outputPath } = await publishInitial(t, "owned-pass");
    const replacement = phase3ArtifactSet("replacement");
    const preparedOutput = await validateOutputTarget({
      outputPath,
      replace: true,
    });
    assert.deepEqual(
      await publishArtifactSet({
        artifacts: replacement,
        preparedOutput,
        replace: true,
      }),
      { recovered: false, replaced: true },
    );
    await assertPublishedArtifactSet(outputPath, replacement);
  });

  for (const mutation of [
    {
      label: "prior-lineage",
      mutate: async (outputPath) =>
        writeFile(
          join(outputPath, ".relationship-presentation-poc-owned"),
          `${JSON.stringify({
            sentinelVersion: "owned-output-v0.4.1",
            owner: "relationship-presentation-poc",
          })}\n`,
        ),
    },
    {
      label: "wrong-owner",
      mutate: async (outputPath) =>
        writeFile(
          join(outputPath, ".relationship-presentation-poc-owned"),
          `${JSON.stringify({
            sentinelVersion: "owned-output-v1.0",
            owner: "some-other-tool",
          })}\n`,
        ),
    },
    {
      label: "invalid-manifest",
      mutate: async (outputPath) =>
        writeFile(
          join(outputPath, "09-distribution-manifest.json"),
          "not json\n",
        ),
    },
    {
      label: "extra-entry",
      mutate: async (outputPath) =>
        writeFile(join(outputPath, "user-data.txt"), "do not delete\n"),
    },
  ]) {
    await t.test(`${mutation.label} is not adopted`, async (t) => {
      const { outputPath } = await publishInitial(t, mutation.label);
      await mutation.mutate(outputPath);
      const preparedOutput = await validateOutputTarget({
        outputPath,
        replace: true,
      });
      await assertPublicationCode(
        () =>
          publishArtifactSet({
            artifacts: phase3ArtifactSet("replacement"),
            preparedOutput,
            replace: true,
          }),
        "OUTPUT_NOT_OWNED",
      );
      assert.equal(await exists(outputPath), true);
      if (mutation.label === "extra-entry") {
        assert.equal(
          await readFile(join(outputPath, "user-data.txt"), "utf8"),
          "do not delete\n",
        );
      }
    });
  }
});

test("output safety rejects special, symlinked, package-contained, and overlapping targets", async (t) => {
  const fileCase = await createCase(t, "special-file");
  await writeFile(fileCase.outputPath, "not a directory\n");
  await assertPublicationCode(
    () => validateOutputTarget({ outputPath: fileCase.outputPath }),
    "UNSAFE_OUTPUT_PATH",
  );

  const symlinkCase = await createCase(t, "symlink");
  const realTarget = join(symlinkCase.root, "real-target");
  await mkdir(realTarget);
  await symlink(
    realTarget,
    symlinkCase.outputPath,
    process.platform === "win32" ? "junction" : "dir",
  );
  await assertPublicationCode(
    () => validateOutputTarget({ outputPath: symlinkCase.outputPath }),
    "UNSAFE_OUTPUT_PATH",
  );

  await assertPublicationCode(
    () =>
      validateOutputTarget({
        outputPath: join(repositoryRoot, "phase3-unsafe-output"),
      }),
    "INPUT_OUTPUT_OVERLAP",
  );
  const defaultTarget = await validateOutputTarget({
    defaultOutput: true,
    outputPath: join(repositoryRoot, "dist"),
  });
  assert.equal(defaultTarget.outputPath, join(repositoryRoot, "dist"));

  const overlapCase = await createCase(t, "input-overlap");
  const inputDirectory = join(overlapCase.root, "inputs");
  await mkdir(inputDirectory);
  const inputPath = join(inputDirectory, "source.jsonld");
  await writeFile(inputPath, "{}\n");
  await assertPublicationCode(
    () =>
      validateOutputTarget({
        inputPaths: [inputPath],
        outputPath: inputPath,
      }),
    "INPUT_OUTPUT_OVERLAP",
  );
  await assertPublicationCode(
    () =>
      validateOutputTarget({
        inputPaths: [inputPath],
        outputPath: join(inputDirectory, "published"),
      }),
    "INPUT_OUTPUT_OVERLAP",
  );
});

test("the OS advisory lock fails immediately and releases when its holder dies", async (t) => {
  const { outputPath } = await createCase(t, "lock");
  const holder = fork(lockHolderPath, [outputPath], {
    stdio: ["ignore", "ignore", "pipe", "ipc"],
  });
  t.after(() => {
    if (holder.exitCode === null) {
      holder.kill();
    }
  });
  assert.deepEqual(await waitForMessage(holder), { acquired: true });

  const preparedOutput = await validateOutputTarget({ outputPath });
  await assertPublicationCode(
    () =>
      publishArtifactSet({
        artifacts: phase3ArtifactSet("locked"),
        preparedOutput,
      }),
    "OUTPUT_LOCKED",
  );

  const holderExit = waitForExit(holder);
  holder.kill();
  await holderExit;
  await publishArtifactSet({
    artifacts: phase3ArtifactSet("released"),
    preparedOutput,
  });
  await assertPublishedArtifactSet(
    outputPath,
    phase3ArtifactSet("released"),
  );
});

test("kill-and-rerun recovery completes every journal boundary", async (t) => {
  for (const crashStep of JOURNAL_STEPS) {
    await t.test(crashStep, async (t) => {
      const { outputPath, parent } = await publishInitial(
        t,
        `recovery-${crashStep}`,
      );
      const child = spawn(
        process.execPath,
        [crashChildPath, outputPath, crashStep],
        { stdio: ["ignore", "ignore", "pipe"] },
      );
      const childResult = await waitForExit(child);
      assert.equal(
        childResult.code,
        86,
        `${crashStep}: ${childResult.standardError}`,
      );

      if (crashStep === "journal-written") {
        const journal = JSON.parse(
          await readFile(
            join(parent, "presentation.replace-journal.json"),
            "utf8",
          ),
        );
        assert.equal(dirname(join(parent, journal.staging)), parent);
        assert.equal(
          join(parent, journal.staging).startsWith(`${outputPath}\\`),
          false,
        );
        assert.equal(
          join(parent, journal.staging).startsWith(`${outputPath}/`),
          false,
        );
      }

      const replacement = phase3ArtifactSet("replacement");
      const preparedOutput = await validateOutputTarget({
        outputPath,
        replace: true,
      });
      await publishArtifactSet({
        artifacts: replacement,
        preparedOutput,
        replace: true,
      });
      await assertPublishedArtifactSet(outputPath, replacement);

      const siblings = await readdir(parent);
      assert.equal(
        siblings.some(
          (name) =>
            name.includes(".staging-") ||
            name.endsWith(".replace-backup") ||
            name.endsWith(".replace-journal.json"),
        ),
        false,
      );
    });
  }
});

test("corrupt or unsafe recovery state is preserved and fails closed", async (t) => {
  await t.test("an unreadable journal leaves the owned target untouched", async (t) => {
    const { outputPath, parent, artifacts } = await publishInitial(
      t,
      "corrupt-journal",
    );
    const journalPath = join(parent, "presentation.replace-journal.json");
    await writeFile(journalPath, "{ definitely not json\n");
    const preparedOutput = await validateOutputTarget({
      outputPath,
      replace: true,
    });
    await assertPublicationCode(
      () =>
        publishArtifactSet({
          artifacts: phase3ArtifactSet("replacement"),
          preparedOutput,
          replace: true,
        }),
      "OUTPUT_RECOVERY_REQUIRED",
    );
    await assertPublishedArtifactSet(outputPath, artifacts);
    assert.equal(await readFile(journalPath, "utf8"), "{ definitely not json\n");
  });

  await t.test("recovery never deletes an unowned backup", async (t) => {
    const { outputPath, parent } = await publishInitial(t, "unowned-backup");
    const backupPath = join(parent, "presentation.replace-backup");
    await mkdir(backupPath);
    await writeFile(join(backupPath, "user-data.txt"), "keep me\n");
    await writeFile(
      join(parent, "presentation.replace-journal.json"),
      `${JSON.stringify(
        {
          journalVersion: "replace-journal-v1.0",
          target: "presentation",
          staging: "presentation.staging-recovery-fixture",
          backup: "presentation.replace-backup",
          sequence: [
            "rename-target-to-backup",
            "rename-staging-to-target",
            "remove-backup",
            "remove-journal",
          ],
        },
        null,
        2,
      )}\n`,
    );
    const preparedOutput = await validateOutputTarget({
      outputPath,
      replace: true,
    });
    await assertPublicationCode(
      () =>
        publishArtifactSet({
          artifacts: phase3ArtifactSet("replacement"),
          preparedOutput,
          replace: true,
        }),
      "OUTPUT_RECOVERY_REQUIRED",
    );
    assert.equal(
      await readFile(join(backupPath, "user-data.txt"), "utf8"),
      "keep me\n",
    );
  });
});

test("detached reports are sibling writes and never mutate the target", async (t) => {
  const { outputPath, parent, artifacts } = await publishInitial(
    t,
    "detached-report",
  );
  const preparedOutput = await validateOutputTarget({
    outputPath,
    replace: true,
  });
  const report = buildErrorReport({ code: "OUTPUT_EXISTS", violations: [] });

  assert.equal(
    await writeDetachedFailureReport(preparedOutput, report),
    true,
  );
  assert.deepEqual(
    new Uint8Array(
      await readFile(join(parent, "presentation.error-report.json")),
    ),
    report,
  );
  await assertPublishedArtifactSet(outputPath, artifacts);
  assert.equal(
    (await readdir(outputPath)).includes("presentation.error-report.json"),
    false,
  );
});
