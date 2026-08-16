# Phase 8 Fingerprints, Manifests, and Verifier Evidence

Status: accepted for implementation

Evidence date: 2026-08-16

Specification: Relationship Presentation Compiler v1.0, edge-canonical re-cut

Phase 8 completes the successful core computation. A conforming request now
returns the exact fourteen-file canonical artifact set, lowercase SHA-256 core
and distribution fingerprints, and the LF-terminated success status line. The
same result crosses the supervised Browser Worker boundary byte-for-byte.

## Acyclic byte production

Stage 8 renders and revalidates first, then hashes only the context, Stages
01–07, and `presentation.html`. The JCS core manifest records compiler identity,
the five embedded locked-artifact digests, all eight raw input hashes, and those
nine output hashes. It contains no ontology, runtime, package, SBOM, browser,
path, clock, or host evidence.

The core fingerprint is computed from the LF-terminated JCS serialization with
`coreFingerprint` absent. Only after that value exists does the core build the
validation report and Phase 8 demo. It then builds the ownership sentinel and
the outer distribution manifest over the sentinel, core manifest, report, and
demo. The distribution fingerprint is likewise computed with its own member
absent. The status line is built last and reports both values.

Development bundles inject a forty-zero `SOURCE_COMMIT` sentinel so committed
goldens remain reproducible before release packaging. This value is explicit
non-release evidence. Phase 11 must inject the actual full release commit and
regenerate every dependent golden, bundle, and lock.

## Canonical verifier

The project-owned verifier operates only on a named byte map. In normative
order it parses the distribution manifest with duplicate-member rejection,
requires exact JCS bytes, verifies its fingerprint and every outer file hash,
verifies the core-manifest hash and fingerprint, verifies every core output,
then rejects extra, missing, or non-byte entries. Manifest structure, role order,
logical filenames, compiler identity, digest syntax, and the complete artifact
name set are closed.

The compiler runs this verifier against its own result before returning success.
The conformance matrix independently flips one byte in each of all fourteen
files and requires rejection, then repeats with a missing and an extra file.
Fingerprint-occurrence tests prove that no core-listed file contains the core
fingerprint and that only the distribution manifest file contains the
distribution fingerprint.

## Goldens, hosts, and deployment

`expected/relationship-42` now contains all fourteen exact files. Node tests
compare the complete result with those bytes and independently inspect manifest,
report, sentinel, status, and hash relationships. The poisoned CPS harness now
observes the complete successful hashing and parsing path. The Browser test
compares the supervised Chromium Worker result with direct execution of the
same committed bundle, including every returned byte.

`scripts/generate-phase8-site.mjs` invokes the packaged core and writes its
verified artifacts without rewriting. GitHub Pages refuses to serve
dot-prefixed URLs even from a `.nojekyll` upload, so the site adds one
byte-identical `ownership-sentinel.json` alias and changes only the Pages
`index.html` link target to that alias. The canonical `demo.html`, sentinel, and
fourteen-file core result remain unchanged. The live homepage exposes usable
links to the full content set and displays the core fingerprint.
