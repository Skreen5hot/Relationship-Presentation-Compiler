import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const checkOnly = process.argv.slice(2).includes("--check");

const artifactDefinitions = [
  ["context", "contexts/poc.context.jsonld"],
  ["contract", "contract/person-association-contract.jsonld"],
  ["supported-profile", "profiles/two-slide-explainer.jsonld"],
  ["carrier-style", "carrier/presentation.css"],
  ["carrier-navigation", "carrier/navigation.js"],
];

const ontologyDefinitions = [
  {
    role: "bfo",
    ontologyIri: "http://purl.obolibrary.org/obo/bfo.owl",
    versionIri: "http://purl.obolibrary.org/obo/bfo/2020/bfo-core.ttl",
    sourceReleaseOrTag: "release-2024-01-29",
    sourceCommit: "044490fc5100ffed6df7d4d15cbc167698b6fdee",
    localFilename: "vendor/ontology/bfo-core.ttl",
    upstreamBlobSha1: "768c070a9075613f157be0811028ade83d318891",
    license: "CC-BY-4.0",
    note: "Upstream owl:versionIRI genuinely ends in bfo-core.ttl at this release. Verified against the pinned commit; do not correct.",
  },
  {
    role: "cco-agent",
    ontologyIri: "https://www.commoncoreontologies.org/AgentOntology",
    versionIri:
      "https://www.commoncoreontologies.org/2024-11-05/AgentOntology",
    sourceReleaseOrTag: "v2.0-2024-11-06",
    sourceCommit: "510dad76be0ef710b65a421075af912af25342b7",
    localFilename: "vendor/ontology/AgentOntology.ttl",
    upstreamBlobSha1: "0a24b3fd3b04d3b5dd456ef74216225b02a44054",
    license: "BSD-3-Clause",
    note: "Upstream owl:versionIRI is dated 2024-11-05 despite the v2.0-2024-11-06 tag. Verified against the pinned commit; do not correct.",
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
    upstreamBlobSha1: "4728723e8b6854115a3b00cbd07c1c9424708635",
    license: "BSD-3-Clause",
  },
];

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function gitBlobSha1(bytes) {
  return createHash("sha1")
    .update(`blob ${bytes.length}\0`)
    .update(bytes)
    .digest("hex");
}

function serialized(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

async function emit(relativePath, value) {
  const absolutePath = resolve(repositoryRoot, relativePath);
  const expected = Buffer.from(serialized(value), "utf8");

  if (checkOnly) {
    const actual = await readFile(absolutePath);
    if (!actual.equals(expected)) {
      throw new Error(`${relativePath} is not reproducible from its inputs`);
    }
    return;
  }

  await writeFile(absolutePath, expected);
}

const artifactLock = {
  lockVersion: "artifact-lock-v1.0",
  artifacts: await Promise.all(
    artifactDefinitions.map(async ([role, path]) => ({
      role,
      path,
      sha256: sha256(await readFile(resolve(repositoryRoot, path))),
    })),
  ),
};

const ontologies = [];
for (const definition of ontologyDefinitions) {
  const { upstreamBlobSha1, license, note, ...identity } = definition;
  const bytes = await readFile(resolve(repositoryRoot, definition.localFilename));
  const actualBlobSha1 = gitBlobSha1(bytes);
  if (actualBlobSha1 !== upstreamBlobSha1) {
    throw new Error(
      `${definition.localFilename} is not upstream Git blob ${upstreamBlobSha1}`,
    );
  }

  const lockEntry = {
    ...identity,
    sha256: sha256(bytes),
    license,
  };
  if (note !== undefined) {
    lockEntry.note = note;
  }
  ontologies.push(lockEntry);
}

await emit("artifact.lock.json", artifactLock);
await emit("ontology.lock.json", {
  lockVersion: "ontology-lock-v1.0",
  ontologies,
});

console.log(
  checkOnly
    ? "Phase 1 lock files reproduce exactly."
    : "Generated artifact.lock.json and ontology.lock.json.",
);
