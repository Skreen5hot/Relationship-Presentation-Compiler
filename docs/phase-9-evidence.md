# Phase 9 Unified Failure-Surface Evidence

Status: accepted for implementation

Evidence date: 2026-08-16

Specification: Relationship Presentation Compiler v1.0, edge-canonical re-cut

Phase 9 closes the compiler's failure surface. One authoritative registry now
contains all 49 Appendix A top-level codes in specification order, with exact
category, Node exit class, and host applicability. Unknown top-level codes fail
closed instead of becoming an extensible runtime namespace.

## Canonical reports and status lines

The core report builder validates the governing code and violation shape before
sorting violations by code, missing-before-present source, source, and message
using UTF-16 code-unit order. It emits at most 100 entries; a larger ordered set
changes both the result and report governing code to
`TOO_MANY_VIOLATIONS`. Reports use the fixed key order, two-space JSON, UTF-8,
LF-only line endings, and one terminal LF. `contractVersion` appears only for
`FIXTURE_CONTRACT_FAILED` and `TOO_MANY_VIOLATIONS`.

Failure results and reports are produced together, preventing divergence among
`CoreResult.code`, its exact `status=error code=<CODE>\n` line, and the report's
top-level code. Successful C8 results now use the shared formatter for the exact
fingerprint-only line. The Node terminal adapter maps success to exit 0 and
stdout, maps every registered failure to its Appendix A exit class and stderr,
and rejects noncanonical result objects. No terminal line contains an output
path.

## Closed ordering and host handoff

The combined-defect matrix proves the required winner at each implemented core
boundary: C0 shape, C1 embedded artifact lock, C2 fixed-role structural order,
C3 JSON-LD trust, C4 request grammar, C5 profile contract, and C6 ordered
fixture violations. C7 and C8 unexpected states retain the closed
`INTERNAL_COMPILER_ERROR` mapping.

Browser supervision failures use the committed core bundle's exported
`buildErrorReport`. The B2 handoff validates exact success and failure status
lines and canonical report bytes before accepting a Worker result. Worker
death, malformed results, CRLF status lines, or noncanonical reports therefore
all collapse to `INTERNAL_COMPILER_ERROR`; timeout remains `BUILD_TIMEOUT`, and
structured-clone failure remains `INVALID_CORE_REQUEST`.

## Reproducible evidence

The Node suite independently enumerates every Appendix A row and checks all 49
reports and exit mappings. It also covers report ordering, the 100-entry cap,
closed-code rejection, terminal stream discipline, and C0–C6 precedence. The
real-Chromium suite requires byte-identical direct-core and supervised-Worker
results for representative failures from every C0–C6 boundary plus host
supervision faults.

The regenerated browser core bundle retains exactly the public exports
`compileCore` and `buildErrorReport`. Its Phase 9 lock values are:

- SHA-256: `b8a55fa5c3978b02f48ed760aecb60bc05bf856e7d4063ec7e09ce7043315890`
- SRI: `sha384-/0zvobooJKGJelAtJmM1JaW5D4jSdnaRmyrMlLtGlBoBuDGElD6+ptdKOfZjsYmv`

GitHub Actions executes the Phase 9 Node gate on Windows and Ubuntu and the
failure-equivalence gate in pinned Chromium. The Pages workflow now requires
both the Phase 8 artifact gate and Phase 9 Node gate before regenerating and
deploying the unchanged canonical fourteen-file success artifact set and
diagnostic index.
