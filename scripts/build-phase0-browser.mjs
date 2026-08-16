import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { build } from "esbuild";

import { assertPhase0CpsBundle } from "./scan-phase0-cps.mjs";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = resolve(packageRoot, "build", "phase0");
const failClosedEventsShim = resolve(
  packageRoot,
  "src/core/phase0-shims/fail-closed-events.cjs"
);

const sharedOptions = {
  absWorkingDir: packageRoot,
  alias: {
    "lru-cache": "./src/core/phase0-shims/deterministic-lru.cjs",
    "rdf-canonize": "./src/core/phase0-shims/identifier-issuer.cjs"
  },
  bundle: true,
  charset: "utf8",
  format: "esm",
  legalComments: "none",
  minify: false,
  platform: "browser",
  plugins: [
    {
      name: "phase0-jsonld-cps-boundary",
      setup(buildContext) {
        buildContext.onResolve({ filter: /^\.\/events$/ }, (arguments_) => {
          const resolveDirectory = arguments_.resolveDir.replaceAll("\\", "/");
          if (resolveDirectory.endsWith("/node_modules/jsonld/lib")) {
            return { path: failClosedEventsShim };
          }
          return undefined;
        });
      }
    }
  ],
  sourcemap: false,
  target: "es2023",
  treeShaking: true,
  write: false
};

async function reproducibleBuild(entryPoint, outputName) {
  const options = {
    ...sharedOptions,
    entryPoints: [entryPoint],
    outfile: outputName
  };
  const first = await build(options);
  const second = await build(options);

  assert.equal(first.outputFiles.length, 1);
  assert.equal(second.outputFiles.length, 1);
  assert.deepEqual(
    first.outputFiles[0].contents,
    second.outputFiles[0].contents,
    `${outputName} was not reproducible across consecutive clean builds`
  );

  await writeFile(resolve(outputDirectory, outputName), first.outputFiles[0].contents);
  return first.outputFiles[0].text;
}

await mkdir(outputDirectory, { recursive: true });
const coreBundle = await reproducibleBuild(
  "./src/core/phase0-jsonld-adapter.js",
  "core-edge-smoke.bundle.mjs"
);
assertPhase0CpsBundle(coreBundle, "Phase 0 core bundle");
await reproducibleBuild(
  "./src/host-browser/phase0-worker-harness.js",
  "worker-smoke.bundle.mjs"
);
