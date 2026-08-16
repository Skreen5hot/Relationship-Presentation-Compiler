import { createHash } from "node:crypto";
import { readFile as readFileNative } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { parseJsonBytes } from "../core/json-scan.js";

const COMPILER_NAME = "relationship-presentation-poc";
const COMPILER_VERSION = "1.0.0";
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const INTEGRITY_PATTERN = /^sha512-[A-Za-z0-9+/]+={0,2}$/;

export class HostLockError extends Error {
  constructor(code) {
    super(code);
    this.name = "HostLockError";
    this.code = code;
  }
}

function fail(code) {
  throw new HostLockError(code);
}

function hashBytes(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function exactKeys(value, keys) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value).length === keys.length &&
    keys.every((key) => Object.prototype.hasOwnProperty.call(value, key))
  );
}

function parseLockedJson(bytes, code) {
  try {
    return parseJsonBytes(bytes).value;
  } catch {
    fail(code);
  }
}

async function readBytes(readFile, path, code) {
  try {
    return new Uint8Array(await readFile(path));
  } catch {
    fail(code);
  }
}

function safeLockedPath(packageRoot, relativePath, code) {
  if (
    typeof relativePath !== "string" ||
    relativePath.length === 0 ||
    relativePath.includes("\\") ||
    relativePath.split("/").some((part) => part === "" || part === "..")
  ) {
    fail(code);
  }
  const path = resolve(packageRoot, relativePath);
  const rootPrefix = `${resolve(packageRoot)}${process.platform === "win32" ? "\\" : "/"}`;
  const candidate = process.platform === "win32" ? path.toLowerCase() : path;
  const prefix = process.platform === "win32" ? rootPrefix.toLowerCase() : rootPrefix;
  if (!candidate.startsWith(prefix)) {
    fail(code);
  }
  return path;
}

function validateRuntimeShape(lock) {
  if (
    !exactKeys(lock, [
      "lockVersion",
      "node",
      "packageManager",
      "jsonLdProcessor",
      "domTestImplementation",
      "filesystemLock",
      "compiler",
      "packageLockSha256",
      "artifactLockSha256",
      "ontologyLockSha256",
      "sbom",
    ]) ||
    lock.lockVersion !== "runtime-lock-v1.0" ||
    !exactKeys(lock.node, [
      "version",
      "releaseLine",
      "releaseStatusAtSpecification",
    ]) ||
    !exactKeys(lock.packageManager, ["name", "version"]) ||
    !exactKeys(lock.compiler, ["name", "version", "sourceCommit"]) ||
    !/^[0-9a-f]{40}$/.test(lock.compiler.sourceCommit) ||
    !SHA256_PATTERN.test(lock.packageLockSha256) ||
    !SHA256_PATTERN.test(lock.artifactLockSha256) ||
    !SHA256_PATTERN.test(lock.ontologyLockSha256) ||
    !exactKeys(lock.sbom, [
      "path",
      "format",
      "specVersion",
      "mediaType",
      "sha256",
    ]) ||
    lock.sbom.path !== "sbom.json" ||
    lock.node.version !== "24.19.0" ||
    lock.node.releaseLine !== "24.x" ||
    lock.node.releaseStatusAtSpecification !== "Active LTS" ||
    lock.packageManager.name !== "npm" ||
    lock.packageManager.version !== "11.17.0" ||
    lock.compiler.name !== COMPILER_NAME ||
    lock.compiler.version !== COMPILER_VERSION ||
    lock.sbom.format !== "CycloneDX JSON" ||
    lock.sbom.specVersion !== "1.7" ||
    lock.sbom.mediaType !==
      "application/vnd.cyclonedx+json; version=1.7" ||
    !SHA256_PATTERN.test(lock.sbom.sha256)
  ) {
    fail("RUNTIME_LOCK_MISMATCH");
  }
  for (const member of [
    lock.jsonLdProcessor,
    lock.domTestImplementation,
    lock.filesystemLock,
  ]) {
    if (
      !exactKeys(member, ["package", "version", "integrity"]) ||
      typeof member.package !== "string" ||
      typeof member.version !== "string" ||
      !INTEGRITY_PATTERN.test(member.integrity)
    ) {
      fail("RUNTIME_LOCK_MISMATCH");
    }
  }
  if (
    lock.jsonLdProcessor.package !== "jsonld" ||
    lock.domTestImplementation.package !== "jsdom" ||
    lock.filesystemLock.package !== "fs-native-extensions"
  ) {
    fail("RUNTIME_LOCK_MISMATCH");
  }
}

async function defaultRuntimeFacts() {
  const executableDirectory = dirname(process.execPath);
  const npmManifestPath =
    process.platform === "win32"
      ? resolve(executableDirectory, "node_modules", "npm", "package.json")
      : resolve(
          executableDirectory,
          "..",
          "lib",
          "node_modules",
          "npm",
          "package.json",
        );
  const npmManifest = parseLockedJson(
    new Uint8Array(await readFileNative(npmManifestPath)),
    "RUNTIME_LOCK_MISMATCH",
  );
  return {
    compilerName: COMPILER_NAME,
    compilerVersion: COMPILER_VERSION,
    nodeVersion: process.versions.node,
    npmVersion: npmManifest.version,
  };
}

function verifyNamedPackageLock(lockMember, packageLock) {
  const packageEntry = packageLock.packages?.[`node_modules/${lockMember.package}`];
  if (
    packageEntry?.version !== lockMember.version ||
    packageEntry?.integrity !== lockMember.integrity
  ) {
    fail("PACKAGE_LOCK_MISMATCH");
  }
}

async function verifyInstalledGraph(packageRoot, packageLock, readFile) {
  if (
    packageLock?.lockfileVersion !== 3 ||
    packageLock?.packages === null ||
    typeof packageLock?.packages !== "object" ||
    Array.isArray(packageLock.packages)
  ) {
    fail("PACKAGE_LOCK_MISMATCH");
  }

  for (const [location, entry] of Object.entries(packageLock.packages)) {
    if (location === "" || entry.link === true) {
      continue;
    }
    if (
      typeof entry.version !== "string" ||
      (entry.resolved?.startsWith("https://registry.npmjs.org/") &&
        !INTEGRITY_PATTERN.test(entry.integrity))
    ) {
      fail("PACKAGE_LOCK_MISMATCH");
    }

    let installedBytes;
    try {
      installedBytes = new Uint8Array(
        await readFile(safeLockedPath(packageRoot, `${location}/package.json`, "PACKAGE_LOCK_MISMATCH")),
      );
    } catch {
      if (entry.optional === true) {
        continue;
      }
      fail("PACKAGE_LOCK_MISMATCH");
    }
    const installed = parseLockedJson(installedBytes, "PACKAGE_LOCK_MISMATCH");
    if (installed.version !== entry.version) {
      fail("PACKAGE_LOCK_MISMATCH");
    }
  }
}

function validateArtifactLock(lock) {
  const expected = [
    ["context", "contexts/poc.context.jsonld"],
    ["contract", "contract/person-association-contract.jsonld"],
    ["supported-profile", "profiles/two-slide-explainer.jsonld"],
    ["carrier-style", "carrier/presentation.css"],
    ["carrier-navigation", "carrier/navigation.js"],
  ];
  if (
    !exactKeys(lock, ["lockVersion", "artifacts"]) ||
    lock.lockVersion !== "artifact-lock-v1.0" ||
    !Array.isArray(lock.artifacts) ||
    lock.artifacts.length !== expected.length ||
    !lock.artifacts.every(
      (artifact, index) =>
        exactKeys(artifact, ["role", "path", "sha256"]) &&
        artifact.role === expected[index][0] &&
        artifact.path === expected[index][1] &&
        SHA256_PATTERN.test(artifact.sha256),
    )
  ) {
    fail("ARTIFACT_LOCK_MISMATCH");
  }
}

function validateOntologyLock(lock) {
  const expected = [
    ["bfo", "vendor/ontology/bfo-core.ttl"],
    ["cco-agent", "vendor/ontology/AgentOntology.ttl"],
    [
      "cco-information-entity",
      "vendor/ontology/InformationEntityOntology.ttl",
    ],
  ];
  const requiredKeys = [
    "role",
    "ontologyIri",
    "versionIri",
    "sourceReleaseOrTag",
    "sourceCommit",
    "localFilename",
    "sha256",
    "license",
  ];
  if (
    !exactKeys(lock, ["lockVersion", "ontologies"]) ||
    lock.lockVersion !== "ontology-lock-v1.0" ||
    !Array.isArray(lock.ontologies) ||
    lock.ontologies.length !== expected.length ||
    !lock.ontologies.every((ontology, index) => {
      const keys =
        ontology?.note === undefined
          ? requiredKeys
          : [...requiredKeys, "note"];
      return (
        exactKeys(ontology, keys) &&
        ontology.role === expected[index][0] &&
        ontology.localFilename === expected[index][1] &&
        typeof ontology.ontologyIri === "string" &&
        typeof ontology.versionIri === "string" &&
        typeof ontology.sourceReleaseOrTag === "string" &&
        /^[0-9a-f]{40}$/.test(ontology.sourceCommit) &&
        SHA256_PATTERN.test(ontology.sha256) &&
        typeof ontology.license === "string" &&
        (ontology.note === undefined || typeof ontology.note === "string")
      );
    })
  ) {
    fail("ONTOLOGY_LOCK_MISMATCH");
  }
}

function validateSbom(sbom, packageLock) {
  if (
    sbom?.bomFormat !== "CycloneDX" ||
    sbom?.specVersion !== "1.7" ||
    sbom.serialNumber !== undefined ||
    sbom.metadata?.timestamp !== undefined ||
    !Array.isArray(sbom.components) ||
    !Array.isArray(sbom.dependencies) ||
    sbom.metadata?.component?.name !== COMPILER_NAME ||
    sbom.metadata?.component?.version !== COMPILER_VERSION ||
    sbom.components.length === 0 ||
    sbom.dependencies.length !== Object.keys(packageLock.packages).length
  ) {
    fail("SBOM_MISMATCH");
  }
}

export async function verifyNodeHostLocks({
  packageRoot,
  readFile = readFileNative,
  runtimeFacts,
  verifyGraph = true,
} = {}) {
  const root = resolve(packageRoot ?? ".");
  const fixedEvidencePaths = [];

  const runtimePath = resolve(root, "runtime.lock.json");
  fixedEvidencePaths.push(runtimePath);
  const runtimeBytes = await readBytes(
    readFile,
    runtimePath,
    "RUNTIME_LOCK_MISMATCH",
  );
  const runtimeLock = parseLockedJson(runtimeBytes, "RUNTIME_LOCK_MISMATCH");
  validateRuntimeShape(runtimeLock);
  const facts = runtimeFacts ?? (await defaultRuntimeFacts());
  if (
    runtimeLock.node.version !== facts.nodeVersion ||
    runtimeLock.packageManager.name !== "npm" ||
    runtimeLock.packageManager.version !== facts.npmVersion ||
    runtimeLock.compiler.name !== facts.compilerName ||
    runtimeLock.compiler.version !== facts.compilerVersion
  ) {
    fail("RUNTIME_LOCK_MISMATCH");
  }

  const packageLockPath = resolve(root, "package-lock.json");
  fixedEvidencePaths.push(packageLockPath);
  const packageLockBytes = await readBytes(
    readFile,
    packageLockPath,
    "PACKAGE_LOCK_MISMATCH",
  );
  if (hashBytes(packageLockBytes) !== runtimeLock.packageLockSha256) {
    fail("PACKAGE_LOCK_MISMATCH");
  }
  const packageLock = parseLockedJson(packageLockBytes, "PACKAGE_LOCK_MISMATCH");
  verifyNamedPackageLock(runtimeLock.jsonLdProcessor, packageLock);
  verifyNamedPackageLock(runtimeLock.domTestImplementation, packageLock);
  verifyNamedPackageLock(runtimeLock.filesystemLock, packageLock);
  if (verifyGraph) {
    await verifyInstalledGraph(root, packageLock, readFile);
  }

  const artifactLockPath = resolve(root, "artifact.lock.json");
  fixedEvidencePaths.push(artifactLockPath);
  const artifactLockBytes = await readBytes(
    readFile,
    artifactLockPath,
    "ARTIFACT_LOCK_MISMATCH",
  );
  if (hashBytes(artifactLockBytes) !== runtimeLock.artifactLockSha256) {
    fail("ARTIFACT_LOCK_MISMATCH");
  }
  const artifactLock = parseLockedJson(
    artifactLockBytes,
    "ARTIFACT_LOCK_MISMATCH",
  );
  validateArtifactLock(artifactLock);
  for (const artifact of artifactLock.artifacts) {
    const artifactBytes = await readBytes(
      readFile,
      safeLockedPath(root, artifact.path, "ARTIFACT_LOCK_MISMATCH"),
      "ARTIFACT_LOCK_MISMATCH",
    );
    if (hashBytes(artifactBytes) !== artifact.sha256) {
      fail("ARTIFACT_LOCK_MISMATCH");
    }
  }

  const ontologyLockPath = resolve(root, "ontology.lock.json");
  fixedEvidencePaths.push(ontologyLockPath);
  const ontologyLockBytes = await readBytes(
    readFile,
    ontologyLockPath,
    "ONTOLOGY_LOCK_MISMATCH",
  );
  if (hashBytes(ontologyLockBytes) !== runtimeLock.ontologyLockSha256) {
    fail("ONTOLOGY_LOCK_MISMATCH");
  }
  const ontologyLock = parseLockedJson(
    ontologyLockBytes,
    "ONTOLOGY_LOCK_MISMATCH",
  );
  validateOntologyLock(ontologyLock);
  for (const ontology of ontologyLock.ontologies) {
    const ontologyPath = safeLockedPath(
      root,
      ontology.localFilename,
      "ONTOLOGY_LOCK_MISMATCH",
    );
    fixedEvidencePaths.push(ontologyPath);
    const ontologyBytes = await readBytes(
      readFile,
      ontologyPath,
      "ONTOLOGY_LOCK_MISMATCH",
    );
    if (hashBytes(ontologyBytes) !== ontology.sha256) {
      fail("ONTOLOGY_LOCK_MISMATCH");
    }
  }

  const sbomPath = safeLockedPath(root, runtimeLock.sbom.path, "SBOM_MISMATCH");
  fixedEvidencePaths.push(sbomPath);
  const sbomBytes = await readBytes(
    readFile,
    sbomPath,
    "SBOM_MISMATCH",
  );
  if (hashBytes(sbomBytes) !== runtimeLock.sbom.sha256) {
    fail("SBOM_MISMATCH");
  }
  validateSbom(parseLockedJson(sbomBytes, "SBOM_MISMATCH"), packageLock);

  return Object.freeze({
    artifactLock,
    fixedEvidencePaths: Object.freeze(fixedEvidencePaths),
    packageLock,
    runtimeLock,
  });
}
