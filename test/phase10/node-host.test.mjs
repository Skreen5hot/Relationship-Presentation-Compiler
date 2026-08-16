import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import {
  lstat,
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  CliError,
  HELP_TEXT,
  parseCliArguments,
  VERSION_TEXT,
} from "../../src/host-node/cli.js";
import {
  InputAcquisitionError,
  loadValidatedInput,
  validateInputFile,
} from "../../src/host-node/input-acquisition.js";
import {
  HostLockError,
  verifyNodeHostLocks,
} from "../../src/host-node/locks.js";
import { runNodeCompilation } from "../../src/host-node/node-host.js";
import { ARTIFACT_FILENAMES } from "../../src/host-node/publication.js";
import { runSupervisedCore } from "../../src/host-node/supervisor.js";
import { canonicalCoreRequest } from "../phase2/core-request-fixture.mjs";

const repositoryRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const encoder = new TextEncoder();

async function temporaryCase(t, label) {
  const root = await mkdtemp(join(tmpdir(), `rpc-phase10-${label}-`));
  t.after(() => rm(root, { force: true, recursive: true }));
  return root;
}

function assertCliCode(arguments_, code) {
  assert.throws(
    () => parseCliArguments(arguments_),
    (error) => error instanceof CliError && error.code === code,
  );
}

test("N1 parses only the closed CLI and preserves informational modes", () => {
  assert.deepEqual(parseCliArguments([]), {
    defaultMode: true,
    mode: "compile",
    replace: true,
  });
  assert.deepEqual(parseCliArguments(["--help"]), { mode: "help" });
  assert.deepEqual(parseCliArguments(["--version"]), { mode: "version" });
  assert.ok(HELP_TEXT.endsWith("\n"));
  assert.ok(VERSION_TEXT.endsWith("\n"));

  const parameterized = parseCliArguments([
    "--source",
    "source.jsonld",
    "--request",
    "request.txt",
    "--profile",
    "profile.jsonld",
    "--out",
    "output",
    "--replace",
  ]);
  assert.deepEqual(parameterized, {
    defaultMode: false,
    mode: "compile",
    out: "output",
    profile: "profile.jsonld",
    replace: true,
    request: "request.txt",
    source: "source.jsonld",
  });

  assertCliCode(["--unknown"], "UNKNOWN_OPTION");
  assertCliCode(["source.jsonld"], "UNKNOWN_OPTION");
  assertCliCode(["--help", "--help"], "DUPLICATE_OPTION");
  assertCliCode(
    ["--source", "a", "--source", "b"],
    "DUPLICATE_OPTION",
  );
  assertCliCode(["--replace"], "INVALID_CLI_OPTIONS");
  assertCliCode(["--help", "--version"], "INVALID_CLI_OPTIONS");
  assertCliCode(["--source", "only.jsonld"], "INVALID_CLI_OPTIONS");
});

function overlayReader(overlays) {
  const normalized = new Map(
    Object.entries(overlays).map(([path, bytes]) => [resolve(path), bytes]),
  );
  return async (path) =>
    normalized.has(resolve(path))
      ? normalized.get(resolve(path))
      : readFile(path);
}

async function expectLockCode(action, code) {
  await assert.rejects(
    action,
    (error) => error instanceof HostLockError && error.code === code,
  );
}

test("N2 validates every lock in the fixed order and detects installed drift", async () => {
  const evidence = await verifyNodeHostLocks({ packageRoot: repositoryRoot });
  assert.equal(evidence.runtimeLock.lockVersion, "runtime-lock-v1.0");
  assert.equal(
    evidence.runtimeLock.compiler.sourceCommit,
    "0000000000000000000000000000000000000000",
  );

  const files = Object.fromEntries(
    await Promise.all(
      [
        "runtime.lock.json",
        "package-lock.json",
        "artifact.lock.json",
        "ontology.lock.json",
        "sbom.json",
      ].map(async (name) => [
        resolve(repositoryRoot, name),
        new Uint8Array(await readFile(resolve(repositoryRoot, name))),
      ]),
    ),
  );
  const flipped = (path) => {
    const bytes = new Uint8Array(files[path]);
    bytes[bytes.length - 2] ^= 1;
    return bytes;
  };

  const runtimePath = resolve(repositoryRoot, "runtime.lock.json");
  const runtimeText = new TextDecoder().decode(files[runtimePath]);
  const wrongRuntime = encoder.encode(
    runtimeText.replace('"version": "24.19.0"', '"version": "24.19.1"'),
  );
  await expectLockCode(
    () =>
      verifyNodeHostLocks({
        packageRoot: repositoryRoot,
        readFile: overlayReader({ [runtimePath]: wrongRuntime }),
        verifyGraph: false,
      }),
    "RUNTIME_LOCK_MISMATCH",
  );
  const wrongRuntimeShape = encoder.encode(
    runtimeText.replace('"releaseLine": "24.x"', '"releaseLine": "25.x"'),
  );
  await expectLockCode(
    () =>
      verifyNodeHostLocks({
        packageRoot: repositoryRoot,
        readFile: overlayReader({ [runtimePath]: wrongRuntimeShape }),
        verifyGraph: false,
      }),
    "RUNTIME_LOCK_MISMATCH",
  );

  for (const [name, code] of [
    ["package-lock.json", "PACKAGE_LOCK_MISMATCH"],
    ["artifact.lock.json", "ARTIFACT_LOCK_MISMATCH"],
    ["ontology.lock.json", "ONTOLOGY_LOCK_MISMATCH"],
    ["sbom.json", "SBOM_MISMATCH"],
  ]) {
    const path = resolve(repositoryRoot, name);
    await expectLockCode(
      () =>
        verifyNodeHostLocks({
          packageRoot: repositoryRoot,
          readFile: overlayReader({ [path]: flipped(path) }),
          verifyGraph: false,
        }),
      code,
    );
  }

  const packagePath = resolve(repositoryRoot, "package-lock.json");
  const artifactPath = resolve(repositoryRoot, "artifact.lock.json");
  await expectLockCode(
    () =>
      verifyNodeHostLocks({
        packageRoot: repositoryRoot,
        readFile: overlayReader({
          [artifactPath]: flipped(artifactPath),
          [packagePath]: flipped(packagePath),
        }),
        verifyGraph: false,
      }),
    "PACKAGE_LOCK_MISMATCH",
  );

  const installedManifestPath = resolve(
    repositoryRoot,
    "node_modules/jsonld/package.json",
  );
  const installedManifest = await readFile(installedManifestPath, "utf8");
  await expectLockCode(
    () =>
      verifyNodeHostLocks({
        packageRoot: repositoryRoot,
        readFile: overlayReader({
          [installedManifestPath]: encoder.encode(
            installedManifest.replace('"version": "9.0.0"', '"version": "9.0.1"'),
          ),
        }),
      }),
    "PACKAGE_LOCK_MISMATCH",
  );
});

test("N2 rejects duplicate lock members, missing evidence, and every locked payload mutation", async () => {
  const runtimePath = resolve(repositoryRoot, "runtime.lock.json");
  const runtime = JSON.parse(await readFile(runtimePath, "utf8"));
  const targetCases = [
    [
      "package-lock.json",
      "packageLockSha256",
      '  "name": "relationship-presentation-poc",',
      '  "name": "relationship-presentation-poc",\n  "name": "relationship-presentation-poc",',
      "PACKAGE_LOCK_MISMATCH",
    ],
    [
      "artifact.lock.json",
      "artifactLockSha256",
      '  "lockVersion": "artifact-lock-v1.0",',
      '  "lockVersion": "artifact-lock-v1.0",\n  "lockVersion": "artifact-lock-v1.0",',
      "ARTIFACT_LOCK_MISMATCH",
    ],
    [
      "ontology.lock.json",
      "ontologyLockSha256",
      '  "lockVersion": "ontology-lock-v1.0",',
      '  "lockVersion": "ontology-lock-v1.0",\n  "lockVersion": "ontology-lock-v1.0",',
      "ONTOLOGY_LOCK_MISMATCH",
    ],
    [
      "sbom.json",
      "sbom",
      '  "bomFormat": "CycloneDX",',
      '  "bomFormat": "CycloneDX",\n  "bomFormat": "CycloneDX",',
      "SBOM_MISMATCH",
    ],
  ];
  const duplicateRuntime = encoder.encode(
    (await readFile(runtimePath, "utf8")).replace(
      '  "lockVersion": "runtime-lock-v1.0",',
      '  "lockVersion": "runtime-lock-v1.0",\n  "lockVersion": "runtime-lock-v1.0",',
    ),
  );
  await expectLockCode(
    () =>
      verifyNodeHostLocks({
        packageRoot: repositoryRoot,
        readFile: overlayReader({ [runtimePath]: duplicateRuntime }),
        verifyGraph: false,
      }),
    "RUNTIME_LOCK_MISMATCH",
  );

  for (const [name, hashMember, needle, replacement, code] of targetCases) {
    const targetPath = resolve(repositoryRoot, name);
    const duplicateBytes = encoder.encode(
      (await readFile(targetPath, "utf8")).replace(needle, replacement),
    );
    const adjustedRuntime = structuredClone(runtime);
    const digest = createHash("sha256").update(duplicateBytes).digest("hex");
    if (hashMember === "sbom") {
      adjustedRuntime.sbom.sha256 = digest;
    } else {
      adjustedRuntime[hashMember] = digest;
    }
    await expectLockCode(
      () =>
        verifyNodeHostLocks({
          packageRoot: repositoryRoot,
          readFile: overlayReader({
            [runtimePath]: encoder.encode(`${JSON.stringify(adjustedRuntime, null, 2)}\n`),
            [targetPath]: duplicateBytes,
          }),
          verifyGraph: false,
        }),
      code,
    );
  }

  const evidence = await verifyNodeHostLocks({
    packageRoot: repositoryRoot,
    verifyGraph: false,
  });
  for (const artifact of evidence.artifactLock.artifacts) {
    const path = resolve(repositoryRoot, artifact.path);
    const mutated = new Uint8Array(await readFile(path));
    mutated[0] ^= 1;
    await expectLockCode(
      () =>
        verifyNodeHostLocks({
          packageRoot: repositoryRoot,
          readFile: overlayReader({ [path]: mutated }),
          verifyGraph: false,
        }),
      "ARTIFACT_LOCK_MISMATCH",
    );
  }
  for (const ontology of JSON.parse(
    await readFile(resolve(repositoryRoot, "ontology.lock.json"), "utf8"),
  ).ontologies) {
    const path = resolve(repositoryRoot, ontology.localFilename);
    const mutated = new Uint8Array(await readFile(path));
    mutated[0] ^= 1;
    await expectLockCode(
      () =>
        verifyNodeHostLocks({
          packageRoot: repositoryRoot,
          readFile: overlayReader({ [path]: mutated }),
          verifyGraph: false,
        }),
      "ONTOLOGY_LOCK_MISMATCH",
    );
  }

  const sbomPath = resolve(repositoryRoot, "sbom.json");
  await expectLockCode(
    () =>
      verifyNodeHostLocks({
        packageRoot: repositoryRoot,
        readFile: async (path) => {
          if (resolve(path) === sbomPath) {
            const error = new Error("missing");
            error.code = "ENOENT";
            throw error;
          }
          return readFile(path);
        },
        verifyGraph: false,
      }),
    "SBOM_MISMATCH",
  );
});

test("N3 and N4 enforce symlink trust and detect identity changes", async (t) => {
  const root = await temporaryCase(t, "inputs");
  const packageRoot = join(root, "package");
  const outside = join(root, "outside.txt");
  const inside = join(packageRoot, "inside.txt");
  const insideLink = join(packageRoot, "inside-link.txt");
  const outsideLink = join(root, "outside-link.txt");
  await mkdir(packageRoot);
  await writeFile(inside, "inside");
  await writeFile(outside, "outside");
  await symlink(inside, insideLink, "file");
  await symlink(outside, outsideLink, "file");

  const allowed = await validateInputFile({
    packageRoot,
    path: insideLink,
  });
  assert.equal(new TextDecoder().decode(await loadValidatedInput(allowed)), "inside");

  await assert.rejects(
    () => validateInputFile({ fixed: true, packageRoot, path: insideLink }),
    (error) =>
      error instanceof InputAcquisitionError &&
      error.code === "UNSAFE_INPUT_PATH",
  );
  await assert.rejects(
    () => validateInputFile({ fixed: true, packageRoot, path: outside }),
    (error) =>
      error instanceof InputAcquisitionError &&
      error.code === "UNSAFE_INPUT_PATH",
  );
  await assert.rejects(
    () => validateInputFile({ packageRoot, path: outsideLink }),
    (error) =>
      error instanceof InputAcquisitionError &&
      error.code === "UNSAFE_INPUT_PATH",
  );

  const changing = await validateInputFile({ packageRoot, path: outside });
  await assert.rejects(
    () =>
      loadValidatedInput(changing, {
        onOpened: () => writeFile(outside, "changed-size"),
      }),
    (error) =>
      error instanceof InputAcquisitionError &&
      error.code === "INPUT_CHANGED_DURING_LOAD",
  );
});

test("Node Worker supervision maps timeout, death, and malformed results", async () => {
  const canonical = await canonicalCoreRequest();
  const timeout = await runSupervisedCore(canonical, {
    timeoutMs: 25,
    workerUrl: new URL("./never-result-worker.js", import.meta.url),
  });
  assert.equal(timeout.code, "BUILD_TIMEOUT");

  for (const workerUrl of [
    new URL("./throw-worker.js", import.meta.url),
    new URL("./malformed-result-worker.js", import.meta.url),
  ]) {
    const result = await runSupervisedCore(canonical, {
      timeoutMs: 1_000,
      workerUrl,
    });
    assert.equal(result.code, "INTERNAL_COMPILER_ERROR");
  }

  const memory = await runSupervisedCore(canonical, {
    resourceLimits: { maxOldGenerationSizeMb: 16 },
    timeoutMs: 10_000,
    workerUrl: new URL("./memory-limit-worker.js", import.meta.url),
  });
  assert.equal(memory.code, "MEMORY_LIMIT_EXCEEDED");
});

test("the Node host compiles, publishes, verifies, and detaches core failures", async (t) => {
  const root = await temporaryCase(t, "end-to-end");
  const evidence = await verifyNodeHostLocks({ packageRoot: repositoryRoot });
  const outputPath = join(root, "success");
  const options = {
    defaultMode: false,
    out: outputPath,
    profile: resolve(repositoryRoot, "profiles/two-slide-explainer.jsonld"),
    replace: false,
    request: resolve(repositoryRoot, "fixtures/relationship-42-request.txt"),
    source: resolve(repositoryRoot, "fixtures/relationship-42.jsonld"),
  };
  const success = await runNodeCompilation(options, {
    lockEvidence: evidence,
    packageRoot: repositoryRoot,
  });
  assert.equal(success.status, "success");
  assert.equal(success.coreFingerprint, "2724d66efecc61f338948da5c7d97da011ccf1fa232a450a94a0bfc19820f98b");
  assert.deepEqual(
    (await Promise.all(ARTIFACT_FILENAMES.map(async (name) => {
      await lstat(join(outputPath, name));
      return name;
    }))).sort(),
    [...ARTIFACT_FILENAMES].sort(),
  );

  const invalidInputDirectory = join(root, "invalid-input");
  const failedOutputDirectory = join(root, "failed-output");
  const invalidRequestPath = join(invalidInputDirectory, "invalid-request.txt");
  const failedOutputPath = join(failedOutputDirectory, "failed");
  await mkdir(invalidInputDirectory);
  await mkdir(failedOutputDirectory);
  await writeFile(invalidRequestPath, "invalid request");
  const failure = await runNodeCompilation(
    { ...options, out: failedOutputPath, request: invalidRequestPath },
    { lockEvidence: evidence, packageRoot: repositoryRoot },
  );
  assert.equal(failure.code, "REQUEST_GRAMMAR_MISMATCH");
  await assert.rejects(() => lstat(failedOutputPath), { code: "ENOENT" });
  assert.deepEqual(
    new Uint8Array(await readFile(`${failedOutputPath}.error-report.json`)),
    failure.errorReport,
  );
});

test("default mode is the documented canonical compile with owned replacement enabled", async (t) => {
  const root = await temporaryCase(t, "default-mode");
  const repositoryEvidence = await verifyNodeHostLocks({
    packageRoot: repositoryRoot,
  });
  const evidenceRelativePaths = repositoryEvidence.fixedEvidencePaths.map(
    (path) => relative(repositoryRoot, path),
  );
  for (const path of new Set([
    "carrier/navigation.js",
    "carrier/presentation.css",
    "contexts/poc.context.jsonld",
    "contract/person-association-contract.jsonld",
    "fixtures/relationship-42-request.txt",
    "fixtures/relationship-42.jsonld",
    "profiles/two-slide-explainer.jsonld",
    ...evidenceRelativePaths,
  ])) {
    await mkdir(dirname(resolve(root, path)), { recursive: true });
    await copyFile(resolve(repositoryRoot, path), resolve(root, path));
  }
  const lockEvidence = Object.freeze({
    ...repositoryEvidence,
    fixedEvidencePaths: Object.freeze(
      evidenceRelativePaths.map((path) => resolve(root, path)),
    ),
  });
  const first = await runNodeCompilation(
    { defaultMode: true, mode: "compile", replace: true },
    { lockEvidence, packageRoot: root },
  );
  assert.equal(first.status, "success");
  const second = await runNodeCompilation(
    { defaultMode: true, mode: "compile", replace: true },
    { lockEvidence, packageRoot: root },
  );
  assert.equal(second.status, "success");
  assert.deepEqual(second.artifacts, first.artifacts);
});

function runCli(arguments_) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(process.execPath, [resolve(repositoryRoot, "index.js"), ...arguments_], {
      cwd: repositoryRoot,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString("utf8");
    });
    child.once("error", reject);
    child.once("exit", (code, signal) =>
      resolveRun({ code, signal, stderr, stdout }),
    );
  });
}

test("independent CLI processes produce byte-identical outputs", async (t) => {
  const root = await temporaryCase(t, "process-determinism");
  const outputs = [join(root, "first"), join(root, "second")];
  const statuses = [];
  for (const output of outputs) {
    const result = await runCli([
      "--source",
      "fixtures/relationship-42.jsonld",
      "--request",
      "fixtures/relationship-42-request.txt",
      "--profile",
      "profiles/two-slide-explainer.jsonld",
      "--out",
      output,
    ]);
    assert.deepEqual({ code: result.code, signal: result.signal, stderr: result.stderr }, {
      code: 0,
      signal: null,
      stderr: "",
    });
    statuses.push(result.stdout);
  }
  assert.equal(statuses[0], statuses[1]);
  for (const name of ARTIFACT_FILENAMES) {
    assert.deepEqual(
      new Uint8Array(await readFile(join(outputs[0], name))),
      new Uint8Array(await readFile(join(outputs[1], name))),
      name,
    );
  }
});

test("the CLI emits only its deterministic informational or terminal line", async () => {
  assert.deepEqual(await runCli(["--help"]), {
    code: 0,
    signal: null,
    stderr: "",
    stdout: HELP_TEXT,
  });
  assert.deepEqual(await runCli(["--version"]), {
    code: 0,
    signal: null,
    stderr: "",
    stdout: VERSION_TEXT,
  });
  assert.deepEqual(await runCli(["--unknown"]), {
    code: 2,
    signal: null,
    stderr: "status=error code=UNKNOWN_OPTION\n",
    stdout: "",
  });
});
