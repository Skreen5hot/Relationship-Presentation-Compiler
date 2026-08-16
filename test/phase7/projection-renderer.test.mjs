import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import { computeAccessibleName, getRole } from "dom-accessibility-api";
import { JSDOM } from "jsdom";

import { CoreFailure } from "../../src/core/core-failure.js";
import { parseJsonBytes } from "../../src/core/json-scan.js";
import { runPhase7 } from "../../src/core/phase7.js";
import { revalidateHtmlSubset } from "../../src/core/revalidate-html.js";
import {
  clone,
  repositoryRoot,
  sourceNode,
} from "../phase5/phase5-fixture.mjs";
import {
  expectedPhase7Artifacts,
  phase7Inputs,
} from "./phase7-fixture.mjs";

const decoder = new TextDecoder("utf-8", { fatal: true });
const encoder = new TextEncoder();

function assertInternalFailure(callback) {
  assert.throws(
    callback,
    (error) =>
      error instanceof CoreFailure && error.code === "INTERNAL_COMPILER_ERROR",
  );
}

function phase7Arguments(result, parsed, overrides = {}) {
  return {
    bytes: result.artifacts["presentation.html"],
    carrierNavigation: parsed.carrierNavigation,
    carrierStyle: parsed.carrierStyle,
    htmlProjection: result.stages.htmlProjection,
    narrative: result.stages.narrative,
    presentation: result.stages.presentation,
    ...overrides,
  };
}

test("canonical Stages 01–07 and presentation HTML match exact golden bytes", async () => {
  const parsed = await phase7Inputs();
  const result = await runPhase7(parsed);
  const expected = await expectedPhase7Artifacts();
  for (const [name, bytes] of Object.entries(expected)) {
    assert.deepEqual(result.artifacts[name], bytes, name);
  }
  assert.equal(
    revalidateHtmlSubset(phase7Arguments(result, parsed)),
    true,
  );
  const second = await runPhase7(parsed);
  assert.deepEqual(second.artifacts, result.artifacts);
});

test("Stage 07 contains complete stable traceability without source assertions", async () => {
  const parsed = await phase7Inputs();
  const result = await runPhase7(parsed);
  const projection = result.stages.htmlProjection;
  const serialized = JSON.stringify(projection);
  assert.equal(serialized.includes("/kg/"), false);

  const ids = [];
  const visit = (node) => {
    ids.push(node["@id"]);
    for (const attribute of node.attribute ?? []) {
      ids.push(attribute["@id"]);
    }
    for (const child of node.hasChild ?? []) {
      visit(child);
    }
  };
  visit(projection);
  assert.equal(ids.every((id) => typeof id === "string"), true);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(serialized.includes("projectsContent"), true);
  assert.equal(serialized.includes("projectsNode"), true);
});

test("late-bound content reaches the Stage 07 graph and standards-parsed HTML", async () => {
  const parsed = await phase7Inputs();
  parsed.source = parseJsonBytes(
    new Uint8Array(
      await readFile(resolve(repositoryRoot, "fixtures/late-bound-example.jsonld")),
    ),
  ).value;
  parsed.request =
    "Create a two-slide presentation explaining Alliance Omega to a general audience.\n";
  const result = await runPhase7(parsed);
  const html = decoder.decode(result.artifacts["presentation.html"]);
  const dom = new JSDOM(html);
  assert.equal(dom.window.document.title, "Alliance Omega presentation");
  assert.equal(
    dom.window.document.querySelector("p").textContent,
    "Mira is associated with Zed.",
  );
  assert.deepEqual(
    [...dom.window.document.querySelectorAll("li")].map((item) => item.textContent),
    ["Mira", "Zed"],
  );
  assert.equal(revalidateHtmlSubset(phase7Arguments(result, parsed)), true);
});

test("hostile labels remain inert in text and attribute contexts", async () => {
  const hostile =
    'A & B <Mira> "quoted" </script><script>alert(1)</script> {participant2} 50% off & more {relationshipTitle}';
  const parsed = await phase7Inputs();
  const source = clone(parsed.source);
  sourceNode(source, "/relationship-42-identifier").label = hostile;
  sourceNode(source, "/alice-name").label = hostile;
  parsed.source = source;
  parsed.request = `Create a two-slide presentation explaining ${hostile} to a general audience.\n`;
  const result = await runPhase7(parsed);
  const html = decoder.decode(result.artifacts["presentation.html"]);

  assert.equal(html.includes("<script>alert(1)</script>"), false);
  assert.equal(html.includes("&lt;/script&gt;&lt;script&gt;alert(1)&lt;/script&gt;"), true);
  const dom = new JSDOM(html);
  assert.equal(dom.window.document.querySelector("h1").textContent, hostile);
  assert.equal(
    dom.window.document.querySelector("main").getAttribute("aria-label"),
    `${hostile} presentation`,
  );
  assert.equal(dom.window.document.scripts.length, 1);
  assert.equal(revalidateHtmlSubset(phase7Arguments(result, parsed)), true);
});

test("the subset revalidator rejects every out-of-grammar adversarial class", async () => {
  const parsed = await phase7Inputs();
  const result = await runPhase7(parsed);
  const html = decoder.decode(result.artifacts["presentation.html"]);
  const mutations = [
    html.replace("  <body>\n", "  <body>\n    <!-- injected -->\n"),
    html.replace('lang="en"', "lang='en'"),
    html.replace('lang="en"', "lang=en"),
    html.replace("        <p>", "        <aside>"),
    html.replace("    <main ", "    <main unknown=\"x\" "),
    html.replace("<title>Relationship", "<title>A & Relationship"),
    html.replace("<title>Relationship", "<title>A&nbsp;Relationship"),
    html.replace("<!DOCTYPE html>", "<!doctype html>"),
    html.replace("  <head>", "   <head>"),
    html.replace('id="slide-2"', 'id="slide-1"'),
    html.replace('aria-labelledby="slide-2-title"', 'aria-labelledby="missing"'),
    html.replace("<!DOCTYPE html>\n", "<!DOCTYPE html>\n<!DOCTYPE html>\n"),
  ];
  for (const mutated of mutations) {
    assertInternalFailure(() =>
      revalidateHtmlSubset(
        phase7Arguments(result, parsed, { bytes: encoder.encode(mutated) }),
      ),
    );
  }

  assertInternalFailure(() =>
    revalidateHtmlSubset(
      phase7Arguments(result, parsed, {
        carrierStyle: `${parsed.carrierStyle}</StYlE`,
      }),
    ),
  );
  assertInternalFailure(() =>
    revalidateHtmlSubset(
      phase7Arguments(result, parsed, {
        carrierNavigation: `${parsed.carrierNavigation}</ScRiPt`,
      }),
    ),
  );
});

test("full-HTML parsing preserves accessibility and locked navigation behavior", async () => {
  const parsed = await phase7Inputs();
  const result = await runPhase7(parsed);
  const dom = new JSDOM(decoder.decode(result.artifacts["presentation.html"]), {
    pretendToBeVisual: true,
    runScripts: "dangerously",
  });
  const document = dom.window.document;
  const main = document.querySelector("main");
  const slides = [...document.querySelectorAll("section")];
  const headings = [...document.querySelectorAll("h1, h2")];
  const buttons = [...document.querySelectorAll("button")];

  assert.equal(getRole(main), "main");
  assert.equal(computeAccessibleName(main), "Relationship 42 presentation");
  assert.deepEqual(headings.map((heading) => heading.tagName), ["H1", "H2"]);
  assert.deepEqual(buttons.map((button) => getRole(button)), ["button", "button"]);
  assert.deepEqual(buttons.map((button) => computeAccessibleName(button)), [
    "Next",
    "Previous",
  ]);
  assert.equal(slides[0].hasAttribute("hidden"), false);
  assert.equal(slides[1].hasAttribute("hidden"), true);

  buttons[0].click();
  assert.equal(slides[0].hasAttribute("hidden"), true);
  assert.equal(slides[1].hasAttribute("hidden"), false);
  assert.equal(document.activeElement, headings[1]);
  buttons[0].click();
  assert.equal(slides[1].hasAttribute("hidden"), false);
  buttons[1].click();
  assert.equal(slides[0].hasAttribute("hidden"), false);
  assert.equal(document.activeElement, headings[0]);
  buttons[1].click();
  assert.equal(slides[0].hasAttribute("hidden"), false);
  dom.window.close();
});

test("the diagnostic demo is sandboxed, escaped, local, and deterministic", async () => {
  const parsed = await phase7Inputs();
  const result = await runPhase7(parsed);
  const demo = decoder.decode(result.artifacts["demo.html"]);
  const dom = new JSDOM(demo);
  const document = dom.window.document;
  const iframe = document.querySelector("iframe");

  assert.equal(iframe.getAttribute("sandbox"), "allow-scripts");
  assert.equal(iframe.hasAttribute("src"), false);
  assert.equal(
    iframe.getAttribute("srcdoc"),
    decoder.decode(result.artifacts["presentation.html"]),
  );
  assert.equal(document.querySelectorAll("script").length, 0);
  assert.equal(document.querySelectorAll("link").length, 0);
  assert.equal(demo.includes("https://"), false);
  assert.deepEqual(
    [...document.querySelectorAll("section a")].map((link) =>
      link.getAttribute("href")
    ),
    [
      "poc.context.jsonld",
      "01-request.jsonld",
      "02-resolution.jsonld",
      "03-contract-validation.jsonld",
      "04-content-manifest.jsonld",
      "05-narrative.jsonld",
      "06-presentation.jsonld",
      "07-html-projection.jsonld",
      "presentation.html",
    ],
  );
});

test("the generated Pages directory is an exact projection of Phase 7 outputs", async () => {
  const parsed = await phase7Inputs();
  const result = await runPhase7(parsed);
  for (const [name, bytes] of Object.entries(result.artifacts)) {
    assert.deepEqual(
      new Uint8Array(await readFile(resolve(repositoryRoot, "site", name))),
      bytes,
      name,
    );
  }
  assert.deepEqual(
    new Uint8Array(await readFile(resolve(repositoryRoot, "site/index.html"))),
    result.artifacts["demo.html"],
  );
});
