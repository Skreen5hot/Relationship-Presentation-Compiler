import {
  lstat,
  mkdtemp,
  open,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  stat,
  unlink,
} from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { tryLock, unlock } from "fs-native-extensions";

import { parseJsonBytes } from "../core/json-scan.js";

export const ARTIFACT_FILENAMES = Object.freeze([
  ".relationship-presentation-poc-owned",
  "poc.context.jsonld",
  "01-request.jsonld",
  "02-resolution.jsonld",
  "03-contract-validation.jsonld",
  "04-content-manifest.jsonld",
  "05-narrative.jsonld",
  "06-presentation.jsonld",
  "07-html-projection.jsonld",
  "08-core-manifest.json",
  "09-distribution-manifest.json",
  "presentation.html",
  "demo.html",
  "validation-report.json",
]);

export const JOURNAL_STEPS = Object.freeze([
  "journal-written",
  "target-backed-up",
  "target-published",
  "backup-removed",
  "journal-removed",
]);

const JOURNAL_SEQUENCE = Object.freeze([
  "rename-target-to-backup",
  "rename-staging-to-target",
  "remove-backup",
  "remove-journal",
]);
const JOURNAL_VERSION = "replace-journal-v1.0";
const OWNED_OUTPUT_VERSION = "owned-output-v1.0";
const OWNER = "relationship-presentation-poc";
const DISTRIBUTION_MANIFEST_VERSION = "distribution-manifest-v1.0";
const PREPARED_OUTPUT = Symbol("prepared-output");
const repositoryRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../..",
);

export class PublicationError extends Error {
  constructor(code, preparedOutput) {
    super(code);
    this.name = "PublicationError";
    this.code = code;
    if (preparedOutput !== undefined) {
      this.preparedOutput = preparedOutput;
    }
  }
}

function publicationError(code, preparedOutput) {
  return new PublicationError(code, preparedOutput);
}

function pathKey(path) {
  return process.platform === "win32" ? path.toLowerCase() : path;
}

function samePath(left, right) {
  return pathKey(left) === pathKey(right);
}

function sameIdentity(left, right) {
  return left.dev === right.dev && left.ino === right.ino;
}

async function lstatIfPresent(path) {
  try {
    return await lstat(path);
  } catch (error) {
    if (error?.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

async function directoryContainsPath(directoryPath, targetPath) {
  const directoryIdentity = await stat(directoryPath);
  const targetMetadata = await lstatIfPresent(targetPath);
  let cursor = targetMetadata === null ? dirname(targetPath) : targetPath;

  while (true) {
    const cursorIdentity = await stat(cursor);
    if (sameIdentity(directoryIdentity, cursorIdentity)) {
      return true;
    }
    const parent = dirname(cursor);
    if (samePath(parent, cursor)) {
      return false;
    }
    cursor = parent;
  }
}

function assertPreparedOutput(preparedOutput) {
  if (preparedOutput?.[PREPARED_OUTPUT] !== true) {
    throw new TypeError("A validated output descriptor is required");
  }
}

function createPreparedOutput(parentPath, outputName) {
  const outputPath = join(parentPath, outputName);
  return Object.freeze({
    [PREPARED_OUTPUT]: true,
    backupPath: join(parentPath, `${outputName}.replace-backup`),
    errorReportPath: join(parentPath, `${outputName}.error-report.json`),
    journalPath: join(parentPath, `${outputName}.replace-journal.json`),
    journalTemporaryPath: join(
      parentPath,
      `${outputName}.replace-journal.json.tmp`,
    ),
    lockPath: join(parentPath, `${outputName}.lock`),
    outputName,
    outputParent: parentPath,
    outputPath,
    stagingPrefix: join(parentPath, `${outputName}.staging-`),
  });
}

async function inspectOutputNode(preparedOutput) {
  const metadata = await lstatIfPresent(preparedOutput.outputPath);
  if (metadata === null) {
    return null;
  }
  if (metadata.isSymbolicLink() || !metadata.isDirectory()) {
    throw publicationError("UNSAFE_OUTPUT_PATH", preparedOutput);
  }
  return metadata;
}

export async function validateOutputTarget({
  defaultOutput = false,
  inputPaths = [],
  outputPath,
  packageRoot = repositoryRoot,
  replace = false,
}) {
  if (typeof outputPath !== "string" || outputPath.length === 0) {
    throw publicationError("UNSAFE_OUTPUT_PATH");
  }

  let outputParent;
  let packageBoundary;
  try {
    const absoluteOutput = resolve(outputPath);
    const unresolvedParent = dirname(absoluteOutput);
    outputParent = await realpath(unresolvedParent);
    packageBoundary = await realpath(packageRoot);
    const parentMetadata = await stat(outputParent);
    if (!parentMetadata.isDirectory()) {
      throw publicationError("UNSAFE_OUTPUT_PATH");
    }
  } catch (error) {
    if (error instanceof PublicationError) {
      throw error;
    }
    throw publicationError("UNSAFE_OUTPUT_PATH");
  }

  const outputName = basename(resolve(outputPath));
  if (outputName.length === 0 || outputName === "." || outputName === "..") {
    throw publicationError("UNSAFE_OUTPUT_PATH");
  }
  const preparedOutput = createPreparedOutput(outputParent, outputName);

  const existingTarget = await lstatIfPresent(preparedOutput.outputPath);
  if (existingTarget?.isSymbolicLink()) {
    throw publicationError("UNSAFE_OUTPUT_PATH", preparedOutput);
  }
  const defaultDistribution = join(packageBoundary, "dist");
  if (
    (await directoryContainsPath(packageBoundary, preparedOutput.outputPath)) &&
    !(defaultOutput && samePath(preparedOutput.outputPath, defaultDistribution))
  ) {
    throw publicationError("INPUT_OUTPUT_OVERLAP");
  }

  for (const inputPath of inputPaths) {
    let inputRealPath;
    try {
      inputRealPath = await realpath(inputPath);
    } catch {
      throw publicationError("INPUT_OUTPUT_OVERLAP");
    }
    if (
      samePath(preparedOutput.outputPath, inputRealPath) ||
      (await directoryContainsPath(
        dirname(inputRealPath),
        preparedOutput.outputPath,
      ))
    ) {
      throw publicationError("INPUT_OUTPUT_OVERLAP");
    }
  }

  if (existingTarget !== null && !existingTarget.isDirectory()) {
    throw publicationError("UNSAFE_OUTPUT_PATH", preparedOutput);
  }
  if (existingTarget !== null && !replace) {
    throw publicationError("OUTPUT_EXISTS", preparedOutput);
  }
  return preparedOutput;
}

function snapshotArtifacts(artifacts) {
  if (
    artifacts === null ||
    typeof artifacts !== "object" ||
    Array.isArray(artifacts)
  ) {
    throw new TypeError("The artifact set must be a plain byte map");
  }
  const prototype = Object.getPrototypeOf(artifacts);
  const keys = Reflect.ownKeys(artifacts);
  if (
    (prototype !== Object.prototype && prototype !== null) ||
    keys.length !== ARTIFACT_FILENAMES.length ||
    keys.some(
      (key) =>
        typeof key !== "string" || !ARTIFACT_FILENAMES.includes(key),
    )
  ) {
    throw new TypeError("The artifact set must contain exactly fourteen files");
  }

  const snapshots = new Map();
  for (const filename of ARTIFACT_FILENAMES) {
    const descriptor = Object.getOwnPropertyDescriptor(artifacts, filename);
    if (
      descriptor === undefined ||
      !("value" in descriptor) ||
      Object.prototype.toString.call(descriptor.value) !==
        "[object Uint8Array]"
    ) {
      throw new TypeError(`Artifact ${filename} must be a Uint8Array`);
    }
    snapshots.set(
      filename,
      Uint8Array.prototype.slice.call(descriptor.value),
    );
  }
  return snapshots;
}

async function syncDirectory(path) {
  let handle;
  try {
    handle = await open(path, "r");
    await handle.sync();
  } catch (error) {
    if (
      !["EACCES", "EBADF", "EINVAL", "EISDIR", "ENOTSUP", "EPERM"].includes(
        error?.code,
      )
    ) {
      throw error;
    }
  } finally {
    await handle?.close();
  }
}

async function writeNewFileSynced(path, bytes) {
  const handle = await open(path, "wx", 0o600);
  try {
    await handle.writeFile(bytes);
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function writeStagingDirectory(preparedOutput, artifacts) {
  const stagingPath = await mkdtemp(preparedOutput.stagingPrefix);
  try {
    for (const [filename, bytes] of artifacts) {
      await writeNewFileSynced(join(stagingPath, filename), bytes);
    }
    await syncDirectory(stagingPath);
    await syncDirectory(preparedOutput.outputParent);
    return stagingPath;
  } catch (error) {
    await rm(stagingPath, { force: true, recursive: true });
    throw error;
  }
}

function isPlainJsonObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

async function readJsonFile(path) {
  const bytes = new Uint8Array(await readFile(path));
  return parseJsonBytes(bytes).value;
}

async function isOwnedDirectory(directoryPath) {
  try {
    const metadata = await lstat(directoryPath);
    if (metadata.isSymbolicLink() || !metadata.isDirectory()) {
      return false;
    }
    const entries = await readdir(directoryPath, { withFileTypes: true });
    if (
      entries.length !== ARTIFACT_FILENAMES.length ||
      entries.some(
        (entry) =>
          !entry.isFile() || !ARTIFACT_FILENAMES.includes(entry.name),
      )
    ) {
      return false;
    }

    const sentinel = await readJsonFile(
      join(directoryPath, ".relationship-presentation-poc-owned"),
    );
    if (
      !isPlainJsonObject(sentinel) ||
      sentinel.sentinelVersion !== OWNED_OUTPUT_VERSION ||
      sentinel.owner !== OWNER
    ) {
      return false;
    }

    const manifest = await readJsonFile(
      join(directoryPath, "09-distribution-manifest.json"),
    );
    return (
      isPlainJsonObject(manifest) &&
      manifest.manifestVersion === DISTRIBUTION_MANIFEST_VERSION
    );
  } catch {
    return false;
  }
}

async function requireOwnedDirectory(directoryPath, code) {
  if (!(await isOwnedDirectory(directoryPath))) {
    throw publicationError(code);
  }
}

function journalBytes(preparedOutput, stagingPath) {
  const journal = {
    journalVersion: JOURNAL_VERSION,
    target: preparedOutput.outputName,
    staging: basename(stagingPath),
    backup: basename(preparedOutput.backupPath),
    sequence: JOURNAL_SEQUENCE,
  };
  return new TextEncoder().encode(`${JSON.stringify(journal, null, 2)}\n`);
}

function hasExactJournalShape(journal, preparedOutput) {
  if (!isPlainJsonObject(journal)) {
    return false;
  }
  const keys = Object.keys(journal);
  const expectedKeys = [
    "journalVersion",
    "target",
    "staging",
    "backup",
    "sequence",
  ];
  const stagingPrefix = `${preparedOutput.outputName}.staging-`;
  return (
    keys.length === expectedKeys.length &&
    expectedKeys.every((key) => keys.includes(key)) &&
    journal.journalVersion === JOURNAL_VERSION &&
    journal.target === preparedOutput.outputName &&
    journal.backup === basename(preparedOutput.backupPath) &&
    typeof journal.staging === "string" &&
    journal.staging.startsWith(stagingPrefix) &&
    basename(journal.staging) === journal.staging &&
    Array.isArray(journal.sequence) &&
    journal.sequence.length === JOURNAL_SEQUENCE.length &&
    JOURNAL_SEQUENCE.every((step, index) => journal.sequence[index] === step)
  );
}

async function writeJournal(preparedOutput, stagingPath) {
  if (
    (await lstatIfPresent(preparedOutput.journalPath)) !== null ||
    (await lstatIfPresent(preparedOutput.journalTemporaryPath)) !== null
  ) {
    throw publicationError("OUTPUT_RECOVERY_REQUIRED", preparedOutput);
  }
  try {
    await writeNewFileSynced(
      preparedOutput.journalTemporaryPath,
      journalBytes(preparedOutput, stagingPath),
    );
    await rename(
      preparedOutput.journalTemporaryPath,
      preparedOutput.journalPath,
    );
    await syncDirectory(preparedOutput.outputParent);
  } catch (error) {
    try {
      await unlink(preparedOutput.journalTemporaryPath);
    } catch (cleanupError) {
      if (cleanupError?.code !== "ENOENT") {
        throw cleanupError;
      }
    }
    throw error;
  }
}

async function removeOwnedDirectory(directoryPath, preparedOutput) {
  if (!samePath(dirname(directoryPath), preparedOutput.outputParent)) {
    throw publicationError("OUTPUT_RECOVERY_REQUIRED", preparedOutput);
  }
  await requireOwnedDirectory(directoryPath, "OUTPUT_RECOVERY_REQUIRED");
  await rm(directoryPath, { recursive: true });
  await syncDirectory(preparedOutput.outputParent);
}

async function finishRecovery(preparedOutput) {
  const journalMetadata = await lstatIfPresent(preparedOutput.journalPath);
  const backupMetadata = await lstatIfPresent(preparedOutput.backupPath);
  const temporaryMetadata = await lstatIfPresent(
    preparedOutput.journalTemporaryPath,
  );

  if (journalMetadata === null) {
    if (backupMetadata !== null || temporaryMetadata !== null) {
      throw publicationError("OUTPUT_RECOVERY_REQUIRED", preparedOutput);
    }
    return false;
  }
  if (
    journalMetadata.isSymbolicLink() ||
    !journalMetadata.isFile() ||
    temporaryMetadata !== null
  ) {
    throw publicationError("OUTPUT_RECOVERY_REQUIRED", preparedOutput);
  }

  let journal;
  try {
    journal = await readJsonFile(preparedOutput.journalPath);
  } catch {
    throw publicationError("OUTPUT_RECOVERY_REQUIRED", preparedOutput);
  }
  if (!hasExactJournalShape(journal, preparedOutput)) {
    throw publicationError("OUTPUT_RECOVERY_REQUIRED", preparedOutput);
  }

  const stagingPath = join(preparedOutput.outputParent, journal.staging);
  const targetMetadata = await lstatIfPresent(preparedOutput.outputPath);
  const stagingMetadata = await lstatIfPresent(stagingPath);
  const currentBackupMetadata = await lstatIfPresent(preparedOutput.backupPath);
  for (const metadata of [
    targetMetadata,
    stagingMetadata,
    currentBackupMetadata,
  ]) {
    if (
      metadata !== null &&
      (metadata.isSymbolicLink() || !metadata.isDirectory())
    ) {
      throw publicationError("OUTPUT_RECOVERY_REQUIRED", preparedOutput);
    }
  }

  const topology = [
    targetMetadata !== null,
    stagingMetadata !== null,
    currentBackupMetadata !== null,
  ]
    .map((value) => (value ? "1" : "0"))
    .join("");

  if (topology === "110") {
    await requireOwnedDirectory(
      preparedOutput.outputPath,
      "OUTPUT_RECOVERY_REQUIRED",
    );
    await requireOwnedDirectory(stagingPath, "OUTPUT_RECOVERY_REQUIRED");
    await rename(preparedOutput.outputPath, preparedOutput.backupPath);
    await syncDirectory(preparedOutput.outputParent);
    await rename(stagingPath, preparedOutput.outputPath);
    await syncDirectory(preparedOutput.outputParent);
    await removeOwnedDirectory(preparedOutput.backupPath, preparedOutput);
  } else if (topology === "011") {
    await requireOwnedDirectory(stagingPath, "OUTPUT_RECOVERY_REQUIRED");
    await requireOwnedDirectory(
      preparedOutput.backupPath,
      "OUTPUT_RECOVERY_REQUIRED",
    );
    await rename(stagingPath, preparedOutput.outputPath);
    await syncDirectory(preparedOutput.outputParent);
    await removeOwnedDirectory(preparedOutput.backupPath, preparedOutput);
  } else if (topology === "101") {
    await requireOwnedDirectory(
      preparedOutput.outputPath,
      "OUTPUT_RECOVERY_REQUIRED",
    );
    await removeOwnedDirectory(preparedOutput.backupPath, preparedOutput);
  } else if (topology === "100") {
    await requireOwnedDirectory(
      preparedOutput.outputPath,
      "OUTPUT_RECOVERY_REQUIRED",
    );
  } else if (topology === "001") {
    await requireOwnedDirectory(
      preparedOutput.backupPath,
      "OUTPUT_RECOVERY_REQUIRED",
    );
    await rename(preparedOutput.backupPath, preparedOutput.outputPath);
    await syncDirectory(preparedOutput.outputParent);
  } else {
    throw publicationError("OUTPUT_RECOVERY_REQUIRED", preparedOutput);
  }

  await unlink(preparedOutput.journalPath);
  await syncDirectory(preparedOutput.outputParent);
  return true;
}

export async function acquirePublicationLock(preparedOutput) {
  assertPreparedOutput(preparedOutput);
  const handle = await open(preparedOutput.lockPath, "a+");
  let held = false;
  try {
    held = tryLock(handle.fd);
    if (!held) {
      throw publicationError("OUTPUT_LOCKED", preparedOutput);
    }
  } catch (error) {
    await handle.close();
    throw error;
  }

  let released = false;
  return async function releasePublicationLock() {
    if (released) {
      return;
    }
    released = true;
    try {
      if (held) {
        unlock(handle.fd);
      }
    } finally {
      await handle.close();
    }
  };
}

async function callJournalHook(hook, step) {
  if (hook !== undefined) {
    await hook(step);
  }
}

export async function publishArtifactSet({
  artifacts,
  onJournalStep,
  preparedOutput,
  replace = false,
}) {
  assertPreparedOutput(preparedOutput);
  const artifactSnapshots = snapshotArtifacts(artifacts);
  const releaseLock = await acquirePublicationLock(preparedOutput);
  let journalActive = false;
  let stagingPath;

  try {
    await inspectOutputNode(preparedOutput);
    const recovered = await finishRecovery(preparedOutput);

    let targetMetadata = await inspectOutputNode(preparedOutput);
    if (targetMetadata !== null && !replace) {
      throw publicationError("OUTPUT_EXISTS", preparedOutput);
    }
    if (targetMetadata !== null) {
      await requireOwnedDirectory(
        preparedOutput.outputPath,
        "OUTPUT_NOT_OWNED",
      );
    }

    stagingPath = await writeStagingDirectory(
      preparedOutput,
      artifactSnapshots,
    );
    await requireOwnedDirectory(stagingPath, "OUTPUT_NOT_OWNED");

    targetMetadata = await inspectOutputNode(preparedOutput);
    if (targetMetadata === null) {
      await rename(stagingPath, preparedOutput.outputPath);
      stagingPath = undefined;
      await syncDirectory(preparedOutput.outputParent);
      return Object.freeze({ recovered, replaced: false });
    }
    if (!replace) {
      throw publicationError("OUTPUT_EXISTS", preparedOutput);
    }
    await requireOwnedDirectory(
      preparedOutput.outputPath,
      "OUTPUT_NOT_OWNED",
    );
    if ((await lstatIfPresent(preparedOutput.backupPath)) !== null) {
      throw publicationError("OUTPUT_RECOVERY_REQUIRED", preparedOutput);
    }

    await writeJournal(preparedOutput, stagingPath);
    journalActive = true;
    await callJournalHook(onJournalStep, "journal-written");

    await rename(preparedOutput.outputPath, preparedOutput.backupPath);
    await syncDirectory(preparedOutput.outputParent);
    await callJournalHook(onJournalStep, "target-backed-up");

    await rename(stagingPath, preparedOutput.outputPath);
    stagingPath = undefined;
    await syncDirectory(preparedOutput.outputParent);
    await callJournalHook(onJournalStep, "target-published");

    await removeOwnedDirectory(preparedOutput.backupPath, preparedOutput);
    await callJournalHook(onJournalStep, "backup-removed");

    await unlink(preparedOutput.journalPath);
    journalActive = false;
    await syncDirectory(preparedOutput.outputParent);
    await callJournalHook(onJournalStep, "journal-removed");
    return Object.freeze({ recovered, replaced: true });
  } finally {
    if (stagingPath !== undefined && !journalActive) {
      try {
        await requireOwnedDirectory(stagingPath, "OUTPUT_RECOVERY_REQUIRED");
        await rm(stagingPath, { recursive: true });
        await syncDirectory(preparedOutput.outputParent);
      } catch {
        // The governing publication error must not be replaced by cleanup.
      }
    }
    await releaseLock();
  }
}

export async function writeDetachedFailureReport(
  preparedOutput,
  errorReportBytes,
) {
  assertPreparedOutput(preparedOutput);
  if (
    Object.prototype.toString.call(errorReportBytes) !== "[object Uint8Array]"
  ) {
    throw new TypeError("Error-report bytes must be a Uint8Array");
  }
  const snapshot = Uint8Array.prototype.slice.call(errorReportBytes);

  try {
    const existing = await lstatIfPresent(preparedOutput.errorReportPath);
    if (
      existing !== null &&
      (existing.isSymbolicLink() || !existing.isFile())
    ) {
      return false;
    }
    const handle = await open(
      preparedOutput.errorReportPath,
      existing === null ? "wx" : "w",
      0o600,
    );
    try {
      await handle.writeFile(snapshot);
      await handle.sync();
    } finally {
      await handle.close();
    }
    await syncDirectory(preparedOutput.outputParent);
    return true;
  } catch {
    return false;
  }
}
