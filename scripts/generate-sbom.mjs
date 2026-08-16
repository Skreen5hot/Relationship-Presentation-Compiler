import { spawnSync } from "node:child_process";
import { readFile, rm, writeFile, mkdtemp } from "node:fs/promises";
import { delimiter, dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const arguments_ = process.argv.slice(2);
const checkOnly = arguments_.includes("--check");
const outputFlagIndex = arguments_.indexOf("--output");
const outputPath = resolve(
  repositoryRoot,
  outputFlagIndex === -1 ? "sbom.json" : arguments_[outputFlagIndex + 1],
);

if (outputFlagIndex !== -1 && arguments_[outputFlagIndex + 1] === undefined) {
  throw new Error("--output requires a path");
}

const packageManifest = JSON.parse(
  await readFile(resolve(repositoryRoot, "package.json"), "utf8"),
);
const packageLock = JSON.parse(
  await readFile(resolve(repositoryRoot, "package-lock.json"), "utf8"),
);
const cyclonedxManifest = JSON.parse(
  await readFile(
    resolve(repositoryRoot, "node_modules/@cyclonedx/cyclonedx-npm/package.json"),
    "utf8",
  ),
);
const expectedCyclonedxVersion =
  packageManifest.devDependencies["@cyclonedx/cyclonedx-npm"];
if (cyclonedxManifest.version !== expectedCyclonedxVersion) {
  throw new Error("Installed CycloneDX generator does not match package.json");
}

const temporaryDirectory = await mkdtemp(join(tmpdir(), "rpc-sbom-"));
const temporaryOutput = resolve(temporaryDirectory, "sbom.json");
const childEnvironment = { ...process.env };
const pathKey =
  Object.keys(childEnvironment).find((key) => key.toLowerCase() === "path") ??
  "PATH";
childEnvironment[pathKey] = `${dirname(process.execPath)}${delimiter}${childEnvironment[pathKey] ?? ""}`;

try {
  const result = spawnSync(
    process.execPath,
    [
      resolve(
        repositoryRoot,
        "node_modules/@cyclonedx/cyclonedx-npm/bin/cyclonedx-npm-cli.js",
      ),
      "--package-lock-only",
      "--spec-version",
      "1.7",
      "--output-format",
      "JSON",
      "--output-reproducible",
      "--short-PURLs",
      "--validate",
      "--output-file",
      temporaryOutput,
      resolve(repositoryRoot, "package.json"),
    ],
    {
      cwd: repositoryRoot,
      env: childEnvironment,
      encoding: "utf8",
    },
  );

  if (result.status !== 0) {
    throw new Error(
      `CycloneDX generation failed (${result.status}): ${result.stderr || result.stdout}`,
    );
  }

  const toolBytes = await readFile(temporaryOutput);
  const generatedBytes = toolBytes.at(-1) === 0x0a
    ? toolBytes
    : Buffer.concat([toolBytes, Buffer.from("\n", "utf8")]);
  const bom = JSON.parse(generatedBytes.toString("utf8"));
  if (
    bom.bomFormat !== "CycloneDX" ||
    bom.specVersion !== "1.7" ||
    bom.$schema !== "http://cyclonedx.org/schema/bom-1.7.schema.json"
  ) {
    throw new Error("Generator did not emit CycloneDX 1.7 JSON");
  }
  if ("serialNumber" in bom || "timestamp" in (bom.metadata ?? {})) {
    throw new Error("Reproducible SBOM contains time- or random-based metadata");
  }

  const npmTool = bom.metadata?.tools?.components?.find(
    (component) => component.name === "npm",
  );
  const expectedNpmVersion = packageManifest.engines.npm;
  if (npmTool?.version !== expectedNpmVersion) {
    throw new Error(
      `SBOM used npm ${npmTool?.version ?? "unknown"}; expected ${expectedNpmVersion}`,
    );
  }

  const components = [bom.metadata.component];
  const appendComponents = (siblings = []) => {
    for (const component of siblings) {
      components.push(component);
      appendComponents(component.components);
    }
  };
  appendComponents(bom.components);

  const componentsByPath = new Map();
  for (const component of components) {
    const packagePath = component.properties?.find(
      (property) => property.name === "cdx:npm:package:path",
    )?.value;
    if (packagePath === undefined || componentsByPath.has(packagePath)) {
      throw new Error("SBOM component paths are missing or duplicated");
    }
    if (typeof component.purl !== "string" || !component.purl.startsWith("pkg:npm/")) {
      throw new Error(`SBOM component ${packagePath} lacks a deterministic npm PURL`);
    }
    componentsByPath.set(packagePath, component);
  }

  const lockedPackages = Object.entries(packageLock.packages);
  if (componentsByPath.size !== lockedPackages.length) {
    throw new Error("SBOM does not enumerate every package-lock.json package");
  }
  for (const [packagePath, lockedPackage] of lockedPackages) {
    const component = componentsByPath.get(packagePath);
    if (component?.version !== lockedPackage.version) {
      throw new Error(`SBOM version mismatch for ${packagePath || "the compiler"}`);
    }
    if (lockedPackage.integrity !== undefined) {
      const separator = lockedPackage.integrity.indexOf("-");
      const algorithm = lockedPackage.integrity
        .slice(0, separator)
        .replace(/^sha(\d+)$/i, "SHA-$1")
        .toUpperCase();
      const expectedHex = Buffer.from(
        lockedPackage.integrity.slice(separator + 1),
        "base64",
      ).toString("hex");
      const hashes = component.externalReferences?.flatMap(
        ({ hashes = [] }) => hashes,
      ) ?? [];
      if (
        !hashes.some(
          ({ alg, content }) => alg === algorithm && content === expectedHex,
        )
      ) {
        throw new Error(`SBOM integrity mismatch for ${packagePath}`);
      }
    }
  }

  if (checkOnly) {
    const committedBytes = await readFile(outputPath);
    if (!committedBytes.equals(generatedBytes)) {
      throw new Error("sbom.json is not byte-reproducible from package-lock.json");
    }
  } else {
    await writeFile(outputPath, generatedBytes);
  }

  console.log(
    checkOnly
      ? "sbom.json reproduces exactly as CycloneDX 1.7 JSON."
      : `Generated ${outputPath}.`,
  );
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
