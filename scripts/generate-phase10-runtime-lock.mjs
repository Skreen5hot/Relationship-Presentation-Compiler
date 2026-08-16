import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { parseJsonBytes } from "../src/core/json-scan.js";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const checkMode = process.argv.includes("--check");

async function bytes(relativePath) {
  return new Uint8Array(await readFile(resolve(repositoryRoot, relativePath)));
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

const packageLockBytes = await bytes("package-lock.json");
const artifactLockBytes = await bytes("artifact.lock.json");
const ontologyLockBytes = await bytes("ontology.lock.json");
const sbomBytes = await bytes("sbom.json");
const packageLock = parseJsonBytes(packageLockBytes).value;

function lockedPackage(name) {
  const entry = packageLock.packages[`node_modules/${name}`];
  if (
    entry === undefined ||
    typeof entry.version !== "string" ||
    typeof entry.integrity !== "string"
  ) {
    throw new Error(`package-lock.json does not lock ${name}`);
  }
  return { package: name, version: entry.version, integrity: entry.integrity };
}

const runtimeLock = {
  lockVersion: "runtime-lock-v1.0",
  node: {
    version: "24.19.0",
    releaseLine: "24.x",
    releaseStatusAtSpecification: "Active LTS",
  },
  packageManager: { name: "npm", version: "11.17.0" },
  jsonLdProcessor: lockedPackage("jsonld"),
  domTestImplementation: lockedPackage("jsdom"),
  filesystemLock: lockedPackage("fs-native-extensions"),
  compiler: {
    name: "relationship-presentation-poc",
    version: "1.0.0",
    // Phase 11 replaces this development packaging sentinel.
    sourceCommit: "0000000000000000000000000000000000000000",
  },
  packageLockSha256: sha256(packageLockBytes),
  artifactLockSha256: sha256(artifactLockBytes),
  ontologyLockSha256: sha256(ontologyLockBytes),
  sbom: {
    path: "sbom.json",
    format: "CycloneDX JSON",
    specVersion: "1.7",
    mediaType: "application/vnd.cyclonedx+json; version=1.7",
    sha256: sha256(sbomBytes),
  },
};
const generatedBytes = new TextEncoder().encode(
  `${JSON.stringify(runtimeLock, null, 2)}\n`,
);
const outputPath = resolve(repositoryRoot, "runtime.lock.json");

if (checkMode) {
  const committed = new Uint8Array(await readFile(outputPath));
  if (
    committed.byteLength !== generatedBytes.byteLength ||
    committed.some((value, index) => value !== generatedBytes[index])
  ) {
    throw new Error("runtime.lock.json does not reproduce from locked evidence");
  }
  process.stdout.write("Phase 10 development runtime lock reproduces exactly.\n");
} else {
  await writeFile(outputPath, generatedBytes);
  process.stdout.write("Generated the Phase 10 development runtime lock.\n");
}
