import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import Ajv2020 from "ajv/dist/2020.js";

const sha256 = "0".repeat(64);
const integrity = "sha512-YQ==";

async function loadJson(relativePath) {
  return JSON.parse(
    await readFile(new URL(`../../${relativePath}`, import.meta.url), "utf8")
  );
}

const validLocks = {
  "artifact-lock.schema.json": {
    lockVersion: "artifact-lock-v1.0",
    artifacts: [
      { role: "context", path: "contexts/poc.context.jsonld", sha256 },
      {
        role: "contract",
        path: "contract/person-association-contract.jsonld",
        sha256
      },
      {
        role: "supported-profile",
        path: "profiles/two-slide-explainer.jsonld",
        sha256
      },
      { role: "carrier-style", path: "carrier/presentation.css", sha256 },
      {
        role: "carrier-navigation",
        path: "carrier/navigation.js",
        sha256
      }
    ]
  },
  "browser-host-lock.schema.json": {
    lockVersion: "browser-host-lock-v1.0",
    bundle: {
      path: "browser/relationship-presentation-core.bundle.mjs",
      sha256,
      sriIntegrity: "sha384-YQ=="
    },
    bundler: { package: "esbuild", version: "0.28.2", integrity },
    compiler: { name: "relationship-presentation-poc", version: "1.0.0" },
    engineBaselines: [
      { engine: "Chromium", version: "1" },
      { engine: "Firefox", version: "1" },
      { engine: "WebKit", version: "1" }
    ]
  },
  "ontology-lock.schema.json": {
    lockVersion: "ontology-lock-v1.0",
    ontologies: [
      {
        role: "bfo",
        ontologyIri: "http://purl.obolibrary.org/obo/bfo.owl",
        versionIri: "http://purl.obolibrary.org/obo/bfo/2020/bfo-core.ttl",
        sourceReleaseOrTag: "release-2024-01-29",
        sourceCommit: "044490fc5100ffed6df7d4d15cbc167698b6fdee",
        localFilename: "vendor/ontology/bfo-core.ttl",
        sha256,
        license: "CC-BY-4.0"
      },
      {
        role: "cco-agent",
        ontologyIri: "https://www.commoncoreontologies.org/AgentOntology",
        versionIri:
          "https://www.commoncoreontologies.org/2024-11-05/AgentOntology",
        sourceReleaseOrTag: "v2.0-2024-11-06",
        sourceCommit: "510dad76be0ef710b65a421075af912af25342b7",
        localFilename: "vendor/ontology/AgentOntology.ttl",
        sha256,
        license: "BSD-3-Clause"
      },
      {
        role: "cco-information-entity",
        ontologyIri:
          "https://www.commoncoreontologies.org/InformationEntityOntology",
        versionIri:
          "https://www.commoncoreontologies.org/2024-11-06/InformationEntityOntology",
        sourceReleaseOrTag: "v2.0-2024-11-06",
        sourceCommit: "510dad76be0ef710b65a421075af912af25342b7",
        localFilename: "vendor/ontology/InformationEntityOntology.ttl",
        sha256,
        license: "BSD-3-Clause"
      }
    ]
  },
  "runtime-lock.schema.json": {
    lockVersion: "runtime-lock-v1.0",
    node: {
      version: "24.19.0",
      releaseLine: "24.x",
      releaseStatusAtSpecification: "Active LTS"
    },
    packageManager: { name: "npm", version: "11.17.0" },
    jsonLdProcessor: { package: "jsonld", version: "9.0.0", integrity },
    domTestImplementation: { package: "jsdom", version: "30.0.1", integrity },
    filesystemLock: {
      package: "fs-native-extensions",
      version: "1.5.0",
      integrity
    },
    compiler: {
      name: "relationship-presentation-poc",
      version: "1.0.0",
      sourceCommit: "0".repeat(40)
    },
    packageLockSha256: sha256,
    artifactLockSha256: sha256,
    ontologyLockSha256: sha256,
    sbom: {
      path: "sbom.json",
      format: "CycloneDX JSON",
      specVersion: "1.7",
      mediaType: "application/vnd.cyclonedx+json; version=1.7",
      sha256
    }
  }
};

test("all Phase 0 lock schemas compile and accept their populated shape", async () => {
  const ajv = new Ajv2020({ allErrors: true, strict: true });

  for (const [filename, validLock] of Object.entries(validLocks)) {
    const schema = await loadJson(`schemas/${filename}`);
    const validate = ajv.compile(schema);
    assert.equal(
      validate(validLock),
      true,
      `${filename}: ${JSON.stringify(validate.errors)}`
    );

    assert.equal(
      validate({ ...validLock, unexpected: true }),
      false,
      `${filename} accepted an unknown top-level member`
    );
  }
});

test("package decisions are exact and the runtime has no range-selected tools", async () => {
  const packageJson = await loadJson("package.json");
  const selections = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies
  };

  assert.deepEqual(
    {
      bundler: selections.esbuild,
      dom: selections.jsdom,
      filesystemLock: selections["fs-native-extensions"],
      jsonLd: selections.jsonld,
      packageManager: packageJson.engines.npm
    },
    {
      bundler: "0.28.2",
      dom: "30.0.1",
      filesystemLock: "1.5.0",
      jsonLd: "9.0.0",
      packageManager: "11.17.0"
    }
  );

  for (const [name, version] of Object.entries(selections)) {
    assert.match(version, /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/u, `${name} is not exact`);
  }
});
