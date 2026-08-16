import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../..",
);

function collectComponents(bom) {
  const result = [bom.metadata.component];
  const visit = (siblings = []) => {
    for (const component of siblings) {
      result.push(component);
      visit(component.components);
    }
  };
  visit(bom.components);
  return result;
}

function containsMember(value, memberName) {
  if (value === null || typeof value !== "object") {
    return false;
  }
  if (Object.hasOwn(value, memberName)) {
    return true;
  }
  return Object.values(value).some((child) => containsMember(child, memberName));
}

test("the SBOM is reproducible CycloneDX 1.7 without volatile metadata", async () => {
  const bytes = await readFile(resolve(repositoryRoot, "sbom.json"));
  const bom = JSON.parse(bytes.toString("utf8"));

  assert.equal(bytes.at(-1), 0x0a);
  assert.equal(bytes.includes(0x0d), false);
  assert.equal(bom.$schema, "http://cyclonedx.org/schema/bom-1.7.schema.json");
  assert.equal(bom.bomFormat, "CycloneDX");
  assert.equal(bom.specVersion, "1.7");
  assert.equal(bom.version, 1);
  assert.equal(containsMember(bom, "serialNumber"), false);
  assert.equal(containsMember(bom, "timestamp"), false);

  const toolComponents = bom.metadata.tools.components;
  assert.equal(
    toolComponents.find(({ name }) => name === "npm").version,
    "11.17.0",
  );
  assert.equal(
    toolComponents.find(({ name }) => name === "cyclonedx-npm").version,
    "6.0.1",
  );
  assert.equal(
    new Set(bom.dependencies.map(({ ref }) => ref)).size,
    bom.dependencies.length,
  );
});

test("the SBOM enumerates the full lock graph with versions, PURLs, integrity, and known licenses", async () => {
  const bom = JSON.parse(
    await readFile(resolve(repositoryRoot, "sbom.json"), "utf8"),
  );
  const packageLock = JSON.parse(
    await readFile(resolve(repositoryRoot, "package-lock.json"), "utf8"),
  );
  const components = collectComponents(bom);
  const byPath = new Map(
    components.map((component) => [
      component.properties.find(
        ({ name }) => name === "cdx:npm:package:path",
      ).value,
      component,
    ]),
  );

  assert.equal(components.length, Object.keys(packageLock.packages).length);
  assert.equal(byPath.size, components.length);

  for (const [packagePath, lockedPackage] of Object.entries(
    packageLock.packages,
  )) {
    const component = byPath.get(packagePath);
    assert.ok(component, `${packagePath || "compiler"} is missing`);
    assert.equal(component.version, lockedPackage.version);
    assert.match(component.purl, /^pkg:npm\//);

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
      const hashes = component.externalReferences.flatMap(
        ({ hashes = [] }) => hashes,
      );
      assert.ok(
        hashes.some(
          ({ alg, content }) => alg === algorithm && content === expectedHex,
        ),
        `${packagePath} lacks its package-lock integrity hash`,
      );
    }
  }

  assert.deepEqual(bom.metadata.component.licenses, [
    { license: { id: "MIT", acknowledgement: "declared" } },
  ]);
  for (const requiredPath of [
    "node_modules/fs-native-extensions",
    "node_modules/jsdom",
    "node_modules/dom-accessibility-api",
    "node_modules/esbuild",
    "node_modules/@cyclonedx/cyclonedx-npm",
  ]) {
    assert.ok(byPath.has(requiredPath), `${requiredPath} must be SBOM-enumerated`);
  }
});
