import { fail } from "./core-failure.js";
import { escapeHtmlAttribute, escapeHtmlText } from "./escape-html.js";

const PHASE7_ARTIFACTS = [
  "poc.context.jsonld",
  "01-request.jsonld",
  "02-resolution.jsonld",
  "03-contract-validation.jsonld",
  "04-content-manifest.jsonld",
  "05-narrative.jsonld",
  "06-presentation.jsonld",
  "07-html-projection.jsonld",
  "presentation.html",
];

function findText(narrative, id) {
  const content = [
    ...(narrative.hasDocumentContent ?? []),
    ...(narrative.hasUnit ?? []).flatMap((unit) => unit.hasContent ?? []),
  ].find((node) => node["@id"] === id);
  if (typeof content?.textValue !== "string") {
    fail("INTERNAL_COMPILER_ERROR");
  }
  return content.textValue;
}

export function buildDemoHtml(narrative, presentationBytes) {
  let presentation;
  try {
    presentation = new TextDecoder("utf-8", { fatal: true }).decode(
      presentationBytes,
    );
  } catch {
    fail("INTERNAL_COMPILER_ERROR");
  }
  const documentTitle = findText(narrative, "run:document-title-content");
  const message = findText(narrative, "run:primary-message-content-1");
  const artifactItems = PHASE7_ARTIFACTS.map(
    (name) =>
      `          <li><a href="${escapeHtmlAttribute(
        name,
      )}"><code>${escapeHtmlText(name)}</code></a></li>`,
  ).join("\n");
  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Relationship Presentation Compiler — Phase 7 demo</title>
    <style>
      :root { color-scheme: light; font-family: system-ui, sans-serif; color: #172033; background: #eef2f7; }
      * { box-sizing: border-box; }
      body { margin: 0; }
      main { width: min(100% - 2rem, 80rem); margin: 0 auto; padding: 2rem 0 4rem; }
      header { margin-bottom: 1.5rem; }
      .eyebrow { color: #1769aa; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
      h1, h2 { color: #103f72; }
      h1 { margin-bottom: .5rem; }
      .summary { max-width: 70ch; font-size: 1.1rem; line-height: 1.55; }
      iframe { width: 100%; aspect-ratio: 16 / 9; border: 1px solid #cad3e1; border-radius: 1rem; background: white; box-shadow: 0 1rem 3rem rgb(23 32 51 / 14%); }
      section { margin-top: 2rem; padding: 1.25rem 1.5rem; border: 1px solid #cad3e1; border-radius: .75rem; background: white; }
      code { overflow-wrap: anywhere; }
      a { color: #075b9d; }
      a:focus-visible { outline: .2rem solid #f6a800; outline-offset: .2rem; }
    </style>
  </head>
  <body>
    <main>
      <header>
        <p class="eyebrow">Edge-canonical compiler · Phase 7</p>
        <h1>${escapeHtmlText(documentTitle)}</h1>
        <p class="summary">${escapeHtmlText(message)} This diagnostic viewer presents the deterministic Stage 07 HTML projection. Its embedded presentation is network-silent because its locked carriers make no requests.</p>
        <p><a href="presentation.html">Open the generated presentation directly</a></p>
      </header>
      <iframe title="Generated presentation: ${escapeHtmlAttribute(
        documentTitle,
      )}" sandbox="allow-scripts" srcdoc="${escapeHtmlAttribute(
        presentation,
      )}"></iframe>
      <section aria-labelledby="artifact-heading">
        <h2 id="artifact-heading">Phase 7 artifacts</h2>
        <ol>
${artifactItems}
        </ol>
      </section>
    </main>
  </body>
</html>
`;
  return new TextEncoder().encode(html);
}
