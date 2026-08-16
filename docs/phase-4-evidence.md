# Phase 4 Browser Host and Bundle Evidence

Status: accepted for implementation

Evidence date: 2026-08-16

Specification: Relationship Presentation Compiler v1.0, edge-canonical re-cut

Phase 4 materializes the deterministic browser core bundle, its Browser-host
lock, and the supervised reference embed API. It first proved the browser
substrate against the C0–C2 shell; the same locked bundle now carries C3–C8 and
the complete Phase 8 result while retaining the Phase 4 host contract.

## Locked core bundle

`scripts/build-phase4-browser.mjs` builds
`browser/relationship-presentation-core.bundle.mjs` twice with the locked
esbuild 0.28.2 recipe and requires byte identity. It injects the five
`artifact.lock.json` digests and scans every project-owned core source and the
emitted bundle against the CPS. The only permitted dependency inputs are the
locked JSON-LD processor, canonicalizer helper, and project-owned fail-closed
shims selected in Phase 0.

The committed bundle exports exactly `compileCore` and `buildErrorReport`. Its
lock evidence is:

- SHA-256: `b8a55fa5c3978b02f48ed760aecb60bc05bf856e7d4063ec7e09ce7043315890`
- SRI: `sha384-/0zvobooJKGJelAtJmM1JaW5D4jSdnaRmyrMlLtGlBoBuDGElD6+ptdKOfZjsYmv`

`browser-host.lock.json` also binds the esbuild package integrity and the exact
browser versions pinned by Playwright 1.62.1: Chromium 151.0.7922.34, Firefox
153.0, and WebKit 26.5. The Chromium version is executed per change. Firefox
and WebKit are pinned release targets; full execution against all three remains
the Phase 11 release claim and is not asserted by Phase 4.

## Reference host

`createRelationshipPresentationCompiler()` returns a handle with `compile` and
`close`. Every invocation receives its own dedicated module Worker. The host
uses a 40-second timer by default, terminates the Worker on settlement, returns
`BUILD_TIMEOUT` on expiry, and maps Worker errors or malformed results to
`INTERNAL_COMPILER_ERROR`. A structured-clone failure at the boundary maps to
`INVALID_CORE_REQUEST`. Host failures use the core bundle's exported
`buildErrorReport`, so their status line and report bytes share the closed
deterministic path.

The handle owns no publication target, storage, or lock. Successful results are
returned to the embedder unchanged. Closing the handle terminates active work
and prevents later compilation.

## Equivalence and supervision evidence

The real-Chromium test serves the committed modules over HTTP and compares the
reference host with direct Node execution of the same committed core bundle.
The smoke corpus covers the canonical fixture request, a mutated locked carrier,
and an invalid CoreRequest value. Phase 5 extends this evidence with request,
profile, context, contract, and contamination cases. Phases 6–7 add canonical,
late-bound, hostile-placeholder, projection, carrier, and revalidation paths.
The canonical request now passes C3–C8 and returns the complete fourteen-file
Phase 8 success result. Phase 9 additionally closes status-line and report
validation at the B2 handoff. Equivalence asserts both fingerprints, the status
line, the filename set, and every artifact byte.

Separate Worker fixtures prove timeout termination, thrown-worker failure,
malformed-result rejection, structured-clone rejection, active-work shutdown,
and the absence of `MEMORY_LIMIT_EXCEEDED` from the Browser host.

## Packaging boundary

Browsers do not expose an integrity option on the `Worker` constructor or on a
Worker's static module imports. The lock publishes the SRI value for embedders
to enforce wherever their loading mechanism supports it; the reference HTTP
harness verifies the exact locked bytes before execution through the build
gate.

`SOURCE_COMMIT` is now consumed by the Phase 8 core manifest. Development builds
inject the explicit forty-zero sentinel pinned by the Phase 8 goldens. Phase 11
remains the truthful packaging point for injecting the final release commit and
regenerating the goldens, bundle, and bundle lock as release evidence.
