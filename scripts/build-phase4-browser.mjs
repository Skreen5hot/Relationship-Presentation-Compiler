import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { build } from "esbuild";

import { parseJsonBytes } from "../src/core/json-scan.js";
import { assertCpsSource } from "./scan-phase0-cps.mjs";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const browserDirectory = resolve(repositoryRoot, "browser");
const bundlePath = resolve(
  browserDirectory,
  "relationship-presentation-core.bundle.mjs",
);
const lockPath = resolve(repositoryRoot, "browser-host.lock.json");
const checkMode = process.argv.includes("--check");
const failClosedEventsShim = resolve(
  repositoryRoot,
  "src/core/phase0-shims/fail-closed-events.cjs",
);

async function readJson(relativePath) {
  const bytes = new Uint8Array(
    await readFile(resolve(repositoryRoot, relativePath)),
  );
  return parseJsonBytes(bytes).value;
}

const [artifactLock, packageLock, browserPins] = await Promise.all([
  readJson("artifact.lock.json"),
  readJson("package-lock.json"),
  readJson("node_modules/playwright-core/browsers.json"),
]);

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
const compilerIdentity = {
  name: "relationship-presentation-poc",
  version: "1.0.0",
  // Phase 11 replaces this development sentinel during release packaging.
  sourceCommit: "0000000000000000000000000000000000000000",
};
assert.deepEqual(Object.keys(embeddedArtifactDigests), [
  "context",
  "contract",
  "canonicalProfile",
  "carrierStyle",
  "carrierNavigation",
]);

const buildOptions = {
  absWorkingDir: repositoryRoot,
  alias: {
    "lru-cache": resolve(
      repositoryRoot,
      "src/core/phase0-shims/deterministic-lru.cjs",
    ),
    "rdf-canonize": resolve(
      repositoryRoot,
      "src/core/phase0-shims/identifier-issuer.cjs",
    ),
  },
  bundle: true,
  charset: "utf8",
  define: {
    __RPC_ARTIFACT_DIGESTS__: JSON.stringify(embeddedArtifactDigests),
    __RPC_COMPILER_NAME__: JSON.stringify(compilerIdentity.name),
    __RPC_COMPILER_VERSION__: JSON.stringify(compilerIdentity.version),
    __RPC_SOURCE_COMMIT__: JSON.stringify(compilerIdentity.sourceCommit),
  },
  entryPoints: [resolve(repositoryRoot, "src/core/core.js")],
  format: "esm",
  legalComments: "none",
  metafile: true,
  minify: false,
  outfile: "relationship-presentation-core.bundle.mjs",
  platform: "browser",
  plugins: [
    {
      name: "jsonld-cps-boundary",
      setup(buildContext) {
        buildContext.onResolve({ filter: /^\.\/events$/ }, (arguments_) => {
          const resolveDirectory = arguments_.resolveDir.replaceAll("\\", "/");
          if (resolveDirectory.endsWith("/node_modules/jsonld/lib")) {
            return { path: failClosedEventsShim };
          }
          return undefined;
        });
      },
    },
  ],
  sourcemap: false,
  target: "es2023",
  treeShaking: true,
  write: false,
};

const firstBuild = await build(buildOptions);
const secondBuild = await build(buildOptions);
assert.equal(firstBuild.outputFiles.length, 1);
assert.equal(secondBuild.outputFiles.length, 1);
assert.deepEqual(
  firstBuild.outputFiles[0].contents,
  secondBuild.outputFiles[0].contents,
  "The Phase 4 browser core bundle did not reproduce byte-identically",
);

const bundleBytes = firstBuild.outputFiles[0].contents;
assertCpsSource(firstBuild.outputFiles[0].text, "Phase 4 browser core bundle");
for (const inputPath of Object.keys(firstBuild.metafile.inputs)) {
  if (inputPath.startsWith("<define:")) {
    continue;
  }
  if (
    !inputPath.startsWith("src/core/") &&
    !inputPath.startsWith("node_modules/jsonld/") &&
    !inputPath.startsWith("node_modules/canonicalize/")
  ) {
    throw new Error(`Unexpected Phase 4 core input: ${inputPath}`);
  }
  if (inputPath.startsWith("src/core/")) {
    assertCpsSource(
      await readFile(resolve(repositoryRoot, inputPath), "utf8"),
      inputPath,
    );
  }
}

function digestHex(algorithm, bytes) {
  return createHash(algorithm).update(bytes).digest("hex");
}

function digestBase64(algorithm, bytes) {
  return createHash(algorithm).update(bytes).digest("base64");
}

function pinnedBrowserVersion(name) {
  const pin = browserPins.browsers.find((browser) => browser.name === name);
  assert.equal(typeof pin?.browserVersion, "string", `${name} is not pinned`);
  return pin.browserVersion;
}

const esbuildLock = packageLock.packages["node_modules/esbuild"];
assert.equal(esbuildLock.version, "0.28.2");
assert.match(esbuildLock.integrity, /^sha512-[A-Za-z0-9+/]+={0,2}$/u);

const browserHostLock = {
  lockVersion: "browser-host-lock-v1.0",
  bundle: {
    path: "browser/relationship-presentation-core.bundle.mjs",
    sha256: digestHex("sha256", bundleBytes),
    sriIntegrity: `sha384-${digestBase64("sha384", bundleBytes)}`,
  },
  bundler: {
    package: "esbuild",
    version: esbuildLock.version,
    integrity: esbuildLock.integrity,
  },
  compiler: {
    name: "relationship-presentation-poc",
    version: "1.0.0",
  },
  engineBaselines: [
    { engine: "Chromium", version: pinnedBrowserVersion("chromium") },
    { engine: "Firefox", version: pinnedBrowserVersion("firefox") },
    { engine: "WebKit", version: pinnedBrowserVersion("webkit") },
  ],
};
const lockBytes = new TextEncoder().encode(
  `${JSON.stringify(browserHostLock, null, 2)}\n`,
);

if (checkMode) {
  assert.deepEqual(
    new Uint8Array(await readFile(bundlePath)),
    bundleBytes,
    "Committed browser bundle differs from a clean Phase 4 build",
  );
  assert.deepEqual(
    new Uint8Array(await readFile(lockPath)),
    lockBytes,
    "browser-host.lock.json differs from the generated lock",
  );
  console.log("Phase 4 browser bundle and host lock reproduce exactly.");
} else {
  await mkdir(browserDirectory, { recursive: true });
  await writeFile(bundlePath, bundleBytes);
  await writeFile(lockPath, lockBytes);
  console.log("Generated the Phase 4 browser bundle and host lock.");
}
