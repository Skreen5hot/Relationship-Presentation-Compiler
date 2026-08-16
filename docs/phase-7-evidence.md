# Phase 7 Projection, Rendering, Revalidation, and Demo Evidence

Status: accepted for implementation

Evidence date: 2026-08-16

Specification: Relationship Presentation Compiler v1.0, edge-canonical re-cut

Phase 7 implements canonical Stage 07, deterministic presentation rendering,
the shipped subset revalidator, independent HTML5 evidence, the diagnostic
demo, and GitHub Pages deployment. At the Phase 7 exit a conforming invocation
returned the incremental `INTERNAL_COMPILER_ERROR` sentinel; the current core
continues through the complete Phase 8 fourteen-file success result.

## Complete HTML projection

The projector consumes only the Stage 05 narrative and Stage 06 presentation.
Its graph represents the doctype, shell, metadata, document title, named main
landmark, two slides, headings, message, list, items, navigation controls,
initial visibility, stable DOM identifiers, intent tokens, and ordered trace
links. Every document, doctype, element, attribute, and text node has a stable
run identifier. The graph contains no source assertion or fixture IRI.

The fixed projection vocabulary is closed to the normative element, attribute,
role, and navigation mappings. User-perceivable values link to their
`TextContent` node or deterministic navigation region. Intent IRIs map through
the named lookup to `advance` and `back`; those tokens agree across the region,
element intent, and serialized `data-intent` value.

## Renderer and fail-closed subset

Text and double-quoted attribute escaping are centralized in one audited core
module. Fixture values can enter only text and attribute data positions. The
locked stylesheet and navigation script are inserted as exact payloads; the
renderer neither reformats nor interprets them.

Before acceptance, the project-owned revalidator decodes the bytes fatally,
parses only the exact doctype, closed element/attribute sets, double-quoted
attributes, four character references, raw carrier elements, and renderer
whitespace discipline. It re-derives and compares every node and attribute with
Stage 07, checks projected values, intent agreement, visibility, carrier bytes,
unique IDs, resolved heading references, element counts, and non-positive
heading focus targets. It then serializes the derived tree and requires exact
byte equality with the input.

The adversarial matrix rejects comments, alternative quoting, unquoted or
unknown attributes, unknown elements, raw metacharacters, unknown references,
doctype and whitespace deviations, duplicate IDs, dangling references, extra
doctypes, and raw carrier terminators. Accepted hostile labels remain inert and
round-trip as their original visible strings.

## Independent meaning and deployment

JSDOM plus `dom-accessibility-api` independently verify the main name, heading
levels, native buttons, visible labels, initial hidden state, focus movement,
and boundary-safe navigation. Pinned Chromium independently parses both the
direct presentation and sandboxed `iframe[srcdoc]`, verifies native Enter/Space
activation and focus transfer, and observes no request outside the local demo
origin.

`scripts/generate-phase7-site.mjs` derives a static site from the canonical
fixture: diagnostic index/demo, direct presentation, context, and Stages
01–07. The Pages workflow uses exact Node/npm baselines, the locked dependency
graph, the Phase 7 Node gate, and immutable SHAs for the official configure,
upload, and deploy actions. The demo grants only `sandbox="allow-scripts"` to
its embedded presentation and attributes network silence to the locked carrier
contracts, not to sandboxing.
