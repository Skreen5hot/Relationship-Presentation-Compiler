import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";
import { JSDOM } from "jsdom";
import jsonld from "jsonld";

const repositoryRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../..",
);

const readBytes = (path) => readFile(resolve(repositoryRoot, path));
const readJson = async (path) => JSON.parse(await readFile(resolve(repositoryRoot, path), "utf8"));
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

function assertLockedTextBytes(path, bytes) {
  assert.notDeepEqual(
    bytes.subarray(0, 3),
    Buffer.from([0xef, 0xbb, 0xbf]),
    `${path} must not begin with a UTF-8 BOM`,
  );
  assert.equal(bytes.at(-1), 0x0a, `${path} must end in LF`);
  assert.equal(bytes.includes(0x0d), false, `${path} must use LF, not CRLF`);
}

test("the five static artifacts match the fixed lock schema and raw hashes", async () => {
  const lock = await readJson("artifact.lock.json");
  const schema = await readJson("schemas/artifact-lock.schema.json");
  const validate = new Ajv2020({ strict: true }).compile(schema);

  assert.equal(validate(lock), true, JSON.stringify(validate.errors));
  assert.deepEqual(
    lock.artifacts.map(({ role, path }) => [role, path]),
    [
      ["context", "contexts/poc.context.jsonld"],
      ["contract", "contract/person-association-contract.jsonld"],
      ["supported-profile", "profiles/two-slide-explainer.jsonld"],
      ["carrier-style", "carrier/presentation.css"],
      ["carrier-navigation", "carrier/navigation.js"],
    ],
  );

  for (const artifact of lock.artifacts) {
    const bytes = await readBytes(artifact.path);
    assertLockedTextBytes(artifact.path, bytes);
    assert.equal(sha256(bytes), artifact.sha256);
  }
});

test("context, contract, and profile preserve the v1.0 normative semantics", async () => {
  const contextDocument = await readJson("contexts/poc.context.jsonld");
  const contract = await readJson("contract/person-association-contract.jsonld");
  const profile = await readJson("profiles/two-slide-explainer.jsonld");
  const context = contextDocument["@context"];

  assert.equal(context["@version"], 1.1);
  assert.deepEqual(context.rp, {
    "@id": "https://example.org/relationship-presentation-poc/contract/",
    "@prefix": true,
  });
  assert.deepEqual(context.specificallyDependsOn, {
    "@id": "obo:BFO_0000195",
    "@type": "@id",
  });
  assert.deepEqual(context.hasSlide, {
    "@id": "projection:hasSlide",
    "@container": "@list",
    "@type": "@id",
  });
  assert.deepEqual(context.hiddenInitially, {
    "@id": "html:hiddenInitially",
    "@type": "xsd:boolean",
  });

  assert.deepEqual(contract, {
    "@context": "../contexts/poc.context.jsonld",
    "@id": "rp:PersonAssociation",
    "@type": "owl:Class",
    subClassOf: "obo:BFO_0000145",
    label: "Person Association",
    definition:
      "A Person Association is a relational quality that specifically depends on exactly two distinct Persons and for which neither Person occupies a distinguished directional participant role.",
    comment:
      "This local contract class constrains the source pattern eligible for the supported two-slide explainer profile. It does not introduce a new object property and does not claim that all BFO relational qualities are person associations.",
    example:
      "An association-quality instance that specifically depends on Alice and Bob, where neither participant is directionally privileged by the source fixture.",
  });

  assert.deepEqual(profile, {
    "@context": "../contexts/poc.context.jsonld",
    "@id": "profile:two-slide-explainer-v3",
    "@type": "projection:PresentationProfile",
    "projection:slideCount": 2,
    "projection:participantOrder": "utf16-code-unit-ascending-label",
    "projection:eligibleSourceClass": { "@id": "rp:PersonAssociation" },
    "projection:overviewRule": {
      "@id": "rule:person-association-overview-v1-0",
    },
    "projection:associationTemplate":
      "{participant1} is associated with {participant2}.",
    "projection:documentTitleTemplate": "{relationshipTitle} presentation",
    "projection:participantSlideTitle": "Participants",
    "projection:advanceLabel": "Next",
    "projection:backLabel": "Previous",
    "projection:outputFormat": { "@id": "projection:HTML" },
  });
  assert.equal("projection:aspectRatio" in profile, false);

  const approvedContextUrl =
    "https://example.org/repository/contexts/poc.context.jsonld";
  const loadedUrls = [];
  const documentLoader = async (url) => {
    loadedUrls.push(url);
    if (url !== approvedContextUrl) {
      throw new Error(`Unexpected JSON-LD document request: ${url}`);
    }
    return { contextUrl: null, documentUrl: url, document: contextDocument };
  };

  const expandedContract = await jsonld.expand(contract, {
    base: "https://example.org/repository/contract/person-association-contract.jsonld",
    documentLoader,
  });
  const expandedProfile = await jsonld.expand(profile, {
    base: "https://example.org/repository/profiles/two-slide-explainer.jsonld",
    documentLoader,
  });
  assert.equal(
    expandedContract[0]["@id"],
    "https://example.org/relationship-presentation-poc/contract/PersonAssociation",
  );
  assert.equal(
    expandedProfile[0]["@id"],
    "https://example.org/relationship-presentation-poc/profile/two-slide-explainer-v3",
  );
  assert.deepEqual(loadedUrls, [approvedContextUrl, approvedContextUrl]);
});

test("the fixed carrier is inert, accessible, and boundary-safe", async () => {
  const cssBytes = await readBytes("carrier/presentation.css");
  const navigationBytes = await readBytes("carrier/navigation.js");
  const css = cssBytes.toString("utf8");
  const navigation = navigationBytes.toString("utf8");

  assert.doesNotMatch(css, /<\/style/i);
  assert.doesNotMatch(css, /@import|url\s*\(/i);
  assert.match(css, /aspect-ratio:\s*16\s*\/\s*9/);
  assert.match(css, /button:focus-visible/);
  assert.match(css, /h1:focus-visible/);
  assert.match(css, /h2:focus-visible/);
  assert.match(css, /section\[hidden\]\s*{[^}]*display:\s*none/s);

  assert.doesNotMatch(navigation, /<\/script/i);
  assert.equal(
    navigation.match(/\.addEventListener\s*\(\s*"click"/g)?.length,
    1,
  );
  assert.doesNotMatch(
    navigation,
    /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|eval|Function|setTimeout|setInterval|localStorage|sessionStorage|indexedDB)\b/,
  );
  assert.doesNotMatch(
    navigation,
    /createElement|insertAdjacentHTML|innerHTML|outerHTML|style\s*\./,
  );
  assert.equal(navigation.match(/\blet slideIndex\b/g)?.length, 1);
  assert.equal(navigation.match(/toggleAttribute\(\s*"hidden"/g)?.length, 1);

  const dom = new JSDOM(
    `<!DOCTYPE html><html><body><main>
      <section><h1 tabindex="-1">Overview</h1><p>First slide.</p><button data-intent="advance">Next</button></section>
      <section hidden><h2 tabindex="-1">Participants</h2><ul><li>A</li><li>B</li></ul><button data-intent="back">Previous</button><button data-intent="advance">Next</button><button data-intent="other">Other</button></section>
    </main><script>${navigation}</script></body></html>`,
    { runScripts: "dangerously" },
  );
  const { document } = dom.window;
  const slides = [...document.querySelectorAll("main > section")];
  const [advance] = document.querySelectorAll('[data-intent="advance"]');

  advance.click();
  assert.equal(slides[0].hasAttribute("hidden"), true);
  assert.equal(slides[1].hasAttribute("hidden"), false);
  assert.equal(document.activeElement, slides[1].querySelector("h2"));

  slides[1].querySelector('[data-intent="other"]').click();
  slides[1].querySelector('[data-intent="advance"]').click();
  assert.equal(slides[1].hasAttribute("hidden"), false);

  slides[1].querySelector('[data-intent="back"]').click();
  assert.equal(slides[0].hasAttribute("hidden"), false);
  assert.equal(slides[1].hasAttribute("hidden"), true);
  assert.equal(document.activeElement, slides[0].querySelector("h1"));

  slides[1].querySelector('[data-intent="back"]').click();
  assert.equal(slides[0].hasAttribute("hidden"), false);
  dom.window.close();
});
