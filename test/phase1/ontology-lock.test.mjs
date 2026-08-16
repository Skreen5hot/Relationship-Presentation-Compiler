import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";

const repositoryRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const upstreamBlobs = new Map([
  ["vendor/ontology/bfo-core.ttl", "768c070a9075613f157be0811028ade83d318891"],
  ["vendor/ontology/AgentOntology.ttl", "0a24b3fd3b04d3b5dd456ef74216225b02a44054"],
  [
    "vendor/ontology/InformationEntityOntology.ttl",
    "4728723e8b6854115a3b00cbd07c1c9424708635",
  ],
]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const gitBlobSha1 = (bytes) =>
  createHash("sha1")
    .update(`blob ${bytes.length}\0`)
    .update(bytes)
    .digest("hex");

test("ontology.lock.json binds exact pinned upstream bytes", async () => {
  const lock = JSON.parse(
    await readFile(resolve(repositoryRoot, "ontology.lock.json"), "utf8"),
  );
  const schema = JSON.parse(
    await readFile(
      resolve(repositoryRoot, "schemas/ontology-lock.schema.json"),
      "utf8",
    ),
  );
  const validate = new Ajv2020({ strict: true }).compile(schema);
  assert.equal(validate(lock), true, JSON.stringify(validate.errors));

  for (const ontology of lock.ontologies) {
    const bytes = await readFile(resolve(repositoryRoot, ontology.localFilename));
    assert.equal(bytes.at(-1), 0x0a);
    assert.notDeepEqual(bytes.subarray(0, 3), Buffer.from([0xef, 0xbb, 0xbf]));
    assert.equal(sha256(bytes), ontology.sha256);
    assert.equal(gitBlobSha1(bytes), upstreamBlobs.get(ontology.localFilename));

    const text = bytes.toString("utf8");
    assert.match(text, new RegExp(`<${ontology.ontologyIri.replaceAll(".", "\\.")}>`));
    assert.match(text, new RegExp(`owl:versionIRI <${ontology.versionIri.replaceAll(".", "\\.")}>`));
  }

  assert.equal(
    lock.ontologies[0].note,
    "Upstream owl:versionIRI genuinely ends in bfo-core.ttl at this release. Verified against the pinned commit; do not correct.",
  );
  assert.equal(
    lock.ontologies[1].note,
    "Upstream owl:versionIRI is dated 2024-11-05 despite the v2.0-2024-11-06 tag. Verified against the pinned commit; do not correct.",
  );
});

test("vendored ontology license evidence is preserved", async () => {
  const bfo = await readFile(
    resolve(repositoryRoot, "vendor/ontology/bfo-core.ttl"),
    "utf8",
  );
  const agent = await readFile(
    resolve(repositoryRoot, "vendor/ontology/AgentOntology.ttl"),
    "utf8",
  );
  const informationEntity = await readFile(
    resolve(repositoryRoot, "vendor/ontology/InformationEntityOntology.ttl"),
    "utf8",
  );
  const ccoLicense = await readFile(
    resolve(repositoryRoot, "vendor/ontology/licenses/CCO-BSD-3-Clause.txt"),
  );

  assert.match(
    bfo,
    /dc:license <https:\/\/creativecommons\.org\/licenses\/by\/4\.0\/>/,
  );
  assert.match(agent, /dcterms:license "BSD 3-Clause:/);
  assert.match(informationEntity, /dcterms:license "BSD 3-Clause:/);
  assert.equal(
    gitBlobSha1(ccoLicense),
    "26826d5784bbeda05e196f4c7538b30b85544b92",
  );
});
