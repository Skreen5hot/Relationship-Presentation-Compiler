# Phase 10 Completed Conformance-Suite Evidence

Status: accepted for implementation

Evidence date: 2026-08-16

Specification: Relationship Presentation Compiler v1.0, edge-canonical re-cut

Phase 10 completes the Section 45 functional corpus and makes the Node host an
end-to-end implementation. It does not claim the Phase 11 release envelope or
the full three-engine release matrix.

## Development runtime lock and Node host

`runtime.lock.json` is generated deterministically from committed evidence. It
binds Node 24.19.0, npm 11.17.0, compiler 1.0.0, the three selected dependency
records, and these SHA-256 values:

| Evidence | SHA-256 |
| --- | --- |
| `package-lock.json` | `f17ca9b9f5d9e8336528413e8f779da86e3d7c6d608e5af7d48a471e3f26ec97` |
| `artifact.lock.json` | `e07f9556b1259d04360c4cdf5f73924763f4b8058c69dd6340c2e107eb8b833e` |
| `ontology.lock.json` | `89bfd3b5db441bec8e5107f9d7c2b395a238bdd7a93fad2856e490b782ffed1b` |
| `sbom.json` | `1969dc896254f17ef191aeea728d321b6055587dab820d951efcc01623b52659` |

The lock intentionally carries the forty-zero development `sourceCommit` used
by the Phase 8 goldens and core bundle. Phase 11 injects the actual release
commit and regenerates the affected release evidence.

The Node entry point now implements the closed CLI and the complete host phase
sequence:

- N1 parses only the documented options, defaults, informational modes, and
  duplicate-option failures.
- N2 applies the fixed runtime, package, artifact, ontology, and SBOM lock order,
  rejects duplicate JSON members, and verifies the installed dependency graph.
- N3–N4 enforce path trust, symlink policy, identity rechecks, raw-byte
  acquisition, and exact eight-input assembly.
- C0–C8 execute inside a terminable `worker_threads` Worker with a 40-second
  parent timer and resource limits sized as an intended 256 MiB guard.
- N5 uses the Phase 3 OS-lock, staging, ownership, journal, and recovery
  substrate; N6 verifies the published fourteen-file byte map.

The 256 MiB setting is an intended V8 guard, not a proven resident-memory hard
cap. An actual lower-limit worker termination proves the Node-only
`MEMORY_LIMIT_EXCEEDED` mapping; timeout, thrown-worker, malformed-result, and
worker-death paths prove the remaining supervision outcomes.

## Full functional corpus

The shared corpus has 85 cases: 20 positives and 65 required negatives. The
positive side contains the canonical and late-bound fixtures, eight seeded
runtime-generated fixtures, every specified metamorphic transformation, the
grammar-suffix designator, accepted-hostile text, and permitted BOM cases. The
negative side covers Section 46 and every Core/Both governing-code case used by
Section 45.20, including simultaneous defects that exercise phase ordering.

For each case the direct core establishes the expected result. Except for the
specified C0 `INVALID_CORE_REQUEST` direct-call exception, the suite executes
the result through the Node host end to end. It then executes the identical
corpus through the release bundle and reference Worker in pinned Chromium
151.0.7922.34. Success requires identical artifact bytes, both fingerprints,
and the status line; failure requires the same governing code, status line, and
error-report bytes. The mutated-carrier case proves the intentional N2/C1
detection-site asymmetry while retaining the same code and report.

The full 85-case corpus is also repeated under a Node Worker and Chromium with
every prohibited Common Platform Surface global replaced by a throwing trap.
Permitted cryptographic and decoding calls are instrumented to require
`SHA-256` and fatal `TextDecoder` construction.

## Complementary completion evidence

Phase 10 adds deterministic seeded generation with semantic assertions and
manifest verification. Alternate test-only bundles inject matching locked
digests to test the exact context, contract, and canonical-profile byte limits;
the source, request, and user-profile limits likewise pass at the exact boundary
and fail one byte over. Earlier binding suites remain part of `npm test`:

- Phase 7 accessibility, navigation, full-HTML parsing, hostile text, carrier,
  and subset-revalidator adversarial tests;
- Phase 8 golden, fingerprint, manifest dependency, and mutation tests;
- Phase 9 registry, failure ordering, exit class, and terminal-line tests;
- Phase 3 two-platform publication, locking, crash recovery, and detached-report
  tests.

CI runs the complete Node gates on Windows and Ubuntu and the complete browser
gates in pinned Chromium on every change. GitHub Pages builds only after the
Phase 8 artifacts and Phase 9–10 Node surfaces pass.

## Phase boundary

Phase 10 does not make the v1.0 release claim. Phase 11 must inject the real
`sourceCommit`, run the dual-host corpus against Chromium, Firefox, and WebKit,
close platform and newline packaging deltas, reproduce from a clean archive,
and publish the checksum, SRI, and final documentation evidence.
