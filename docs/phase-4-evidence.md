# Phase 4 Browser Host and Bundle Evidence

Status: accepted for implementation

Evidence date: 2026-08-16

Specification: Relationship Presentation Compiler v1.0, edge-canonical re-cut

Phase 4 materializes the deterministic browser core bundle, its Browser-host
lock, and the supervised reference embed API. It proves the browser substrate
against the C0–C2 core shell; semantic success artifacts arrive in Phases 5–8.

## Locked core bundle

`scripts/build-phase4-browser.mjs` builds
`browser/relationship-presentation-core.bundle.mjs` twice with the locked
esbuild 0.28.2 recipe and requires byte identity. It injects the five
`artifact.lock.json` digests, scans every core source and the emitted bundle
against the CPS, and rejects any module outside `src/core/`.

The committed bundle exports exactly `compileCore` and `buildErrorReport`. Its
lock evidence is:

- SHA-256: `9f525c4ce9b5f5a937d22a3b0d2a76c5eaec0668ea118eca69eedd19e129084f`
- SRI: `sha384-PCWQfhnEBf0jV806+gOscC3clZoj5c7F+l77cs7e+9rEOC/ccVzrCUCEUM1CM/N+`

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
The smoke corpus covers the canonical structural request, a mutated locked
carrier, and an invalid CoreRequest value. Phase 2's explicit scaffold means
the structurally valid canonical request still returns
`INTERNAL_COMPILER_ERROR` until C3–C8 exist; Phase 4 asserts identical bytes and
codes, not semantic success that has not been implemented.

Separate Worker fixtures prove timeout termination, thrown-worker failure,
malformed-result rejection, structured-clone rejection, active-work shutdown,
and the absence of `MEMORY_LIMIT_EXCEEDED` from the Browser host.

## Packaging boundary

Browsers do not expose an integrity option on the `Worker` constructor or on a
Worker's static module imports. The lock publishes the SRI value for embedders
to enforce wherever their loading mechanism supports it; the reference HTTP
harness verifies the exact locked bytes before execution through the build
gate.

`SOURCE_COMMIT` is not yet consumed by the C0–C2 shell. Phase 11 remains the
truthful packaging point for injecting the final release commit and regenerating
the bundle lock after manifest construction makes that constant observable.
