# Relationship Presentation Compiler

A deterministic offline compiler that transforms one narrow BFO/CCO-aligned
source pattern into a two-slide HTML presentation through inspectable JSON-LD
stages.

## Status

Phases 0 through 2 establish the Edge-Canonical substrate, immutable release
inputs, and core boundary: locked tool selections, strict lock schemas, a
CPS-scanned JSON-LD slice, native advisory-lock evidence, the normative
context/contract/profile, inert carrier payloads, pinned ontology evidence, a
reproducible CycloneDX 1.7 SBOM, and the C0–C2 compiler shell with poisoned-host
equivalence. The semantic compiler stages and GitHub Pages demo are
intentionally added in later phases.

The normative design is
[`relationship-presentation-spec-v1_0.md`](relationship-presentation-spec-v1_0.md).
Phase 0 choices and rejected alternatives are in
[`docs/phase-0-decisions.md`](docs/phase-0-decisions.md). Phase 1 provenance,
hashes, and deferrals are recorded in
[`docs/phase-1-evidence.md`](docs/phase-1-evidence.md). Phase 2 boundary and CPS
evidence is in [`docs/phase-2-evidence.md`](docs/phase-2-evidence.md).

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

## Phase 1 verification

Generate or verify all Phase 1 release evidence with the exact runtime:

```text
npm run generate:phase1
npm run test:phase1
```

`generate:phase1` hashes the five locked artifacts, verifies the three ontology
files against their pinned upstream Git blobs, and emits a timestamp-free,
serial-free CycloneDX 1.7 SBOM from the complete `package-lock.json` graph.
`test:phase1` regenerates all three outputs in check mode before running schema,
provenance, semantic-content, carrier-navigation, and SBOM-coverage tests.

## Phase 2 verification

Build and verify the C0–C2 core skeleton with the exact runtime:

```text
npm run test:phase2:node
npm run test:phase2:browser
```

The build injects the five `artifact.lock.json` digests, emits a reproducible
browser-compatible ESM bundle, and scans its complete module graph against the
closed Common Platform Surface. The Node and real-Chromium suites execute the
same hostile corpus with prohibited globals poisoned and SHA-256/TextDecoder
usage instrumented.
