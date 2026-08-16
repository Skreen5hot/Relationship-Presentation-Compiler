import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { build } from "esbuild";

import { assertCpsSource } from "./scan-phase0-cps.mjs";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = resolve(repositoryRoot, "build", "phase2");
const coreOutputName = "relationship-presentation-core.skeleton.bundle.mjs";
const workerOutputName = "poison-worker.bundle.mjs";
const artifactLock = JSON.parse(
  await readFile(resolve(repositoryRoot, "artifact.lock.json"), "utf8"),
);

const digestRoleMap = {
  context: "context",
  contract: "contract",
  "supported-profile": "canonicalProfile",
  "carrier-style": "carrierStyle",
  "carrier-navigation": "carrierNavigation",
};
const embeddedArtifactDigests = Object.fromEntries(
  artifactLock.artifacts.map((artifact) => [
    digestRoleMap[artifact.role],
    artifact.sha256,
  ]),
);
assert.deepEqual(Object.keys(embeddedArtifactDigests), [
  "context",
  "contract",
  "canonicalProfile",
  "carrierStyle",
  "carrierNavigation",
]);

const coreOptions = {
  absWorkingDir: repositoryRoot,
  bundle: true,
  charset: "utf8",
  define: {
    __RPC_ARTIFACT_DIGESTS__: JSON.stringify(embeddedArtifactDigests),
  },
  entryPoints: ["./src/core/core.js"],
  format: "esm",
  legalComments: "none",
  metafile: true,
  minify: false,
  outfile: coreOutputName,
  platform: "browser",
  sourcemap: false,
  target: "es2023",
  treeShaking: true,
  write: false,
};

async function buildTwice(options, outputName) {
  const first = await build(options);
  const second = await build(options);
  assert.equal(first.outputFiles.length, 1);
  assert.equal(second.outputFiles.length, 1);
  assert.deepEqual(
    first.outputFiles[0].contents,
    second.outputFiles[0].contents,
    `${outputName} was not reproducible across consecutive clean builds`,
  );
  await writeFile(
    resolve(outputDirectory, outputName),
    first.outputFiles[0].contents,
  );
  return first;
}

await mkdir(outputDirectory, { recursive: true });
const coreBuild = await buildTwice(coreOptions, coreOutputName);
assertCpsSource(coreBuild.outputFiles[0].text, "Phase 2 core bundle");

for (const inputPath of Object.keys(coreBuild.metafile.inputs)) {
  if (inputPath.startsWith("<define:")) {
    continue;
  }
  if (!inputPath.startsWith("src/core/")) {
    throw new Error(`Unexpected Phase 2 core input: ${inputPath}`);
  }
  assertCpsSource(
    await readFile(resolve(repositoryRoot, inputPath), "utf8"),
    inputPath,
  );
}

await buildTwice(
  {
    absWorkingDir: repositoryRoot,
    bundle: true,
    charset: "utf8",
    entryPoints: ["./test/phase2/browser-poison-worker.js"],
    external: [`./${coreOutputName}`],
    format: "esm",
    legalComments: "none",
    minify: false,
    outfile: workerOutputName,
    platform: "browser",
    sourcemap: false,
    target: "es2023",
    treeShaking: true,
    write: false,
  },
  workerOutputName,
);

console.log("Phase 2 core and poisoned-browser harness reproduce exactly.");
