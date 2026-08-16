# Relationship Presentation Compiler

A deterministic offline compiler that transforms one narrow BFO/CCO-aligned
source pattern into a two-slide HTML presentation through inspectable JSON-LD
stages.

## Status

Phases 0 through 5 establish the Edge-Canonical substrate, immutable release
inputs, core boundary, both host shells, recoverable Node publication, and the
closed-world semantic front half:
locked tools and schemas, a CPS-scanned JSON-LD slice, normative static inputs,
pinned ontology evidence, a reproducible CycloneDX 1.7 SBOM, the C0–C6 core,
OS-locked journaled publication, and a deterministic SRI-locked browser bundle
executed through a supervised dedicated Worker. Request normalization, exact
resolution, profile equality, contract validation, and Stages 01–03 are now
implemented. Narrative, projection, rendering, manifests, and the GitHub Pages
demo are intentionally added later.

The normative design is
[`relationship-presentation-spec-v1_0.md`](relationship-presentation-spec-v1_0.md).
Phase 0 choices and rejected alternatives are in
[`docs/phase-0-decisions.md`](docs/phase-0-decisions.md). Phase 1 provenance,
hashes, and deferrals are recorded in
[`docs/phase-1-evidence.md`](docs/phase-1-evidence.md). Phase 2 boundary and CPS
evidence is in [`docs/phase-2-evidence.md`](docs/phase-2-evidence.md). Phase 3
publication evidence is in
[`docs/phase-3-evidence.md`](docs/phase-3-evidence.md). Phase 4 browser-host
evidence is in [`docs/phase-4-evidence.md`](docs/phase-4-evidence.md). Phase 5
semantic evidence is in [`docs/phase-5-evidence.md`](docs/phase-5-evidence.md).

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

## Phase 3 verification

Run the Node publication-safety and crash-recovery matrix:

```text
npm run test:phase3
```

The suite exercises fresh publication, existing-output rejection, exact v1.0
ownership recognition, prior-lineage rejection, output-path safety, immediate
cross-process lock exclusion, staged replacement, recovery after process death
at every journal boundary, corrupt-journal fail-closed behavior, and detached
failure-report placement. It runs on both Windows and Ubuntu in CI.

The end-to-end CLI remains intentionally unavailable: Phase 3 proves placement
of a supplied fourteen-file byte map, while later semantic phases produce and
verify the real canonical artifact set.

## Phase 4 verification

Reproduce the committed browser bundle and run the host gates:

```text
npm run test:phase4:node
npm run test:phase4:browser
```

The Node gate rebuilds the single ESM core twice, verifies byte identity against
the committed bundle, checks its CPS surface, and validates SHA-256, SRI,
bundler, and engine pins in `browser-host.lock.json`. The browser gate uses the
pinned real Chromium engine to exercise the reference Worker host, 40-second
default supervision contract, timeout and abnormal-worker mappings, explicit
shutdown, and Node-equivalent core results.

## Phase 5 verification

Run the request, JSON-LD trust, profile, resolution, closed-world contract, and
Stage 01–03 gates:

```text
npm run test:phase5:node
npm run test:phase5:browser
```

The Node suite derives the first three golden artifacts from the canonical
fixture, validates a late-bound fixture, exercises inert metamorphic changes,
and covers the Phase 5 negative matrix. The browser suite sends representative
C3–C6 cases through the supervised Worker host in pinned Chromium and requires
byte-identical status lines and error reports. A conforming fixture still ends
with `INTERNAL_COMPILER_ERROR` at the explicit Stage 04 boundary until Phase 6
adds the next semantic stages.
