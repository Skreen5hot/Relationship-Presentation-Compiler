import { lstat, open, realpath, stat } from "node:fs/promises";
import { parse, resolve, sep } from "node:path";

const VALIDATED_INPUT = Symbol("validated-input");

export class InputAcquisitionError extends Error {
  constructor(code) {
    super(code);
    this.name = "InputAcquisitionError";
    this.code = code;
  }
}

function fail(code) {
  throw new InputAcquisitionError(code);
}

function pathKey(path) {
  return process.platform === "win32" ? path.toLowerCase() : path;
}

function isInsidePath(candidate, boundary) {
  const candidateKey = pathKey(candidate);
  const boundaryKey = pathKey(boundary);
  return (
    candidateKey === boundaryKey ||
    candidateKey.startsWith(`${boundaryKey}${sep}`)
  );
}

async function containsSymlink(path) {
  const absolute = resolve(path);
  const parsed = parse(absolute);
  let cursor = parsed.root;
  for (const part of absolute.slice(parsed.root.length).split(sep).filter(Boolean)) {
    cursor = resolve(cursor, part);
    const metadata = await lstat(cursor);
    if (metadata.isSymbolicLink()) {
      return true;
    }
  }
  return false;
}

function identity(metadata) {
  return Object.freeze({
    ctimeNs: metadata.ctimeNs,
    dev: metadata.dev,
    ino: metadata.ino,
    mtimeNs: metadata.mtimeNs,
    size: metadata.size,
  });
}

function sameIdentity(left, right) {
  return (
    left.dev === right.dev &&
    left.ino === right.ino &&
    left.size === right.size &&
    left.mtimeNs === right.mtimeNs &&
    left.ctimeNs === right.ctimeNs
  );
}

export async function validateInputFile({
  fixed = false,
  packageRoot,
  path,
}) {
  if (typeof path !== "string" || path.length === 0) {
    fail("UNSAFE_INPUT_PATH");
  }
  try {
    const absolutePath = resolve(path);
    const packageBoundary = await realpath(packageRoot);
    const hasSymlink = await containsSymlink(absolutePath);
    const realPath = await realpath(absolutePath);
    const metadata = await stat(realPath, { bigint: true });
    if (
      !metadata.isFile() ||
      (fixed && hasSymlink) ||
      (fixed && !isInsidePath(realPath, packageBoundary)) ||
      (!fixed && hasSymlink && !isInsidePath(realPath, packageBoundary))
    ) {
      fail("UNSAFE_INPUT_PATH");
    }
    return Object.freeze({
      [VALIDATED_INPUT]: true,
      absolutePath,
      fixed,
      identity: identity(metadata),
      realPath,
    });
  } catch (error) {
    if (error instanceof InputAcquisitionError) {
      throw error;
    }
    fail("UNSAFE_INPUT_PATH");
  }
}

function assertValidated(descriptor) {
  if (descriptor?.[VALIDATED_INPUT] !== true) {
    throw new TypeError("A validated input descriptor is required");
  }
}

export async function loadValidatedInput(descriptor, { onOpened } = {}) {
  assertValidated(descriptor);
  let handle;
  try {
    const currentRealPath = await realpath(descriptor.absolutePath);
    const currentPathMetadata = await stat(currentRealPath, { bigint: true });
    if (
      pathKey(currentRealPath) !== pathKey(descriptor.realPath) ||
      !sameIdentity(descriptor.identity, identity(currentPathMetadata))
    ) {
      fail("INPUT_CHANGED_DURING_LOAD");
    }

    handle = await open(descriptor.realPath, "r");
    const before = identity(await handle.stat({ bigint: true }));
    if (!sameIdentity(descriptor.identity, before)) {
      fail("INPUT_CHANGED_DURING_LOAD");
    }
    if (onOpened !== undefined) {
      await onOpened(descriptor);
    }
    const bytes = new Uint8Array(await handle.readFile());
    const after = identity(await handle.stat({ bigint: true }));
    const finalRealPath = await realpath(descriptor.absolutePath);
    const finalPathMetadata = identity(
      await stat(finalRealPath, { bigint: true }),
    );
    if (
      !sameIdentity(before, after) ||
      pathKey(finalRealPath) !== pathKey(descriptor.realPath) ||
      !sameIdentity(after, finalPathMetadata)
    ) {
      fail("INPUT_CHANGED_DURING_LOAD");
    }
    return bytes;
  } catch (error) {
    if (error instanceof InputAcquisitionError) {
      throw error;
    }
    fail("INPUT_CHANGED_DURING_LOAD");
  } finally {
    await handle?.close();
  }
}

const ARTIFACT_ROLE_TO_INPUT = Object.freeze({
  context: "context",
  contract: "contract",
  "supported-profile": "canonicalProfile",
  "carrier-style": "carrierStyle",
  "carrier-navigation": "carrierNavigation",
});

export async function validateCompilationInputs({
  artifactLock,
  fixedEvidencePaths = [],
  packageRoot,
  profilePath,
  requestPath,
  sourcePath,
  userInputsFixed = false,
}) {
  const descriptors = {};
  for (const [index, path] of fixedEvidencePaths.entries()) {
    descriptors[`evidence-${index}`] = await validateInputFile({
      fixed: true,
      packageRoot,
      path,
    });
  }
  for (const artifact of artifactLock.artifacts) {
    descriptors[ARTIFACT_ROLE_TO_INPUT[artifact.role]] = await validateInputFile({
      fixed: true,
      packageRoot,
      path: resolve(packageRoot, artifact.path),
    });
  }
  descriptors.userProfile = await validateInputFile({
    fixed: userInputsFixed,
    packageRoot,
    path: profilePath,
  });
  descriptors.source = await validateInputFile({
    fixed: userInputsFixed,
    packageRoot,
    path: sourcePath,
  });
  descriptors.request = await validateInputFile({
    fixed: userInputsFixed,
    packageRoot,
    path: requestPath,
  });
  return Object.freeze(descriptors);
}

export async function assembleCoreRequest(descriptors, loadOptions) {
  const inputs = {};
  for (const role of [
    "context",
    "contract",
    "canonicalProfile",
    "userProfile",
    "source",
    "request",
    "carrierStyle",
    "carrierNavigation",
  ]) {
    inputs[role] = await loadValidatedInput(descriptors[role], loadOptions);
  }
  return { inputs };
}
