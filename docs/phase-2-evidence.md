# Phase 2 Core-Skeleton Evidence

Status: accepted for implementation

Evidence date: 2026-08-16

Specification: Relationship Presentation Compiler v1.0, edge-canonical re-cut

Phase 2 implements the C0–C2 core boundary and Common Platform Surface gates
named in Section 48. It does not claim the later semantic, projection,
rendering, manifest, or publication phases.

## Core boundary

`compileCore` accepts one plain object containing exactly the eight named
`Uint8Array` roles from Section 6.3. It rejects missing, unknown, accessor, and
non-byte members as `INVALID_CORE_REQUEST`. All eight arrays are copied
synchronously before the first asynchronous operation so later caller mutation
cannot alter the invocation snapshot.

The bundle exports exactly the compilation entry point and pure
`buildErrorReport` helper. Error status lines are LF-terminated and report bytes
use fixed member order, two-space JSON indentation, UTF-8 without BOM, LF, and
a terminal LF. Violation ordering and the 100-item truncation rule are already
implemented even though fixture-contract violations arrive in later phases.

## C1 embedded artifact enforcement

`scripts/build-phase2-core.mjs` reads `artifact.lock.json` and injects the five
digests in the normative order: context, contract, canonical profile, carrier
style, carrier navigation. `compileCore` hashes the copied raw bytes with only
`crypto.subtle.digest("SHA-256", …)` and returns
`ARTIFACT_LOCK_MISMATCH` on the first mismatch. Mutation cases cover every
role under Node and Chromium.

The Phase 2 output is an ignored development bundle. Phase 4 subsequently
created the committed browser-host bundle and its lock; Phase 11 will inject
the release commit and reproduce the final packaging.

## C2 structural validation

Inputs are checked in the fixed order context, contract, canonical profile,
user profile, source, request. For each input the byte limit precedes fatal
UTF-8 decoding. The accepted BOM policy from Phase 0 strips exactly one leading
UTF-8 BOM after raw-byte hashing.

The project-owned JSON scanner is iterative rather than recursive. It decodes
object keys with JSON semantics, catches escaped-equivalent and surrogate-pair
duplicates per object scope, validates token structure, and bounds its own
container stack at depth 64. User-profile and source tests cover duplicate
members, nested scopes, invalid UTF-8, exact and over-limit sizes, BOM handling,
and depth 64/65.

At the Phase 2 exit, structurally conforming inputs returned deterministic
`INTERNAL_COMPILER_ERROR` because C3–C8 were absent. The current core carries
the canonical fixture through C3–C6 and Stages 01–06 before returning the same
explicit boundary sentinel for the still-absent Stage 07 onward. The sentinel
remains an incremental-build behavior, not a v1.0 release success claim.

## CPS enforcement

The build scans every source module in the Phase 2 graph and the emitted bundle
with the Acorn-based closed policy. Negative seeds cover Node built-ins,
process/Buffer, DOM and network capabilities, time and randomness, locale APIs,
storage, timers, dynamic code/import, WebAssembly, and worker creation.

The binding harness executes its functional corpus, now including the Phase 6
JSON-LD, closed-world, and narrative path, in a Node Worker and a real Chromium
Worker with prohibited globals replaced by throwing traps.
`TextDecoder`, `TextEncoder`, and WebCrypto are instrumented. Host WebCrypto
internals are calibrated before observations are cleared, so evidence records
only the core calls. The canonical structural case observes exactly five
`"SHA-256"` requests and six fatal UTF-8 decoders. Every case produces
byte-identical error reports, codes, and status lines across hosts.
