# Relationship Presentation Compiler Specification v1.0

**Status:** Release specification for the trusted offline CLI, v1.0
**Version:** v1.0
**Supersedes:** v0.4.1 (final specification of the POC series)
**Specification date:** 2026-08-15
**Runtime:** Offline Node.js command-line build
**Default command:** `node index.js`
**Parameterized command:** `node index.js --source <fixture.jsonld> --request <request.txt> --profile <profile.jsonld> --out <output-dir>`

**Release position:** This specification defines the v1.0 release of a deterministic offline compiler for trusted local inputs. An implementation may claim v1.0 release status only when every item in Section 46 (Definition of Done) is satisfied with evidence. This document alone is not the release. Service deployment, untrusted uploads, and external certification remain out of scope for the v1.0 release claim and require a new major revision. Artifact authenticity (signing) is delegated to external release infrastructure and is not a compiler obligation; the compiler's obligation ends at independently verifiable fingerprints.

**Identifier continuity:** The package name `relationship-presentation-poc`, the ownership sentinel filename, and the `https://example.org/relationship-presentation-poc/…` namespaces are retained from the POC lineage. They are stable identifiers, not readiness claims. Renaming them would break replacement-ownership continuity and churn every generated artifact for cosmetic benefit. The `example.org` namespaces are project-local by design and are not angle-bracket placeholders in the sense of Section 10.1.

**Primary changes from v0.4.1** (finding identifiers refer to the v0.4.1 structured review; the full finding-to-resolution record is Appendix C):

- specifies the controlled request grammar as an anchored, uniquely decomposable match, eliminating capture ambiguity (F-01);
- requires pairwise IRI distinctness among all six selected individuals and prohibits `owl:sameAs` among them (F-02);
- rejects duplicate JSON object member names in every parsed JSON input, not only in verifier-parsed manifests (F-03);
- assigns every lock its own error code, defines a normative lock-validation order, binds an error code inline at every MUST-fail condition, defines a global deterministic failure ordering, and adds an exit-class column to the error-code registry (F-04);
- names the output-lock mechanism class and requires a locked filesystem-lock dependency, because the Node.js standard library provides no OS advisory lock (F-05);
- extends source-graph contamination checking to every IRI position, including subjects and literal datatypes (F-06);
- reframes the supported profile as the parameter block of a fixed, identified projection program; makes `slideCount` and `participantOrder` load-bearing; moves `aspectRatio` into the carrier contract; and advances the profile identifier to `profile:two-slide-explainer-v3` (F-07);
- documents the deliberate annotation-as-content decision for designator and name text relative to CCO's Information Bearing Entity pattern (F-08);
- specifies release-packaging injection semantics for `sourceCommit` (F-09);
- defines generated-object key order as the member union across all normative occurrences of a type (F-10);
- prohibits bidirectional control characters and Unicode noncharacters in contract-critical strings while deliberately permitting ZWJ/ZWNJ (F-11);
- defines `derivedFrom` as character provenance and separates it from eligibility provenance (F-12);
- binds the Table 27.1 mapping and the navigation intent-token mapping to named rules (F-13);
- classifies which lock values are specification-normative, baseline-normative, or release-populated, and defines the re-lock policy for Node.js updates within the pinned LTS line (F-14);
- adds the ontology-lock hash to the runtime lock for evidence symmetry (F-15);
- constrains locked carrier payload bytes against premature element termination (F-16);
- corrects the sandboxed-demo wording so that network absence is attributed to the locked script, not to the sandbox attribute (F-17);
- defines one Prohibited Meta-Type Set and references it uniformly (F-18);
- revises the build plan with realistic estimates and an early publication-substrate spike (F-19);
- annotates the ontology lock with upstream-faithful oddities so that future reviewers do not "correct" verified values.

---

## 1. Purpose

This specification defines a deterministic offline compiler that transforms one narrow BFO/CCO-aligned source pattern into a two-slide HTML presentation through inspectable JSON-LD stages.

The compiler is not a general ontology-to-presentation system. It supports exactly one semantic pattern:

```text
one rp:PersonAssociation
+ one matching CCO Non-Name Identifier
+ exactly two distinct CCO Persons
+ exactly one CCO Designative Name for each Person
+ one supported two-slide explainer profile
────────────────────────────────
self-contained two-slide HTML presentation
+ inspectable JSON-LD artifacts
+ deterministic manifests and validation reports
```

The compiler MUST work for fixtures authored after compiler implementation, provided they satisfy the v1.0 contract.

---

## 2. Release Position

v1.0 is the specification for a trusted offline CLI release.

The v1.0 release claim is established only by all of the following, together:

- an implemented compiler conforming to this specification;
- a passing compiler-conformance test suite (Section 42);
- a complete dependency inventory;
- populated ontology, runtime, and static-artifact locks with no placeholders;
- an SBOM in the declared machine-readable format;
- dependency vulnerability and license review;
- filesystem-safety and hostile-input review;
- reproducible-build evidence;
- supported-platform release packaging checks, including a detached SHA-256 checksum published alongside the release archive;
- accessibility verification;
- independent security and release review.

A service accepting untrusted uploads remains out of scope. Signed release envelopes are delegated to external release infrastructure (Section 44).

---

## 3. Success Criterion

The v1.0 release succeeds if this statement is true:

> Given any JSON-LD 1.1 fixture satisfying the closed-world v1.0 Person Association contract, a matching controlled-language request, the supported profile version, and locked local ontology, context, contract, profile, runtime, dependency, and SBOM artifacts, the compiler produces the profile-defined two-slide HTML presentation without fixture-specific compiler logic or profile changes. Every projected value and compiler decision is traceable, all canonical outputs are deterministic for identical input byte sequences and build locks, the deterministic failure ordering yields exactly one error code for any nonconforming invocation, and the source graph remains free of projection, profile, rule, layout, HTML, carrier, navigation, and runtime vocabulary in every RDF position.

---

## 4. Source Basis

BFO provides the upper-level basis for relational qualities and specifically dependent continuants. `obo:BFO_0000145` is labeled "relational quality" and is defined in terms of a quality that specifically depends on two non-identical entities. `obo:BFO_0000195` is labeled "specifically depends on"; its declared domain is specifically dependent continuant and its range is the union of specifically dependent continuant and independent continuants that are not spatial regions, so the fixture direction `R → P` is domain- and range-correct. (`obo:BFO_0000194`, "specifically depended on by", is the inverse and is not used by this contract.)

CCO provides the information-entity pattern used for identifiers and names. `cco:ont00001916` is labeled "designates" with domain `cco:ont00000686` ("Designative Information Content Entity"); `cco:ont00000649` is labeled "Non-Name Identifier"; and `cco:ont00000003` is labeled "Designative Name". CCO axiomatizes `cco:ont00000003 owl:disjointWith cco:ont00000649`. CCO's Agent Ontology provides `cco:ont00001262`, labeled "Person."

The local contract class introduced below follows the rule that, when a new subclass is necessary, it should be created under the closest BFO/CCO parent class and defined according to the "b is a c that d's" pattern.

### 4.1 Annotation-as-Content Decision

This contract carries designator and name text in `rdfs:label`. The domain-correct CCO pattern would instead concretize each Designative Name or Non-Name Identifier (a generically dependent Information Content Entity) in an Information Bearing Entity and attach the string through `cco:ont00001765` ("has text value"), whose declared domain is Information Bearing Entity, not Information Content Entity. v1.0 deliberately flattens the concretization stack: requiring the bearer layer would double the contract-critical neighborhood for no gain in the projected result, and `has text value` is not domain-correct on the ICE itself. The consequence is acknowledged: the fixture's realism is knowingly thinner than CCO's own axioms at exactly this point, and any future ingestion of real CCO data MUST map bearer-level text values into `rdfs:label` at ingestion time, outside compiler scope. This decision is a v1.0 contract property, not an oversight.

### 4.2 Pinned Semantic Baseline

The semantic baseline is deliberately pinned to:

- BFO 2020, release `release-2024-01-29`, commit `044490fc5100ffed6df7d4d15cbc167698b6fdee`;
- CCO 2.0, release `v2.0-2024-11-06`, commit `510dad76be0ef710b65a421075af912af25342b7`.

Later CCO releases do not silently change the v1.0 semantic baseline. Adopting another CCO release requires a specification and lock-version change, even if all critical term IRIs remain unchanged.

Two upstream values look like errors and are not; the ontology lock carries notes so they are never "corrected" (Section 10.3): the BFO 2020 `owl:versionIRI` genuinely ends in `bfo-core.ttl`, and the Agent Ontology `owl:versionIRI` is genuinely dated `2024-11-05` despite the `v2.0-2024-11-06` release tag. Both were verified against the pinned commits during the v0.4.1 review.

Nonnormative source references:

- [BFO 2020 release](https://github.com/BFO-ontology/BFO-2020/releases/tag/release-2024-01-29)
- [CCO 2.0 release](https://github.com/CommonCoreOntology/CommonCoreOntologies/releases/tag/v2.0-2024-11-06)
- [Node.js 24.19.0 LTS release](https://nodejs.org/en/blog/release/v24.19.0)
- [Node.js release schedule](https://github.com/nodejs/Release)
- [CycloneDX 1.7 specification overview](https://cyclonedx.org/specification/overview/)
- [RFC 8785, JSON Canonicalization Scheme](https://www.rfc-editor.org/rfc/rfc8785)

---

## 5. Normative Language

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **MAY**, and **OPTIONAL** are to be interpreted as described by BCP 14, RFC 2119 and RFC 8174, when and only when they appear in all capitals.

A conforming fixture is a source JSON-LD fixture satisfying the v1.0 Person Association contract under the closed-world validation semantics defined here.

A correct presentation is a generated presentation whose presentation-visible content, document metadata visible to users, and accessibility-tree strings are derived only from source designators, the supported profile, and named deterministic rules.

"Canonical output" means a file included directly or transitively by the core or distribution manifest.

Where a normative condition states that the compiler MUST fail or MUST produce a result, the governing error code is bound inline at that condition. Appendix A is the complete registry and assigns each code an exit class. Section 9.7 defines which single code is emitted when multiple conditions fail.

---

## 6. Ontology and Contract Design

### 6.1 Local Contract Class

v1.0 introduces exactly one local source-domain class:

```text
rp:PersonAssociation
```

It introduces no new source-domain object property.

`rp:PersonAssociation` is asserted as a subclass of `obo:BFO_0000145`.

### 6.2 Contract Class Definition

The contract ontology file is:

```text
contract/person-association-contract.jsonld
```

Required semantic content:

```json
{
  "@context": "../contexts/poc.context.jsonld",
  "@id": "rp:PersonAssociation",
  "@type": "owl:Class",
  "subClassOf": "obo:BFO_0000145",
  "label": "Person Association",
  "definition": "A Person Association is a relational quality that specifically depends on exactly two distinct Persons and for which neither Person occupies a distinguished directional participant role.",
  "comment": "This local contract class constrains the source pattern eligible for the supported two-slide explainer profile. It does not introduce a new object property and does not claim that all BFO relational qualities are person associations.",
  "example": "An association-quality instance that specifically depends on Alice and Bob, where neither participant is directionally privileged by the source fixture."
}
```

The definition deliberately does not mention rendering, HTML, slides, templates, or projection rules.

### 6.3 Authorial Assertion Boundary

The fixture author asserts the non-directional meaning of the source entity by directly typing it as `rp:PersonAssociation`.

The compiler MUST validate that the direct type assertion and required neighborhood are present. It MUST NOT claim to infer symmetry or absence of directional roles from the two `obo:BFO_0000195` edges. The class assertion licenses profile eligibility under this closed-world contract.

### 6.4 Profile Binding

Rendering eligibility is a profile-layer rule, not an ontological differentia.

A supported profile identifier names a fixed projection program: the versioned set of compiler rules that compose slides, regions, and carrier structure for that profile. The profile document is that program's parameter block. It supplies the strings and constants the program reads; it does not describe slide or region structure, and v1.0 does not claim that it does.

The supported binding is:

```text
rp:PersonAssociation
→ program identified by profile:two-slide-explainer-v3
→ rule:person-association-overview-v1-0
→ "{participant1} is associated with {participant2}."
```

The source ontology describes what the entity is. The profile identifier selects the fixed program by which that pattern is communicated, and the profile document parameterizes it.

---

## 7. Scope and Definitions

### 7.1 Supported Pattern

v1.0 is parametric over:

- fixture namespace;
- relationship IRI;
- resolving identifier IRI;
- participant IRIs;
- name-node IRIs;
- relationship title label;
- participant labels, including labels containing grammar or template substrings;
- unrelated extra source facts that do not contaminate or alter the selected neighborhood;
- JSON-LD surface syntax that expands to the same permitted default-graph triples.

v1.0 is not parametric over:

- eligible relationship class;
- participant count or participant class;
- participant roles or directionality;
- presentation profile shape or version;
- output carrier;
- controlled-language grammar;
- template wording;
- slide count.

### 7.2 Source Graph

The source graph is the expanded JSON-LD 1.1 default RDF graph loaded from the input fixture after duplicate-triple collapse.

It contains source-domain assertions. It MUST NOT contain projection, profile, rule, layout, HTML, JavaScript, navigation, carrier, runtime, or demo vocabulary in any RDF position: subject IRI, predicate IRI, object IRI, `rdf:type` object, or literal datatype IRI (Section 40).

### 7.3 Prohibited Meta-Type Set

The Prohibited Meta-Type Set is:

```text
owl:Class
rdfs:Class
rdf:Property
owl:ObjectProperty
owl:DatatypeProperty
owl:AnnotationProperty
```

Wherever this specification prohibits an individual from being "directly typed as an RDF/OWL class or property," it means direct `rdf:type` assertion to any member of this set. Sections 17.1 through 17.4 reference this set uniformly.

### 7.4 Contract Ontology

The contract ontology is the fixed local ontology fragment defining `rp:PersonAssociation`. It is source-domain vocabulary, not projection vocabulary.

### 7.5 Fixture Individuals and Selected Individuals

A fixture individual is a named RDF node represented by an absolute IRI.

The required fixture individuals are:

```text
D   resolving designator
R   resolved Person Association
P1  first participant
P2  second participant
N1  name designator for P1
N2  name designator for P2
```

The selected individuals are exactly these six nodes as bound by contract validation. Section 17.5 requires them to be six pairwise-distinct absolute IRIs.

### 7.6 Presentation-Visible and User-Perceivable Content

Presentation-visible content is text rendered inside `presentation.html`.

User-perceivable content additionally includes:

- the HTML document title;
- accessible names and descriptions;
- button labels;
- focus-visible state where applicable.

Diagnostic content in `demo.html` is not presentation-visible content, but it MUST still be escaped and safe.

### 7.7 Significant HTML Equivalence

Two HTML outputs are significantly equivalent if, after standards-compliant HTML parsing, they contain the same required document structure, element order, attributes, text nodes, accessible names, button intent values, initial hidden state, and navigation behavior. Deterministic CSS and JavaScript formatting are not significant unless they alter required behavior or user-perceivable content.

---
## 8. Repository Structure

```text
relationship-presentation-poc/
├── index.js
├── package.json
├── package-lock.json
├── runtime.lock.json
├── ontology.lock.json
├── artifact.lock.json
├── sbom.json
├── contexts/
│   └── poc.context.jsonld
├── contract/
│   └── person-association-contract.jsonld
├── carrier/
│   ├── presentation.css
│   └── navigation.js
├── vendor/
│   └── ontology/
│       ├── bfo-core.ttl
│       ├── AgentOntology.ttl
│       └── InformationEntityOntology.ttl
├── fixtures/
│   ├── relationship-42.jsonld
│   ├── relationship-42-request.txt
│   └── late-bound-example.jsonld
├── profiles/
│   └── two-slide-explainer.jsonld
├── src/
│   ├── cli.js
│   ├── supervise-build.js
│   ├── load-inputs.js
│   ├── validate-locks.js
│   ├── validate-context.js
│   ├── normalize-graph.js
│   ├── normalize-request.js
│   ├── resolve-scope.js
│   ├── validate-resolved-neighborhood.js
│   ├── select-content.js
│   ├── build-narrative.js
│   ├── build-presentation.js
│   ├── project-html.js
│   ├── render-html.js
│   ├── build-core-manifest.js
│   ├── build-distribution-manifest.js
│   ├── validate-run.js
│   ├── canonical-json.js
│   ├── stable-jsonld.js
│   ├── html-escape.js
│   ├── output-safety.js
│   ├── output-lock.js
│   └── error-report.js
├── expected/
│   └── relationship-42/
│       ├── 01-request.jsonld
│       ├── 02-resolution.jsonld
│       ├── 03-contract-validation.jsonld
│       ├── 04-content-manifest.jsonld
│       ├── 05-narrative.jsonld
│       ├── 06-presentation.jsonld
│       ├── 07-html-projection.jsonld
│       └── presentation.html
├── test/
│   ├── canonical-golden.test.js
│   ├── late-bound-fixture.test.js
│   ├── generated-fixture-metamorphic.test.js
│   ├── hostile-labels.test.js
│   ├── negative-contract.test.js
│   ├── no-hardcoded-fixture-values.test.js
│   ├── failure-ordering.test.js
│   ├── output-safety.test.js
│   ├── dependency-lock.test.js
│   ├── artifact-lock.test.js
│   ├── manifest-graph.test.js
│   ├── accessibility.test.js
│   ├── navigation-behavior.test.js
│   └── determinism.test.js
└── dist/
    ├── .relationship-presentation-poc-owned
    ├── poc.context.jsonld
    ├── 01-request.jsonld
    ├── 02-resolution.jsonld
    ├── 03-contract-validation.jsonld
    ├── 04-content-manifest.jsonld
    ├── 05-narrative.jsonld
    ├── 06-presentation.jsonld
    ├── 07-html-projection.jsonld
    ├── 08-core-manifest.json
    ├── 09-distribution-manifest.json
    ├── presentation.html
    ├── demo.html
    └── validation-report.json
```

Temporary staging, lock, recovery, and detached failure-report paths MUST NOT be children of an already published output directory.

---

## 9. Runtime Modes and CLI

### 9.1 Default Mode

```bash
node index.js
```

This is equivalent to:

```bash
node index.js \
  --source fixtures/relationship-42.jsonld \
  --request fixtures/relationship-42-request.txt \
  --profile profiles/two-slide-explainer.jsonld \
  --out dist \
  --replace
```

### 9.2 Parameterized Mode

```bash
node index.js \
  --source <fixture.jsonld> \
  --request <request.txt> \
  --profile <profile.jsonld> \
  --out <output-dir>
```

All four path options are required in parameterized mode.

### 9.3 Supported Options

The CLI MUST support:

```text
--source <path>
--request <path>
--profile <path>
--out <path>
--replace
--help
--version
```

`--help` and `--version` MUST be mutually exclusive with compilation options and MUST exit successfully without reading compilation inputs.

### 9.4 CLI Errors

- Unknown options MUST produce `UNKNOWN_OPTION`.
- Duplicate singleton options MUST produce `DUPLICATE_OPTION`.
- Supplying only some of `--source`, `--request`, `--profile`, and `--out` MUST produce `INVALID_CLI_OPTIONS`.
- Using `--replace` without a compilation mode MUST produce `INVALID_CLI_OPTIONS`.
- Input/output overlap MUST produce `INPUT_OUTPUT_OVERLAP`.
- A symlink output path or symlinked existing output directory MUST produce `UNSAFE_OUTPUT_PATH`.
- An input symlink MAY be accepted only when its fully resolved target is a regular file inside the approved package boundary. Otherwise it MUST produce `UNSAFE_INPUT_PATH`.

### 9.5 Exit Codes

| Exit code | Meaning |
|---:|---|
| 0 | Success |
| 1 | Fixture contract, request, profile, or run validation failure |
| 2 | CLI usage error |
| 3 | Input loading, context, encoding, or trust-boundary error |
| 4 | Output safety, output lock, or build-lock error |
| 5 | Internal compiler error |
| 6 | Operational resource guard terminated the build |

Appendix A assigns every error code to exactly one exit class.

### 9.6 stdout and stderr

`stdout` is reserved for `--help`, `--version`, or exactly one LF-terminated deterministic success line:

```text
status=success artifact=relationship-presentation coreFingerprint=<sha256> distributionFingerprint=<sha256>
```

The success line MUST NOT contain the output path.

`stderr` is reserved for exactly one LF-terminated deterministic error line of the form:

```text
status=error code=<ERROR_CODE>
```

Stack traces MUST NOT be emitted unless a nonconforming developer-only diagnostic mode is added in a future version.

### 9.7 Deterministic Failure Ordering

The single emitted error code is part of the deterministic surface. Validation MUST proceed in the following phase order, and the first failing phase determines the emitted code:

1. CLI syntax and option validation (Section 9.4).
2. Lock validation, in the internal order of Section 10.6.
3. Path resolution and trust-boundary validation for inputs and the output target, including input/output overlap, symlink rules, and — when `--replace` is absent — existence of the output target (`OUTPUT_EXISTS`).
4. Input loading: byte limits, UTF-8 and BOM handling, duplicate JSON member rejection, JSON depth and context structure, JSON-LD trust rules, expansion, and expanded-triple limits, applied per input in the fixed order context, contract, profile, source, request.
5. Request grammar and designator validation (Section 15).
6. Profile contract validation (Section 16).
7. Fixture contract, distinctness, and contamination validation (Sections 17, 18, 40). All independently reportable violations are collected and ordered per Section 39; the emitted code is the governing category code (for example `FIXTURE_CONTRACT_FAILED`, `SOURCE_GRAPH_CONTAMINATED`, or `SOURCE_NAMESPACE_NOT_ALLOWED`, whichever governs the first-ordered violation).
8. Stage construction and renderer validation (Sections 20–29); unexpected internal states produce `INTERNAL_COMPILER_ERROR`.
9. Output lock acquisition, staging, ownership validation of an existing target under `--replace`, and recovery-journal inspection (Section 38).
10. Publication and manifest verification (Sections 31–35).

Within a phase, checks run in the order this specification lists them. A conforming implementation MUST NOT reorder phases for performance in a way that changes the emitted code.

---

## 10. Runtime, Ontology, and Static-Artifact Locks

### 10.1 Lock Semantics and Value Normativity

The locks establish build consistency and evidence. They do not, by themselves, establish artifact authenticity. Authenticity requires a signed release envelope or equivalent external trust root, which is provided by release infrastructure outside this compiler.

Lock values fall into three normativity classes:

1. **Specification-normative** values are fixed by this document: `lockVersion` strings, the SBOM format and `specVersion`, and every structural member name. Changing one requires a specification revision.
2. **Baseline-normative** values are fixed at the specification date but re-lockable without a specification revision, provided the change stays inside the declared line: the Node.js version and bundled npm version within the pinned `24.x` LTS line. A Node.js patch or minor update within `24.x` requires a lock revision (with a `lockVersion` suffix bump and re-run conformance evidence), not a specification revision. Changing the major release line requires a specification revision, mirroring the CCO rule in Section 4.2. The `24.x` line is scheduled to move from Active LTS to Maintenance LTS in October 2026; that transition alone does not require a specification revision.
3. **Release-populated** values are shown as angle-bracket placeholders and MUST be populated concretely in a conforming release. A conforming release MUST NOT contain angle-bracket placeholders.

### 10.2 Runtime Lock

File:

```text
runtime.lock.json
```

Normative baseline at the v1.0 specification date:

```json
{
  "lockVersion": "runtime-lock-v1.0",
  "node": {
    "version": "24.19.0",
    "releaseLine": "24.x",
    "releaseStatusAtSpecification": "Active LTS"
  },
  "packageManager": {
    "name": "npm",
    "version": "11.17.0"
  },
  "jsonLdProcessor": {
    "package": "<package-name>",
    "version": "<exact-version>",
    "integrity": "<lockfile-integrity>"
  },
  "domTestImplementation": {
    "package": "<package-name>",
    "version": "<exact-version>",
    "integrity": "<lockfile-integrity>"
  },
  "filesystemLock": {
    "package": "<package-name>",
    "version": "<exact-version>",
    "integrity": "<lockfile-integrity>"
  },
  "compiler": {
    "name": "relationship-presentation-poc",
    "version": "1.0.0",
    "sourceCommit": "<full-commit-sha>"
  },
  "packageLockSha256": "<sha256>",
  "artifactLockSha256": "<sha256>",
  "ontologyLockSha256": "<sha256>",
  "sbom": {
    "path": "sbom.json",
    "format": "CycloneDX JSON",
    "specVersion": "1.7",
    "mediaType": "application/vnd.cyclonedx+json; version=1.7",
    "sha256": "<sha256>"
  }
}
```

`filesystemLock` names the dependency providing the OS advisory lock required by Section 38.2. It is a required member because the Node.js standard library provides no such lock.

`sourceCommit` is injected at release packaging time, outside the repository tree: a file committed to a repository cannot contain the hash of the commit that contains it. The value is asserted release evidence. The compiler verifies its own `compiler.name` and `compiler.version` against the lock; it cannot and does not verify `sourceCommit` at runtime.

The compiler MUST fail with `RUNTIME_LOCK_MISMATCH` when the executing Node version, npm version, or compiler name/version does not match the populated lock. Mismatches attributed to other locks use their own codes per Section 10.6.

The implementation MUST use `npm ci` or an equivalent lock-preserving installation procedure. A successful `npm install` against an altered graph is not conformance evidence.

### 10.3 Ontology Lock

File:

```text
ontology.lock.json
```

Required shape:

```json
{
  "lockVersion": "ontology-lock-v1.0",
  "ontologies": [
    {
      "role": "bfo",
      "ontologyIri": "http://purl.obolibrary.org/obo/bfo.owl",
      "versionIri": "http://purl.obolibrary.org/obo/bfo/2020/bfo-core.ttl",
      "sourceReleaseOrTag": "release-2024-01-29",
      "sourceCommit": "044490fc5100ffed6df7d4d15cbc167698b6fdee",
      "localFilename": "vendor/ontology/bfo-core.ttl",
      "sha256": "<sha256-of-vendored-bytes>",
      "license": "CC-BY-4.0",
      "note": "Upstream owl:versionIRI genuinely ends in bfo-core.ttl at this release. Verified against the pinned commit; do not correct."
    },
    {
      "role": "cco-agent",
      "ontologyIri": "https://www.commoncoreontologies.org/AgentOntology",
      "versionIri": "https://www.commoncoreontologies.org/2024-11-05/AgentOntology",
      "sourceReleaseOrTag": "v2.0-2024-11-06",
      "sourceCommit": "510dad76be0ef710b65a421075af912af25342b7",
      "localFilename": "vendor/ontology/AgentOntology.ttl",
      "sha256": "<sha256-of-vendored-bytes>",
      "license": "BSD-3-Clause",
      "note": "Upstream owl:versionIRI is dated 2024-11-05 despite the v2.0-2024-11-06 tag. Verified against the pinned commit; do not correct."
    },
    {
      "role": "cco-information-entity",
      "ontologyIri": "https://www.commoncoreontologies.org/InformationEntityOntology",
      "versionIri": "https://www.commoncoreontologies.org/2024-11-06/InformationEntityOntology",
      "sourceReleaseOrTag": "v2.0-2024-11-06",
      "sourceCommit": "510dad76be0ef710b65a421075af912af25342b7",
      "localFilename": "vendor/ontology/InformationEntityOntology.ttl",
      "sha256": "<sha256-of-vendored-bytes>",
      "license": "BSD-3-Clause"
    }
  ]
}
```

`note` is an optional documentary member preserved verbatim in the lock; it carries no runtime semantics.

The compiler MUST NOT download ontology files at runtime. It MUST verify the existence and SHA-256 of every vendored ontology file before compilation; a missing or mismatching vendored file, or a mutated `ontology.lock.json`, MUST produce `ONTOLOGY_LOCK_MISMATCH`. It MUST treat the ontology lock and vendored files as contract evidence, not as runtime imports or entailment sources.

### 10.4 Static-Artifact Lock

File:

```text
artifact.lock.json
```

Required shape:

```json
{
  "lockVersion": "artifact-lock-v1.0",
  "artifacts": [
    {
      "role": "context",
      "path": "contexts/poc.context.jsonld",
      "sha256": "<sha256>"
    },
    {
      "role": "contract",
      "path": "contract/person-association-contract.jsonld",
      "sha256": "<sha256>"
    },
    {
      "role": "supported-profile",
      "path": "profiles/two-slide-explainer.jsonld",
      "sha256": "<sha256>"
    },
    {
      "role": "carrier-style",
      "path": "carrier/presentation.css",
      "sha256": "<sha256>"
    },
    {
      "role": "carrier-navigation",
      "path": "carrier/navigation.js",
      "sha256": "<sha256>"
    }
  ]
}
```

The compiler MUST verify the canonical context, contract, canonical supported profile, stylesheet, and navigation script against this lock before any of them is parsed, used to expand untrusted input, or inserted into a carrier. A mismatching artifact, or a mutated `artifact.lock.json` (including a mismatch against `artifactLockSha256` in the runtime lock), MUST produce `ARTIFACT_LOCK_MISMATCH`.

The user-supplied profile need not be byte-identical to the canonical profile. It MUST pass the trust-boundary rules and be RDF-triple-set equivalent to the locked supported profile as specified in Section 16.

### 10.5 SBOM Contract

`sbom.json` MUST validate as CycloneDX 1.7 JSON and MUST enumerate the compiler package and all runtime and test dependencies represented by `package-lock.json`, including the `filesystemLock` dependency.

For reproducibility, the SBOM MUST:

- omit optional generation timestamps and random serial numbers;
- use stable component and dependency ordering;
- identify packages by deterministic package URLs or equivalent stable identifiers;
- include declared versions, resolved integrity evidence where supported, and licenses where known;
- be generated by a locked tool or by deterministic project code identified in the runtime lock.

The SBOM hash MUST match both `runtime.lock.json` and the core manifest lock evidence. A missing SBOM, invalid SBOM, or hash mismatch MUST produce `SBOM_MISMATCH`.

### 10.6 Lock Validation Order and Code Attribution

Lock validation MUST run in this order, and the first failure determines the emitted code:

1. Parse `runtime.lock.json`; verify executing Node version, npm version, and compiler name/version → `RUNTIME_LOCK_MISMATCH`.
2. Verify `package-lock.json` bytes against `packageLockSha256` and verify the installed dependency graph (names, versions, integrity) against the package lock → `PACKAGE_LOCK_MISMATCH`.
3. Verify `artifact.lock.json` bytes against `artifactLockSha256`, then verify every listed artifact → `ARTIFACT_LOCK_MISMATCH`.
4. Verify `ontology.lock.json` bytes against `ontologyLockSha256`, then verify every vendored ontology file → `ONTOLOGY_LOCK_MISMATCH`.
5. Verify `sbom.json` bytes against the runtime lock's SBOM hash and validate its format → `SBOM_MISMATCH`.

A mismatch between an embedded hash in the runtime lock and the referenced file's actual bytes is attributed to the referenced lock's code (steps 2–5), because the referenced file is the artifact under verification; which of the two files was mutated is undecidable and is not guessed.

---
## 11. Trust Boundary and Input Loader

### 11.1 Approved Package Boundary

The approved package boundary is the real path of the directory containing `package.json` and `runtime.lock.json` for the executing compiler package.

Default inputs and all internally loaded context, contract, ontology, lock, SBOM, and profile-reference files MUST resolve inside that boundary.

An explicitly supplied `--source`, `--request`, or `--profile` path MAY resolve outside the package boundary when it is a regular file named directly by the user and is not reached through a symlink. The output path MAY be outside the package boundary subject to Section 38.

### 11.2 Local-Only Input Rule

The loader MUST read only:

- the explicit CLI input files or their default-mode equivalents;
- fixed package files named by populated locks;
- files created by the current build inside its unique staging directory.

The loader MUST reject:

- HTTP or HTTPS contexts → `REMOTE_CONTEXT_NOT_SUPPORTED`;
- `file:` contexts and any non-approved local context path → `LOCAL_CONTEXT_NOT_APPROVED`;
- JSON-LD `@import` → `JSONLD_IMPORT_NOT_SUPPORTED`;
- dereferencing of `owl:imports` → `OWL_IMPORTS_NOT_SUPPORTED`;
- named graphs → `NAMED_GRAPH_NOT_SUPPORTED`;
- blank nodes in fixtures or profiles → `BLANK_NODE_NOT_SUPPORTED`;
- invalid UTF-8 → `INVALID_UTF8`;
- duplicate JSON object member names in any parsed JSON document → `DUPLICATE_JSON_MEMBER`;
- special files, devices, sockets, pipes, or directories where a regular file is required → `UNSAFE_INPUT_PATH`;
- any implicit filesystem lookup not named by the CLI or a verified lock → `LOCAL_CONTEXT_NOT_APPROVED`.

An `owl:imports` assertion in a fixture MUST produce `OWL_IMPORTS_NOT_SUPPORTED`; it MUST NOT be followed.

Duplicate-member rejection applies to every JSON document the compiler parses: the source fixture, the user-supplied profile, inline contexts, the canonical context, the contract, all lock files, and the SBOM. RFC 8259 permits parsers to silently discard duplicate members; a fixture whose duplicate members present one value to the compiler and a different value to any second tool is a parser-differential vector this rule closes. Because `JSON.parse` cannot detect duplicates, the implementation MUST use a duplicate-detecting parse strategy — a vetted parsing dependency or a project scanner — and the choice MUST be fixed in Phase 0 and covered by the runtime lock and SBOM if it is a dependency.

### 11.3 Input Symlinks

Input paths MUST be examined with `lstat` before opening.

- A symlink supplied for `--source`, `--request`, or `--profile` MUST be rejected with `UNSAFE_INPUT_PATH` unless its complete real-path chain resolves to a regular file inside the approved package boundary.
- A symlink encountered in a fixed locked path MUST be rejected with `UNSAFE_INPUT_PATH`.
- A path that changes identity between validation and opening MUST produce `INPUT_CHANGED_DURING_LOAD` where the platform exposes sufficient metadata to detect it.

### 11.4 Context Trust Rule

A bundled or parameterized source fixture or profile may use the exact approved context-reference literal:

```text
"../contexts/poc.context.jsonld"
```

The compiler recognizes this literal as a package-contract token and maps it to the already verified canonical context; it does not resolve the literal relative to an arbitrary external input path.

A source fixture MUST use either:

1. an exact reference to the canonical package context string approved for source fixtures; or
2. an inline JSON-LD 1.1 context satisfying all rules below.

For an inline fixture context:

- every reserved prefix and term redefinition MUST be byte-for-value identical to its canonical definition; a violation MUST produce `CONTEXT_TERM_REDEFINITION`;
- additional entries MAY define fixture namespace prefixes with `@prefix: true` and absolute IRI bases;
- additional entries MUST NOT redefine compiler, BFO, CCO, RDF, RDFS, OWL, SKOS, or XSD terms → `CONTEXT_TERM_REDEFINITION`;
- `@base`, `@vocab`, `@language`, `@direction`, remote contexts, scoped contexts, and `@import` are prohibited → `LOCAL_CONTEXT_NOT_APPROVED` (or the more specific remote/import code where applicable);
- no context entry may expand a predicate or class into a prohibited namespace → `CONTEXT_TERM_REDEFINITION`.

The compiler MUST resolve the approved canonical context reference internally to the already hash-verified canonical context. It MUST NOT perform general local-path resolution for context strings; any other context path MUST produce `LOCAL_CONTEXT_NOT_APPROVED`.

### 11.5 Profile and Contract Context Handling

The fixed contract and canonical supported profile MUST use their documented canonical context reference and MUST be verified against `artifact.lock.json` before parsing.

A user-supplied profile MAY use the exact approved context reference or an inline context satisfying the same reserved-term rules. The compiler MUST NOT resolve any other context path.

### 11.6 JSON-LD Processing

The loader MUST:

- parse JSON-LD 1.1;
- expand into exactly one default RDF graph;
- collapse duplicate RDF triples;
- preserve literal datatype and language information for validation;
- operate over direct assertions only.

The loader MUST NOT perform:

- RDFS or OWL entailment;
- subclass reasoning;
- `owl:sameAs` closure;
- inverse-property reasoning;
- functional-property reasoning;
- SPARQL queries;
- database access;
- network access;
- LLM calls;
- web search.

JSON-LD nesting and `@reverse` MAY be accepted only when expansion yields permitted named-node triples in the default graph.

---

## 12. Resource Limits and Execution Isolation

### 12.1 Deterministic Structural Limits

These limits are part of deterministic input conformance:

| Limit | v1.0 value | Error code |
|---|---:|---|
| Source file bytes | 1 MiB | `SOURCE_TOO_LARGE` |
| Request file bytes | 4 KiB | `REQUEST_TOO_LARGE` |
| Profile file bytes | 64 KiB | `PROFILE_TOO_LARGE` |
| Context file bytes | 64 KiB | `CONTEXT_TOO_LARGE` |
| Contract file bytes | 64 KiB | `CONTRACT_TOO_LARGE` |
| Maximum JSON nesting depth | 64 | `JSON_TOO_DEEP` |
| Maximum expanded triples | 5,000 | `TOO_MANY_TRIPLES` |
| Maximum context entries | 250 | `TOO_MANY_CONTEXT_TERMS` |
| Maximum critical label length | 256 Unicode scalar values | `LABEL_TOO_LONG` |
| Maximum request designator length | 256 Unicode scalar values | `DESIGNATOR_TOO_LONG` |
| Maximum violations in an error report | 100 | `TOO_MANY_VIOLATIONS` |

Byte limits MUST be checked before decoding or parsing. Duplicate JSON member detection, JSON depth, and context structure MUST be checked before JSON-LD expansion. Unicode scalar counts MUST be computed over Unicode scalar values, not UTF-16 code units.

### 12.2 Operational Guards

Operational guards protect the host but are not semantic conformance limits:

| Guard | v1.0 value | Error code |
|---|---:|---|
| Maximum wall-clock duration for a supervised compiler worker | 40 seconds | `BUILD_TIMEOUT` |
| Maximum intended worker memory | 256 MiB | `MEMORY_LIMIT_EXCEEDED` |

The CLI parent process MUST supervise compilation in a separate child process or worker boundary that it can terminate. It MUST NOT claim to enforce a wall-clock timeout around uninterruptible work in the same JavaScript event loop.

The release launcher MUST apply an appropriate Node heap limit. Where the supported operating system provides a stronger process-memory or job-object limit, release packaging SHOULD use it. If exact resident-memory enforcement is unavailable, the report MUST describe the 256 MiB value as an intended guard rather than a proven hard cap.

Wall-clock and memory termination can vary with environment. They are excluded from the byte-determinism guarantee. Conformance tests MUST run on a documented minimum environment where all valid fixtures within structural limits complete without triggering operational guards.

---

## 13. JSON-LD Vocabulary and Complete Context

Every generated JSON-LD artifact MUST reference:

```json
{
  "@context": "./poc.context.jsonld"
}
```

The context copied to the output directory MUST be byte-identical to the locked canonical context.

The output context MUST define every unprefixed term used by normative artifacts. Undefined relative properties are prohibited.

Fixture-origin IRIs MUST always be emitted as absolute IRI strings in generated artifacts. The output context MUST NOT be dynamically extended with fixture prefixes. Fixed compiler-owned compact IRIs such as `run:`, `rule:`, `profile:`, `projection:`, and `html:` MAY be used because their mappings are locked.

### 13.1 Complete Context

File:

```text
contexts/poc.context.jsonld
```

Required content:

```json
{
  "@context": {
    "@version": 1.1,
    "rdf": { "@id": "http://www.w3.org/1999/02/22-rdf-syntax-ns#", "@prefix": true },
    "rdfs": { "@id": "http://www.w3.org/2000/01/rdf-schema#", "@prefix": true },
    "owl": { "@id": "http://www.w3.org/2002/07/owl#", "@prefix": true },
    "skos": { "@id": "http://www.w3.org/2004/02/skos/core#", "@prefix": true },
    "xsd": { "@id": "http://www.w3.org/2001/XMLSchema#", "@prefix": true },
    "obo": { "@id": "http://purl.obolibrary.org/obo/", "@prefix": true },
    "cco": { "@id": "https://www.commoncoreontologies.org/", "@prefix": true },
    "rp": { "@id": "https://example.org/relationship-presentation-poc/contract/", "@prefix": true },
    "projection": { "@id": "https://example.org/relationship-presentation-poc/projection/", "@prefix": true },
    "profile": { "@id": "https://example.org/relationship-presentation-poc/profile/", "@prefix": true },
    "rule": { "@id": "https://example.org/relationship-presentation-poc/rule/", "@prefix": true },
    "run": { "@id": "https://example.org/relationship-presentation-poc/run/", "@prefix": true },
    "html": { "@id": "https://example.org/relationship-presentation-poc/html/", "@prefix": true },

    "id": "@id",
    "type": "@type",
    "label": "rdfs:label",
    "comment": "rdfs:comment",
    "definition": "skos:definition",
    "example": "skos:example",
    "subClassOf": { "@id": "rdfs:subClassOf", "@type": "@id" },

    "PersonAssociation": "rp:PersonAssociation",
    "RelationalQuality": "obo:BFO_0000145",
    "specificallyDependsOn": { "@id": "obo:BFO_0000195", "@type": "@id" },
    "Person": "cco:ont00001262",
    "DesignativeName": "cco:ont00000003",
    "NonNameIdentifier": "cco:ont00000649",
    "designates": { "@id": "cco:ont00001916", "@type": "@id" },
    "differentFrom": { "@id": "owl:differentFrom", "@type": "@id" },

    "requestedDesignatorText": "projection:requestedDesignatorText",
    "targetArtifact": { "@id": "projection:targetArtifact", "@type": "@id" },
    "communicativeGoal": { "@id": "projection:communicativeGoal", "@type": "@id" },
    "audience": { "@id": "projection:audience", "@type": "@id" },
    "slideLimit": { "@id": "projection:slideLimit", "@type": "xsd:integer" },
    "outputFormat": { "@id": "projection:outputFormat", "@type": "@id" },
    "normalizedBy": { "@id": "projection:normalizedBy", "@type": "@id" },

    "sourceScope": { "@id": "projection:sourceScope", "@type": "@id" },
    "resolvedBy": { "@id": "projection:resolvedBy", "@type": "@id" },
    "resolutionStatus": { "@id": "projection:resolutionStatus", "@type": "@id" },
    "resolutionRule": { "@id": "projection:resolutionRule", "@type": "@id" },

    "contractVersion": "projection:contractVersion",
    "validatedRoot": { "@id": "projection:validatedRoot", "@type": "@id" },
    "status": { "@id": "projection:status", "@type": "@id" },
    "check": { "@id": "projection:check", "@container": "@set" },
    "code": "projection:code",
    "passed": { "@id": "projection:passed", "@type": "xsd:boolean" },
    "message": "projection:message",

    "root": { "@id": "projection:root", "@type": "@id" },
    "selectedSource": { "@id": "projection:selectedSource", "@container": "@list", "@type": "@id" },
    "selectionTrace": { "@id": "projection:selectionTrace", "@container": "@list" },
    "source": { "@id": "projection:source", "@type": "@id" },
    "reason": { "@id": "projection:reason", "@type": "@id" },
    "selectionRule": { "@id": "projection:selectionRule", "@type": "@id" },

    "hasDocumentContent": { "@id": "projection:hasDocumentContent", "@container": "@list", "@type": "@id" },
    "hasUnit": { "@id": "projection:hasUnit", "@container": "@list", "@type": "@id" },
    "sequence": { "@id": "projection:sequence", "@type": "xsd:integer" },
    "textValue": "projection:textValue",
    "hasContent": { "@id": "projection:hasContent", "@container": "@list", "@type": "@id" },
    "contentRole": { "@id": "projection:contentRole", "@type": "@id" },
    "derivedFrom": { "@id": "projection:derivedFrom", "@container": "@list", "@type": "@id" },
    "generatedBy": { "@id": "projection:generatedBy", "@type": "@id" },

    "profileRef": { "@id": "projection:profile", "@type": "@id" },
    "hasSlide": { "@id": "projection:hasSlide", "@container": "@list", "@type": "@id" },
    "hasRegion": { "@id": "projection:hasRegion", "@container": "@list", "@type": "@id" },
    "hasItem": { "@id": "projection:hasItem", "@container": "@list", "@type": "@id" },
    "projectsContent": { "@id": "projection:projectsContent", "@type": "@id" },
    "projectsNarrativeUnit": { "@id": "projection:projectsNarrativeUnit", "@type": "@id" },
    "intent": { "@id": "projection:intent", "@type": "@id" },
    "buttonLabel": "projection:buttonLabel",

    "projectsNode": { "@id": "projection:projectsNode", "@type": "@id" },
    "hasChild": { "@id": "html:hasChild", "@container": "@list", "@type": "@id" },
    "doctypeName": "html:doctypeName",
    "elementName": "html:elementName",
    "attribute": { "@id": "html:attribute", "@container": "@list" },
    "attributeName": "html:attributeName",
    "attributeValue": "html:attributeValue",
    "textNodeValue": "html:textNodeValue",
    "hiddenInitially": { "@id": "html:hiddenInitially", "@type": "xsd:boolean" },
    "htmlIntent": "html:intent",
    "domOrder": { "@id": "html:domOrder", "@type": "xsd:integer" }
  }
}
```

The context content is unchanged from v0.4.1; only its lock entry hash may change if bytes change, and v1.0 changes no bytes.

---

## 14. RDF Ordering Semantics

Every array in a generated JSON-LD artifact MUST be classified as one of:

1. semantic order encoded as `@list`;
2. semantic order recoverable through `sequence`;
3. unordered set encoded as `@set`;
4. canonical serialization order only.

v1.0 uses `@list` for every semantic order.

| Field | Ordering kind |
|---|---|
| `selectedSource` | Semantic order encoded as `@list` |
| `selectionTrace` | Semantic order encoded as `@list` |
| `derivedFrom` | Semantic trace order encoded as `@list` |
| `hasDocumentContent` | Semantic order encoded as `@list` |
| `hasUnit` | Semantic order encoded as `@list` |
| `hasContent` | Semantic order encoded as `@list` |
| `hasSlide` | Semantic order encoded as `@list` |
| `hasRegion` | Semantic order encoded as `@list` |
| `hasItem` | Semantic order encoded as `@list` |
| `hasChild` | DOM order encoded as `@list` |
| `attribute` | Canonical renderer order encoded as `@list` |
| `check` | Unordered set encoded as `@set`; serialized by ascending `code` |

Every ordered object that also has `sequence` MUST have integer sequence values beginning at 1 with no duplicates or gaps within its containing list.

The order of `derivedFrom` is explanatory trace order, not an assertion that RDF derivation is temporally sequential.

---

## 15. Controlled Request Contract

The request grammar is a single anchored template. After removal of at most one final line terminator, the request byte sequence, decoded as UTF-8, MUST equal exactly:

```text
Create a two-slide presentation explaining {T} to a general audience.
```

where `{T}` stands for the captured designator. Formally, in ABNF (RFC 5234, with `%s` marking case-sensitive literals):

```abnf
request    = %s"Create a two-slide presentation explaining "
             designator
             %s" to a general audience."
             [ line-end ]
designator = 1*UCHAR          ; one or more Unicode scalar values, per rules below
line-end   = CRLF / LF        ; at most one, ignored for grammar matching
```

Capture is defined by unique decomposition, not by pattern search: after removing the optional final line terminator, the string MUST begin with the exact fixed prefix and end with the exact fixed suffix, and the designator is everything between them. Because prefix and suffix are anchored to the string boundaries, this decomposition is unique; when the designator itself contains the literal ` to a general audience.`, the interior occurrence belongs to the designator and only the terminal occurrence is the suffix. This is equivalent to greedy capture and is normative: two conforming implementations MUST capture identical designators from identical bytes. Any string not admitting the decomposition MUST produce `REQUEST_GRAMMAR_MISMATCH`.

The captured designator MUST be:

- non-empty after NFC normalization → otherwise `REQUEST_GRAMMAR_MISMATCH`;
- case-sensitive;
- no longer than 256 Unicode scalar values → otherwise `DESIGNATOR_TOO_LONG`;
- free of the characters prohibited by Section 18 → otherwise `INVALID_CRITICAL_STRING`.

Other leading, trailing, or internal whitespace differences are significant and MUST fail with `REQUEST_GRAMMAR_MISMATCH`.

The parser MUST NOT perform fuzzy matching, semantic interpretation, LLM calls, web search, ontology lookup, or recovery.

Valid examples:

```text
Create a two-slide presentation explaining Relationship 42 to a general audience.
Create a two-slide presentation explaining Alpha to a general audience. Beta to a general audience.
```

In the second example the captured designator is `Alpha to a general audience. Beta` — the terminal suffix anchors the decomposition; the interior occurrence is designator content. Resolution then requires a Non-Name Identifier whose label equals that full string.

Invalid examples include:

```text
Create a three-slide presentation explaining Relationship 42 to a general audience.
Create a two-slide deck about Relationship 42.
Explain Relationship 42.
```

---

## 16. Supported Profile Contract

The CLI accepts `--profile`, but v1.0 supports only:

```text
profile:two-slide-explainer-v3
```

The profile identifier names a fixed projection program (Section 6.4). The profile document is that program's parameter block, and v1.0 requires every parameter it carries to be load-bearing:

- `projection:slideCount` MUST be read by the compiler, which MUST verify that the constructed narrative-unit count and slide count equal it; a construction that would diverge is an `INTERNAL_COMPILER_ERROR`.
- `projection:participantOrder` MUST be read by the compiler as the token selecting the participant ordering algorithm. v1.0 defines exactly one token, `utf16-code-unit-ascending-label`, whose algorithm is Section 18. Any other token MUST produce `UNSUPPORTED_PROFILE_CONTRACT` (unreachable under triple-set equality with the locked profile, but normative so that the token, not Section 18 alone, is the selection authority).
- Template and label members are consumed by the named rules that cite them.

`aspectRatio` is not a profile member in v1.0. The presentation surface's 16:9 aspect ratio is a property of the locked carrier stylesheet and is specified in Section 28.3, which is where it was always enforced. Its v0.4.x presence in the profile was a parameter with no consumer.

Profile conformance is equality of the expanded default-graph RDF triple set after:

- successful trusted-context processing;
- duplicate-triple collapse;
- NFC normalization of untagged string literals;
- exact datatype comparison;
- exact IRI comparison;
- rejection of blank nodes, named graphs, and additional triples.

Required profile content:

```json
{
  "@context": "../contexts/poc.context.jsonld",
  "@id": "profile:two-slide-explainer-v3",
  "@type": "projection:PresentationProfile",
  "projection:slideCount": 2,
  "projection:participantOrder": "utf16-code-unit-ascending-label",
  "projection:eligibleSourceClass": { "@id": "rp:PersonAssociation" },
  "projection:overviewRule": { "@id": "rule:person-association-overview-v1-0" },
  "projection:associationTemplate": "{participant1} is associated with {participant2}.",
  "projection:documentTitleTemplate": "{relationshipTitle} presentation",
  "projection:participantSlideTitle": "Participants",
  "projection:advanceLabel": "Next",
  "projection:backLabel": "Previous",
  "projection:outputFormat": { "@id": "projection:HTML" }
}
```

The profile identifier advances from `two-slide-explainer-v2` because the triple set changed (removal of `aspectRatio`, rule-IRI revision), consistent with the rule that a changed profile triple set is a new profile version.

Unknown profile identifiers MUST produce `UNSUPPORTED_PROFILE`.

A changed profile triple set MUST produce `UNSUPPORTED_PROFILE_CONTRACT`.

Template substitution MUST be nonrecursive and single-pass. A participant label containing `{participant2}` or a relationship title containing `{relationshipTitle}` MUST preserve that substring literally after its own placeholder insertion and MUST NOT trigger secondary substitution.

The profile is fixed for v1.0. The `--profile` option exists to make the contract boundary explicit, not to imply support for arbitrary profiles. Section 47.1 names the planned falsifier for profile-drivenness in the next major version.

---
## 17. Closed-World Fixture Contract

Let:

```text
T  requested designator text
D  resolving designator node
R  resolved Person Association node
P1 first participant node
P2 second participant node
N1 name node for P1
N2 name node for P2
L1 label of N1
L2 label of N2
```

Validation operates over one expanded JSON-LD 1.1 default RDF graph using:

- closed-world semantics;
- direct-assertion semantics;
- duplicate-triple collapse;
- no RDFS entailment;
- no OWL entailment;
- no subclass reasoning;
- no inverse-property reasoning;
- no `owl:sameAs` reasoning;
- no remote or local import expansion.

### 17.1 Required Resolving Designator

Exactly one named node `D` with an absolute IRI MUST satisfy:

```turtle
D rdf:type cco:ont00000649 .
D rdfs:label T .
D cco:ont00001916 R .
```

`D` MUST:

- have exactly one `rdfs:label` value in the source graph;
- designate exactly one entity;
- not be directly typed as any member of the Prohibited Meta-Type Set (Section 7.3);
- be selected by exact NFC-normalized equality between its label and `T`.

No other `cco:ont00000649` node may have an NFC-normalized `rdfs:label` equal to `T`.

### 17.2 Required Association Node

`R` MUST be a named node with an absolute IRI.

`R` MUST be directly typed as both:

```turtle
R rdf:type rp:PersonAssociation .
R rdf:type obo:BFO_0000145 .
```

`R` MUST NOT be directly typed as any member of the Prohibited Meta-Type Set.

`R` MAY be directly typed as `owl:NamedIndividual`.

### 17.3 Required Participants

`R` MUST have exactly two distinct outgoing `obo:BFO_0000195` objects after duplicate-triple collapse:

```turtle
R obo:BFO_0000195 P1 .
R obo:BFO_0000195 P2 .
```

`P1` and `P2` MUST:

- be named nodes with absolute IRIs;
- have different absolute IRI strings;
- each be directly typed `cco:ont00001262`;
- not be directly typed as any member of the Prohibited Meta-Type Set.

The fixture MUST additionally assert at least one of:

```turtle
P1 owl:differentFrom P2 .
P2 owl:differentFrom P1 .
```

Both directions MAY be asserted. Duplicate and reciprocal assertions count as evidence for the same required difference and do not create additional participants.

### 17.4 Required Participant Names

For each selected participant `P`, exactly one named node `N` with an absolute IRI MUST satisfy:

```turtle
N rdf:type cco:ont00000003 .
N cco:ont00001916 P .
N rdfs:label L .
```

Each selected `N` MUST:

- designate exactly one entity;
- have exactly one `rdfs:label` value;
- not be directly typed as any member of the Prohibited Meta-Type Set.

Each selected label `L` MUST be:

- an untagged RDF string literal originating from a JSON string;
- non-empty after NFC normalization;
- no longer than 256 Unicode scalar values.

Language-tagged labels are rejected in v1.0.

### 17.5 Selected-Individual Distinctness

The six selected individuals `D`, `R`, `P1`, `P2`, `N1`, `N2` MUST be six pairwise-distinct absolute IRI strings. Any coincidence of two roles on one IRI MUST fail with the check code `SELECTED_INDIVIDUALS_PAIRWISE_DISTINCT`.

The source graph MUST NOT assert `owl:sameAs`, in either direction, between any two selected individuals. A violation MUST fail with the check code `NO_OWL_SAMEAS_AMONG_SELECTED`.

Rationale, recorded so the checks are not weakened later: without entailment, the contract cannot detect that a node typed both `cco:ont00000649` and `rp:PersonAssociation` (a self-designating identifier-quality) is inconsistent under BFO, where generically and specifically dependent continuants are disjoint, or that a node typed both `cco:ont00000003` and `cco:ont00000649` violates CCO's own `owl:disjointWith` axiom between those classes. These two closed-world checks enforce the identity-level consequences of those upstream axioms at the cost of two set-membership tests, without importing entailment. General contradiction detection remains out of scope (Section 44); these checks are targeted at the selected neighborhood only.

### 17.6 Selected-Neighborhood Closure

For purposes of contract validation, the selected neighborhood comprises:

- `D` and all its `rdfs:label` and `cco:ont00001916` values;
- `R` and all its `rdf:type` and `obo:BFO_0000195` values;
- the selected participants and their relevant type and `owl:differentFrom` values;
- every `cco:ont00000003` node that designates either selected participant, including its designates and label values.

Additional fixture facts outside that neighborhood MAY exist. They MUST NOT:

- create another resolving designator for `T`;
- change a selected node's required cardinality;
- introduce a prohibited namespace anywhere in the source graph, in any RDF position (Section 40.2) → `SOURCE_GRAPH_CONTAMINATED`;
- introduce a named graph or blank node;
- place the generated association sentence in the source graph as an exact literal → `SOURCE_GRAPH_CONTAMINATED`.

The source graph MUST NOT contain the generated sentence that would result from the selected labels and fixed template. That sentence is a projection artifact.

### 17.7 Required Deterministic Failures

The fixture MUST fail when any of the following is present:

- zero or multiple matching Non-Name Identifiers;
- one resolving designator designating zero or multiple entities;
- a generic BFO relational quality lacking the direct `rp:PersonAssociation` type;
- a resolved association lacking the direct BFO relational-quality type;
- one or more than two participant objects;
- identical participant IRIs;
- missing Person type;
- missing `owl:differentFrom` evidence;
- an identity collapse among the six selected individuals;
- an `owl:sameAs` assertion between selected individuals;
- zero or multiple Designative Names for either participant;
- a selected name designating zero or multiple entities;
- zero or multiple labels on a contract-critical designator;
- a language-tagged critical label;
- blank nodes;
- named graphs;
- forbidden imports or contexts;
- duplicate JSON member names;
- source contamination in any RDF position;
- any structural limit violation.

---

## 18. Label, Unicode, and Sorting Rules

All contract-critical strings use:

- Unicode NFC normalization before comparison or rendering;
- valid Unicode scalar-value sequences with no unpaired surrogate code units;
- case-sensitive equality;
- UTF-16 code-unit ordering for participant sorting;
- no `localeCompare`;
- no locale-sensitive collation;
- no case folding.

Contract-critical labels and the captured request designator MUST NOT contain, and a violation MUST produce `INVALID_CRITICAL_STRING`:

- control characters in the ranges U+0000–U+001F or U+007F–U+009F;
- the bidirectional control characters U+061C, U+200E, U+200F, U+202A–U+202E, and U+2066–U+2069, which survive NFC and can visually reorder rendered slide text;
- Unicode noncharacters (U+FDD0–U+FDEF and the final two code points of every plane, U+FFFE, U+FFFF, U+1FFFE, U+1FFFF, and so on).

U+200C (ZWNJ) and U+200D (ZWJ) remain permitted deliberately: several orthographies, including Persian and Indic scripts, require them in legitimate personal names, and they do not reorder rendered text. This is a considered trade, not an omission.

The single permitted request-file line terminator is removed before designator capture and is not part of the captured string.

Participant ordering uses the algorithm named by the profile token `utf16-code-unit-ascending-label` (Section 16):

1. primary key: NFC-normalized participant display-name label by ascending UTF-16 code-unit order;
2. tie breaker: participant absolute IRI string by ascending UTF-16 code-unit order.

UTF-16 code-unit ordering is deliberately aligned with RFC 8785's object-member ordering so the project carries one string-ordering discipline, not two.

Identical participant labels are permitted when participant IRIs differ and `owl:differentFrom` is asserted. The rendered list MAY contain identical visible strings, but traceability MUST distinguish the name nodes and participants.

Request matching compares the NFC-normalized captured designator with NFC-normalized untagged identifier labels. Generated strings use the normalized values.

---

## 19. Canonical Fixture

The canonical request is:

```text
Create a two-slide presentation explaining Relationship 42 to a general audience.
```

The canonical fixture namespace is:

```text
https://example.org/relationship-presentation-poc/kg/
```

Canonical source facts:

```turtle
<https://example.org/relationship-presentation-poc/kg/relationship-42>
    rdf:type rp:PersonAssociation ;
    rdf:type obo:BFO_0000145 ;
    obo:BFO_0000195
        <https://example.org/relationship-presentation-poc/kg/alice> ,
        <https://example.org/relationship-presentation-poc/kg/bob> .

<https://example.org/relationship-presentation-poc/kg/alice>
    rdf:type cco:ont00001262 ;
    owl:differentFrom
        <https://example.org/relationship-presentation-poc/kg/bob> .

<https://example.org/relationship-presentation-poc/kg/bob>
    rdf:type cco:ont00001262 .

<https://example.org/relationship-presentation-poc/kg/relationship-42-identifier>
    rdf:type cco:ont00000649 ;
    cco:ont00001916
        <https://example.org/relationship-presentation-poc/kg/relationship-42> ;
    rdfs:label "Relationship 42" .

<https://example.org/relationship-presentation-poc/kg/alice-name>
    rdf:type cco:ont00000003 ;
    cco:ont00001916
        <https://example.org/relationship-presentation-poc/kg/alice> ;
    rdfs:label "Alice" .

<https://example.org/relationship-presentation-poc/kg/bob-name>
    rdf:type cco:ont00000003 ;
    cco:ont00001916
        <https://example.org/relationship-presentation-poc/kg/bob> ;
    rdfs:label "Bob" .
```

Canonical user-perceivable output:

```text
Document title: Relationship 42 presentation
Main accessible name: Relationship 42 presentation
Slide 1 title: Relationship 42
Slide 1 statement: Alice is associated with Bob.
Slide 1 button: Next
Slide 2 heading: Participants
Slide 2 items: Alice, Bob
Slide 2 button: Previous
```

The canonical fixture is a test fixture, not a compiler assumption.

---

## 20. Pipeline and Artifacts

v1.0 has seven intermediate JSON-LD artifacts plus manifests and HTML carriers:

1. Normalize request.
2. Resolve source scope.
3. Validate the resolved neighborhood.
4. Select content.
5. Construct narrative and reified text content.
6. Build a target-neutral presentation.
7. Create a complete HTML document projection.
8. Render, validate, manifest, and publish.

Successful output files are:

```text
.relationship-presentation-poc-owned
poc.context.jsonld
01-request.jsonld
02-resolution.jsonld
03-contract-validation.jsonld
04-content-manifest.jsonld
05-narrative.jsonld
06-presentation.jsonld
07-html-projection.jsonld
08-core-manifest.json
09-distribution-manifest.json
presentation.html
demo.html
validation-report.json
```

Artifacts 01–07 are JSON-LD. Manifests, reports, and the ownership sentinel are canonical plain JSON.

Every stage MUST consume only declared inputs and the output of preceding stages. It MUST NOT re-read hidden fixture-specific state.

---

## 21. Stage 1: Request Artifact

File:

```text
01-request.jsonld
```

Required canonical shape for the canonical fixture:

```json
{
  "@context": "./poc.context.jsonld",
  "@id": "run:request",
  "@type": "projection:ProjectionRequest",
  "targetArtifact": "projection:Presentation",
  "requestedDesignatorText": "Relationship 42",
  "communicativeGoal": "projection:Explain",
  "audience": "projection:GeneralAudience",
  "slideLimit": 2,
  "outputFormat": "projection:HTML",
  "normalizedBy": "rule:controlled-request-v1-0"
}
```

`requestedDesignatorText` is a literal string. IRI-valued fields MUST expand as IRIs under the locked context.

Acceptance checks:

- the request matches the anchored grammar exactly under the unique decomposition of Section 15;
- exactly one non-empty designator is captured;
- no field depends on fixture-specific hidden state.

---

## 22. Stage 2: Resolution Artifact

File:

```text
02-resolution.jsonld
```

The resolver MUST:

1. read `requestedDesignatorText`;
2. find exactly one direct `cco:ont00000649` node having the matching normalized label;
3. follow its direct `cco:ont00001916` assertion;
4. require exactly one designated entity;
5. record `D` and `R` as absolute IRIs.

Required canonical shape:

```json
{
  "@context": "./poc.context.jsonld",
  "@id": "run:resolution",
  "@type": "projection:ScopeResolution",
  "requestedDesignatorText": "Relationship 42",
  "sourceScope": "https://example.org/relationship-presentation-poc/kg/relationship-42",
  "resolvedBy": "https://example.org/relationship-presentation-poc/kg/relationship-42-identifier",
  "resolutionStatus": "projection:UniqueMatch",
  "resolutionRule": "rule:exact-designator-match-v1-0"
}
```

No fixture prefix may appear in canonical generated output.

---

## 23. Stage 3: Contract Validation Artifact

File:

```text
03-contract-validation.jsonld
```

The validator MUST evaluate the closed-world fixture contract for the resolved neighborhood, the distinctness rules of Section 17.5, and the global contamination rules.

Required canonical shape:

```json
{
  "@context": "./poc.context.jsonld",
  "@id": "run:contract-validation",
  "@type": "projection:ContractValidation",
  "contractVersion": "person-association-contract-v1.0",
  "validatedRoot": "https://example.org/relationship-presentation-poc/kg/relationship-42",
  "status": "projection:Passed",
  "check": [
    {
      "@id": "run:check-exactly-one-name-per-participant",
      "@type": "projection:ValidationCheck",
      "code": "EXACTLY_ONE_NAME_PER_PARTICIPANT",
      "passed": true
    },
    {
      "@id": "run:check-exactly-two-person-participants",
      "@type": "projection:ValidationCheck",
      "code": "EXACTLY_TWO_PERSON_PARTICIPANTS",
      "passed": true
    },
    {
      "@id": "run:check-no-owl-sameas-among-selected",
      "@type": "projection:ValidationCheck",
      "code": "NO_OWL_SAMEAS_AMONG_SELECTED",
      "passed": true
    },
    {
      "@id": "run:check-no-source-contamination",
      "@type": "projection:ValidationCheck",
      "code": "NO_SOURCE_GRAPH_CONTAMINATION",
      "passed": true
    },
    {
      "@id": "run:check-participants-asserted-different",
      "@type": "projection:ValidationCheck",
      "code": "PARTICIPANTS_ASSERTED_DIFFERENT",
      "passed": true
    },
    {
      "@id": "run:check-resolved-entity-is-bfo-relational-quality",
      "@type": "projection:ValidationCheck",
      "code": "RESOLVED_ENTITY_IS_BFO_RELATIONAL_QUALITY",
      "passed": true
    },
    {
      "@id": "run:check-resolved-entity-is-person-association",
      "@type": "projection:ValidationCheck",
      "code": "RESOLVED_ENTITY_IS_PERSON_ASSOCIATION",
      "passed": true
    },
    {
      "@id": "run:check-selected-individuals-pairwise-distinct",
      "@type": "projection:ValidationCheck",
      "code": "SELECTED_INDIVIDUALS_PAIRWISE_DISTINCT",
      "passed": true
    }
  ]
}
```

`check` is an RDF set and MUST serialize in ascending `code` order. The generated `@id` suffix MUST be the lowercase ASCII form of the code with underscores replaced by hyphens.

The success artifact records passed checks only because compilation stops on failure. Failure details belong in the detached error report described in Section 39.

---

## 24. Stage 4: Content Manifest Artifact

File:

```text
04-content-manifest.jsonld
```

The selector MUST include exactly:

1. `R`;
2. `D`;
3. the first sorted participant;
4. its name node;
5. the second sorted participant;
6. its name node.

Required canonical shape:

```json
{
  "@context": "./poc.context.jsonld",
  "@id": "run:manifest",
  "@type": "projection:ContentManifest",
  "root": "https://example.org/relationship-presentation-poc/kg/relationship-42",
  "selectedSource": [
    "https://example.org/relationship-presentation-poc/kg/relationship-42",
    "https://example.org/relationship-presentation-poc/kg/relationship-42-identifier",
    "https://example.org/relationship-presentation-poc/kg/alice",
    "https://example.org/relationship-presentation-poc/kg/alice-name",
    "https://example.org/relationship-presentation-poc/kg/bob",
    "https://example.org/relationship-presentation-poc/kg/bob-name"
  ],
  "selectionTrace": [
    {
      "@id": "run:trace-1",
      "@type": "projection:SelectionTrace",
      "sequence": 1,
      "source": "https://example.org/relationship-presentation-poc/kg/relationship-42",
      "reason": "projection:ResolvedRoot"
    },
    {
      "@id": "run:trace-2",
      "@type": "projection:SelectionTrace",
      "sequence": 2,
      "source": "https://example.org/relationship-presentation-poc/kg/relationship-42-identifier",
      "reason": "projection:ResolvingDesignator"
    },
    {
      "@id": "run:trace-3",
      "@type": "projection:SelectionTrace",
      "sequence": 3,
      "source": "https://example.org/relationship-presentation-poc/kg/alice",
      "reason": "projection:SpecificallyDependedOnParticipant"
    },
    {
      "@id": "run:trace-4",
      "@type": "projection:SelectionTrace",
      "sequence": 4,
      "source": "https://example.org/relationship-presentation-poc/kg/alice-name",
      "reason": "projection:DesignatesParticipant"
    },
    {
      "@id": "run:trace-5",
      "@type": "projection:SelectionTrace",
      "sequence": 5,
      "source": "https://example.org/relationship-presentation-poc/kg/bob",
      "reason": "projection:SpecificallyDependedOnParticipant"
    },
    {
      "@id": "run:trace-6",
      "@type": "projection:SelectionTrace",
      "sequence": 6,
      "source": "https://example.org/relationship-presentation-poc/kg/bob-name",
      "reason": "projection:DesignatesParticipant"
    }
  ],
  "selectionRule": "rule:person-association-neighborhood-v1-0"
}
```

Every selected node MUST have exactly one trace entry. No unselected source node may be used to produce presentation-visible or accessibility-tree content.

---
## 25. Stage 5: Narrative Artifact

File:

```text
05-narrative.jsonld
```

All generated user-perceivable strings are reified as `projection:TextContent` nodes. Presentation regions and HTML text or accessibility attributes project these content resources, not RDF predicate names.

### 25.1 Provenance Discipline

v1.0 separates two kinds of provenance and assigns each a home:

- **Character provenance** lives in `derivedFrom`. `derivedFrom` is defined as the ordered set of selected source nodes any of whose literal values contribute characters, after normalization and template substitution, to the generated `textValue`. Order is substitution order.
- **Eligibility provenance** lives in Stage 3. That the association node licensed generation at all is recorded by `03-contract-validation.jsonld` through `validatedRoot` and its checks, and by the selection trace in Stage 4. Eligibility is not restated in `derivedFrom`.

Consequences: the association sentence derives its characters from the two name labels only, so its `derivedFrom` is exactly the two name nodes; the association node and the resolving designator contribute no characters to it and do not appear there. The deck title and document title derive their characters from the resolving designator's label. `derivedFrom` MUST be present and non-empty for source-derived content and MUST be omitted for content taken verbatim from the supported profile; `generatedBy` identifies the profile-extraction rule. This definition is mechanically checkable: for every source-derived `textValue`, the renderer-independent validator MUST be able to reconstruct the string from the labels of exactly the listed nodes plus the named rule's fixed template.

The narrative builder MUST:

1. derive the relationship title from `D`'s selected label;
2. derive participant display names from `N1` and `N2` labels;
3. sort participants according to the profile-selected algorithm (Sections 16 and 18);
4. substitute profile placeholders nonrecursively;
5. create one document-title content node and exactly two narrative units, verifying the unit count against `projection:slideCount`.

Required canonical shape:

```json
{
  "@context": "./poc.context.jsonld",
  "@id": "run:narrative",
  "@type": "projection:Narrative",
  "hasDocumentContent": [
    {
      "@id": "run:document-title-content",
      "@type": "projection:TextContent",
      "sequence": 1,
      "contentRole": "projection:DocumentTitleContent",
      "textValue": "Relationship 42 presentation",
      "derivedFrom": [
        "https://example.org/relationship-presentation-poc/kg/relationship-42-identifier"
      ],
      "generatedBy": "rule:document-title-from-profile-v1-0"
    }
  ],
  "hasUnit": [
    {
      "@id": "run:narrative-unit-1",
      "@type": "projection:NarrativeUnit",
      "sequence": 1,
      "hasContent": [
        {
          "@id": "run:title-content-1",
          "@type": "projection:TextContent",
          "sequence": 1,
          "contentRole": "projection:DeckTitleContent",
          "textValue": "Relationship 42",
          "derivedFrom": [
            "https://example.org/relationship-presentation-poc/kg/relationship-42-identifier"
          ],
          "generatedBy": "rule:relationship-title-from-resolving-designator-v1-0"
        },
        {
          "@id": "run:primary-message-content-1",
          "@type": "projection:TextContent",
          "sequence": 2,
          "contentRole": "projection:PrimaryMessageContent",
          "textValue": "Alice is associated with Bob.",
          "derivedFrom": [
            "https://example.org/relationship-presentation-poc/kg/alice-name",
            "https://example.org/relationship-presentation-poc/kg/bob-name"
          ],
          "generatedBy": "rule:person-association-overview-v1-0"
        }
      ]
    },
    {
      "@id": "run:narrative-unit-2",
      "@type": "projection:NarrativeUnit",
      "sequence": 2,
      "hasContent": [
        {
          "@id": "run:slide-title-content-2",
          "@type": "projection:TextContent",
          "sequence": 1,
          "contentRole": "projection:SlideTitleContent",
          "textValue": "Participants",
          "generatedBy": "rule:participant-slide-title-from-profile-v1-0"
        },
        {
          "@id": "run:participant-item-content-1",
          "@type": "projection:TextContent",
          "sequence": 2,
          "contentRole": "projection:ParticipantItemContent",
          "textValue": "Alice",
          "derivedFrom": [
            "https://example.org/relationship-presentation-poc/kg/alice-name"
          ],
          "generatedBy": "rule:participant-name-label-v1-0"
        },
        {
          "@id": "run:participant-item-content-2",
          "@type": "projection:TextContent",
          "sequence": 3,
          "contentRole": "projection:ParticipantItemContent",
          "textValue": "Bob",
          "derivedFrom": [
            "https://example.org/relationship-presentation-poc/kg/bob-name"
          ],
          "generatedBy": "rule:participant-name-label-v1-0"
        }
      ]
    }
  ]
}
```

---

## 26. Stage 6: Target-Neutral Presentation Artifact

File:

```text
06-presentation.jsonld
```

The presentation artifact expresses presentation roles and navigation intents without HTML element or attribute names.

Required canonical shape:

```json
{
  "@context": "./poc.context.jsonld",
  "@id": "run:presentation",
  "@type": "projection:Presentation",
  "profileRef": "profile:two-slide-explainer-v3",
  "hasDocumentContent": [
    "run:document-title-content"
  ],
  "hasSlide": [
    {
      "@id": "run:slide-1",
      "@type": "projection:Slide",
      "sequence": 1,
      "projectsNarrativeUnit": "run:narrative-unit-1",
      "hasRegion": [
        {
          "@id": "run:slide-1-title-region",
          "@type": "projection:DeckTitleRegion",
          "sequence": 1,
          "projectsContent": "run:title-content-1"
        },
        {
          "@id": "run:slide-1-message-region",
          "@type": "projection:PrimaryMessageRegion",
          "sequence": 2,
          "projectsContent": "run:primary-message-content-1"
        },
        {
          "@id": "run:slide-1-navigation-region",
          "@type": "projection:NavigationRegion",
          "sequence": 3,
          "intent": "projection:Advance",
          "buttonLabel": "Next",
          "generatedBy": "rule:advance-navigation-from-profile-v1-0"
        }
      ]
    },
    {
      "@id": "run:slide-2",
      "@type": "projection:Slide",
      "sequence": 2,
      "projectsNarrativeUnit": "run:narrative-unit-2",
      "hasRegion": [
        {
          "@id": "run:slide-2-title-region",
          "@type": "projection:SlideTitleRegion",
          "sequence": 1,
          "projectsContent": "run:slide-title-content-2"
        },
        {
          "@id": "run:slide-2-items-region",
          "@type": "projection:ItemCollectionRegion",
          "sequence": 2,
          "hasItem": [
            {
              "@id": "run:slide-2-item-region-1",
              "@type": "projection:ItemRegion",
              "sequence": 1,
              "projectsContent": "run:participant-item-content-1"
            },
            {
              "@id": "run:slide-2-item-region-2",
              "@type": "projection:ItemRegion",
              "sequence": 2,
              "projectsContent": "run:participant-item-content-2"
            }
          ]
        },
        {
          "@id": "run:slide-2-navigation-region",
          "@type": "projection:NavigationRegion",
          "sequence": 3,
          "intent": "projection:GoBack",
          "buttonLabel": "Previous",
          "generatedBy": "rule:back-navigation-from-profile-v1-0"
        }
      ]
    }
  ]
}
```

No value of `elementName`, `attributeName`, `htmlIntent`, HTML tag name, DOM ID, CSS selector, or JavaScript event name may occur in this artifact.

---

## 27. Stage 7: Complete HTML Document Projection

File:

```text
07-html-projection.jsonld
```

Stage 7 is the first stage in which HTML semantics may occur.

The graph MUST represent:

- the doctype decision;
- `html`, `head`, and `body` document structure;
- character-set and viewport metadata;
- the user-perceivable document title;
- the main landmark and its accessible name;
- both slides and their initial visibility;
- headings, message, list, list items, and navigation buttons;
- stable DOM IDs and relationships;
- DOM order;
- the origin presentation or content node for each fixture-derived or user-perceivable value.

Fixed CSS source and fixed JavaScript source are versioned carrier resources generated in Stage 8 by named rules. They are not narrative content and need not be serialized as `html:TextNode` resources in this graph. Their generated bytes are covered by `presentation.html` in the core manifest.

### 27.1 Deterministic Mapping

| Presentation or document semantic | HTML semantic |
|---|---|
| document shell | `html`, `head`, `body` |
| `projection:DocumentTitleContent` | `title` text and `main[aria-label]` |
| `projection:Presentation` | `main` |
| `projection:Slide` | `section` |
| `projection:DeckTitleRegion` | `h1` |
| `projection:SlideTitleRegion` | `h2` |
| `projection:PrimaryMessageRegion` | `p` |
| `projection:ItemCollectionRegion` | `ul` |
| `projection:ItemRegion` | `li` |
| `projection:Advance` | `button[data-intent="advance"]` |
| `projection:GoBack` | `button[data-intent="back"]` |

This table is the content of the named rule `rule:html-document-projection-v1-0`. Every projected node bearing `projectsNode` or `projectsContent` and lacking its own `generatedBy` is generated by that rule through this table; the rule attribution is carried by the document node's `generatedBy` and applies to all such descendants.

The intent-token mapping is the named rule `rule:navigation-intent-token-v1-0`, a fixed lookup:

```text
projection:Advance → "advance"
projection:GoBack  → "back"
```

It is a lookup, not a derivation (the tokens are not lowercasings of the IRIs), and it is versioned like every other fixed decision.

The element and attribute vocabulary is allowlisted. The projector MUST reject any element name, attribute name, or intent value not generated by this fixed mapping.

### 27.2 Complete Canonical Artifact

```json
{
  "@context": "./poc.context.jsonld",
  "@id": "run:html-document",
  "@type": "html:Document",
  "generatedBy": "rule:html-document-projection-v1-0",
  "hasChild": [
    {
      "@id": "run:html-doctype",
      "@type": "html:Doctype",
      "domOrder": 1,
      "doctypeName": "html",
      "generatedBy": "rule:html5-doctype-v1-0"
    },
    {
      "@id": "run:html-root",
      "@type": "html:Element",
      "domOrder": 2,
      "elementName": "html",
      "generatedBy": "rule:html-document-shell-v1-0",
      "attribute": [
        {
          "@id": "run:html-root-lang",
          "@type": "html:Attribute",
          "attributeName": "lang",
          "attributeValue": "en",
          "generatedBy": "rule:document-language-v1-0"
        }
      ],
      "hasChild": [
        {
          "@id": "run:html-head",
          "@type": "html:Element",
          "domOrder": 1,
          "elementName": "head",
          "generatedBy": "rule:html-document-shell-v1-0",
          "hasChild": [
            {
              "@id": "run:html-meta-charset",
              "@type": "html:Element",
              "domOrder": 1,
              "elementName": "meta",
              "generatedBy": "rule:utf8-meta-v1-0",
              "attribute": [
                {
                  "@id": "run:html-meta-charset-attribute",
                  "@type": "html:Attribute",
                  "attributeName": "charset",
                  "attributeValue": "utf-8",
                  "generatedBy": "rule:utf8-meta-v1-0"
                }
              ]
            },
            {
              "@id": "run:html-meta-viewport",
              "@type": "html:Element",
              "domOrder": 2,
              "elementName": "meta",
              "generatedBy": "rule:viewport-meta-v1-0",
              "attribute": [
                {
                  "@id": "run:html-meta-viewport-name",
                  "@type": "html:Attribute",
                  "attributeName": "name",
                  "attributeValue": "viewport",
                  "generatedBy": "rule:viewport-meta-v1-0"
                },
                {
                  "@id": "run:html-meta-viewport-content",
                  "@type": "html:Attribute",
                  "attributeName": "content",
                  "attributeValue": "width=device-width, initial-scale=1",
                  "generatedBy": "rule:viewport-meta-v1-0"
                }
              ]
            },
            {
              "@id": "run:html-title",
              "@type": "html:Element",
              "domOrder": 3,
              "elementName": "title",
              "projectsContent": "run:document-title-content",
              "hasChild": [
                {
                  "@id": "run:html-title-text",
                  "@type": "html:TextNode",
                  "domOrder": 1,
                  "projectsContent": "run:document-title-content",
                  "textNodeValue": "Relationship 42 presentation"
                }
              ]
            },
            {
              "@id": "run:html-style",
              "@type": "html:Element",
              "domOrder": 4,
              "elementName": "style",
              "generatedBy": "rule:carrier-style-v1-0"
            }
          ]
        },
        {
          "@id": "run:html-body",
          "@type": "html:Element",
          "domOrder": 2,
          "elementName": "body",
          "generatedBy": "rule:html-document-shell-v1-0",
          "hasChild": [
            {
              "@id": "run:html-main",
              "@type": "html:Element",
              "domOrder": 1,
              "elementName": "main",
              "projectsNode": "run:presentation",
              "attribute": [
                {
                  "@id": "run:html-main-aria-label",
                  "@type": "html:Attribute",
                  "attributeName": "aria-label",
                  "attributeValue": "Relationship 42 presentation",
                  "projectsContent": "run:document-title-content"
                }
              ],
              "hasChild": [
                {
                  "@id": "run:html-slide-1",
                  "@type": "html:Element",
                  "domOrder": 1,
                  "elementName": "section",
                  "projectsNode": "run:slide-1",
                  "hiddenInitially": false,
                  "attribute": [
                    {
                      "@id": "run:html-slide-1-id",
                      "@type": "html:Attribute",
                      "attributeName": "id",
                      "attributeValue": "slide-1",
                      "generatedBy": "rule:stable-dom-identifiers-v1-0"
                    },
                    {
                      "@id": "run:html-slide-1-labelledby",
                      "@type": "html:Attribute",
                      "attributeName": "aria-labelledby",
                      "attributeValue": "slide-1-title",
                      "generatedBy": "rule:heading-reference-v1-0"
                    }
                  ],
                  "hasChild": [
                    {
                      "@id": "run:html-slide-1-title",
                      "@type": "html:Element",
                      "domOrder": 1,
                      "elementName": "h1",
                      "projectsNode": "run:slide-1-title-region",
                      "attribute": [
                        {
                          "@id": "run:html-slide-1-title-id",
                          "@type": "html:Attribute",
                          "attributeName": "id",
                          "attributeValue": "slide-1-title",
                          "generatedBy": "rule:stable-dom-identifiers-v1-0"
                        },
                        {
                          "@id": "run:html-slide-1-title-tabindex",
                          "@type": "html:Attribute",
                          "attributeName": "tabindex",
                          "attributeValue": "-1",
                          "generatedBy": "rule:navigation-focus-target-v1-0"
                        }
                      ],
                      "hasChild": [
                        {
                          "@id": "run:html-slide-1-title-text",
                          "@type": "html:TextNode",
                          "domOrder": 1,
                          "projectsContent": "run:title-content-1",
                          "textNodeValue": "Relationship 42"
                        }
                      ]
                    },
                    {
                      "@id": "run:html-slide-1-message",
                      "@type": "html:Element",
                      "domOrder": 2,
                      "elementName": "p",
                      "projectsNode": "run:slide-1-message-region",
                      "hasChild": [
                        {
                          "@id": "run:html-slide-1-message-text",
                          "@type": "html:TextNode",
                          "domOrder": 1,
                          "projectsContent": "run:primary-message-content-1",
                          "textNodeValue": "Alice is associated with Bob."
                        }
                      ]
                    },
                    {
                      "@id": "run:html-slide-1-next",
                      "@type": "html:Element",
                      "domOrder": 3,
                      "elementName": "button",
                      "projectsNode": "run:slide-1-navigation-region",
                      "htmlIntent": "advance",
                      "attribute": [
                        {
                          "@id": "run:html-slide-1-next-type",
                          "@type": "html:Attribute",
                          "attributeName": "type",
                          "attributeValue": "button",
                          "generatedBy": "rule:native-button-v1-0"
                        },
                        {
                          "@id": "run:html-slide-1-next-intent",
                          "@type": "html:Attribute",
                          "attributeName": "data-intent",
                          "attributeValue": "advance",
                          "generatedBy": "rule:navigation-intent-token-v1-0",
                          "projectsNode": "run:slide-1-navigation-region"
                        }
                      ],
                      "hasChild": [
                        {
                          "@id": "run:html-slide-1-next-text",
                          "@type": "html:TextNode",
                          "domOrder": 1,
                          "projectsNode": "run:slide-1-navigation-region",
                          "textNodeValue": "Next"
                        }
                      ]
                    }
                  ]
                },
                {
                  "@id": "run:html-slide-2",
                  "@type": "html:Element",
                  "domOrder": 2,
                  "elementName": "section",
                  "projectsNode": "run:slide-2",
                  "hiddenInitially": true,
                  "attribute": [
                    {
                      "@id": "run:html-slide-2-id",
                      "@type": "html:Attribute",
                      "attributeName": "id",
                      "attributeValue": "slide-2",
                      "generatedBy": "rule:stable-dom-identifiers-v1-0"
                    },
                    {
                      "@id": "run:html-slide-2-labelledby",
                      "@type": "html:Attribute",
                      "attributeName": "aria-labelledby",
                      "attributeValue": "slide-2-title",
                      "generatedBy": "rule:heading-reference-v1-0"
                    },
                    {
                      "@id": "run:html-slide-2-hidden",
                      "@type": "html:Attribute",
                      "attributeName": "hidden",
                      "attributeValue": "",
                      "generatedBy": "rule:initial-slide-visibility-v1-0"
                    }
                  ],
                  "hasChild": [
                    {
                      "@id": "run:html-slide-2-title",
                      "@type": "html:Element",
                      "domOrder": 1,
                      "elementName": "h2",
                      "projectsNode": "run:slide-2-title-region",
                      "attribute": [
                        {
                          "@id": "run:html-slide-2-title-id",
                          "@type": "html:Attribute",
                          "attributeName": "id",
                          "attributeValue": "slide-2-title",
                          "generatedBy": "rule:stable-dom-identifiers-v1-0"
                        },
                        {
                          "@id": "run:html-slide-2-title-tabindex",
                          "@type": "html:Attribute",
                          "attributeName": "tabindex",
                          "attributeValue": "-1",
                          "generatedBy": "rule:navigation-focus-target-v1-0"
                        }
                      ],
                      "hasChild": [
                        {
                          "@id": "run:html-slide-2-title-text",
                          "@type": "html:TextNode",
                          "domOrder": 1,
                          "projectsContent": "run:slide-title-content-2",
                          "textNodeValue": "Participants"
                        }
                      ]
                    },
                    {
                      "@id": "run:html-slide-2-list",
                      "@type": "html:Element",
                      "domOrder": 2,
                      "elementName": "ul",
                      "projectsNode": "run:slide-2-items-region",
                      "hasChild": [
                        {
                          "@id": "run:html-slide-2-item-1",
                          "@type": "html:Element",
                          "domOrder": 1,
                          "elementName": "li",
                          "projectsNode": "run:slide-2-item-region-1",
                          "hasChild": [
                            {
                              "@id": "run:html-slide-2-item-1-text",
                              "@type": "html:TextNode",
                              "domOrder": 1,
                              "projectsContent": "run:participant-item-content-1",
                              "textNodeValue": "Alice"
                            }
                          ]
                        },
                        {
                          "@id": "run:html-slide-2-item-2",
                          "@type": "html:Element",
                          "domOrder": 2,
                          "elementName": "li",
                          "projectsNode": "run:slide-2-item-region-2",
                          "hasChild": [
                            {
                              "@id": "run:html-slide-2-item-2-text",
                              "@type": "html:TextNode",
                              "domOrder": 1,
                              "projectsContent": "run:participant-item-content-2",
                              "textNodeValue": "Bob"
                            }
                          ]
                        }
                      ]
                    },
                    {
                      "@id": "run:html-slide-2-previous",
                      "@type": "html:Element",
                      "domOrder": 3,
                      "elementName": "button",
                      "projectsNode": "run:slide-2-navigation-region",
                      "htmlIntent": "back",
                      "attribute": [
                        {
                          "@id": "run:html-slide-2-previous-type",
                          "@type": "html:Attribute",
                          "attributeName": "type",
                          "attributeValue": "button",
                          "generatedBy": "rule:native-button-v1-0"
                        },
                        {
                          "@id": "run:html-slide-2-previous-intent",
                          "@type": "html:Attribute",
                          "attributeName": "data-intent",
                          "attributeValue": "back",
                          "generatedBy": "rule:navigation-intent-token-v1-0",
                          "projectsNode": "run:slide-2-navigation-region"
                        }
                      ],
                      "hasChild": [
                        {
                          "@id": "run:html-slide-2-previous-text",
                          "@type": "html:TextNode",
                          "domOrder": 1,
                          "projectsNode": "run:slide-2-navigation-region",
                          "textNodeValue": "Previous"
                        }
                      ]
                    }
                  ]
                }
              ]
            },
            {
              "@id": "run:html-script",
              "@type": "html:Element",
              "domOrder": 2,
              "elementName": "script",
              "generatedBy": "rule:carrier-navigation-script-v1-0"
            }
          ]
        }
      ]
    }
  ]
}
```

### 27.3 Projection Invariants

- Every HTML document, doctype, element, attribute, and text node MUST have a stable `@id`.
- Every fixture-derived or user-perceivable text node or attribute value MUST project a `projection:TextContent` node or deterministic navigation region.
- The `style` and `script` elements are the only projected elements whose fixed locked text payload is inserted by the renderer without an `html:TextNode` resource; their generating rules and locked source files MUST match.
- Every fixed shell or structural value MUST identify a named deterministic rule either directly or through its containing generated node; nodes generated by the Table 27.1 mapping are attributed to `rule:html-document-projection-v1-0` through the document node.
- An element's `htmlIntent` value, its `data-intent` attribute value, and the `rule:navigation-intent-token-v1-0` mapping of its region's `intent` MUST be equal.
- `domOrder` MUST agree with `hasChild` list order.
- Attribute-list order is canonical serialization order and MUST match the example.
- `hiddenInitially` MUST agree with presence or absence of the `hidden` attribute.
- HTML text and attribute values MUST be treated as data, never as markup or code.
- The graph MUST contain no source-graph assertions. `projectsNode` and `projectsContent` are projection trace links only.

---
## 28. Stage 8: Rendering and Fixed Carriers

### 28.1 Canonical Presentation HTML

File:

```text
presentation.html
```

Required canonical output for the canonical fixture:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Relationship 42 presentation</title>
    <style>
      /* fixed locked stylesheet generated by rule:carrier-style-v1-0 */
    </style>
  </head>
  <body>
    <main aria-label="Relationship 42 presentation">
      <section id="slide-1" aria-labelledby="slide-1-title">
        <h1 id="slide-1-title" tabindex="-1">Relationship 42</h1>
        <p>Alice is associated with Bob.</p>
        <button type="button" data-intent="advance">Next</button>
      </section>
      <section id="slide-2" aria-labelledby="slide-2-title" hidden>
        <h2 id="slide-2-title" tabindex="-1">Participants</h2>
        <ul>
          <li>Alice</li>
          <li>Bob</li>
        </ul>
        <button type="button" data-intent="back">Previous</button>
      </section>
    </main>
    <script>
      /* fixed locked navigation script generated by rule:carrier-navigation-script-v1-0 */
    </script>
  </body>
</html>
```

The placeholder comments above stand for the full locked payloads of `carrier/presentation.css` and `carrier/navigation.js`; the published document embeds the payload bytes, not the comments. The serialized document for a given compiler version MUST be byte-deterministic. Formatting is fixed by the renderer, and goldens assert exact bytes for canonical fixtures.

### 28.2 Contextual Escaping

The renderer MUST apply context-appropriate escaping at every insertion site:

- text nodes: escape `&`, `<`, `>`;
- double-quoted attribute values: escape `&`, `<`, `>`, `"`;
- no fixture text may be inserted into element names, attribute names, CSS, JavaScript, comments, or URLs.

Escaping MUST be centralized in one audited module exposing one escaper per insertion context. The renderer MUST NOT concatenate unescaped fixture text.

### 28.3 Fixed Stylesheet Contract

`carrier/presentation.css` is locked by hash and inserted verbatim into `<style>` by `rule:carrier-style-v1-0`. It MUST:

- provide the presentation surface with a 16:9 aspect ratio (this is a carrier property; it was a consumerless profile parameter before v1.0 and is owned here now);
- provide visible layout for sections, headings, paragraph, list, and buttons;
- preserve a visible keyboard focus indicator for buttons and focused headings;
- avoid `display: none` on focusable controls in the visible slide;
- contain no external references (no `@import`, no `url(...)` fetches).

The payload bytes MUST NOT contain the byte sequence `</style` in any ASCII case variant; HTML terminates a raw-text `style` element at that sequence regardless of CSS syntax, and the constraint is on bytes, not on CSS semantics. This is a normative property of the locked file, verified by conformance test (Section 42.17); the renderer MUST additionally verify it before insertion and treat a violation as `INTERNAL_COMPILER_ERROR`.

### 28.4 Fixed Navigation Script Contract

`carrier/navigation.js` is locked by hash and inserted verbatim into `<script>` by `rule:carrier-navigation-script-v1-0`. It MUST:

1. use only DOM APIs available in the locked DOM test implementation and supported evergreen browsers;
2. attach one delegated click listener;
3. interpret only `data-intent="advance"` and `data-intent="back"`;
4. maintain one integer slide index over the ordered `section` elements inside `main`;
5. toggle only the `hidden` attribute to change visibility;
6. move focus to the newly visible slide's heading;
7. perform no network requests, no dynamic script or style injection, no `eval`, no `Function` constructor, no timers, and no storage access;
8. tolerate repeated clicks at boundaries without error.

The payload bytes MUST NOT contain the byte sequence `</script` in any ASCII case variant (the same raw-text termination rule; a string literal containing it would truncate the element). Conventional escaping such as `<\/script` satisfies the constraint. Verified by conformance test; the renderer MUST additionally verify before insertion and treat a violation as `INTERNAL_COMPILER_ERROR`.

### 28.5 Renderer Validation

Before publication, the renderer MUST parse its own serialized document with the locked DOM implementation and verify:

- document structure matches the Stage 7 projection graph, including element order and attributes;
- every projected text node and attribute value equals its projected content `textValue`;
- every element's `data-intent` value equals both its `htmlIntent` and the `rule:navigation-intent-token-v1-0` token of its region's intent;
- slide 2 is initially hidden and slide 1 is not;
- both carrier payloads are byte-identical to their locked files and free of their terminating byte sequences;
- exactly one `main`, one `h1`, and one `script` exist;
- IDs are unique and `aria-labelledby` references resolve.

Any failure is `INTERNAL_COMPILER_ERROR`.

---

## 29. Accessibility Contract

The published presentation MUST provide:

- a `main` landmark whose accessible name equals the document-title content;
- one `h1` on slide 1 and one `h2` on slide 2, each referenced by `aria-labelledby` on its section;
- native `button` elements with `type="button"` and visible text labels from the profile;
- keyboard operability of navigation with Enter and Space through native button semantics;
- focus movement to the newly visible slide's heading on navigation;
- `tabindex="-1"` on slide headings so script focus works without adding headings to the tab order;
- initial visibility state expressed with the `hidden` attribute only;
- no ARIA roles that override native semantics;
- no positive `tabindex` values.

Accessibility-tree verification in tests uses the locked DOM implementation: accessible names, heading levels, button names, and hidden state are asserted for both slides.

---

## 30. Demo Page

File:

```text
demo.html
```

`demo.html` is a diagnostic viewer. It MUST:

- present the generated presentation and the artifact list;
- render every displayed artifact value and fixture string as escaped text;
- execute no fixture-derived script and load no network resources;
- function when opened from the local filesystem.

If the demo embeds the presentation with `iframe[srcdoc]`, the embedded document's scripts run only when the sandbox permits them. The demo MUST use `sandbox="allow-scripts"` without `allow-same-origin`. The sandbox attribute does not prohibit network access; the absence of network activity is a property of the locked navigation script (Section 28.4, item 7) and of the locked stylesheet (Section 28.3), not of the sandbox. The demo MUST NOT be described as network-isolated by sandboxing; it is network-silent because its only executable payload is locked and makes no requests.

`demo.html` is included in the distribution manifest but is not part of the deterministic core fingerprint.

---

## 31. Deterministic Stage 8 Build Order

Stage 8 MUST execute in this order:

1. Render `presentation.html` from the Stage 7 graph and locked carriers.
2. Validate the rendered document (Section 28.5).
3. Write `poc.context.jsonld` and artifacts `01`–`07` into staging.
4. Write `presentation.html` into staging.
5. Compute SHA-256 for the context, artifacts `01`–`07`, and `presentation.html`.
6. Build and write `08-core-manifest.json`; compute the core fingerprint over its canonical bytes.
7. Build and write `validation-report.json`, which may reference the core fingerprint.
8. Build and write `demo.html`, which may display the core fingerprint.
9. Write the ownership sentinel.
10. Build and write `09-distribution-manifest.json` over the sentinel, core manifest, validation report, and demo; compute the distribution fingerprint over its canonical bytes.
11. Publish per Section 38 and print the success line.

Fingerprint-occurrence rules:

- files listed in the core manifest MUST NOT contain the core fingerprint;
- the validation report and demo MAY reference the core fingerprint;
- the distribution manifest is the only file that may carry the distribution fingerprint, over its own canonicalized content excluding its embedded fingerprint member;
- the success line reports both fingerprints.

Dependency sketch:

```text
context, 01..07, presentation.html
        │  (hashes)
        ▼
08-core-manifest.json ──► core fingerprint
        │                        │
        ▼                        ▼
validation-report.json      demo.html
        │                        │
        └────────┬───────────────┘
                 ▼
        ownership sentinel
                 ▼
09-distribution-manifest.json ──► distribution fingerprint
```

Nonnormative note: Sections 31 through 39 form a self-contained publication substrate — acyclic manifests, canonical hashing, ownership, locking, staged replacement, recovery, and failure reporting — with no dependence on the semantic pipeline. They are a candidate for extraction as a standalone specification reusable by other services in the portfolio. v1.0 deliberately keeps them inline; extraction, if it happens, is a future editorial act that MUST NOT change their normative content silently.

---

## 32. Canonical JSON and Hashing

### 32.1 Hash Algorithm

All fingerprints and file hashes use SHA-256 over exact file bytes, lowercase hexadecimal.

### 32.2 Manifest Fingerprint Canonicalization

The core and distribution manifests are canonical JSON per RFC 8785 (JCS): UTF-8, no insignificant whitespace, lexicographic member ordering by UTF-16 code units, shortest-form JSON number serialization, LF-terminated file.

Fingerprint computation for a manifest:

1. parse the manifest with a duplicate-member-rejecting parser;
2. remove the manifest's own fingerprint member;
3. serialize per RFC 8785;
4. hash the canonical bytes.

All numeric values in manifests MUST be non-negative integers within the IEEE-754 exactly-representable safe range, so RFC 8785 number serialization is exact.

### 32.3 Generated JSON-LD Serialization and Key Order

Generated JSON-LD artifacts are serialized deterministically: two-space indentation, LF line endings, terminal LF, and fixed key order.

The fixed key order for each generated `@type` is defined as the union of member names across all normative occurrences of that type in this specification, in order of first appearance. Objects that omit optional members serialize their present members in that same relative order. This closes the gap where two occurrences of one type carry different member subsets.

Worked example — `html:Attribute` occurs with three optional members across Section 27.2; its union order is:

| Position | Member |
|---:|---|
| 1 | `@id` |
| 2 | `@type` |
| 3 | `attributeName` |
| 4 | `attributeValue` |
| 5 | `generatedBy` |
| 6 | `projectsContent` |
| 7 | `projectsNode` |

An attribute node carrying only `generatedBy` serializes it in position 5; one carrying `generatedBy` and `projectsNode` serializes them in positions 5 and 7 relative order. Goldens pin the result; the union rule is what makes the goldens derivable rather than merely asserted.

JSON strings use minimal JSON escaping; characters requiring escapes serialize as `\"`, `\\`, `\n`, `\r`, `\t`, or lowercase `\uXXXX` where mandatory.

### 32.4 Cross-Platform Byte Discipline

All generated text files use UTF-8 without BOM and LF line endings on every platform. Release packaging MUST protect goldens and locked carrier bytes from newline translation (for example, `.gitattributes` with `-text` or equivalent).

---

## 33. Core Manifest

File:

```text
08-core-manifest.json
```

Required logical content:

```json
{
  "manifestVersion": "core-manifest-v1.0",
  "compiler": {
    "name": "relationship-presentation-poc",
    "version": "1.0.0",
    "sourceCommit": "<full-commit-sha>"
  },
  "locks": [
    { "role": "runtime-lock", "path": "runtime.lock.json", "sha256": "<sha256>" },
    { "role": "package-lock", "path": "package-lock.json", "sha256": "<sha256>" },
    { "role": "artifact-lock", "path": "artifact.lock.json", "sha256": "<sha256>" },
    { "role": "ontology-lock", "path": "ontology.lock.json", "sha256": "<sha256>" },
    { "role": "sbom", "path": "sbom.json", "sha256": "<sha256>" }
  ],
  "inputs": [
    { "role": "source", "name": "source.jsonld", "sha256": "<sha256>" },
    { "role": "request", "name": "request.txt", "sha256": "<sha256>" },
    { "role": "profile", "name": "profile.jsonld", "sha256": "<sha256>" },
    { "role": "context", "name": "poc.context.jsonld", "sha256": "<sha256>" },
    { "role": "contract", "name": "person-association-contract.jsonld", "sha256": "<sha256>" },
    { "role": "carrier-style", "name": "presentation.css", "sha256": "<sha256>" },
    { "role": "carrier-navigation", "name": "navigation.js", "sha256": "<sha256>" }
  ],
  "outputs": [
    { "role": "output-context", "path": "poc.context.jsonld", "sha256": "<sha256>" },
    { "role": "stage-01", "path": "01-request.jsonld", "sha256": "<sha256>" },
    { "role": "stage-02", "path": "02-resolution.jsonld", "sha256": "<sha256>" },
    { "role": "stage-03", "path": "03-contract-validation.jsonld", "sha256": "<sha256>" },
    { "role": "stage-04", "path": "04-content-manifest.jsonld", "sha256": "<sha256>" },
    { "role": "stage-05", "path": "05-narrative.jsonld", "sha256": "<sha256>" },
    { "role": "stage-06", "path": "06-presentation.jsonld", "sha256": "<sha256>" },
    { "role": "stage-07", "path": "07-html-projection.jsonld", "sha256": "<sha256>" },
    { "role": "presentation", "path": "presentation.html", "sha256": "<sha256>" }
  ],
  "coreFingerprint": "<sha256>"
}
```

Input entries use logical role names, not user paths. The manifest MUST NOT contain absolute paths, output-directory names, timestamps, or environment identifiers. `sourceCommit` follows the release-packaging injection semantics of Section 10.2.

The core manifest excludes itself, the validation report, the demo, the sentinel, and the distribution manifest.

---

## 34. Validation Report

File:

```text
validation-report.json
```

Required logical content:

```json
{
  "reportVersion": "validation-report-v1.0",
  "requestGrammarMatched": true,
  "designatorResolved": true,
  "resolutionStatus": "UniqueMatch",
  "fixtureContractSatisfied": true,
  "selectedIndividualsPairwiseDistinct": true,
  "profileSupported": true,
  "sourceContaminationDetected": false,
  "escapingApplied": true,
  "renderedDocumentValidated": true,
  "accessibilityChecksPassed": true,
  "artifactHashesRecorded": true,
  "coreFingerprint": "<sha256>"
}
```

The report MUST NOT claim:

- `navigationWorks`;
- `outputIsDeterministic`;
- `fixtureParametric`;
- `productionReady`;
- `distributionManifestPresent` or `distributionVerified`.

Those properties are established by the test suite and release evidence, not by a single run. The report MUST NOT include the distribution fingerprint.

---

## 35. Distribution Manifest

File:

```text
09-distribution-manifest.json
```

Required logical content:

```json
{
  "manifestVersion": "distribution-manifest-v1.0",
  "coreManifest": { "path": "08-core-manifest.json", "sha256": "<sha256>" },
  "files": [
    { "role": "ownership-sentinel", "path": ".relationship-presentation-poc-owned", "sha256": "<sha256>" },
    { "role": "core-manifest", "path": "08-core-manifest.json", "sha256": "<sha256>" },
    { "role": "validation-report", "path": "validation-report.json", "sha256": "<sha256>" },
    { "role": "demo", "path": "demo.html", "sha256": "<sha256>" }
  ],
  "distributionFingerprint": "<sha256>"
}
```

A distribution verifier MUST, in order:

1. parse the distribution manifest with duplicate-member rejection;
2. verify the distribution fingerprint over its canonicalized content excluding the fingerprint member;
3. verify every listed file hash, including the sentinel;
4. verify the core manifest hash and then the core fingerprint;
5. verify every core-listed output hash;
6. report any extra, missing, or mismatching files.

The distribution manifest does not include itself in `files`.

---

## 36. Determinism Guarantee

For identical input bytes, identical locked artifacts, and the same compiler version, the following MUST be byte-identical across runs, platforms, and directories:

- context copy, artifacts `01`–`07`, `presentation.html`;
- `08-core-manifest.json`, `validation-report.json`, `09-distribution-manifest.json`;
- the ownership sentinel;
- the success line;
- for nonconforming invocations, the single stderr error line, per the failure ordering of Section 9.7.

`demo.html` MUST be deterministic given the same build outputs but is excluded from the core fingerprint.

The implementation MUST NOT allow iteration order of hash maps, filesystem listing order, locale, environment variables, wall-clock time, or random values to influence canonical bytes or the emitted error code. Where ordering exists, it MUST come from this specification.

Determinism tests MUST compare independent runs executed in separate processes with different output directories, on both supported platforms.

A future `semanticSha256` (hash over expanded RDF quads) MAY be added alongside byte hashes in a later version; v1.0 asserts byte determinism only.

---

## 37. Ownership Sentinel

File:

```text
.relationship-presentation-poc-owned
```

Required logical content:

```json
{
  "sentinelVersion": "owned-output-v1.0",
  "owner": "relationship-presentation-poc",
  "purpose": "Marks this directory as compiler-owned output eligible for replacement."
}
```

The sentinel is canonical JSON and participates in the distribution manifest.

Replacement eligibility of an existing directory requires all of:

- the sentinel is present, parseable, and has `owner` equal to `relationship-presentation-poc` and a `sentinelVersion` this compiler recognizes as its own lineage;
- a parseable `09-distribution-manifest.json` with the expected `manifestVersion`;
- no unexpected extra entries beyond documented outputs and recovery artifacts.

v1.0 recognizes only `owned-output-v1.0`. Directories published by the v0.4.x POC lineage carry `owned-output-v0.4.1` and are deliberately not owned by v1.0: replacing them requires manual removal by the operator, and the compiler MUST fail with `OUTPUT_NOT_OWNED` rather than adopt them. This is the conservative reading of an ownership boundary across a major-version line.

If any condition fails, the compiler MUST fail with `OUTPUT_NOT_OWNED` and MUST NOT delete or overwrite anything.

---

## 38. Output Safety and Recoverable Replacement

### 38.1 Path Resolution Rules

Before any output mutation:

1. resolve the real path of the output parent directory;
2. reject output paths whose final component is a symlink → `UNSAFE_OUTPUT_PATH`;
3. reject existing output directories that are symlinks → `UNSAFE_OUTPUT_PATH`;
4. reject outputs inside the compiler package, inside any input directory, or equal to any input path → `INPUT_OUTPUT_OVERLAP`;
5. reject devices, sockets, pipes, and other special files → `UNSAFE_OUTPUT_PATH`;
6. compare identity with device and inode (or platform equivalent), not string prefixes;
7. when `--replace` is absent and the output target exists → `OUTPUT_EXISTS` (checked in phase 3 of Section 9.7, before compilation).

### 38.2 Output Lock

Concurrent builds targeting one output MUST be excluded through an OS advisory lock with automatic release on process termination — `flock` semantics on POSIX, `LockFileEx` semantics on Windows — acquired on a deterministic sibling lock file named `<output-basename>.lock` in the output parent directory.

The Node.js standard library provides no such lock; `node:fs` exposes neither `flock` nor `LockFileEx`. Therefore the lock MUST be provided by the dependency recorded as `filesystemLock` in the runtime lock (Section 10.2) and enumerated in the SBOM. Selecting that dependency is a Phase 0 decision (Section 45). A native module is acceptable; the requirement is on the semantics, not the implementation language.

Marker-file schemes (exclusive-create of an ordinary file, PID files, mkdir locks) MUST NOT be used as the exclusion mechanism: a killed process leaves a stale marker that either blocks future builds or invites unsafe automatic cleanup, and v1.0 chooses neither. The OS-held lock is the mechanism precisely because the operating system releases it when the holder dies.

If the lock is already held, the compiler MUST fail immediately with `OUTPUT_LOCKED`. It MUST NOT wait, retry, or steal. Lock-file content is not significant; its existence when unheld is not an error.

### 38.3 Staging

Builds write into a fresh staging directory created with a mkdtemp-style unique-name primitive in the output parent, never inside an existing published output directory. Staging names are operational values excluded from canonical bytes.

### 38.4 Existing Output Handling

Under `--replace`, an existing target is validated for ownership per Section 37 before any mutation. `OUTPUT_NOT_OWNED` aborts with the target untouched.

### 38.5 Publication of a New Output

When the target does not exist, publication is a single atomic rename of staging to the target within the same filesystem. If rename fails because the parent is on another filesystem, the build MUST fail rather than degrade to copy-then-delete.

### 38.6 Recoverable Replacement Protocol

When the target exists and is owned, replacement MUST follow a journaled sequence:

1. acquire the output lock (Section 38.2);
2. validate ownership (Section 38.4);
3. write the completed build into staging and fsync files, directory entries, and the parent directory to the extent the platform supports;
4. write a journal file `<output-basename>.replace-journal.json` in the output parent recording target, staging, and backup names and the intended sequence, then fsync it;
5. rename the current target to the backup name;
6. rename staging to the target;
7. delete the backup after successful publication;
8. delete the journal and release the lock.

Journal and backup names are deterministic siblings derived from the output basename.

### 38.7 Recovery Rules

On startup, holding the lock, the compiler MUST inspect the parent for a journal:

- journal present, target missing, backup present → complete or roll back per journal state deterministically;
- journal present, target present, staging or backup residue present → finish the journal's declared step order or fail with `OUTPUT_RECOVERY_REQUIRED` without deleting user data;
- journal unreadable or inconsistent → `OUTPUT_RECOVERY_REQUIRED`.

Recovery MUST never delete a directory that fails ownership validation.

### 38.8 Detached Failure Reports

On validation failure, the compiler MUST NOT write into the output target. The error report path is the sibling `<output-basename>.error-report.json` in the output parent. Its content follows Section 39. If even the parent is unwritable, the stderr line is the sole failure surface.

---
## 39. Error Reports

File on failure:

```text
<output-basename>.error-report.json
```

Required logical content:

```json
{
  "errorVersion": "error-report-v1.0",
  "code": "FIXTURE_CONTRACT_FAILED",
  "contractVersion": "person-association-contract-v1.0",
  "violations": [
    {
      "code": "EXACTLY_TWO_PERSON_PARTICIPANTS",
      "source": "https://example.org/relationship-presentation-poc/kg/relationship-42",
      "message": "Resolved association must specifically depend on exactly two distinct Persons."
    }
  ]
}
```

Rules:

- top-level `code` is the single governing code also printed to stderr;
- `violations` lists independently detected failures up to the limit of 100; more MUST produce top-level `TOO_MANY_VIOLATIONS` carrying the first 100;
- ordering is by `code` ascending, then `source` ascending (violations without `source` sort before those with one), then `message` ascending, all by UTF-16 code units;
- messages are fixed template strings; fixture-derived text appears only in identified fields, never interpolated into prose;
- reports MUST NOT contain stack traces, timestamps, absolute paths, environment values, process IDs, hostnames, or random identifiers.

The error report is deterministic for identical failing inputs and locks.

---

## 40. Source Contamination and Namespace Rules

### 40.1 Allowed Source Namespaces

Source fixtures MAY use:

- `http://www.w3.org/1999/02/22-rdf-syntax-ns#` (`rdf:type` and structural RDF);
- `http://www.w3.org/2000/01/rdf-schema#` (labels, comments);
- `http://www.w3.org/2002/07/owl#` (`owl:differentFrom`, `owl:NamedIndividual`; `owl:sameAs` is additionally constrained by Section 17.5);
- `http://www.w3.org/2001/XMLSchema#` (literal datatypes);
- `http://www.w3.org/2004/02/skos/core#` (documentation annotations);
- `http://purl.obolibrary.org/obo/` (BFO terms);
- `https://www.commoncoreontologies.org/` (CCO terms);
- `https://example.org/relationship-presentation-poc/contract/` (the contract class only, as an `rdf:type` object);
- fixture-owned namespaces for individuals.

The allowlist governs predicate IRIs, `rdf:type` object IRIs, and literal datatype IRIs: every predicate, every direct class assertion, and every literal datatype in the source graph MUST come from the allowlist (fixture-owned namespaces name individuals; they do not license predicates, classes, or datatypes). A violation MUST produce `SOURCE_NAMESPACE_NOT_ALLOWED`.

Subject and non-type object positions are free to use fixture-owned namespaces; they remain subject to the prohibitions below.

### 40.2 Prohibited Namespaces in Source

These namespaces MUST NOT occur anywhere in the source graph, in any RDF position — subject IRI, predicate IRI, object IRI, `rdf:type` object IRI, or literal datatype IRI:

```text
https://example.org/relationship-presentation-poc/projection/
https://example.org/relationship-presentation-poc/profile/
https://example.org/relationship-presentation-poc/rule/
https://example.org/relationship-presentation-poc/run/
https://example.org/relationship-presentation-poc/html/
https://example.org/relationship-presentation-poc/layout/
https://example.org/relationship-presentation-poc/intent/
http://www.w3.org/1999/xhtml
```

Matching is by namespace prefix on the absolute IRI string, with and without a trailing `#` variant. A violation MUST produce `SOURCE_GRAPH_CONTAMINATED`.

A fixture individual IRI minted inside a prohibited namespace is contamination even when every predicate about it is allowlisted; a literal typed with a prohibited-namespace datatype is contamination even though it is "just data". The check is positional-complete by construction, and the negative suite exercises subject-position and datatype-position cases (Section 43).

The words "slide", "presentation", or "html" inside label text are not contamination. An unused declared prefix is not contamination; contamination is assessed over expanded triples.

`rp:PersonAssociation` is permitted only as an `rdf:type` object. Any other use of the contract namespace in the source graph MUST produce `LOCAL_CONTRACT_VOCABULARY_VIOLATION`.

### 40.3 Optional Source Facts

Unselected source facts are permitted when they satisfy every rule above and do not alter selected-neighborhood validity. They MUST NOT appear in generated user-perceivable output.

---

## 41. Anti-Hardcoding Rules

Compiler source MUST NOT contain:

- canonical fixture IRIs;
- canonical designator or participant label strings;
- the canonical association sentence;
- branching on fixture IRIs or label values;
- fixture-conditional templates.

Compiler source MAY contain:

- the fixed profile template strings and profile constants;
- fixed rule and check identifiers;
- fixed HTML element and attribute names emitted by the Stage 7 mapping;
- fixed error codes and fixed message templates.

Enforcement combines a source lint for prohibited literals with late-bound and generated-fixture tests. The lint is weak evidence by itself; the binding evidence is behavioral (Sections 42.2, 42.3).

---

## 42. Conformance Test Architecture

### 42.1 Canonical Golden Test

Compile the canonical fixture; compare every canonical output byte-for-byte against `expected/relationship-42/`; verify both fingerprints and the success line.

### 42.2 Late-Bound Fixture Test

A second full fixture with different namespace, IRIs, labels, and title, authored only in test data, MUST compile with correct outputs computed from its inputs, not from stored goldens.

### 42.3 Runtime-Generated Fixture Tests

Property-based generation of conforming fixtures (seeded, deterministic) MUST yield: grammar match, unique resolution, contract pass, profile-order-correct participants, template-correct sentence, byte-valid outputs, verified manifests.

### 42.4 Metamorphic Tests

- Participant label swap: rendered order follows the profile-selected UTF-16 ordering, not input order.
- Fixture IRI renaming under label preservation: user-perceivable strings unchanged; traceability IRIs change coherently.
- Addition of unrelated non-contaminating facts: canonical outputs unchanged.
- Duplicate triple assertions: outputs unchanged.
- Reciprocal `owl:differentFrom`: outputs unchanged.
- A designator label containing the literal grammar suffix ` to a general audience.`: the anchored decomposition of Section 15 captures the full designator, resolution requires the full-string identifier label, and the rendered title carries the full designator.

### 42.5 Hostile Label Tests

Labels including:

```text
A & B <Mira> "quoted" </script><script>alert(1)</script> {participant2} 50% off & more {relationshipTitle}
```

MUST remain inert visible text: escaped in text and attribute contexts, no element or attribute injection, no template re-substitution, DOM parse confirms structure. These are accepted-hostile cases: the strings are legitimate label content rendered safely. Rejected-hostile cases — bidirectional controls, noncharacters, control characters — belong to Section 43 and MUST fail with `INVALID_CRITICAL_STRING` rather than render.

### 42.6 Navigation Behavior Tests

Using the locked DOM implementation: initial visibility; advance; back; boundary clicks; focus movement to headings; no exceptions.

### 42.7 Accessibility Tests

Assert accessible names, heading levels, button names and keyboard activation, `hidden` semantics, and `aria-labelledby` resolution for both slides.

### 42.8 Determinism Tests

Independent processes, distinct output directories, both supported platforms: byte-identical canonical outputs and identical fingerprints.

### 42.9 Manifest Dependency Tests

Assert the Stage 8 build order by content: no core-listed file contains the core fingerprint; the report and demo may; only the distribution manifest carries the distribution fingerprint; verifier passes end-to-end and fails on any single-byte mutation.

### 42.10 Lock Tests

For each lock, a targeted mutation MUST fail with that lock's own code: Node/npm/compiler mismatch → `RUNTIME_LOCK_MISMATCH`; dependency graph drift → `PACKAGE_LOCK_MISMATCH`; carrier/context/contract/profile byte change → `ARTIFACT_LOCK_MISMATCH`; vendored ontology change → `ONTOLOGY_LOCK_MISMATCH`; SBOM absence or drift → `SBOM_MISMATCH`. A test with two simultaneous lock defects MUST emit the code of the earlier step in Section 10.6.

### 42.11 Context and JSON-LD Guard Tests

Remote context, unapproved local context path, `@import`, reserved-term redefinition, named graph, blank node, `owl:imports`, and duplicate JSON member names in each parsed input class (fixture, profile, inline context, lock, SBOM) MUST fail with their bound codes.

### 42.12 Resource Limit Tests

Each Section 12.1 limit has a passing boundary case and a failing over-limit case with the bound code.

### 42.13 Output Safety Tests

Covering: fresh publish; `OUTPUT_EXISTS`; sentinel ownership pass/fail including prior-lineage `owned-output-v0.4.1` rejection; symlinked target; overlap; concurrent lock exclusion (`OUTPUT_LOCKED`); kill-and-rerun recovery at each journal step; journal corruption → `OUTPUT_RECOVERY_REQUIRED`; detached error report placement; staging never inside the published target.

### 42.14 Two-Platform Execution

The suite MUST pass on one POSIX platform and on Windows. Newline discipline, path identity, rename semantics, and lock semantics are asserted on both.

### 42.15 Optional Conformance Report

A machine-readable run summary MAY be emitted as `compiler-conformance-report-v1.0`; it is test infrastructure, not a build output.

### 42.16 Failure-Ordering Tests

Inputs crafted with multiple simultaneous defects across phases (for example, an oversize source and a grammar-mismatching request; a lock defect and a contaminated fixture) MUST emit exactly the single code dictated by Section 9.7, on both platforms.

### 42.17 Carrier Payload Tests

Assert the locked stylesheet contains no case-insensitive `</style` byte sequence and the locked script no case-insensitive `</script`, and that the renderer's defensive check triggers `INTERNAL_COMPILER_ERROR` on an artificially violated payload in a test harness.

---

## 43. Required Negative Tests

Each case MUST fail deterministically with its documented code and produce a conforming detached error report:

- zero matching identifiers; two matching identifiers;
- designator resolving to zero or two entities;
- generic relational quality without `rp:PersonAssociation`;
- association missing the direct BFO type;
- one participant; three participants; duplicated participant IRI;
- missing Person type; missing `owl:differentFrom`;
- identity collapse among selected individuals (`D = R`; `D = P1`; `P1 = N1`);
- `owl:sameAs` asserted between two selected individuals in either direction;
- zero names for a participant; two names for a participant;
- a name designating two entities; a name with two labels;
- language-tagged critical label; empty-after-NFC label; over-length label and designator;
- control character in a critical string; bidirectional control character (for example U+202E) in a label; Unicode noncharacter in a label;
- association sentence literal present in the source graph;
- prohibited namespace as predicate; as object; as subject IRI; as `rdf:type` object; as literal datatype;
- non-allowlisted predicate namespace; non-allowlisted literal datatype;
- contract namespace used outside the `rdf:type` position;
- duplicate JSON member names in the fixture; in the profile; in an inline context;
- blank node; named graph; remote context; `@import`; `owl:imports`;
- grammar deviations: wrong slide count, missing suffix, extra internal whitespace, empty designator;
- unsupported profile identifier; altered profile triple set; unknown `participantOrder` token;
- oversize files; JSON too deep; too many triples; too many context terms.

BOM policy: the loader either accepts exactly one leading U+FEFF in UTF-8 inputs by stripping it before grammar and JSON processing, or rejects it with `UTF8_BOM_NOT_SUPPORTED`. v1.0 RECOMMENDS strip-one-BOM for files while hashing raw bytes as read. The choice MUST be documented, tested, and identical on both platforms.

---

## 44. Explicitly Out of Scope

- Arbitrary relationship classes, participant counts, or profiles.
- RDFS/OWL entailment, SPARQL, general contradiction detection beyond the targeted checks of Section 17.5.
- LLM assistance, web search, or network access of any kind.
- Multi-user or service deployment; untrusted upload handling.
- Signed release envelopes (delegated to external release infrastructure).
- React/JSX carriers. The HTML projection graph is renderer-neutral by design; a future React carrier would replace Stage 8 only.
- General-purpose CSS theming beyond the locked stylesheet.

---

## 45. Build Phases

Estimates assume one implementer familiar with the stack, exclusive of external review. The v0.4.1 estimate of 12.5 days is superseded: it priced happy paths, and this specification is mostly guards. The publication substrate is deliberately scheduled as an early spike because it carries the highest cross-platform risk and no semantic dependencies.

**Phase 0 — Decisions and skeleton (1.5 days).** Repository skeleton; JSON-LD processor selection; duplicate-detecting JSON parse strategy (Section 11.2); `filesystemLock` dependency selection (Section 38.2); DOM test implementation selection; lock file schemas; CI on both platforms.

**Phase 1 — Locked artifacts (1 day).** Context, contract, profile v3, carriers, vendored ontologies; populate ontology and artifact locks; SBOM generation path.

**Phase 2 — CLI and trusted loader (2 days).** Option parsing and errors; lock validation in Section 10.6 order; path and symlink rules; byte limits; UTF-8/BOM; duplicate-member rejection; context trust; expansion and structural limits.

**Phase 3 — Publication substrate spike (3 days).** Output lock via the selected dependency; staging; fresh publish; ownership validation; journaled replacement; recovery matrix; detached error reports; the Section 42.13 suite green on POSIX and Windows before any semantic stage is written.

**Phase 4 — Request, resolution, contract (1.5 days).** Anchored grammar; Unicode rules; resolution; full closed-world contract including distinctness and contamination; stages 01–03.

**Phase 5 — Selection, narrative, presentation (1 day).** Stages 04–06; provenance discipline; profile parameter consumption.

**Phase 6 — Projection, rendering, carriers, demo (2 days).** Stage 07 graph; renderer and escaping module; renderer validation; carrier payload checks; demo.

**Phase 7 — Fingerprints, manifests, verifier (1.5 days).** Canonical JSON; JCS fingerprints; core and distribution manifests; validation report; verifier.

**Phase 8 — Failure surfaces (1 day).** Deterministic failure ordering; error-report ordering; exit-class mapping; stderr discipline.

**Phase 9 — Test suite completion (4 days).** Goldens; late-bound; generated fixtures; metamorphic; hostile; negatives; lock tests; failure-ordering tests; determinism; accessibility; navigation.

**Phase 10 — Two-platform hardening and release packaging (1.5 days).** Windows/POSIX deltas; newline protection; `sourceCommit` injection; checksum publication; documentation.

**Total: approximately 20 days.** The critical dependency chain is Phase 0 → 2 → 3; Phases 4–6 can begin once Phase 2 is green, in parallel with late Phase 3 work, but nothing publishes through an unproven substrate.

---

## 46. Definition of Done

### 46.1 Locked Build

- `npm ci` succeeds against the committed lockfile; the installed graph matches; the `filesystemLock` dependency is present, locked, and exercised;
- runtime, ontology, artifact, and SBOM locks are populated with no placeholders and validate in Section 10.6 order;
- duplicate-member rejection is active on every parsed JSON input;
- network access is disabled or absent during compilation and tests.

### 46.2 Parametric Behavior

- canonical, late-bound, and generated fixtures compile correctly;
- the anti-hardcoding lint and behavioral tests pass.

### 46.3 Semantic and Projection Integrity

- closed-world contract, distinctness, and contamination checks enforce every rule in Sections 17, 18, and 40;
- every source-derived `textValue` is reconstructible from exactly its `derivedFrom` nodes plus its named rule;
- stage artifacts match their canonical shapes and ordering semantics.

### 46.4 Carrier Quality

- rendered document passes renderer validation, accessibility, and navigation suites;
- carrier payloads satisfy the byte constraints of Sections 28.3 and 28.4.

### 46.5 Integrity and Determinism

- manifests, fingerprints, and the verifier pass end-to-end and fail on mutation;
- byte determinism holds across processes, directories, and both platforms;
- every nonconforming invocation yields exactly one deterministic code per Section 9.7, verified by the failure-ordering suite.

### 46.6 Filesystem Safety

- the Section 42.13 matrix passes on both platforms, including recovery at every journal step and prior-lineage rejection.

### 46.7 Evidence

- per-code lock mutation tests pass;
- the release archive is published with a detached SHA-256 checksum file;
- `sourceCommit` is injected at packaging and recorded in the runtime lock and core manifest;
- a clean-environment build reproduction from the archive succeeds.

---

## 47. Expected Finding

v1.0 will demonstrate that one narrow semantic pattern can be compiled to a correct, accessible, deterministic presentation through a profile-parameterized fixed projection program, with every user-perceivable string traceable to source labels, profile parameters, or named rules, and with the compiler unable to publish through an unverified or unsafe path.

Stated with the same restraint the validation report practices: v1.0 demonstrates parametricity over fixtures, not over profiles. The projection program is fixed; the profile parameterizes it.

### 47.1 Roadmap Falsifier

The claim that the architecture is profile-driven, rather than merely profile-parameterized, is not tested by v1.0 and MUST NOT be asserted from it. The next major version introduces a second supported profile differing in exactly one structural axis (for example, slide count three, or an items-first region order) with its own projection program version. If supporting it requires changes outside the profile document, the program registry, and the goldens — that is, if stage logic must branch — the profile abstraction is falsified as drawn and MUST be redesigned before the portfolio reuses it.

---

## Appendix A: Error Code Registry

Codes are grouped by category. Exactly one code is printed per failure. The exit class binds each code to Section 9.5.

| Category | Code | Exit |
|---|---|---:|
| CLI | `UNKNOWN_OPTION` | 2 |
| CLI | `DUPLICATE_OPTION` | 2 |
| CLI | `INVALID_CLI_OPTIONS` | 2 |
| Input | `UNSAFE_INPUT_PATH` | 3 |
| Input | `INPUT_CHANGED_DURING_LOAD` | 3 |
| Input | `SOURCE_TOO_LARGE` | 3 |
| Input | `REQUEST_TOO_LARGE` | 3 |
| Input | `PROFILE_TOO_LARGE` | 3 |
| Input | `CONTEXT_TOO_LARGE` | 3 |
| Input | `CONTRACT_TOO_LARGE` | 3 |
| Input | `INVALID_UTF8` | 3 |
| Input | `UTF8_BOM_NOT_SUPPORTED` | 3 |
| JSON | `JSON_TOO_DEEP` | 3 |
| JSON | `DUPLICATE_JSON_MEMBER` | 3 |
| JSON-LD | `TOO_MANY_TRIPLES` | 3 |
| JSON-LD | `TOO_MANY_CONTEXT_TERMS` | 3 |
| JSON-LD | `REMOTE_CONTEXT_NOT_SUPPORTED` | 3 |
| JSON-LD | `LOCAL_CONTEXT_NOT_APPROVED` | 3 |
| JSON-LD | `CONTEXT_TERM_REDEFINITION` | 3 |
| JSON-LD | `JSONLD_IMPORT_NOT_SUPPORTED` | 3 |
| JSON-LD | `OWL_IMPORTS_NOT_SUPPORTED` | 3 |
| JSON-LD | `BLANK_NODE_NOT_SUPPORTED` | 3 |
| JSON-LD | `NAMED_GRAPH_NOT_SUPPORTED` | 3 |
| Request | `REQUEST_GRAMMAR_MISMATCH` | 1 |
| Request | `DESIGNATOR_TOO_LONG` | 1 |
| Request | `INVALID_CRITICAL_STRING` | 1 |
| Profile | `UNSUPPORTED_PROFILE` | 1 |
| Profile | `UNSUPPORTED_PROFILE_CONTRACT` | 1 |
| Fixture | `FIXTURE_CONTRACT_FAILED` | 1 |
| Fixture | `LABEL_TOO_LONG` | 1 |
| Fixture | `SOURCE_GRAPH_CONTAMINATED` | 1 |
| Fixture | `LOCAL_CONTRACT_VOCABULARY_VIOLATION` | 1 |
| Fixture | `SOURCE_NAMESPACE_NOT_ALLOWED` | 1 |
| Reporting | `TOO_MANY_VIOLATIONS` | 1 |
| Lock | `RUNTIME_LOCK_MISMATCH` | 4 |
| Lock | `PACKAGE_LOCK_MISMATCH` | 4 |
| Lock | `ARTIFACT_LOCK_MISMATCH` | 4 |
| Lock | `ONTOLOGY_LOCK_MISMATCH` | 4 |
| Lock | `SBOM_MISMATCH` | 4 |
| Output | `INPUT_OUTPUT_OVERLAP` | 4 |
| Output | `UNSAFE_OUTPUT_PATH` | 4 |
| Output | `OUTPUT_EXISTS` | 4 |
| Output | `OUTPUT_NOT_OWNED` | 4 |
| Output | `OUTPUT_LOCKED` | 4 |
| Output | `OUTPUT_RECOVERY_REQUIRED` | 4 |
| Operational | `BUILD_TIMEOUT` | 6 |
| Operational | `MEMORY_LIMIT_EXCEEDED` | 6 |
| Internal | `INTERNAL_COMPILER_ERROR` | 5 |

Fixture-contract check codes (Section 23) appear as violation entries under `FIXTURE_CONTRACT_FAILED` and are not separate top-level codes.

---

## Appendix B: Canonical Traceability Matrix

| User-perceivable value | Immediate origin | Ultimate origin |
|---|---|---|
| `Relationship 42 presentation` (title, main label) | `run:document-title-content` | designator label + profile title template |
| `Relationship 42` (h1) | `run:title-content-1` | resolving designator label |
| `Alice is associated with Bob.` | `run:primary-message-content-1` | sorted Designative Name labels + fixed overview rule |
| `Participants` | `run:slide-title-content-2` | profile slide-title parameter |
| `Alice`, `Bob` (items) | participant item contents | Designative Name labels |
| `Next`, `Previous` | navigation regions | profile button parameters |
| `advance`, `back` (`data-intent`) | navigation regions | `rule:navigation-intent-token-v1-0` |
| `slide-1`, `slide-2`, heading IDs | stable-identifier rule | `rule:stable-dom-identifiers-v1-0` |
| `hidden` on slide 2 | `hiddenInitially` | `rule:initial-slide-visibility-v1-0` |

The association sentence row records character provenance. Its eligibility — that a validated `rp:PersonAssociation` licensed generation at all — is carried by `03-contract-validation.jsonld` (`validatedRoot`) and the Stage 4 selection trace, per the provenance split of Section 25.1.

---

## Appendix C: Change Record, v0.4.1 → v1.0

Each row resolves one finding of the v0.4.1 structured review.

| Finding | Resolution | Sections |
|---|---|---|
| F-01 request-grammar capture ambiguity | Anchored ABNF with unique decomposition; adversarial suffix example and metamorphic test | 15, 42.4 |
| F-02 selected-individual identity collapse | Six-way pairwise distinctness; `owl:sameAs` prohibition among selected; two new canonical checks; rationale recorded | 17.5, 23, 43 |
| F-03 duplicate JSON members accepted in inputs | `DUPLICATE_JSON_MEMBER` on every parsed JSON document; parser strategy fixed in Phase 0 | 11.2, 12.1, 42.11, 43, 45 |
| F-04 error-code binding and precedence gaps | Inline code bindings; per-lock codes; lock validation order; global failure ordering; exit-class registry | 5, 9.7, 10.6, 42.10, 42.16, App. A |
| F-05 unimplementable stdlib output lock | OS advisory lock mandated via locked `filesystemLock` dependency; marker schemes prohibited with rationale | 10.2, 38.2, 45, 46.1 |
| F-06 contamination positions incomplete | Prohibition extended to subject and literal-datatype positions; allowlist scope stated; negative cases added | 40.1, 40.2, 43 |
| F-07 epiphenomenal profile | Profile reframed as parameter block of a fixed program; `slideCount`/`participantOrder` load-bearing; `aspectRatio` moved to carrier; profile v3; falsifier named | 6.4, 16, 28.3, 47, 47.1 |
| F-08 annotation-as-content undocumented | Deliberate flattening of the IBE/`has text value` pattern owned in Source Basis with ingestion rule | 4.1 |
| F-09 `sourceCommit` self-reference | Release-packaging injection semantics; runtime non-verifiability stated | 10.2, 33, 46.7 |
| F-10 key order undefined for optional members | Union-across-occurrences rule with `html:Attribute` worked example | 32.3 |
| F-11 bidirectional controls unconstrained | Bidi controls and noncharacters prohibited; ZWJ/ZWNJ deliberately retained | 18, 42.5, 43 |
| F-12 `derivedFrom` membership unprincipled | Character provenance defined; eligibility provenance assigned to Stage 3/4; canonical `05` updated | 25.1, App. B |
| F-13 unbound Table 27.1 and intent tokens | Table bound to `rule:html-document-projection-v1-0`; `rule:navigation-intent-token-v1-0` introduced; equality invariant | 27.1, 27.3, 28.5 |
| F-14 lock-value normativity unclassified | Three normativity classes; Node re-lock policy within the 24.x line | 10.1 |
| F-15 ontology-lock hash absent from runtime lock | `ontologyLockSha256` added | 10.2, 10.6 |
| F-16 carrier payload termination risk | `</style`/`</script` byte prohibitions; renderer defensive check; conformance test | 28.3, 28.4, 28.5, 42.17 |
| F-17 sandbox network claim | Network absence attributed to locked script; `allow-scripts` only | 30 |
| F-18 prohibited meta-type drift | One Prohibited Meta-Type Set, referenced uniformly | 7.3, 17.1–17.4 |
| F-19 schedule optimism | ~20-day plan; publication-substrate spike front-loaded as Phase 3 | 45 |

Additional editorial changes: release-position and identifier-continuity statements; upstream-oddity notes in the ontology lock; rule-IRI series advanced to `-v1-0`; `selectedIndividualsPairwiseDistinct` added to the validation report; prior-lineage sentinel rejection; substrate-extraction note.

---

*End of specification.*
