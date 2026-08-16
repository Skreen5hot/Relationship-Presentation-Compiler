# Relationship Presentation Compiler

A deterministic offline compiler that transforms one narrow BFO/CCO-aligned
source pattern into a two-slide HTML presentation through inspectable JSON-LD
stages.

## Status

Phase 0 establishes the Edge-Canonical substrate: locked tool selections,
strict lock schemas, a reproducible browser bundle recipe, a CPS-scanned
JSON-LD expansion/to-RDF slice, native advisory-lock evidence, and Node/browser
smoke equivalence. It does not yet implement the compiler stages or publish a
GitHub Pages site.

The normative design is
[`relationship-presentation-spec-v1_0.md`](relationship-presentation-spec-v1_0.md).
Phase 0 choices and rejected alternatives are in
[`docs/phase-0-decisions.md`](docs/phase-0-decisions.md).

## Phase 0 verification

Use Node 24.19.0 and npm 11.17.0:

```text
npm ci
npm run test:phase0:node
node node_modules/playwright/cli.js install --only-shell chromium
npm run test:phase0:browser
```

CI runs the Node gates on Windows and Ubuntu and the Worker gate in pinned
Chromium. GitHub Pages deployment through GitHub Actions is intentionally added
with the demo/publication phase, after canonical output exists.
