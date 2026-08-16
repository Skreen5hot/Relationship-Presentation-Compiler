# Phase 1 Locked-Artifact Evidence

Status: accepted for implementation

Evidence date: 2026-08-16

Specification: Relationship Presentation Compiler v1.0, edge-canonical re-cut

Phase 1 materializes the fixed inputs named by Section 48 without advancing
into the Phase 2 compiler shell. Every generated JSON document is UTF-8 without
a BOM, uses LF, ends in LF, and is reproducible from committed inputs.

## Core-locked artifacts

`artifact.lock.json` fixes this order and these raw-byte SHA-256 values:

| Role | Path | SHA-256 |
|---|---|---|
| context | `contexts/poc.context.jsonld` | `6e27b066fa6f205e130f322f479c89edd0c5e64a12800f3bcb9ea1117822b484` |
| contract | `contract/person-association-contract.jsonld` | `09dffb9112967a8e725244e8caa03e055a3f88761af545459a773a5a01722322` |
| supported profile | `profiles/two-slide-explainer.jsonld` | `cfa9db81b1388b11342e7a4433f259acc49595d8b801072bccd0587c0305c296` |
| carrier style | `carrier/presentation.css` | `ffcf45b266ad10b4dc1f21d604beec4db52a3a618f13541444ed77e6f3a8cc3d` |
| carrier navigation | `carrier/navigation.js` | `94d1406758a8fe887a8d39f3559b505099ab08d5e2af39834b7f52bee5e914ad` |

The stylesheet owns the 16:9 surface and focus treatment. The navigation
payload has one delegated click listener, recognizes only `advance` and `back`,
changes visibility only through `hidden`, moves heading focus, tolerates both
boundaries, and contains no ambient network, timer, dynamic-code, or storage
surface. Tests exercise these behaviors in the locked conformance DOM.

The Phase 2 core build consumes these digests through packaging-time constant
injection. Release packaging later injects the same five values into both host
packagings and re-verifies equality, as required by EC-03 and Sections
6.7/13.8.

## Ontology release evidence

The three TTL files are copied byte-for-byte from the source paths and commits
named in `vendor/ontology/README.md`. The generation/check path verifies their
upstream Git blob SHA-1 values before computing the SHA-256 values recorded in
`ontology.lock.json`:

| Role | Pinned commit | SHA-256 |
|---|---|---|
| BFO core | `044490fc5100ffed6df7d4d15cbc167698b6fdee` | `6944e2c96a0d8709dc15ae5364792019e208061eda3f32311af4f3b8d8443a3b` |
| CCO Agent | `510dad76be0ef710b65a421075af912af25342b7` | `ab9989895089f8adb445426c5bcfc9bc1a1100f981c15b1e7349fd71bfe18e85` |
| CCO Information Entity | `510dad76be0ef710b65a421075af912af25342b7` | `a074aaf66f3d7177b6293ff5714c8a86a7b00ca47e357dd0c91e3def697e9d9f` |

The tests preserve the BFO `bfo-core.ttl` version-IRI suffix and the Agent
Ontology's `2024-11-05` version date exactly. Per EC-04, these files remain
Node-host release evidence: they are not core inputs and are not represented in
the core manifest.

## SBOM generation

`scripts/generate-sbom.mjs` invokes the locked
`@cyclonedx/cyclonedx-npm` 6.0.1 tool in package-lock-only, reproducible mode,
with CycloneDX JSON 1.7 validation enabled. It deliberately resolves npm beside
`process.execPath`; the recorded tool version is therefore the locked npm
11.17.0 rather than an ambient `PATH` installation.

The committed SBOM enumerates all 260 package-lock package locations (the
compiler plus 259 dependency locations), including platform-conditional
packages, with stable PURLs, versions, and SHA-512 package integrity evidence.
It omits generation timestamps and random serial numbers. Its SHA-256 is
`1969dc896254f17ef191aeea728d321b6055587dab820d951efcc01623b52659`.

## Phase boundary

The concrete lock-file SHA-256 values are:

- `artifact.lock.json`: `e07f9556b1259d04360c4cdf5f73924763f4b8058c69dd6340c2e107eb8b833e`
- `ontology.lock.json`: `89bfd3b5db441bec8e5107f9d7c2b395a238bdd7a93fad2856e490b782ffed1b`

`runtime.lock.json` cannot truthfully be populated until packaging can bind a
release commit, the Node host, these lock hashes, and the SBOM hash.
`browser-host.lock.json` likewise waits for the Phase 4 release bundle and
engine evidence. They are intentionally not Phase 1 artifacts.
