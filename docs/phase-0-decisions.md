# Phase 0 Decision Record

Status: accepted for implementation
Decision date: 2026-08-16
Specification: Relationship Presentation Compiler v1.0, edge-canonical re-cut

This record freezes the decisions required by specification Section 48 before
semantic compiler work begins. Exact versions are repeated in `package.json`
and will be bound to integrity values by `package-lock.json`.

## Decisions

| ID | Decision | Selection | Acceptance evidence |
| --- | --- | --- | --- |
| P0-01 | JSON-LD processor | `jsonld` 9.0.0 expansion and to-RDF slice, release-bundled with three project-owned CPS shims and always called with a project-supplied inert document loader | Node and Chromium execute the same expansion/to-RDF probe; the bundled core probe passes the Phase 0 CPS static scan and network-poison harness |
| P0-02 | Duplicate-member detection | Project-owned byte scanner before `JSON.parse` | Avoids parser differentials and keeps duplicate detection inside the CPS; the scanner and adversarial corpus land in Phase 2 |
| P0-03 | Node publication lock | `fs-native-extensions` 1.5.0 | Cross-process probe proves exclusive acquisition and automatic release after abnormal holder termination on Windows and Ubuntu CI |
| P0-04 | Independent DOM evidence | `jsdom` 30.0.1 plus `dom-accessibility-api` 0.7.1 | Test-only dependencies; neither is reachable from the core graph or browser core bundle |
| P0-05 | Browser bundler | `esbuild` 0.28.2 | Deterministic ESM build settings are fixed by `scripts/build-phase0-browser.mjs`; two clean builds must be byte-identical |
| P0-06 | Real browser evidence | Playwright 1.62.1, Chromium in per-change CI | The worker smoke runs in a real headless engine; release work will expand to the three locked engine baselines |
| P0-07 | CPS source/bundle scan | Acorn 8.18.0 plus project-owned lexical policy | The scan covers the core entry graph and generated ESM, including dependencies; poisoned execution is independent evidence |
| P0-08 | SBOM tool | `@cyclonedx/cyclonedx-npm` 6.0.1 | Locked as build tooling now; deterministic CycloneDX 1.7 generation is implemented in Phase 1 |
| P0-09 | Node/npm baseline | Node 24.19.0 and npm 11.17.0 | CI runs this exact pair. Runtime attestation resolves npm beside `process.execPath` using the fixed Windows/Unix Node-distribution layout and never searches `PATH` |
| P0-10 | UTF-8 BOM handling | Hash raw bytes; strip exactly one leading UTF-8 BOM for text decoding; reject any later BOM as content where the grammar disallows it | This removes the prior ambiguity while preserving byte identity for locks and fingerprints |
| P0-11 | Core boundary | One asynchronous `compileCore(request)` entry point and one pure `buildErrorReport` helper; `CoreResult`/`HostFailureResult` are byte-oriented | The browser embed API owns a dedicated Worker and returns results; it never publishes to a shared mutable target |
| P0-12 | Optional OPFS binding | An embedder that implements the optional OPFS publication profile must use Web Locks around revalidation and replacement | The v1.0 reference Browser host has no shared publication target, so no vacuous lock claim is made |

## JSON-LD boundary

The selected processor is acceptable only through the project adapter and
release bundler. Importing the package root was tested and rejected: it brings
`Date.now`, `Math.random`, `new Function`, `process.nextTick`, and timers into
the graph. The accepted graph imports only the expansion and to-RDF modules.
Three transitive implementation helpers are replaced at bundling with reviewed,
project-owned equivalents: a bounded deterministic `Map` cache, the package's
small `IdentifierIssuer` algorithm, and a fail-closed event handler that removes
the package's otherwise unreachable `console` reporters. The adapter supplies
a loader that recognizes the one approved context token and throws for every other URL. No
default loader is exported or reachable from the compiler API. Both Node and
Browser hosts consume the same packaged core ESM. Phase 0 scans that graph and
poisons network globals; Phase 2 applies the full gates and JSON-LD corpus. A
future processor upgrade is a lock revision and must repeat both gates.

## Duplicate JSON strategy

The scanner will operate on the original `Uint8Array`, after the input-size
gate and fatal UTF-8 decoding. It will maintain string/escape and container
state, decode object keys exactly as JSON does, and reject a repeated decoded
key within the same object before `JSON.parse` is called. Duplicate tracking is
per object; arrays and nested objects have independent scopes. Tests will cover
escaped-equivalent keys, nested scope, surrogate escapes, malformed JSON,
leading BOM policy, and duplicates in every core and host JSON input class.

## Bundle recipe

The core release build is one ESM bundle, browser platform, ECMAScript 2023
target, UTF-8 charset, tree-shaking enabled, no source map, no legal-comment
side file, and no generated timestamp or absolute path. Build output is written
outside the source tree and compared byte-for-byte across two builds before it
can be copied to `browser/` by release packaging.

## Embed API surface

The Phase 4 reference embed API will expose:

```text
createRelationshipPresentationCompiler(options?) -> handle
handle.compile(coreRequest, supervision?) -> Promise<CoreResult | HostFailureResult>
handle.close() -> Promise<void>
```

`coreRequest` contains only the eight named input byte sequences. `compile`
uses a dedicated module Worker, enforces timeout supervision, and returns the
fourteen-file byte map or deterministic failure result. The embedder owns any
download, display, OPFS, or other placement policy.

## Poisoned-harness design

The Node harness executes the bundled core in an isolated worker realm. The
browser harness executes it in a dedicated module Worker. Before importing the
core, each harness replaces configurable banned globals with throwing accessors
and instruments `crypto.subtle.digest`, `TextEncoder`, and `TextDecoder`.
Instrumentation records that digest requests are exactly `SHA-256` and input
decoders are fatal. The static scan and poisoned run must both pass; neither is
treated as a substitute for the other.

## Lock schema policy

The four schemas in `schemas/` use JSON Schema draft 2020-12, reject unknown
members, constrain fixed roles and paths, and distinguish structural validity
from digest verification. They validate populated release locks; placeholders
from the specification examples are intentionally invalid.

## Deferred by design

Phase 0 does not populate release locks, vendor ontology bytes, the SBOM, or the
release browser bundle. Those are Phase 1 deliverables because their hashes and
source commit must describe a concrete release tree. Phase 0 proves the chosen
substrate and freezes the schema those files must satisfy.
