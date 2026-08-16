# Relationship Presentation Compiler Specification v1.0

**Status:** Release specification for the edge-canonical compiler core with Node and Browser host profiles, v1.0
**Version:** v1.0 (edge-canonical re-cut)
**Supersedes:** the unratified v1.0 draft of 2026-08-15 (non-edge-canonical), and v0.4.1 (final specification of the POC series)
**Specification date:** 2026-08-15
**Core execution:** One edge-canonical core, executing byte-identically under Node.js 24.x and evergreen browsers, with no code modification
**Node host command:** `node index.js` / `node index.js --source <fixture.jsonld> --request <request.txt> --profile <profile.jsonld> --out <output-dir>`
**Browser host invocation:** `import { compileCore } from "./browser/relationship-presentation-core.bundle.mjs"` executed in a dedicated Worker

**Release position:** This specification defines the v1.0 release of a deterministic compiler whose compute core is edge-canonical: every semantic, projection, canonicalization, and fingerprinting decision is made by one pure core that consumes named input byte sequences and produces named output byte sequences, identically under both supported hosts. Host profiles own only acquisition, attestation, supervision, and placement. An implementation may claim v1.0 release status only when every item in Section 49 (Definition of Done) is satisfied with evidence, including the dual-host equivalence evidence of Section 45.20. This document alone is not the release. Service deployment, untrusted uploads, and external certification remain out of scope for the v1.0 release claim. Artifact authenticity (signing) is delegated to external release infrastructure; the compiler's obligation ends at independently verifiable fingerprints.

**Identifier continuity:** The package name `relationship-presentation-poc`, the ownership sentinel filename, and the `https://example.org/relationship-presentation-poc/…` namespaces are retained from the POC lineage. They are stable identifiers, not readiness claims. The `example.org` namespaces are project-local by design and are not angle-bracket placeholders in the sense of Section 13.1. The browser bundle filename `browser/relationship-presentation-core.bundle.mjs` joins the stable identifier set.

**Primary changes from v0.4.1** (finding identifiers refer to the v0.4.1 structured review; the finding-to-resolution record is Appendix C):

- specifies the controlled request grammar as an anchored, uniquely decomposable match, eliminating capture ambiguity (F-01);
- requires pairwise IRI distinctness among all six selected individuals and prohibits `owl:sameAs` among them (F-02);
- rejects duplicate JSON object member names in every parsed JSON input (F-03);
- assigns every lock its own error code, defines normative lock-validation and global failure orderings, binds an error code inline at every MUST-fail condition, and adds exit-class and host-applicability columns to the error-code registry (F-04);
- names the output-lock mechanism class and requires a locked filesystem-lock dependency in the Node host, because the Node.js standard library provides no OS advisory lock (F-05);
- extends source-graph contamination checking to every IRI position, including subjects and literal datatypes (F-06);
- reframes the supported profile as the parameter block of a fixed, identified projection program; makes `slideCount` and `participantOrder` load-bearing; moves `aspectRatio` into the carrier contract; advances the profile identifier to `profile:two-slide-explainer-v3` (F-07);
- documents the deliberate annotation-as-content decision relative to CCO's Information Bearing Entity pattern (F-08);
- specifies release-packaging injection semantics for `sourceCommit` (F-09);
- defines generated-object key order as the member union across all normative occurrences of a type (F-10);
- prohibits bidirectional control characters and Unicode noncharacters in contract-critical strings while deliberately permitting ZWJ/ZWNJ (F-11);
- defines `derivedFrom` as character provenance and separates it from eligibility provenance (F-12);
- binds the Table 31.1 mapping and the navigation intent-token mapping to named rules (F-13);
- classifies lock-value normativity and defines the Node re-lock policy within the pinned LTS line (F-14);
- adds the ontology-lock hash to the Node host lock for evidence symmetry (F-15);
- constrains locked carrier payload bytes against premature element termination (F-16);
- attributes network absence in the demo to the locked script, not to the sandbox attribute (F-17);
- defines one Prohibited Meta-Type Set, referenced uniformly (F-18);
- revises the build plan with realistic estimates and an early publication-substrate spike (F-19).

**Edge-canonical re-cut (this cut).** The unratified v1.0 draft resolved all nineteen findings but bound compute to Node-specific capabilities. This cut relocates every host-bound obligation into explicit host profiles and leaves a pure core, without removing any v1.0 functionality:

- a functional-core / host-shell partition with a normative Core Boundary Interface: named input bytes in, named output bytes out (Section 6);
- a normative Common Platform Surface — the closed allowlist of ambient capabilities the core may touch — enforced by a static scan and a poisoned-global harness (Sections 6.4, 6.5, 45.18, 45.19);
- lock enforcement for the five static artifacts moved into the core via packaging-injected embedded digests, making `ARTIFACT_LOCK_MISMATCH` host-invariant (Sections 6.7, 13.8);
- a host-independent core manifest: environment attestation (runtime lock, package lock, SBOM, bundle SRI) becomes host release evidence rather than per-run manifest content (Section 37);
- the runtime DOM dependency replaced by a project-owned deterministic subset revalidator; independent full-HTML5 parsing becomes conformance evidence (Sections 32.5, 45.21);
- a Browser host profile: dedicated-Worker execution, embedder publication handoff, browser host lock with bundle SRI (Sections 11, 13.7);
- the Node host profile retaining CLI, filesystem trust, OS advisory output lock, staged recoverable replacement, and environment attestation unchanged in substance (Sections 10, 14, 15);
- a dual-host equivalence suite as the edge-canonical falsifier: identical canonical bytes, fingerprints, and status lines across hosts (Section 45.20);
- the build plan revised to approximately 22.5 days (Section 48).

The decision register and the draft-to-re-cut section map are Appendix D.

---

# PART I — FOUNDATIONS AND ARCHITECTURE

## 1. Purpose

This specification defines a deterministic compiler that transforms one narrow BFO/CCO-aligned source pattern into a two-slide HTML presentation through inspectable JSON-LD stages, with a compute core that runs unmodified and byte-identically under Node.js and evergreen browsers.

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

The compiler MUST work for fixtures authored after compiler implementation, provided they satisfy the v1.0 contract, and MUST produce the same canonical bytes for the same inputs under either host.

## 2. Release Position

v1.0 is the specification for an edge-canonical compiler core released with two host profiles: a trusted offline Node CLI and a trusted browser embedding.

The v1.0 release claim is established only by all of the following, together:

- an implemented core and both host profiles conforming to this specification;
- a passing conformance test suite (Section 45), including the Common Platform Surface enforcement evidence and the dual-host equivalence evidence;
- a complete dependency inventory;
- populated ontology, artifact, Node host, and browser host locks with no placeholders;
- an SBOM in the declared machine-readable format;
- dependency vulnerability and license review;
- filesystem-safety and hostile-input review;
- reproducible-build evidence, including deterministic reproduction of the browser bundle;
- supported-platform release packaging checks, including a detached SHA-256 checksum file and the bundle's Subresource Integrity value published alongside the release archive;
- accessibility verification;
- independent security and release review.

A service accepting untrusted uploads remains out of scope; the browser embedder occupies the same trust position as the CLI operator. Signed release envelopes are delegated to external release infrastructure (Section 47).

## 3. Success Criterion

The v1.0 release succeeds if this statement is true:

> Given any JSON-LD 1.1 fixture satisfying the closed-world v1.0 Person Association contract, a matching controlled-language request, the supported profile version, and locked local ontology, context, contract, profile, and carrier artifacts, the compiler core produces the profile-defined two-slide HTML presentation without fixture-specific compiler logic or profile changes — byte-identically under the Node host and the Browser host. Every projected value and compiler decision is traceable, all canonical outputs are deterministic for identical input byte sequences and locked artifacts, the deterministic failure ordering yields exactly one error code for any nonconforming invocation and that code is host-invariant for core-phase failures, and the source graph remains free of projection, profile, rule, layout, HTML, carrier, navigation, and runtime vocabulary in every RDF position.

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

Two upstream values look like errors and are not; the ontology lock carries notes so they are never "corrected" (Section 13.3): the BFO 2020 `owl:versionIRI` genuinely ends in `bfo-core.ttl`, and the Agent Ontology `owl:versionIRI` is genuinely dated `2024-11-05` despite the `v2.0-2024-11-06` release tag. Both were verified against the pinned commits during the v0.4.1 review.

Nonnormative source references:

- [BFO 2020 release](https://github.com/BFO-ontology/BFO-2020/releases/tag/release-2024-01-29)
- [CCO 2.0 release](https://github.com/CommonCoreOntology/CommonCoreOntologies/releases/tag/v2.0-2024-11-06)
- [Node.js 24.19.0 LTS release](https://nodejs.org/en/blog/release/v24.19.0)
- [Node.js release schedule](https://github.com/nodejs/Release)
- [CycloneDX 1.7 specification overview](https://cyclonedx.org/specification/overview/)
- [RFC 8785, JSON Canonicalization Scheme](https://www.rfc-editor.org/rfc/rfc8785)

## 5. Normative Language and Scope Tags

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **MAY**, and **OPTIONAL** are to be interpreted as described by BCP 14, RFC 2119 and RFC 8174, when and only when they appear in all capitals.

Every normative obligation in this specification carries one scope:

- **Core** — binds the edge-canonical core; identical under both hosts; part of the dual-host equivalence surface.
- **Node host** — binds the Node CLI host profile only.
- **Browser host** — binds the Browser host profile only.
- **Both hosts** — binds each host profile in its own binding, with the same required semantics.
- **Release** — binds release packaging and evidence, not any runtime.

Part III is Core in its entirety unless a subsection states otherwise. Part II sections carry their host in the section title. Part IV is Release unless stated otherwise.

A conforming fixture is a source JSON-LD fixture satisfying the v1.0 Person Association contract under the closed-world validation semantics defined here. A correct presentation is a generated presentation whose presentation-visible content, document metadata visible to users, and accessibility-tree strings are derived only from source designators, the supported profile, and named deterministic rules. "Canonical output" means a file included directly or transitively by the core or distribution manifest. The "canonical artifact set" is the complete named byte map the core produces on success (Section 6.3).

Where a normative condition states that the compiler MUST fail or MUST produce a result, the governing error code is bound inline at that condition. Appendix A is the complete registry and assigns each code an exit class and host applicability. Section 12 defines which single code is emitted when multiple conditions fail.

## 6. Edge-Canonical Architecture

### 6.1 Principle

**Scope: Core, Both hosts.** The compiler observes the portfolio's Edge-Canonical First discipline: all compute runs unmodified in a browser or under `node index.js`. Concretely, every decision that influences canonical bytes — parsing, validation, semantics, projection, rendering, canonicalization, fingerprinting, error-code selection for core phases, and error-report content — is made by one pure core module graph. Anything that touches a filesystem, a terminal, a clock, an environment variable, a lock, a process, or a network is a host concern and is prohibited in the core.

The corollary the rest of this document enforces: if the environment genuinely cannot influence canonical bytes, then environment evidence describes the release, not the run. Environment attestation therefore lives in host locks and release evidence (Section 13), not in the core manifest (Section 37).

### 6.2 Core / Host Partition

**Scope: Core, Both hosts.** The core is a deterministic asynchronous function from a named input byte map to a named output byte map. It performs no I/O, holds no ambient state, reads no paths, and observes no time. The hosts:

| Concern | Node host | Browser host |
|---|---|---|
| Input acquisition | CLI options, file reads, symlink and trust rules | Embedder supplies byte map |
| Environment attestation | Node host lock validated at startup | Bundle Subresource Integrity; release evidence |
| Static-artifact enforcement | Lock files verified at startup; core re-verifies via embedded digests | Core verifies via embedded digests |
| Supervision | `worker_threads` with resource limits and a parent timer | Dedicated Worker with a timer; `Worker.terminate()` |
| Output exclusion | OS advisory lock via the `filesystemLock` dependency | No shared mutable target in v1.0 (Section 11.3) |
| Publication | Staged, journaled, recoverable filesystem replacement | Handoff of the canonical artifact set to the embedder |
| Status surfaces | Exit codes, stdout/stderr lines | `CoreResult` returned to the embedder |

No functionality from the v1.0 draft is removed by this partition; each obligation is relocated to the layer that can actually discharge it.

### 6.3 Core Boundary Interface

**Scope: Core.** The core exports exactly one entry point:

```text
compileCore(coreRequest) → Promise<CoreResult>
```

`CoreRequest` is a plain object with exactly one member, `inputs`, holding exactly eight named `Uint8Array` values:

```text
inputs.context             locked canonical context bytes
inputs.contract            locked contract ontology bytes
inputs.canonicalProfile    locked supported profile bytes
inputs.userProfile         user-supplied profile bytes
inputs.source              fixture bytes
inputs.request             request bytes
inputs.carrierStyle        locked stylesheet bytes
inputs.carrierNavigation   locked navigation script bytes
```

A missing member, an unknown member, a duplicate role, or a non-`Uint8Array` value MUST produce `INVALID_CORE_REQUEST`. Under the Node host this indicates a host defect; under the Browser host it indicates an embedder usage error. Paths never cross this boundary in either direction.

`CoreResult` on success:

```text
status                "success"
statusLine            the exact success line of Section 10.5
coreFingerprint       lowercase-hex SHA-256
distributionFingerprint lowercase-hex SHA-256
artifacts             byte map: canonical filename → Uint8Array,
                      containing exactly the thirteen files of Section 24
```

`CoreResult` on failure:

```text
status                "error"
statusLine            "status=error code=<CODE>" per Section 10.5
code                  the single governing error code
errorReport           Uint8Array of Section 42 bytes, or absent where
                      no report is defined for the code
```

`compileCore` MUST be a pure function of the input bytes and the packaging-injected constants of Section 6.7. Two invocations with identical inputs MUST return identical `CoreResult` values under any host, byte for byte. The Promise is required only because the Common Platform Surface digest primitive is asynchronous; no scheduling nondeterminism may influence results.

The error-report builder (Section 42) MUST be exported by the core as a pure helper so that host-phase failures produce reports through the same deterministic code path the core uses.

### 6.4 Common Platform Surface

**Scope: Core.** The Common Platform Surface (CPS) is the closed allowlist of ambient capabilities the core module graph may reference. If a capability is not listed here, the core MUST NOT use it.

Permitted:

- ECMAScript 2023 language intrinsics and standard built-in objects, excluding everything banned below;
- `TextEncoder`; `TextDecoder` constructed with `{ fatal: true }` for all input decoding;
- `Uint8Array`, `ArrayBuffer`, `DataView`;
- `crypto.subtle.digest` with algorithm `"SHA-256"` only;
- `Promise` and `async`/`await`;
- the `JSON` global, noting that `JSON.parse` alone cannot satisfy the duplicate-member rule of Section 16 and MUST be paired with or replaced by the project's duplicate-detecting scan.

Banned for the core, non-exhaustively and in addition to the closed-allowlist rule (this list exists to seed the poisoned-global harness of Section 6.5):

- every `node:` builtin, CommonJS `require`, `process`, `Buffer`, `__dirname`;
- `window`, `document`, `navigator`, and all DOM constructors;
- `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, and any network capability;
- `Date` (constructor and statics), `performance`;
- `Math.random`, `crypto.getRandomValues`, `crypto.randomUUID`;
- `Intl`, `String.prototype.localeCompare`, and every `toLocale*` method;
- all storage APIs; all timers (`setTimeout`, `setInterval`, `setImmediate`, `queueMicrotask` for scheduling-dependent logic);
- `eval`, the `Function` constructor, dynamic `import()`;
- `WebAssembly` (prohibited in the v1.0 core for auditability; a future revision may lift this deliberately);
- spawning of workers, processes, or realms from within the core;
- reading any environment, locale, timezone, or platform identifier.

The CPS is what makes "edge-canonical" a checkable property rather than a slogan: the core's world is bytes, ECMAScript, one text codec pair, and one hash.

### 6.5 CPS Enforcement

**Scope: Release, Both hosts.** Two independent mechanisms enforce the CPS, in the negative-tests-are-the-deliverable discipline:

1. **Static scan.** A conformance test scans the core module graph and the built browser bundle for banned identifiers and import specifiers (Section 45.18). The scan is necessary but weak evidence.
2. **Poisoned-global harness.** The full functional test corpus executes with every banned global replaced by a throwing trap and every permitted global instrumented, under both hosts (Section 45.19). Any trap activation fails the suite. This is the runtime falsifier: a core that secretly reaches outside the CPS cannot pass it.

### 6.6 Core Dependency Constraint

**Scope: Core, Release.** Every dependency reachable from the core module graph MUST itself satisfy the CPS: pure ECMAScript, no native bindings, no I/O, no ambient environment reads. The JSON-LD processor MUST accept an injected document loader, and the core MUST inject an inert loader that resolves only the approved context token of Section 17 and throws on anything else. Dependency EC-conformance is release evidence verified by the static scan and the poisoned-global harness over the bundle, which contains the dependencies' code.

The DOM implementation formerly required at runtime is demoted to conformance-evidence tooling (Sections 32.5, 45.21); the shipped core has no DOM dependency.

### 6.7 Packaging-Injected Core Constants

**Scope: Core, Release.** Release packaging injects into the core, before bundling and before Node host packaging, the following constants, which are the only values `compileCore` may consult beyond its inputs:

- `COMPILER_NAME` = `relationship-presentation-poc`;
- `COMPILER_VERSION` = `1.0.0`;
- `SOURCE_COMMIT` = the full release commit SHA (asserted evidence; a repository file cannot contain the hash of the commit containing it, so injection happens at packaging, outside the tree);
- `EMBEDDED_ARTIFACT_DIGESTS` = the five SHA-256 values of the locked static artifacts (context, contract, canonical profile, carrier stylesheet, carrier navigation script).

The embedded digests MUST equal the corresponding values in `artifact.lock.json`; release packaging MUST verify the equality, and the conformance suite MUST re-verify it (Section 13.8). Because the digests are compiled in, static-artifact enforcement is a core phase (`ARTIFACT_LOCK_MISMATCH`) and is host-invariant: a mutated carrier fails identically in a browser with no filesystem and in the Node CLI. The constants are part of the compiler's identity, not of any environment; identical constants MUST be present in both host packagings of the same release.

---
## 7. Ontology and Contract Design

**Scope: Core.**

### 7.1 Local Contract Class

v1.0 introduces exactly one local source-domain class:

```text
rp:PersonAssociation
```

It introduces no new source-domain object property.

`rp:PersonAssociation` is asserted as a subclass of `obo:BFO_0000145`.

### 7.2 Contract Class Definition

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

### 7.3 Authorial Assertion Boundary

The fixture author asserts the non-directional meaning of the source entity by directly typing it as `rp:PersonAssociation`.

The compiler MUST validate that the direct type assertion and required neighborhood are present. It MUST NOT claim to infer symmetry or absence of directional roles from the two `obo:BFO_0000195` edges. The class assertion licenses profile eligibility under this closed-world contract.

### 7.4 Profile Binding

Rendering eligibility is a profile-layer rule, not an ontological differentia.

A supported profile identifier names a fixed projection program: the versioned set of core rules that compose slides, regions, and carrier structure for that profile. The profile document is that program's parameter block. It supplies the strings and constants the program reads; it does not describe slide or region structure, and v1.0 does not claim that it does.

The supported binding is:

```text
rp:PersonAssociation
→ program identified by profile:two-slide-explainer-v3
→ rule:person-association-overview-v1-0
→ "{participant1} is associated with {participant2}."
```

The source ontology describes what the entity is. The profile identifier selects the fixed program by which that pattern is communicated, and the profile document parameterizes it.

## 8. Scope and Definitions

### 8.1 Supported Pattern

v1.0 is parametric over:

- fixture namespace;
- relationship IRI;
- resolving identifier IRI;
- participant IRIs;
- name-node IRIs;
- relationship title label;
- participant labels, including labels containing grammar or template substrings;
- unrelated extra source facts that do not contaminate or alter the selected neighborhood;
- JSON-LD surface syntax that expands to the same permitted default-graph triples;
- the executing host (Node or Browser), over which every canonical byte is invariant.

v1.0 is not parametric over:

- eligible relationship class;
- participant count or participant class;
- participant roles or directionality;
- presentation profile shape or version;
- output carrier;
- controlled-language grammar;
- template wording;
- slide count.

### 8.2 Source Graph

The source graph is the expanded JSON-LD 1.1 default RDF graph loaded from the input fixture after duplicate-triple collapse.

It contains source-domain assertions. It MUST NOT contain projection, profile, rule, layout, HTML, JavaScript, navigation, carrier, runtime, or demo vocabulary in any RDF position: subject IRI, predicate IRI, object IRI, `rdf:type` object, or literal datatype IRI (Section 43).

### 8.3 Prohibited Meta-Type Set

The Prohibited Meta-Type Set is:

```text
owl:Class
rdfs:Class
rdf:Property
owl:ObjectProperty
owl:DatatypeProperty
owl:AnnotationProperty
```

Wherever this specification prohibits an individual from being "directly typed as an RDF/OWL class or property," it means direct `rdf:type` assertion to any member of this set. Sections 21.1 through 21.4 reference this set uniformly.

### 8.4 Contract Ontology

The contract ontology is the fixed local ontology fragment defining `rp:PersonAssociation`. It is source-domain vocabulary, not projection vocabulary.

### 8.5 Fixture Individuals and Selected Individuals

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

The selected individuals are exactly these six nodes as bound by contract validation. Section 21.5 requires them to be six pairwise-distinct absolute IRIs.

### 8.6 Presentation-Visible and User-Perceivable Content

Presentation-visible content is text rendered inside `presentation.html`.

User-perceivable content additionally includes:

- the HTML document title;
- accessible names and descriptions;
- button labels;
- focus-visible state where applicable.

Diagnostic content in `demo.html` is not presentation-visible content, but it MUST still be escaped and safe.

### 8.7 Significant HTML Equivalence

Two HTML outputs are significantly equivalent if, after standards-compliant HTML parsing, they contain the same required document structure, element order, attributes, text nodes, accessible names, button intent values, initial hidden state, and navigation behavior. Deterministic CSS and JavaScript formatting are not significant unless they alter required behavior or user-perceivable content.

### 8.8 Core, Hosts, and Artifact-Set Terms

- **Core**: the pure module graph exporting `compileCore` and the pure helpers this specification assigns to it, constrained by the Common Platform Surface.
- **Host profile**: the normative binding of acquisition, attestation, supervision, status emission, and placement for one execution environment. v1.0 defines two: Node host (Section 10) and Browser host (Section 11).
- **Canonical artifact set**: the byte map of exactly the thirteen files listed in Section 24, as produced by the core on success.
- **Status line**: the single LF-terminated success or error line whose exact string the core produces in `CoreResult.statusLine` and whose emission is a host act.

## 9. Repository Structure

```text
relationship-presentation-poc/
├── index.js                      (Node host entry)
├── package.json
├── package-lock.json
├── runtime.lock.json             (Node host lock)
├── browser-host.lock.json
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
│   ├── core/
│   │   ├── compile-core.js
│   │   ├── embedded-constants.js        (packaging-injected, Section 6.7)
│   │   ├── validate-core-request.js
│   │   ├── validate-input-bytes.js
│   │   ├── json-scan.js                 (duplicate-detecting parse)
│   │   ├── jsonld-load.js               (injected inert document loader)
│   │   ├── validate-context.js
│   │   ├── normalize-graph.js
│   │   ├── normalize-request.js
│   │   ├── resolve-scope.js
│   │   ├── validate-resolved-neighborhood.js
│   │   ├── select-content.js
│   │   ├── build-narrative.js
│   │   ├── build-presentation.js
│   │   ├── project-html.js
│   │   ├── render-html.js
│   │   ├── subset-revalidate.js
│   │   ├── canonical-json.js
│   │   ├── stable-jsonld.js
│   │   ├── html-escape.js
│   │   ├── build-core-manifest.js
│   │   ├── build-validation-report.js
│   │   ├── build-demo.js
│   │   ├── build-sentinel.js
│   │   ├── build-distribution-manifest.js
│   │   └── error-report.js
│   ├── host-node/
│   │   ├── cli.js
│   │   ├── validate-locks.js
│   │   ├── path-safety.js
│   │   ├── read-inputs.js
│   │   ├── supervise-worker.js
│   │   ├── output-lock.js
│   │   ├── publish.js
│   │   └── emit.js
│   └── host-browser/
│       ├── embed.js
│       └── worker-harness.js
├── browser/
│   └── relationship-presentation-core.bundle.mjs   (release-built, Section 13.7)
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
│   ├── determinism.test.js
│   ├── subset-revalidator.test.js
│   ├── cps-static-scan.test.js
│   ├── cps-poisoned-globals.test.js
│   ├── dual-host-equivalence.test.js
│   └── browser-host.test.js
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

`src/core/` and every module it imports MUST satisfy the Common Platform Surface. `index.js` and `src/host-node/` are Node host code; `src/host-browser/` and `browser/` are Browser host code. Temporary staging, lock, recovery, and detached failure-report paths MUST NOT be children of an already published output directory.

---

# PART II — HOST PROFILES

## 10. Node Host Profile

**Scope: Node host.**

### 10.1 Default Mode

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

### 10.2 Parameterized Mode and Supported Options

```bash
node index.js \
  --source <fixture.jsonld> \
  --request <request.txt> \
  --profile <profile.jsonld> \
  --out <output-dir>
```

All four path options are required in parameterized mode. The CLI MUST support:

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

### 10.3 CLI Errors

- Unknown options MUST produce `UNKNOWN_OPTION`.
- Duplicate singleton options MUST produce `DUPLICATE_OPTION`.
- Supplying only some of `--source`, `--request`, `--profile`, and `--out` MUST produce `INVALID_CLI_OPTIONS`.
- Using `--replace` without a compilation mode MUST produce `INVALID_CLI_OPTIONS`.
- Input/output overlap MUST produce `INPUT_OUTPUT_OVERLAP`.
- Symlink and special-file rules are Section 14; output-path rules are Section 15.1.

### 10.4 Exit Codes

| Exit code | Meaning |
|---:|---|
| 0 | Success |
| 1 | Fixture contract, request, profile, or run validation failure |
| 2 | CLI usage or core-interface error |
| 3 | Input loading, context, encoding, or trust-boundary error |
| 4 | Output safety, output lock, or build-lock error |
| 5 | Internal compiler error |
| 6 | Operational resource guard terminated the build |

Appendix A assigns every error code to exactly one exit class. Exit classes are a Node host mapping; the Browser host returns the code itself.

### 10.5 stdout and stderr

`stdout` is reserved for `--help`, `--version`, or exactly one LF-terminated deterministic success line:

```text
status=success artifact=relationship-presentation coreFingerprint=<sha256> distributionFingerprint=<sha256>
```

`stderr` is reserved for exactly one LF-terminated deterministic error line:

```text
status=error code=<ERROR_CODE>
```

The core produces both strings as `CoreResult.statusLine` for core-phase outcomes; the host emits the string verbatim. For host-phase failures the host constructs the error line from the governing code using the same fixed format. The success line MUST NOT contain the output path. Stack traces MUST NOT be emitted unless a nonconforming developer-only diagnostic mode is added in a future version.

### 10.6 Supervision

The Node host MUST execute `compileCore` inside a `worker_threads` worker it can terminate, with:

- a 40-second parent wall-clock timer; expiry terminates the worker and reports `BUILD_TIMEOUT`;
- worker `resourceLimits` sized to an intended 256 MiB guard; resource-limit termination reports `MEMORY_LIMIT_EXCEEDED`.

The host MUST NOT claim to enforce a wall-clock timeout around uninterruptible work in the same event loop. Where the operating system provides a stronger process-memory or job-object limit, release packaging SHOULD use it; if exact resident-memory enforcement is unavailable, documentation MUST describe 256 MiB as an intended guard rather than a proven hard cap. Guard terminations vary with environment and are excluded from the byte-determinism guarantee; conformance tests run on a documented minimum environment where all valid fixtures within structural limits complete without triggering guards.

### 10.7 Node Host Phase Order

The Node host phase sequence is Section 12.2. The host MUST NOT reorder phases in a way that changes the emitted code.

## 11. Browser Host Profile

**Scope: Browser host.**

### 11.1 Embedding API

The Browser host is the release bundle plus the reference worker harness. An embedder:

1. loads `browser/relationship-presentation-core.bundle.mjs` — enforcing the Subresource Integrity value of Section 13.7 wherever the loading mechanism supports it;
2. executes it inside a dedicated `Worker`;
3. constructs a `CoreRequest` with the eight named `Uint8Array` inputs of Section 6.3;
4. awaits the `CoreResult`.

The embedder occupies the same trust position as the CLI operator: it is trusted infrastructure supplying trusted inputs. The core never touches the DOM, the page, or the network; the bundle contains only CPS-conforming code, and the poisoned-global harness is the evidence.

### 11.2 Worker Execution and Supervision

The reference harness MUST:

- run `compileCore` in a dedicated Worker;
- apply a 40-second timer; expiry calls `Worker.terminate()` and reports `BUILD_TIMEOUT`;
- report abnormal worker termination without a `CoreResult` as `INTERNAL_COMPILER_ERROR`.

No standard browser API caps worker memory deterministically; `MEMORY_LIMIT_EXCEEDED` is therefore not applicable to the Browser host (Appendix A). Engine out-of-memory kills surface as abnormal termination. This asymmetry is documented, not hidden, and guard terminations are excluded from the equivalence corpus.

### 11.3 Publication Handoff

On success the harness returns the `CoreResult` to the embedder. The embedder owns placement — downloads, in-page display, transmission, or storage — and v1.0 makes no durability claim in the browser. Integrity travels with the artifact set itself: any conforming verifier can validate the distribution and core manifests over the returned byte map (Section 39) with no filesystem involved. Because there is no shared mutable publication target in this profile, the publication-exclusion requirement of Section 15.2 is vacuously satisfied here; Section 11.6 names the required binding for embedders that create one.

### 11.4 Browser Host Phase Order

The Browser host phase sequence is Section 12.3.

### 11.5 Inapplicable Codes

The following codes cannot arise under the Browser host and are marked accordingly in Appendix A: `UNKNOWN_OPTION`, `DUPLICATE_OPTION`, `INVALID_CLI_OPTIONS`, `UNSAFE_INPUT_PATH`, `INPUT_CHANGED_DURING_LOAD`, `RUNTIME_LOCK_MISMATCH`, `PACKAGE_LOCK_MISMATCH`, `ONTOLOGY_LOCK_MISMATCH`, `SBOM_MISMATCH`, `INPUT_OUTPUT_OVERLAP`, `UNSAFE_OUTPUT_PATH`, `OUTPUT_EXISTS`, `OUTPUT_NOT_OWNED`, `OUTPUT_LOCKED`, `OUTPUT_RECOVERY_REQUIRED`, `MEMORY_LIMIT_EXCEEDED`.

### 11.6 Informative: OPFS Publication Profile

This subsection is informative. An embedder that implements durable publication into the Origin Private File System, mirroring the sentinel, ownership, staging, journal, and recovery semantics of Sections 15 and 41, MUST guard the target with the Web Locks API:

```text
navigator.locks.request(name, { ifAvailable: true }, holder)
```

with `name` derived deterministically from the output identifier. Web Locks are advisory and are released automatically when the holding context terminates — the same semantic class as `flock`/`LockFileEx`, which is why they are the required binding here. Failure to acquire maps to `OUTPUT_LOCKED`. This profile is not part of the v1.0 conformance surface.

## 12. Deterministic Failure Ordering

**Scope: Both hosts, Core.** The single emitted error code is part of the deterministic surface. The first failing phase determines the code; within a phase, checks run in the order this specification lists them.

### 12.1 Rule

Exactly one code is emitted per failed invocation. A conforming implementation MUST NOT reorder phases for performance in a way that changes the emitted code.

### 12.2 Node Host Phase Sequence

1. **N1** — CLI syntax and option validation (Section 10.3).
2. **N2** — Node host lock validation, in the order of Section 13.6.
3. **N3** — Path resolution and trust-boundary validation for inputs and the output target, including input/output overlap, symlink rules, and — when `--replace` is absent — existence of the output target (`OUTPUT_EXISTS`).
4. **N4** — Input file acquisition (Section 14), producing the eight input byte values.
5. **C0–C8** — the core phase sequence of Section 12.4, inside the supervised worker.
6. **N5** — Output lock acquisition, staging, ownership validation of an existing target under `--replace`, and recovery-journal inspection (Section 15).
7. **N6** — Publication and manifest verification (Sections 15.5–15.7, 39).

### 12.3 Browser Host Phase Sequence

1. **B1** — Request assembly by the embedder; shape defects are detected by the core as phase C0.
2. **C0–C8** — the core phase sequence of Section 12.4, inside the Worker.
3. **B2** — Handoff of the `CoreResult` to the embedder.

### 12.4 Core Phase Sequence

1. **C0** — `CoreRequest` shape validation → `INVALID_CORE_REQUEST`.
2. **C1** — Embedded-digest verification of the five locked inputs, in the fixed order context, contract, canonicalProfile, carrierStyle, carrierNavigation → `ARTIFACT_LOCK_MISMATCH`.
3. **C2** — Per-input structural validation, in the fixed order context, contract, canonicalProfile, userProfile, source, request: byte limit, UTF-8 decoding, BOM policy, duplicate JSON members, JSON depth (Section 16).
4. **C3** — Context approval, JSON-LD expansion with the inert loader, per-document trust rules, and graph limits, expanding contract, canonicalProfile, userProfile, source in that order (Sections 16.4, 16.5).
5. **C4** — Request grammar and designator validation (Section 19).
6. **C5** — Profile contract validation (Section 20).
7. **C6** — Fixture contract, distinctness, and contamination validation (Sections 21, 22, 43); independently reportable violations are collected and ordered per Section 42, and the emitted code is the governing category code for the first-ordered violation.
8. **C7** — Stage construction, rendering, and subset revalidation (Sections 24–32); unexpected internal states produce `INTERNAL_COMPILER_ERROR`.
9. **C8** — Canonical byte production, fingerprints, and status line (Sections 35–39).

### 12.5 Cross-Host Code Equivalence

For every code whose Appendix A host applicability is Core or Both, the same nonconforming input MUST yield the same code under both hosts. The detecting phase site MAY differ: a mutated locked carrier fails at N2 under the Node host and at C1 under the Browser host, with the identical code `ARTIFACT_LOCK_MISMATCH`. The dual-host equivalence suite (Section 45.20) asserts code equality, not phase-site equality.

---
## 13. Locks and Evidence

### 13.1 Lock Semantics and Value Normativity

**Scope: Both hosts, Release.** The locks establish build consistency and evidence. They do not, by themselves, establish artifact authenticity. Authenticity requires a signed release envelope or equivalent external trust root, which is provided by release infrastructure outside this compiler.

Lock values fall into three normativity classes:

1. **Specification-normative** values are fixed by this document: `lockVersion` strings, the SBOM format and `specVersion`, and every structural member name. Changing one requires a specification revision.
2. **Baseline-normative** values are fixed at the specification date but re-lockable without a specification revision, provided the change stays inside the declared line: the Node.js version and bundled npm version within the pinned `24.x` LTS line, and the tested browser-engine baselines of Section 13.7. A Node.js patch or minor update within `24.x` requires a lock revision (with a `lockVersion` suffix bump and re-run conformance evidence), not a specification revision. Changing the major release line requires a specification revision, mirroring the CCO rule in Section 4.2. The `24.x` line is scheduled to move from Active LTS to Maintenance LTS in October 2026; that transition alone does not require a specification revision.
3. **Release-populated** values are shown as angle-bracket placeholders and MUST be populated concretely in a conforming release. A conforming release MUST NOT contain angle-bracket placeholders.

Host scoping: `runtime.lock.json`, `package-lock.json`, `ontology.lock.json`, and `sbom.json` are Node host and release evidence; `browser-host.lock.json` is Browser host and release evidence; `artifact.lock.json` is release evidence whose enforcement is dual — Node host startup verification plus core embedded digests (Sections 6.7, 13.8). Hosts MUST parse lock files and the SBOM with the core-exported duplicate-detecting parser so the duplicate-member rule of Section 16.3 is uniform across every JSON document the compiler reads.

### 13.2 Node Host Lock

**Scope: Node host, Release.** File:

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

`filesystemLock` names the dependency providing the OS advisory lock required by Section 15.2. It is a required member because the Node.js standard library provides no such lock. It is Node host tooling and is excluded from the core module graph and the browser bundle.

`domTestImplementation` is reclassified in this cut as a conformance-evidence dependency: it is exercised only by the test suite (Sections 45.6, 45.7, 45.21). The shipped core performs subset revalidation (Section 32.5) and has no DOM dependency. The member is retained so the evidence toolchain remains locked.

`sourceCommit` follows the packaging-injection semantics of Section 6.7; the value here MUST equal the injected core constant. The Node host verifies its own `compiler.name` and `compiler.version` against the lock at startup; it cannot and does not verify `sourceCommit` at runtime.

The Node host MUST fail with `RUNTIME_LOCK_MISMATCH` when the executing Node version, npm version, or compiler name/version does not match the populated lock. Mismatches attributed to other locks use their own codes per Section 13.6.

The implementation MUST use `npm ci` or an equivalent lock-preserving installation procedure. A successful `npm install` against an altered graph is not conformance evidence.

### 13.3 Ontology Lock

**Scope: Node host, Release.** File:

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

The compiler MUST NOT download ontology files at runtime under any host. The Node host MUST verify the existence and SHA-256 of every vendored ontology file before compilation; a missing or mismatching vendored file, or a mutated `ontology.lock.json`, MUST produce `ONTOLOGY_LOCK_MISMATCH`. The vendored ontologies are contract evidence, not runtime imports or entailment sources; they are not core inputs, are not shipped in the browser bundle, and are therefore not represented in the core manifest (Section 37). Their evidence chain is `ontologyLockSha256` in the Node host lock plus the release checksum set.

### 13.4 Static-Artifact Lock

**Scope: Release; enforcement Both hosts.** File:

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

Enforcement is dual:

1. The Node host MUST verify `artifact.lock.json` bytes against `artifactLockSha256` and then every listed artifact before invoking the core; a mismatch MUST produce `ARTIFACT_LOCK_MISMATCH`.
2. The core MUST verify the five locked input byte values against the embedded digests of Section 6.7 at phase C1, under every host, with the same code.

The user-supplied profile need not be byte-identical to the canonical profile. It MUST pass the core input rules and be RDF-triple-set equivalent to the locked supported profile as specified in Section 20.

### 13.5 SBOM Contract

**Scope: Node host, Release.** `sbom.json` MUST validate as CycloneDX 1.7 JSON and MUST enumerate the compiler package and all runtime, host, build, and test dependencies represented by `package-lock.json`, including the `filesystemLock` dependency, the conformance DOM implementation, and the bundler of Section 13.7.

For reproducibility, the SBOM MUST:

- omit optional generation timestamps and random serial numbers;
- use stable component and dependency ordering;
- identify packages by deterministic package URLs or equivalent stable identifiers;
- include declared versions, resolved integrity evidence where supported, and licenses where known;
- be generated by a locked tool or by deterministic project code identified in the Node host lock.

The SBOM hash MUST match `runtime.lock.json`. A missing SBOM, invalid SBOM, or hash mismatch MUST produce `SBOM_MISMATCH`.

### 13.6 Node Host Lock Validation Order

**Scope: Node host.** Lock validation MUST run in this order, and the first failure determines the emitted code:

1. Parse `runtime.lock.json`; verify executing Node version, npm version, and compiler name/version → `RUNTIME_LOCK_MISMATCH`.
2. Verify `package-lock.json` bytes against `packageLockSha256` and verify the installed dependency graph (names, versions, integrity) against the package lock → `PACKAGE_LOCK_MISMATCH`.
3. Verify `artifact.lock.json` bytes against `artifactLockSha256`, then verify every listed artifact → `ARTIFACT_LOCK_MISMATCH`.
4. Verify `ontology.lock.json` bytes against `ontologyLockSha256`, then verify every vendored ontology file → `ONTOLOGY_LOCK_MISMATCH`.
5. Verify `sbom.json` bytes against the Node host lock's SBOM hash and validate its format → `SBOM_MISMATCH`.

A mismatch between an embedded hash in the Node host lock and the referenced file's actual bytes is attributed to the referenced lock's code (steps 2–5), because the referenced file is the artifact under verification; which of the two files was mutated is undecidable and is not guessed.

### 13.7 Browser Host Lock

**Scope: Browser host, Release.** File:

```text
browser-host.lock.json
```

Required shape:

```json
{
  "lockVersion": "browser-host-lock-v1.0",
  "bundle": {
    "path": "browser/relationship-presentation-core.bundle.mjs",
    "sha256": "<sha256>",
    "sriIntegrity": "sha384-<base64>"
  },
  "bundler": {
    "package": "<package-name>",
    "version": "<exact-version>",
    "integrity": "<lockfile-integrity>"
  },
  "compiler": {
    "name": "relationship-presentation-poc",
    "version": "1.0.0"
  },
  "engineBaselines": [
    { "engine": "Chromium", "version": "<tested-version>" },
    { "engine": "Firefox", "version": "<tested-version>" },
    { "engine": "WebKit", "version": "<tested-version>" }
  ]
}
```

The bundle is the complete core module graph, including CPS-conforming dependencies, built as one deterministic ES module: identical inputs and bundler MUST reproduce byte-identical bundle output, and reproduction is release evidence (Section 49.1). The bundler is locked and SBOM-enumerated; it is build tooling, never a runtime dependency.

A browser cannot attest its own environment at runtime; there is no browser analogue of step 1 of Section 13.6, and this specification does not pretend otherwise. The integrity story is: the bundle's SRI value binds what executes; the equivalence suite binds what it does; `engineBaselines` records where that was proven at release. Embedders SHOULD enforce `sriIntegrity` at load wherever the loading mechanism supports it.

### 13.8 Embedded-Digest Equality

**Scope: Release.** The `EMBEDDED_ARTIFACT_DIGESTS` constants injected under Section 6.7 MUST equal the five `sha256` values in `artifact.lock.json`. Release packaging MUST verify the equality before signing or publishing anything, and the conformance suite MUST re-verify it (Section 45.10). An inequality is a release-packaging defect and blocks release; it is not a runtime state. The runtime consequence of a genuinely mutated artifact is `ARTIFACT_LOCK_MISMATCH` from whichever layer encounters it first (Section 12.5).

## 14. Node Host Trust Boundary and Input Acquisition

**Scope: Node host.**

### 14.1 Approved Package Boundary

The approved package boundary is the real path of the directory containing `package.json` and `runtime.lock.json` for the executing compiler package.

Default inputs and all internally acquired context, contract, ontology, lock, SBOM, and profile-reference files MUST resolve inside that boundary.

An explicitly supplied `--source`, `--request`, or `--profile` path MAY resolve outside the package boundary when it is a regular file named directly by the user and is not reached through a symlink. The output path MAY be outside the package boundary subject to Section 15.

### 14.2 Local-Only Acquisition Rule

The Node host MUST read only:

- the explicit CLI input files or their default-mode equivalents;
- fixed package files named by populated locks;
- files created by the current build inside its unique staging directory.

It MUST reject:

- special files, devices, sockets, pipes, or directories where a regular file is required → `UNSAFE_INPUT_PATH`;
- any implicit filesystem lookup not named by the CLI or a verified lock → `UNSAFE_INPUT_PATH`.

Content-level rejection — encodings, duplicate members, contexts, imports, graphs — is the core's job (Section 16); the host acquires bytes, it does not interpret them.

### 14.3 Input Symlinks

Input paths MUST be examined with `lstat` before opening.

- A symlink supplied for `--source`, `--request`, or `--profile` MUST be rejected with `UNSAFE_INPUT_PATH` unless its complete real-path chain resolves to a regular file inside the approved package boundary.
- A symlink encountered in a fixed locked path MUST be rejected with `UNSAFE_INPUT_PATH`.
- A path that changes identity between validation and opening MUST produce `INPUT_CHANGED_DURING_LOAD` where the platform exposes sufficient metadata to detect it.

### 14.4 Core Request Assembly

After N1–N4 succeed, the Node host reads exactly eight files as raw bytes — the five locked artifacts (context, contract, canonical profile, both carriers) from their package paths and the three user inputs (`--source`, `--request`, `--profile`) — and constructs the `CoreRequest` of Section 6.3. In default mode `inputs.userProfile` and `inputs.canonicalProfile` are read from the same file. The host performs no parsing of these eight inputs and no path-derived transformation of their bytes.

## 15. Node Host Output Safety and Recoverable Replacement

**Scope: Node host.**

### 15.1 Path Resolution Rules

Before any output mutation:

1. resolve the real path of the output parent directory;
2. reject output paths whose final component is a symlink → `UNSAFE_OUTPUT_PATH`;
3. reject existing output directories that are symlinks → `UNSAFE_OUTPUT_PATH`;
4. reject outputs inside the compiler package, inside any input directory, or equal to any input path → `INPUT_OUTPUT_OVERLAP`;
5. reject devices, sockets, pipes, and other special files → `UNSAFE_OUTPUT_PATH`;
6. compare identity with device and inode (or platform equivalent), not string prefixes;
7. when `--replace` is absent and the output target exists → `OUTPUT_EXISTS` (checked in phase N3 of Section 12.2, before compilation).

### 15.2 Output Lock

Concurrent builds targeting one output MUST be excluded through an OS advisory lock with automatic release on process termination — `flock` semantics on POSIX, `LockFileEx` semantics on Windows — acquired on a deterministic sibling lock file named `<output-basename>.lock` in the output parent directory.

The Node.js standard library provides no such lock; `node:fs` exposes neither `flock` nor `LockFileEx`. Therefore the lock MUST be provided by the dependency recorded as `filesystemLock` in the Node host lock (Section 13.2) and enumerated in the SBOM. Selecting that dependency is a Phase 0 decision (Section 48). A native module is acceptable; the requirement is on the semantics, not the implementation language.

Marker-file schemes (exclusive-create of an ordinary file, PID files, mkdir locks) MUST NOT be used as the exclusion mechanism: a killed process leaves a stale marker that either blocks future builds or invites unsafe automatic cleanup, and v1.0 chooses neither. The OS-held lock is the mechanism precisely because the operating system releases it when the holder dies.

If the lock is already held, the compiler MUST fail immediately with `OUTPUT_LOCKED`. It MUST NOT wait, retry, or steal. Lock-file content is not significant; its existence when unheld is not an error.

### 15.3 Staging

Builds write into a fresh staging directory created with a mkdtemp-style unique-name primitive in the output parent, never inside an existing published output directory. Staging names are operational values excluded from canonical bytes.

### 15.4 Existing Output Handling

Under `--replace`, an existing target is validated for ownership before any mutation, using the sentinel recognition rules of Section 41: the sentinel is present, parseable, and has `owner` equal to `relationship-presentation-poc` and a `sentinelVersion` this compiler recognizes as its own lineage; a parseable `09-distribution-manifest.json` with the expected `manifestVersion` is present; and no unexpected extra entries exist beyond documented outputs and recovery artifacts. If any condition fails, the compiler MUST fail with `OUTPUT_NOT_OWNED` and MUST NOT delete or overwrite anything.

### 15.5 Publication of a New Output

When the target does not exist, publication is a single atomic rename of staging to the target within the same filesystem. If rename fails because the parent is on another filesystem, the build MUST fail rather than degrade to copy-then-delete.

### 15.6 Recoverable Replacement Protocol

When the target exists and is owned, replacement MUST follow a journaled sequence:

1. acquire the output lock (Section 15.2);
2. validate ownership (Section 15.4);
3. write the completed canonical artifact set into staging and fsync files, directory entries, and the parent directory to the extent the platform supports;
4. write a journal file `<output-basename>.replace-journal.json` in the output parent recording target, staging, and backup names and the intended sequence, then fsync it;
5. rename the current target to the backup name;
6. rename staging to the target;
7. delete the backup after successful publication;
8. delete the journal and release the lock.

Journal and backup names are deterministic siblings derived from the output basename.

### 15.7 Recovery Rules

On startup, holding the lock, the compiler MUST inspect the parent for a journal:

- journal present, target missing, backup present → complete or roll back per journal state deterministically;
- journal present, target present, staging or backup residue present → finish the journal's declared step order or fail with `OUTPUT_RECOVERY_REQUIRED` without deleting user data;
- journal unreadable or inconsistent → `OUTPUT_RECOVERY_REQUIRED`.

Recovery MUST never delete a directory that fails ownership validation.

### 15.8 Detached Failure Reports

On validation failure, the compiler MUST NOT write into the output target. The error report path is the sibling `<output-basename>.error-report.json` in the output parent, containing the bytes produced by the core-exported builder of Section 42. If even the parent is unwritable, the stderr line is the sole failure surface.

---
# PART III — EDGE-CANONICAL CORE

Every section in Part III is **Scope: Core** and binds identically under both hosts unless a subsection states otherwise.

## 16. Core Input Contract and Structural Limits

### 16.1 Core Request Shape

`CoreRequest` validation is phase C0 (Section 12.4): exactly the eight named members of Section 6.3, each a `Uint8Array`, no extras. Any violation → `INVALID_CORE_REQUEST`.

### 16.2 Deterministic Structural Limits

These limits are part of deterministic input conformance and are checked in phase C2:

| Limit | v1.0 value | Error code |
|---|---:|---|
| Source bytes | 1 MiB | `SOURCE_TOO_LARGE` |
| Request bytes | 4 KiB | `REQUEST_TOO_LARGE` |
| Profile bytes (each of userProfile, canonicalProfile) | 64 KiB | `PROFILE_TOO_LARGE` |
| Context bytes | 64 KiB | `CONTEXT_TOO_LARGE` |
| Contract bytes | 64 KiB | `CONTRACT_TOO_LARGE` |
| Maximum JSON nesting depth | 64 | `JSON_TOO_DEEP` |
| Maximum expanded triples | 5,000 | `TOO_MANY_TRIPLES` |
| Maximum context entries | 250 | `TOO_MANY_CONTEXT_TERMS` |
| Maximum critical label length | 256 Unicode scalar values | `LABEL_TOO_LONG` |
| Maximum request designator length | 256 Unicode scalar values | `DESIGNATOR_TOO_LONG` |
| Maximum violations in an error report | 100 | `TOO_MANY_VIOLATIONS` |

Byte limits MUST be checked before decoding or parsing. Duplicate JSON member detection, JSON depth, and context structure MUST be checked before JSON-LD expansion. Unicode scalar counts MUST be computed over Unicode scalar values, not UTF-16 code units.

Operational guards (wall-clock, memory) are host supervision concerns (Sections 10.6, 11.2), not core limits: a pure function has no clock.

### 16.3 Encoding and Duplicate Members

- Every input MUST decode as UTF-8 with a fatal decoder; invalid sequences → `INVALID_UTF8`.
- BOM policy is Section 46: the core either strips exactly one leading U+FEFF or rejects with `UTF8_BOM_NOT_SUPPORTED`; the choice is fixed, documented, tested, and identical under both hosts. Hashing always covers raw bytes as supplied.
- Duplicate JSON object member names in any parsed JSON input MUST produce `DUPLICATE_JSON_MEMBER`. This applies to all JSON among the eight core inputs; hosts apply the same rule to lock files and the SBOM through the core-exported scanner (Section 13.1). RFC 8259 permits parsers to silently discard duplicate members; a document whose duplicates present one value to the compiler and another to a second tool is a parser-differential vector this rule closes. Because `JSON.parse` cannot detect duplicates, the core MUST use a duplicate-detecting parse strategy — a vetted CPS-conforming dependency or the project scanner — fixed in Phase 0.

### 16.4 Context Approval and JSON-LD Trust Rules

The core's JSON-LD processor receives an injected, inert document loader (Section 6.6). The loader resolves exactly one reference:

```text
"../contexts/poc.context.jsonld"
```

This literal is a package-contract token: the loader maps it to the supplied, digest-verified `inputs.context` bytes. It performs no path resolution of any kind.

For every expanded document, the core MUST reject:

- HTTP or HTTPS contexts → `REMOTE_CONTEXT_NOT_SUPPORTED`;
- `file:` contexts and any context string other than the approved token or a conforming inline context → `LOCAL_CONTEXT_NOT_APPROVED`;
- JSON-LD `@import` → `JSONLD_IMPORT_NOT_SUPPORTED`;
- an `owl:imports` assertion in a fixture → `OWL_IMPORTS_NOT_SUPPORTED`; it is never followed (the inert loader could not follow it, and the assertion itself is rejected);
- named graphs → `NAMED_GRAPH_NOT_SUPPORTED`;
- blank nodes in fixtures or profiles → `BLANK_NODE_NOT_SUPPORTED`.

For an inline fixture or profile context:

- every reserved prefix and term redefinition MUST be byte-for-value identical to its canonical definition; a violation MUST produce `CONTEXT_TERM_REDEFINITION`;
- additional entries MAY define fixture namespace prefixes with `@prefix: true` and absolute IRI bases;
- additional entries MUST NOT redefine compiler, BFO, CCO, RDF, RDFS, OWL, SKOS, or XSD terms → `CONTEXT_TERM_REDEFINITION`;
- `@base`, `@vocab`, `@language`, `@direction`, remote contexts, scoped contexts, and `@import` are prohibited → `LOCAL_CONTEXT_NOT_APPROVED` (or the more specific remote/import code where applicable);
- no context entry may expand a predicate or class into a prohibited namespace → `CONTEXT_TERM_REDEFINITION`.

The fixed contract and canonical supported profile MUST use their documented canonical context reference; their bytes are digest-verified before parsing (phase C1). A user-supplied profile MAY use the approved token or a conforming inline context.

### 16.5 JSON-LD Processing

The core MUST:

- parse JSON-LD 1.1;
- expand into exactly one default RDF graph per document;
- collapse duplicate RDF triples;
- preserve literal datatype and language information for validation;
- operate over direct assertions only.

The core MUST NOT perform RDFS or OWL entailment, subclass reasoning, `owl:sameAs` closure, inverse-property reasoning, functional-property reasoning, SPARQL queries, database access, network access, LLM calls, or web search. Under the Common Platform Surface the last four are impossible by construction; they are stated so the prohibition survives any future CPS amendment.

JSON-LD nesting and `@reverse` MAY be accepted only when expansion yields permitted named-node triples in the default graph.

## 17. JSON-LD Vocabulary and Complete Context

Every generated JSON-LD artifact MUST reference:

```json
{
  "@context": "./poc.context.jsonld"
}
```

The context copy in the canonical artifact set MUST be byte-identical to the supplied, digest-verified canonical context.

The output context MUST define every unprefixed term used by normative artifacts. Undefined relative properties are prohibited.

Fixture-origin IRIs MUST always be emitted as absolute IRI strings in generated artifacts. The output context MUST NOT be dynamically extended with fixture prefixes. Fixed compiler-owned compact IRIs such as `run:`, `rule:`, `profile:`, `projection:`, and `html:` MAY be used because their mappings are locked.

### 17.1 Complete Context

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

The context bytes are unchanged from v0.4.1 and the v1.0 draft; only its lock entry hash would change if bytes changed, and this cut changes no bytes.

## 18. RDF Ordering Semantics

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

## 19. Controlled Request Contract

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
- free of the characters prohibited by Section 22 → otherwise `INVALID_CRITICAL_STRING`.

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

## 20. Supported Profile Contract

The Node CLI accepts `--profile` and the Browser host accepts `inputs.userProfile`, but v1.0 supports only:

```text
profile:two-slide-explainer-v3
```

The profile identifier names a fixed projection program (Section 7.4). The profile document is that program's parameter block, and v1.0 requires every parameter it carries to be load-bearing:

- `projection:slideCount` MUST be read by the core, which MUST verify that the constructed narrative-unit count and slide count equal it; a construction that would diverge is an `INTERNAL_COMPILER_ERROR`.
- `projection:participantOrder` MUST be read by the core as the token selecting the participant ordering algorithm. v1.0 defines exactly one token, `utf16-code-unit-ascending-label`, whose algorithm is Section 22. Any other token MUST produce `UNSUPPORTED_PROFILE_CONTRACT` (unreachable under triple-set equality with the locked profile, but normative so that the token, not Section 22 alone, is the selection authority).
- Template and label members are consumed by the named rules that cite them.

`aspectRatio` is not a profile member in v1.0. The presentation surface's 16:9 aspect ratio is a property of the locked carrier stylesheet and is specified in Section 32.3, which is where it was always enforced. Its v0.4.x presence in the profile was a parameter with no consumer.

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

The profile is fixed for v1.0. The profile option exists to make the contract boundary explicit, not to imply support for arbitrary profiles. Section 50.1 names the planned falsifier for profile-drivenness in the next major version.

## 21. Closed-World Fixture Contract

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

### 21.1 Required Resolving Designator

Exactly one named node `D` with an absolute IRI MUST satisfy:

```turtle
D rdf:type cco:ont00000649 .
D rdfs:label T .
D cco:ont00001916 R .
```

`D` MUST:

- have exactly one `rdfs:label` value in the source graph;
- designate exactly one entity;
- not be directly typed as any member of the Prohibited Meta-Type Set (Section 8.3);
- be selected by exact NFC-normalized equality between its label and `T`.

No other `cco:ont00000649` node may have an NFC-normalized `rdfs:label` equal to `T`.

### 21.2 Required Association Node

`R` MUST be a named node with an absolute IRI.

`R` MUST be directly typed as both:

```turtle
R rdf:type rp:PersonAssociation .
R rdf:type obo:BFO_0000145 .
```

`R` MUST NOT be directly typed as any member of the Prohibited Meta-Type Set.

`R` MAY be directly typed as `owl:NamedIndividual`.

### 21.3 Required Participants

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

### 21.4 Required Participant Names

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

### 21.5 Selected-Individual Distinctness

The six selected individuals `D`, `R`, `P1`, `P2`, `N1`, `N2` MUST be six pairwise-distinct absolute IRI strings. Any coincidence of two roles on one IRI MUST fail with the check code `SELECTED_INDIVIDUALS_PAIRWISE_DISTINCT`.

The source graph MUST NOT assert `owl:sameAs`, in either direction, between any two selected individuals. A violation MUST fail with the check code `NO_OWL_SAMEAS_AMONG_SELECTED`.

Rationale, recorded so the checks are not weakened later: without entailment, the contract cannot detect that a node typed both `cco:ont00000649` and `rp:PersonAssociation` (a self-designating identifier-quality) is inconsistent under BFO, where generically and specifically dependent continuants are disjoint, or that a node typed both `cco:ont00000003` and `cco:ont00000649` violates CCO's own `owl:disjointWith` axiom between those classes. These two closed-world checks enforce the identity-level consequences of those upstream axioms at the cost of two set-membership tests, without importing entailment. General contradiction detection remains out of scope (Section 47); these checks are targeted at the selected neighborhood only.

### 21.6 Selected-Neighborhood Closure

For purposes of contract validation, the selected neighborhood comprises:

- `D` and all its `rdfs:label` and `cco:ont00001916` values;
- `R` and all its `rdf:type` and `obo:BFO_0000195` values;
- the selected participants and their relevant type and `owl:differentFrom` values;
- every `cco:ont00000003` node that designates either selected participant, including its designates and label values.

Additional fixture facts outside that neighborhood MAY exist. They MUST NOT:

- create another resolving designator for `T`;
- change a selected node's required cardinality;
- introduce a prohibited namespace anywhere in the source graph, in any RDF position (Section 43.2) → `SOURCE_GRAPH_CONTAMINATED`;
- introduce a named graph or blank node;
- place the generated association sentence in the source graph as an exact literal → `SOURCE_GRAPH_CONTAMINATED`.

The source graph MUST NOT contain the generated sentence that would result from the selected labels and fixed template. That sentence is a projection artifact.

### 21.7 Required Deterministic Failures

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

## 22. Label, Unicode, and Sorting Rules

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

Participant ordering uses the algorithm named by the profile token `utf16-code-unit-ascending-label` (Section 20):

1. primary key: NFC-normalized participant display-name label by ascending UTF-16 code-unit order;
2. tie breaker: participant absolute IRI string by ascending UTF-16 code-unit order.

UTF-16 code-unit ordering is deliberately aligned with RFC 8785's object-member ordering so the project carries one string-ordering discipline, not two.

Identical participant labels are permitted when participant IRIs differ and `owl:differentFrom` is asserted. The rendered list MAY contain identical visible strings, but traceability MUST distinguish the name nodes and participants.

Request matching compares the NFC-normalized captured designator with NFC-normalized untagged identifier labels. Generated strings use the normalized values.

## 23. Canonical Fixture

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

## 24. Pipeline and Artifacts

v1.0 has seven intermediate JSON-LD artifacts plus manifests and HTML carriers:

1. Normalize request.
2. Resolve source scope.
3. Validate the resolved neighborhood.
4. Select content.
5. Construct narrative and reified text content.
6. Build a target-neutral presentation.
7. Create a complete HTML document projection.
8. Render, revalidate, and produce the canonical artifact set.

The canonical artifact set comprises exactly these thirteen files:

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

Artifacts 01–07 are JSON-LD. Manifests, reports, and the ownership sentinel are canonical plain JSON. The core produces the complete set as a byte map (Section 6.3); placement is a host act (Sections 11.3, 15).

Every stage MUST consume only declared inputs and the output of preceding stages. It MUST NOT re-read hidden fixture-specific state.

---
## 25. Stage 1: Request Artifact

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

- the request matches the anchored grammar exactly under the unique decomposition of Section 19;
- exactly one non-empty designator is captured;
- no field depends on fixture-specific hidden state.

## 26. Stage 2: Resolution Artifact

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

## 27. Stage 3: Contract Validation Artifact

File:

```text
03-contract-validation.jsonld
```

The validator MUST evaluate the closed-world fixture contract for the resolved neighborhood, the distinctness rules of Section 21.5, and the global contamination rules.

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

The success artifact records passed checks only because compilation stops on failure. Failure details belong in the error report described in Section 42.

## 28. Stage 4: Content Manifest Artifact

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

## 29. Stage 5: Narrative Artifact

File:

```text
05-narrative.jsonld
```

All generated user-perceivable strings are reified as `projection:TextContent` nodes. Presentation regions and HTML text or accessibility attributes project these content resources, not RDF predicate names.

### 29.1 Provenance Discipline

v1.0 separates two kinds of provenance and assigns each a home:

- **Character provenance** lives in `derivedFrom`. `derivedFrom` is defined as the ordered set of selected source nodes any of whose literal values contribute characters, after normalization and template substitution, to the generated `textValue`. Order is substitution order.
- **Eligibility provenance** lives in Stage 3. That the association node licensed generation at all is recorded by `03-contract-validation.jsonld` through `validatedRoot` and its checks, and by the selection trace in Stage 4. Eligibility is not restated in `derivedFrom`.

Consequences: the association sentence derives its characters from the two name labels only, so its `derivedFrom` is exactly the two name nodes; the association node and the resolving designator contribute no characters to it and do not appear there. The deck title and document title derive their characters from the resolving designator's label. `derivedFrom` MUST be present and non-empty for source-derived content and MUST be omitted for content taken verbatim from the supported profile; `generatedBy` identifies the profile-extraction rule. This definition is mechanically checkable: for every source-derived `textValue`, a renderer-independent validator MUST be able to reconstruct the string from the labels of exactly the listed nodes plus the named rule's fixed template.

The narrative builder MUST:

1. derive the relationship title from `D`'s selected label;
2. derive participant display names from `N1` and `N2` labels;
3. sort participants according to the profile-selected algorithm (Sections 20 and 22);
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

## 30. Stage 6: Target-Neutral Presentation Artifact

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

## 31. Stage 7: Complete HTML Document Projection

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

Fixed CSS source and fixed JavaScript source are versioned carrier resources rendered in Stage 8 by named rules. They are not narrative content and need not be serialized as `html:TextNode` resources in this graph. Their generated bytes are covered by `presentation.html` in the core manifest.

### 31.1 Deterministic Mapping

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

### 31.2 Complete Canonical Artifact

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

### 31.3 Projection Invariants

- Every HTML document, doctype, element, attribute, and text node MUST have a stable `@id`.
- Every fixture-derived or user-perceivable text node or attribute value MUST project a `projection:TextContent` node or deterministic navigation region.
- The `style` and `script` elements are the only projected elements whose fixed locked text payload is inserted by the renderer without an `html:TextNode` resource; their generating rules and locked source bytes MUST match.
- Every fixed shell or structural value MUST identify a named deterministic rule either directly or through its containing generated node; nodes generated by the Table 31.1 mapping are attributed to `rule:html-document-projection-v1-0` through the document node.
- An element's `htmlIntent` value, its `data-intent` attribute value, and the `rule:navigation-intent-token-v1-0` mapping of its region's `intent` MUST be equal.
- `domOrder` MUST agree with `hasChild` list order.
- Attribute-list order is canonical serialization order and MUST match the example.
- `hiddenInitially` MUST agree with presence or absence of the `hidden` attribute.
- HTML text and attribute values MUST be treated as data, never as markup or code.
- The graph MUST contain no source-graph assertions. `projectsNode` and `projectsContent` are projection trace links only.

## 32. Stage 8: Rendering and Fixed Carriers

### 32.1 Canonical Presentation HTML

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

### 32.2 Contextual Escaping

The renderer MUST apply context-appropriate escaping at every insertion site:

- text nodes: escape `&`, `<`, `>`;
- double-quoted attribute values: escape `&`, `<`, `>`, `"`;
- no fixture text may be inserted into element names, attribute names, CSS, JavaScript, comments, or URLs.

Escaping MUST be centralized in one audited core module exposing one escaper per insertion context. The renderer MUST NOT concatenate unescaped fixture text.

### 32.3 Fixed Stylesheet Contract

`carrier/presentation.css` is locked by embedded digest and inserted verbatim into `<style>` by `rule:carrier-style-v1-0`. It MUST:

- provide the presentation surface with a 16:9 aspect ratio (this is a carrier property; it was a consumerless profile parameter before v1.0 and is owned here now);
- provide visible layout for sections, headings, paragraph, list, and buttons;
- preserve a visible keyboard focus indicator for buttons and focused headings;
- avoid `display: none` on focusable controls in the visible slide;
- contain no external references (no `@import`, no `url(...)` fetches).

The payload bytes MUST NOT contain the byte sequence `</style` in any ASCII case variant; HTML terminates a raw-text `style` element at that sequence regardless of CSS syntax, and the constraint is on bytes, not on CSS semantics. This is a normative property of the locked file, verified by conformance test (Section 45.17); the subset revalidator additionally verifies it before acceptance and treats a violation as `INTERNAL_COMPILER_ERROR`.

### 32.4 Fixed Navigation Script Contract

`carrier/navigation.js` is locked by embedded digest and inserted verbatim into `<script>` by `rule:carrier-navigation-script-v1-0`. It MUST:

1. use only DOM APIs available in the conformance DOM implementation and supported evergreen browsers;
2. attach one delegated click listener;
3. interpret only `data-intent="advance"` and `data-intent="back"`;
4. maintain one integer slide index over the ordered `section` elements inside `main`;
5. toggle only the `hidden` attribute to change visibility;
6. move focus to the newly visible slide's heading;
7. perform no network requests, no dynamic script or style injection, no `eval`, no `Function` constructor, no timers, and no storage access;
8. tolerate repeated clicks at boundaries without error.

The carrier script executes in the presentation document when a person opens it; it is not core code, and the Common Platform Surface does not govern it — items 1–8 do. The payload bytes MUST NOT contain the byte sequence `</script` in any ASCII case variant (the same raw-text termination rule; a string literal containing it would truncate the element). Conventional escaping such as `<\/script` satisfies the constraint. Verified by conformance test; the subset revalidator additionally verifies it and treats a violation as `INTERNAL_COMPILER_ERROR`.

### 32.5 Deterministic Subset Revalidator

Before the rendered bytes are accepted into the canonical artifact set, the core MUST revalidate them with a project-owned deterministic subset revalidator. This module replaces the runtime DOM dependency of earlier drafts: a general HTML5 parser is oversized for a document the compiler itself emitted from a closed vocabulary, and everything a general parser would tolerate beyond that vocabulary is exactly what the revalidator MUST refuse.

**Subset grammar.** The revalidator accepts only:

- the exact doctype `<!DOCTYPE html>`;
- elements from the closed set `html`, `head`, `meta`, `title`, `style`, `body`, `main`, `section`, `h1`, `h2`, `p`, `ul`, `li`, `button`, `script`;
- attributes from the closed set `lang`, `charset`, `name`, `content`, `aria-label`, `id`, `aria-labelledby`, `tabindex`, `hidden`, `type`, `data-intent`, all values double-quoted (`hidden` valueless or empty-valued per Section 31.2);
- `meta` as the only void element;
- `style` and `script` as raw-text elements whose payloads are opaque except for the terminator-byte scan;
- text nodes in which `&`, `<`, `>` occur only as `&amp;`, `&lt;`, `&gt;`, and `&quot;` is the only additional recognized reference;
- the renderer's exact whitespace discipline.

Comments, CDATA, processing instructions, other doctypes, unknown elements or attributes, single-quoted or unquoted attribute values, and any unrecognized character reference are outside the subset.

**Procedure.** The revalidator MUST (a) parse the rendered bytes against the subset grammar, failing closed on anything outside it; (b) re-derive the document structure and compare it, node for node and attribute for attribute, against the Stage 7 projection graph; and (c) re-serialize the derived structure and compare the result byte-for-byte with the rendered input — the round trip is the proof that parse and render agree.

**Checks.** The revalidator MUST verify:

- document structure matches the Stage 7 graph, including element order and attributes;
- every projected text node and attribute value equals its projected content `textValue`;
- every element's `data-intent` value equals both its `htmlIntent` and the `rule:navigation-intent-token-v1-0` token of its region's intent;
- slide 2 is initially hidden and slide 1 is not;
- both carrier payloads are byte-identical to the supplied locked inputs and free of their terminating byte sequences;
- exactly one `main`, one `h1`, and one `script` exist;
- IDs are unique and `aria-labelledby` references resolve.

Any failure is `INTERNAL_COMPILER_ERROR`.

**Division of evidence.** The revalidator is the shipped, edge-canonical, fail-closed gate. Independent full-HTML5 parsing — the conformance DOM implementation and at least one real browser engine — is release evidence that the subset assumptions hold under standards parsing (Section 45.21). The strictness ordering is deliberate: the revalidator rejects documents a general parser would accept; a general parser is consulted to prove the accepted documents mean what Stage 7 says they mean.

## 33. Accessibility Contract

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

Structural accessibility facts (IDs, references, `tabindex`, `hidden`, heading levels) are asserted by the subset revalidator at build time. Accessibility-tree and behavioral verification — accessible names, computed roles, keyboard activation — is conformance evidence using the conformance DOM implementation and real engines (Sections 45.7, 45.21).

## 34. Demo Page

File:

```text
demo.html
```

`demo.html` is a diagnostic viewer produced by the core. It MUST:

- present the generated presentation and the artifact list;
- render every displayed artifact value and fixture string as escaped text;
- execute no fixture-derived script and load no network resources;
- function when opened from the local filesystem or any embedder surface.

If the demo embeds the presentation with `iframe[srcdoc]`, the embedded document's scripts run only when the sandbox permits them. The demo MUST use `sandbox="allow-scripts"` without `allow-same-origin`. The sandbox attribute does not prohibit network access; the absence of network activity is a property of the locked navigation script (Section 32.4, item 7) and of the locked stylesheet (Section 32.3), not of the sandbox. The demo MUST NOT be described as network-isolated by sandboxing; it is network-silent because its only executable payload is locked and makes no requests.

`demo.html` is included in the distribution manifest but is not part of the deterministic core fingerprint.

## 35. Deterministic Stage 8 Byte-Production Order

Stage 8 MUST produce the canonical artifact set in memory in this order:

1. Render `presentation.html` bytes from the Stage 7 graph and the supplied locked carriers.
2. Revalidate the rendered bytes (Section 32.5).
3. Assemble the context copy and artifacts `01`–`07` as bytes.
4. Compute SHA-256 for the context, artifacts `01`–`07`, and `presentation.html`.
5. Build `08-core-manifest.json` bytes; compute the core fingerprint over its canonical bytes.
6. Build `validation-report.json` bytes, which may reference the core fingerprint.
7. Build `demo.html` bytes, which may display the core fingerprint.
8. Build the ownership sentinel bytes.
9. Build `09-distribution-manifest.json` bytes over the sentinel, core manifest, validation report, and demo; compute the distribution fingerprint over its canonical bytes.
10. Build the success status line.
11. Return the `CoreResult`; publication is a host act (Sections 11.3, 15).

Fingerprint-occurrence rules:

- files listed in the core manifest MUST NOT contain the core fingerprint;
- the validation report and demo MAY reference the core fingerprint;
- the distribution manifest is the only file that may carry the distribution fingerprint, over its own canonicalized content excluding its embedded fingerprint member;
- the status line reports both fingerprints.

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

Nonnormative note: Sections 35 through 42 of this Part, together with the Node host's Section 15, form a self-contained publication substrate — acyclic manifests, canonical hashing, ownership, locking, staged replacement, recovery, and failure reporting — whose compute half is now fully edge-canonical. They remain a candidate for extraction as a standalone specification reusable by other services in the portfolio. v1.0 deliberately keeps them inline; extraction, if it happens, is a future editorial act that MUST NOT change their normative content silently.

---
## 36. Canonical JSON and Hashing

### 36.1 Hash Algorithm

All fingerprints and file hashes use SHA-256 over exact file bytes, lowercase hexadecimal, computed through the Common Platform Surface digest primitive (`crypto.subtle.digest("SHA-256", …)`). The primitive is asynchronous; the core API is therefore asynchronous (Section 6.3), and no scheduling nondeterminism may influence results.

### 36.2 Manifest Fingerprint Canonicalization

The core and distribution manifests are canonical JSON per RFC 8785 (JCS): UTF-8, no insignificant whitespace, lexicographic member ordering by UTF-16 code units, shortest-form JSON number serialization, LF-terminated file.

Fingerprint computation for a manifest:

1. parse the manifest with the duplicate-member-rejecting parser;
2. remove the manifest's own fingerprint member;
3. serialize per RFC 8785;
4. hash the canonical bytes.

All numeric values in manifests MUST be non-negative integers within the IEEE-754 exactly-representable safe range, so RFC 8785 number serialization is exact.

### 36.3 Generated JSON-LD Serialization and Key Order

Generated JSON-LD artifacts are serialized deterministically: two-space indentation, LF line endings, terminal LF, and fixed key order.

The fixed key order for each generated `@type` is defined as the union of member names across all normative occurrences of that type in this specification, in order of first appearance. Objects that omit optional members serialize their present members in that same relative order. This closes the gap where two occurrences of one type carry different member subsets.

Worked example — `html:Attribute` occurs with three optional members across Section 31.2; its union order is:

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

### 36.4 Cross-Platform Byte Discipline

All generated text files use UTF-8 without BOM and LF line endings on every platform and every host. Release packaging MUST protect goldens and locked carrier bytes from newline translation (for example, `.gitattributes` with `-text` or equivalent).

## 37. Core Manifest

File:

```text
08-core-manifest.json
```

The core manifest is host-independent: it records what the core received, what the core produced, and the compiler's identity — nothing about the environment. Required logical content:

```json
{
  "manifestVersion": "core-manifest-v1.0",
  "compiler": {
    "name": "relationship-presentation-poc",
    "version": "1.0.0",
    "sourceCommit": "<full-commit-sha>"
  },
  "lockedArtifacts": [
    { "role": "context", "sha256": "<sha256>" },
    { "role": "contract", "sha256": "<sha256>" },
    { "role": "supported-profile", "sha256": "<sha256>" },
    { "role": "carrier-style", "sha256": "<sha256>" },
    { "role": "carrier-navigation", "sha256": "<sha256>" }
  ],
  "inputs": [
    { "role": "source", "name": "source.jsonld", "sha256": "<sha256>" },
    { "role": "request", "name": "request.txt", "sha256": "<sha256>" },
    { "role": "profile", "name": "profile.jsonld", "sha256": "<sha256>" },
    { "role": "canonical-profile", "name": "two-slide-explainer.jsonld", "sha256": "<sha256>" },
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

`lockedArtifacts` is populated from the embedded constants of Section 6.7 and therefore restates, inside the fingerprinted surface, exactly the static-artifact evidence the core enforced. `compiler.sourceCommit` is the packaging-injected constant.

Input entries use logical role names, not user paths. The manifest MUST NOT contain absolute paths, output-directory names, timestamps, host identifiers, or environment identifiers of any kind. In default mode the `profile` and `canonical-profile` entries carry the same hash.

Environment attestation — the Node host lock, package lock, SBOM, and bundle SRI — is deliberately absent. Those are facts about a host, not about the computation; they live in Section 13 and in release evidence. This is what makes the core fingerprint host-invariant, and the dual-host equivalence suite (Section 45.20) asserts exactly that invariance.

The core manifest excludes itself, the validation report, the demo, the sentinel, and the distribution manifest.

## 38. Validation Report

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
- `hostEquivalent`;
- `distributionManifestPresent` or `distributionVerified`.

Those properties are established by the test suite and release evidence, not by a single run. The report MUST NOT include the distribution fingerprint.

## 39. Distribution Manifest

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

The verifier operates over a named byte map; a filesystem is one possible source of that map, not a requirement. Under the Browser host it runs directly over the returned `CoreResult.artifacts`. The distribution manifest does not include itself in `files`.

## 40. Determinism and Host-Invariance Guarantee

For identical input bytes, identical locked artifacts, and the same compiler version, the following MUST be byte-identical across runs, processes, output directories, supported platforms, **and supported hosts**:

- the entire canonical artifact set of Section 24, including both manifests, the validation report, the sentinel, and `demo.html`;
- the status line;
- for nonconforming invocations whose governing code has Core or Both applicability, the single error line and the error-report bytes, per the failure ordering of Section 12.

The implementation MUST NOT allow iteration order of hash maps, filesystem listing order, locale, environment variables, wall-clock time, random values, host identity, or scheduling to influence canonical bytes or the emitted error code. Where ordering exists, it MUST come from this specification. Hosts MUST NOT rewrite, reformat, or re-encode core-produced bytes; placement is byte-preserving.

Determinism tests MUST compare independent runs executed in separate processes with different output directories on both supported Node platforms; host-invariance is established by the dual-host equivalence suite (Section 45.20), which is the falsifier for the edge-canonical claim.

A future `semanticSha256` (hash over expanded RDF quads) MAY be added alongside byte hashes in a later version; v1.0 asserts byte determinism only.

## 41. Ownership Sentinel

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

The sentinel is canonical JSON, is produced by the core as part of the canonical artifact set, and participates in the distribution manifest.

Recognition rules: v1.0 recognizes only `sentinelVersion` `owned-output-v1.0` as its own lineage. Directories published by the v0.4.x POC lineage carry `owned-output-v0.4.1` and are deliberately not owned by v1.0: replacing them requires manual removal by the operator, and the Node host MUST fail with `OUTPUT_NOT_OWNED` rather than adopt them (Section 15.4). This is the conservative reading of an ownership boundary across a major-version line. Ownership validation is a placement-time act and therefore a host obligation; the Browser host has no owned targets in v1.0.

## 42. Error Reports

Failure-report bytes are produced by the core-exported builder for every governing code for which this section defines content; the Node host writes them to the sibling path `<output-basename>.error-report.json` (Section 15.8), and the Browser host returns them in `CoreResult.errorReport`.

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

- top-level `code` is the single governing code also carried by the status line;
- `violations` lists independently detected failures up to the limit of 100; more MUST produce top-level `TOO_MANY_VIOLATIONS` carrying the first 100;
- ordering is by `code` ascending, then `source` ascending (violations without `source` sort before those with one), then `message` ascending, all by UTF-16 code units;
- messages are fixed template strings; fixture-derived text appears only in identified fields, never interpolated into prose;
- reports MUST NOT contain stack traces, timestamps, absolute paths, environment values, host identifiers, process IDs, hostnames, or random identifiers.

The error report is deterministic for identical failing inputs and locked artifacts, under either host.

## 43. Source Contamination and Namespace Rules

### 43.1 Allowed Source Namespaces

Source fixtures MAY use:

- `http://www.w3.org/1999/02/22-rdf-syntax-ns#` (`rdf:type` and structural RDF);
- `http://www.w3.org/2000/01/rdf-schema#` (labels, comments);
- `http://www.w3.org/2002/07/owl#` (`owl:differentFrom`, `owl:NamedIndividual`; `owl:sameAs` is additionally constrained by Section 21.5);
- `http://www.w3.org/2001/XMLSchema#` (literal datatypes);
- `http://www.w3.org/2004/02/skos/core#` (documentation annotations);
- `http://purl.obolibrary.org/obo/` (BFO terms);
- `https://www.commoncoreontologies.org/` (CCO terms);
- `https://example.org/relationship-presentation-poc/contract/` (the contract class only, as an `rdf:type` object);
- fixture-owned namespaces for individuals.

The allowlist governs predicate IRIs, `rdf:type` object IRIs, and literal datatype IRIs: every predicate, every direct class assertion, and every literal datatype in the source graph MUST come from the allowlist (fixture-owned namespaces name individuals; they do not license predicates, classes, or datatypes). A violation MUST produce `SOURCE_NAMESPACE_NOT_ALLOWED`.

Subject and non-type object positions are free to use fixture-owned namespaces; they remain subject to the prohibitions below.

### 43.2 Prohibited Namespaces in Source

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

A fixture individual IRI minted inside a prohibited namespace is contamination even when every predicate about it is allowlisted; a literal typed with a prohibited-namespace datatype is contamination even though it is "just data". The check is positional-complete by construction, and the negative suite exercises subject-position and datatype-position cases (Section 46).

The words "slide", "presentation", or "html" inside label text are not contamination. An unused declared prefix is not contamination; contamination is assessed over expanded triples.

`rp:PersonAssociation` is permitted only as an `rdf:type` object. Any other use of the contract namespace in the source graph MUST produce `LOCAL_CONTRACT_VOCABULARY_VIOLATION`.

### 43.3 Optional Source Facts

Unselected source facts are permitted when they satisfy every rule above and do not alter selected-neighborhood validity. They MUST NOT appear in generated user-perceivable output.

## 44. Anti-Hardcoding Rules

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
- fixed error codes and fixed message templates;
- the packaging-injected constants of Section 6.7.

Enforcement combines a source lint for prohibited literals with late-bound and generated-fixture tests. The lint is weak evidence by itself; the binding evidence is behavioral (Sections 45.2, 45.3). The Common Platform Surface scan (Section 45.18) is a separate gate with a separate purpose: this section polices fixture leakage; the CPS polices environment leakage.

---
# PART IV — CONFORMANCE, PLAN, AND RELEASE

Part IV is **Scope: Release** unless a subsection states otherwise.

## 45. Conformance Test Architecture

### 45.1 Canonical Golden Test

Compile the canonical fixture; compare every canonical output byte-for-byte against `expected/relationship-42/`; verify both fingerprints and the status line.

### 45.2 Late-Bound Fixture Test

A second full fixture with different namespace, IRIs, labels, and title, authored only in test data, MUST compile with correct outputs computed from its inputs, not from stored goldens.

### 45.3 Runtime-Generated Fixture Tests

Property-based generation of conforming fixtures (seeded, deterministic) MUST yield: grammar match, unique resolution, contract pass, profile-order-correct participants, template-correct sentence, byte-valid outputs, verified manifests.

### 45.4 Metamorphic Tests

- Participant label swap: rendered order follows the profile-selected UTF-16 ordering, not input order.
- Fixture IRI renaming under label preservation: user-perceivable strings unchanged; traceability IRIs change coherently.
- Addition of unrelated non-contaminating facts: canonical outputs unchanged.
- Duplicate triple assertions: outputs unchanged.
- Reciprocal `owl:differentFrom`: outputs unchanged.
- A designator label containing the literal grammar suffix ` to a general audience.`: the anchored decomposition of Section 19 captures the full designator, resolution requires the full-string identifier label, and the rendered title carries the full designator.

### 45.5 Hostile Label Tests

Labels including:

```text
A & B <Mira> "quoted" </script><script>alert(1)</script> {participant2} 50% off & more {relationshipTitle}
```

MUST remain inert visible text: escaped in text and attribute contexts, no element or attribute injection, no template re-substitution, and the subset revalidator confirms structure. These are accepted-hostile cases: the strings are legitimate label content rendered safely. Rejected-hostile cases — bidirectional controls, noncharacters, control characters — belong to Section 46 and MUST fail with `INVALID_CRITICAL_STRING` rather than render.

### 45.6 Navigation Behavior Tests

Using the conformance DOM implementation (Section 13.2): initial visibility; advance; back; boundary clicks; focus movement to headings; no exceptions.

### 45.7 Accessibility Tests

Assert accessible names, heading levels, button names and keyboard activation, `hidden` semantics, and `aria-labelledby` resolution for both slides, using the conformance DOM implementation.

### 45.8 Determinism Tests

Independent processes, distinct output directories, both supported Node platforms: byte-identical canonical outputs and identical fingerprints. Host invariance is Section 45.20.

### 45.9 Manifest Dependency Tests

Assert the Stage 8 byte-production order by content: no core-listed file contains the core fingerprint; the report and demo may; only the distribution manifest carries the distribution fingerprint; the byte-map verifier passes end-to-end and fails on any single-byte mutation.

### 45.10 Lock Tests

For each lock, a targeted mutation MUST fail with that lock's own code: Node/npm/compiler mismatch → `RUNTIME_LOCK_MISMATCH`; dependency graph drift → `PACKAGE_LOCK_MISMATCH`; carrier/context/contract/profile byte change → `ARTIFACT_LOCK_MISMATCH` under both hosts; vendored ontology change → `ONTOLOGY_LOCK_MISMATCH`; SBOM absence or drift → `SBOM_MISMATCH`. A test with two simultaneous lock defects MUST emit the code of the earlier step in Section 13.6. The suite MUST re-verify the embedded-digest equality of Section 13.8 against `artifact.lock.json`.

### 45.11 Context and JSON-LD Guard Tests

Remote context, unapproved local context string, `@import`, reserved-term redefinition, named graph, blank node, `owl:imports`, and duplicate JSON member names in each parsed input class (fixture, profile, inline context, lock, SBOM) MUST fail with their bound codes.

### 45.12 Resource Limit Tests

Each Section 16.2 limit has a passing boundary case and a failing over-limit case with the bound code.

### 45.13 Node Output Safety Tests

**Scope: Node host.** Covering: fresh publish; `OUTPUT_EXISTS`; sentinel ownership pass/fail including prior-lineage `owned-output-v0.4.1` rejection; symlinked target; overlap; concurrent lock exclusion (`OUTPUT_LOCKED`); kill-and-rerun recovery at each journal step; journal corruption → `OUTPUT_RECOVERY_REQUIRED`; detached error report placement; staging never inside the published target.

### 45.14 Two-Platform Node Execution

**Scope: Node host.** The suite MUST pass on one POSIX platform and on Windows. Newline discipline, path identity, rename semantics, and lock semantics are asserted on both.

### 45.15 Optional Conformance Report

A machine-readable run summary MAY be emitted as `compiler-conformance-report-v1.0`; it is test infrastructure, not a build output.

### 45.16 Failure-Ordering Tests

Inputs crafted with multiple simultaneous defects across phases (for example, an oversize source and a grammar-mismatching request; a lock defect and a contaminated fixture) MUST emit exactly the single code dictated by Section 12, under both hosts and on both Node platforms.

### 45.17 Carrier Payload Tests

Assert the locked stylesheet contains no case-insensitive `</style` byte sequence and the locked script no case-insensitive `</script`, and that the revalidator's defensive check triggers `INTERNAL_COMPILER_ERROR` on an artificially violated payload in a test harness.

### 45.18 CPS Static Scan

Scan the core module graph and the built browser bundle for banned identifiers and import specifiers per Section 6.4 — every `node:` specifier, `require`, `process`, `window`, `document`, `navigator`, `fetch`, `Date`, `Math.random`, `Intl`, timers, `eval`, `Function`, dynamic `import`, `WebAssembly`, storage, and locale methods. Any hit fails. The scan is necessary but weak evidence; Section 45.19 is the binding evidence. Extending the permitted list requires a specification revision.

### 45.19 CPS Poisoned-Global Harness

Execute the full functional corpus with every banned global replaced by a throwing trap and every permitted global instrumented — under a Node worker and inside at least one pinned browser engine. Any trap activation fails the suite. Instrumentation MUST additionally verify that every digest call requests `"SHA-256"` and that `TextDecoder` is constructed fatal. A core that reaches outside the Common Platform Surface cannot pass this harness; that is its purpose.

### 45.20 Dual-Host Equivalence Suite

**Scope: Release; the edge-canonical falsifier.** The corpus is every positive fixture in the suite (canonical, late-bound, generated seeds) plus every Section 46 negative whose governing code has Core or Both applicability in Appendix A.

Execute the corpus twice:

1. through the Node host end-to-end;
2. through the release bundle inside at least one pinned headless real browser engine, via the reference worker harness.

Assert, per case: byte-identical canonical artifact sets on success; identical core and distribution fingerprints; identical status lines; identical governing codes and identical error-report bytes on failure.

Continuous integration MUST run at least one engine per change; the release claim requires the full `engineBaselines` matrix of Section 13.7. A bundle-under-Node run with poisoned Node globals MAY supplement the suite as a fast proxy but MUST NOT substitute for a real engine. Edge-canonical status is asserted only through this suite — verify before assert.

### 45.21 Independent Full-HTML5 Parse Evidence

Parse the canonical and golden `presentation.html` outputs with the conformance DOM implementation and with at least one real browser engine. Assert significant equivalence (Section 8.7), the accessibility facts of Section 33, and navigation behavior consistent with Section 45.6. This is the proof that the subset the revalidator enforces means, under standards parsing, exactly what Stage 7 says it means.

### 45.22 Subset-Revalidator Adversarial Tests

Hand-crafted byte inputs outside the subset grammar MUST be rejected fail-closed by the revalidator in a test harness: an injected comment; a single-quoted or unquoted attribute; an unknown element; an unknown attribute; an unescaped `&`, `<`, or `>` in a text node; an unrecognized character reference; a wrong or additional doctype; a whitespace deviation from the renderer discipline; a duplicated `id`; a dangling `aria-labelledby`; a `</style` or `</script` sequence inside a carrier payload. The round-trip property of Section 32.5 MUST be asserted over every golden and generated output.

## 46. Required Negative Tests

Each case MUST fail deterministically with its documented code and produce conforming error-report bytes:

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
- oversize files; JSON too deep; too many triples; too many context terms;
- `CoreRequest` defects: a missing input member; an unknown extra member; a non-`Uint8Array` value → `INVALID_CORE_REQUEST`;
- a mutated locked carrier byte, exercised under both hosts → `ARTIFACT_LOCK_MISMATCH`;
- a subset-violating rendered document injected in a harness → `INTERNAL_COMPILER_ERROR` (Section 45.22).

BOM policy: the core either accepts exactly one leading U+FEFF in UTF-8 inputs by stripping it before grammar and JSON processing, or rejects it with `UTF8_BOM_NOT_SUPPORTED`. v1.0 RECOMMENDS strip-one-BOM while hashing raw bytes as supplied. The choice MUST be documented, tested, and identical on both Node platforms and both hosts.

## 47. Explicitly Out of Scope

- Arbitrary relationship classes, participant counts, or profiles.
- RDFS/OWL entailment, SPARQL, and general contradiction detection beyond the targeted checks of Section 21.5.
- LLM assistance, web search, or network access of any kind — structurally impossible inside the core under the Common Platform Surface, and prohibited to the hosts during compilation by rule.
- Multi-user or service deployment; untrusted upload handling. The browser embedder is trusted infrastructure in the same position as the CLI operator, not an untrusted-upload surface.
- Durable browser-side persistence. The OPFS publication profile of Section 11.6 is informative only.
- Signed release envelopes (delegated to external release infrastructure).
- React/JSX carriers. The HTML projection graph is renderer-neutral by design; a future React carrier would replace Stage 8 only.
- General-purpose CSS theming beyond the locked stylesheet.

## 48. Build Phases

Estimates assume one implementer familiar with the stack, exclusive of external review. The publication substrate and the browser host are scheduled early because they carry the cross-platform and cross-host risk and have no semantic dependencies; nothing semantic is considered done until the equivalence smoke covers it.

**Phase 0 — Decisions and skeleton (2 days).** Repository skeleton; CPS-conforming JSON-LD processor selection; duplicate-detecting JSON parse strategy (Section 16.3); `filesystemLock` dependency selection (Section 15.2); conformance DOM implementation selection; bundler selection (Section 13.7); embed API surface; poisoned-harness design; lock schemas; CI on both Node platforms plus at least one headless engine.

**Phase 1 — Locked artifacts (1 day).** Context, contract, profile v3, carriers, vendored ontologies; ontology and artifact locks; SBOM generation path.

**Phase 2 — Core skeleton and CPS enforcement (2 days).** `compileCore` shell; `CoreRequest` validation; input byte validation; the duplicate-detecting scanner; static scan and poisoned-global harness green on the skeleton under both hosts.

**Phase 3 — Node publication substrate spike (3 days).** Output lock via the selected dependency; staging; fresh publish; ownership validation; journaled replacement; recovery matrix; detached error reports; the Section 45.13 suite green on POSIX and Windows before any semantic stage is written.

**Phase 4 — Browser host and bundle (1.5 days).** Worker harness; deterministic bundle build; browser host lock; equivalence smoke on the canonical fixture green in at least one engine.

**Phase 5 — Request, resolution, contract (1.5 days).** Anchored grammar; Unicode rules; resolution; full closed-world contract including distinctness and contamination; stages 01–03.

**Phase 6 — Selection, narrative, presentation (1 day).** Stages 04–06; provenance discipline; profile parameter consumption.

**Phase 7 — Projection, rendering, revalidator, demo (2.5 days).** Stage 07 graph; renderer and escaping module; subset revalidator with round-trip; carrier payload checks; demo.

**Phase 8 — Fingerprints, manifests, verifier (1.5 days).** Canonical JSON; JCS fingerprints; core and distribution manifests; validation report; byte-map verifier.

**Phase 9 — Failure surfaces (1 day).** Unified failure ordering; error-report ordering; exit-class mapping; status-line discipline.

**Phase 10 — Test suite completion (4 days).** Goldens; late-bound; generated fixtures; metamorphic; hostile; negatives; lock tests; failure-ordering tests; determinism; accessibility; navigation; revalidator adversarial suite; the full dual-host equivalence corpus.

**Phase 11 — Platforms, engines, and release packaging (1.5 days).** Windows/POSIX deltas; three-engine equivalence evidence; newline protection; constant injection and digest-equality verification; checksum and SRI publication; documentation.

**Total: approximately 22.5 days.** The critical dependency chain is Phase 0 → 2 → {3, 4}; Phases 5–7 can begin once Phase 2 is green, in parallel with late substrate work, but nothing publishes through an unproven substrate and nothing ships around an unproven bundle.

## 49. Definition of Done

### 49.1 Locked Build

- `npm ci` succeeds against the committed lockfile; the installed graph matches; the `filesystemLock` dependency is present, locked, and exercised;
- Node host, browser host, ontology, and artifact locks and the SBOM are populated with no placeholders and validate in Section 13.6 order;
- the embedded digests equal `artifact.lock.json` (Section 13.8);
- the browser bundle reproduces byte-identically from a clean environment;
- duplicate-member rejection is active on every parsed JSON document;
- network access is disabled or absent during compilation and tests.

### 49.2 Parametric Behavior

- canonical, late-bound, and generated fixtures compile correctly;
- the anti-hardcoding lint and behavioral tests pass.

### 49.3 Semantic and Projection Integrity

- closed-world contract, distinctness, and contamination checks enforce every rule in Sections 21, 22, and 43;
- every source-derived `textValue` is reconstructible from exactly its `derivedFrom` nodes plus its named rule;
- stage artifacts match their canonical shapes and ordering semantics.

### 49.4 Carrier Quality

- the subset revalidator passes on every output, including the round-trip property;
- accessibility and navigation suites pass;
- carrier payloads satisfy the byte constraints of Sections 32.3 and 32.4.

### 49.5 Integrity, Determinism, and Host Invariance

- manifests, fingerprints, and the byte-map verifier pass end-to-end and fail on mutation;
- byte determinism holds across processes, directories, and both Node platforms;
- the dual-host equivalence suite is green — in CI against at least one pinned engine, and at release against the full `engineBaselines` matrix;
- every nonconforming invocation yields exactly one deterministic code per Section 12, verified by the failure-ordering suite.

### 49.6 Filesystem Safety

- the Section 45.13 matrix passes on both Node platforms, including recovery at every journal step and prior-lineage rejection.

### 49.7 Common Platform Surface

- the static scan is clean over the core module graph and the built bundle;
- the poisoned-global harness is green under both hosts.

### 49.8 Evidence

- per-code lock mutation tests pass;
- the release archive is published with a detached SHA-256 checksum file and the bundle's Subresource Integrity value;
- `sourceCommit` and the embedded digests are injected at packaging and recorded in the Node host lock and core manifest;
- a clean-environment build reproduction from the archive, including the bundle, succeeds.

## 50. Expected Finding

v1.0 will demonstrate that one narrow semantic pattern can be compiled to a correct, accessible, deterministic presentation through a profile-parameterized fixed projection program, with every user-perceivable string traceable to source labels, profile parameters, or named rules, with the compiler unable to publish through an unverified or unsafe path — and with the compute itself host-invariant: only acquisition, attestation, supervision, and placement are host-bound, and the equivalence suite, not this document, is what entitles that claim.

Stated with the same restraint the validation report practices: v1.0 demonstrates parametricity over fixtures and invariance over hosts, not parametricity over profiles. The projection program is fixed; the profile parameterizes it.

### 50.1 Roadmap Falsifier

The claim that the architecture is profile-driven, rather than merely profile-parameterized, is not tested by v1.0 and MUST NOT be asserted from it. The next major version introduces a second supported profile differing in exactly one structural axis (for example, slide count three, or an items-first region order) with its own projection program version. If supporting it requires changes outside the profile document, the program registry, and the goldens — that is, if stage logic must branch — the profile abstraction is falsified as drawn and MUST be redesigned before the portfolio reuses it.

---
## Appendix A: Error Code Registry

Codes are grouped by category. Exactly one code is emitted per failure. The exit class is the Node host mapping to Section 10.4; the Browser host returns the code itself in `CoreResult`. Host applicability: **Core** — detected by the core, arises identically under both hosts; **Node** / **Browser** — arises only under that host; **Both** — may be raised by either layer under either host.

| Category | Code | Exit | Hosts |
|---|---|---:|---|
| CLI | `UNKNOWN_OPTION` | 2 | Node |
| CLI | `DUPLICATE_OPTION` | 2 | Node |
| CLI | `INVALID_CLI_OPTIONS` | 2 | Node |
| Core interface | `INVALID_CORE_REQUEST` | 2 | Both |
| Input acquisition | `UNSAFE_INPUT_PATH` | 3 | Node |
| Input acquisition | `INPUT_CHANGED_DURING_LOAD` | 3 | Node |
| Input | `SOURCE_TOO_LARGE` | 3 | Core |
| Input | `REQUEST_TOO_LARGE` | 3 | Core |
| Input | `PROFILE_TOO_LARGE` | 3 | Core |
| Input | `CONTEXT_TOO_LARGE` | 3 | Core |
| Input | `CONTRACT_TOO_LARGE` | 3 | Core |
| Input | `INVALID_UTF8` | 3 | Core |
| Input | `UTF8_BOM_NOT_SUPPORTED` | 3 | Core |
| JSON | `JSON_TOO_DEEP` | 3 | Core |
| JSON | `DUPLICATE_JSON_MEMBER` | 3 | Core |
| JSON-LD | `TOO_MANY_TRIPLES` | 3 | Core |
| JSON-LD | `TOO_MANY_CONTEXT_TERMS` | 3 | Core |
| JSON-LD | `REMOTE_CONTEXT_NOT_SUPPORTED` | 3 | Core |
| JSON-LD | `LOCAL_CONTEXT_NOT_APPROVED` | 3 | Core |
| JSON-LD | `CONTEXT_TERM_REDEFINITION` | 3 | Core |
| JSON-LD | `JSONLD_IMPORT_NOT_SUPPORTED` | 3 | Core |
| JSON-LD | `OWL_IMPORTS_NOT_SUPPORTED` | 3 | Core |
| JSON-LD | `BLANK_NODE_NOT_SUPPORTED` | 3 | Core |
| JSON-LD | `NAMED_GRAPH_NOT_SUPPORTED` | 3 | Core |
| Request | `REQUEST_GRAMMAR_MISMATCH` | 1 | Core |
| Request | `DESIGNATOR_TOO_LONG` | 1 | Core |
| Request | `INVALID_CRITICAL_STRING` | 1 | Core |
| Profile | `UNSUPPORTED_PROFILE` | 1 | Core |
| Profile | `UNSUPPORTED_PROFILE_CONTRACT` | 1 | Core |
| Fixture | `FIXTURE_CONTRACT_FAILED` | 1 | Core |
| Fixture | `LABEL_TOO_LONG` | 1 | Core |
| Fixture | `SOURCE_GRAPH_CONTAMINATED` | 1 | Core |
| Fixture | `LOCAL_CONTRACT_VOCABULARY_VIOLATION` | 1 | Core |
| Fixture | `SOURCE_NAMESPACE_NOT_ALLOWED` | 1 | Core |
| Reporting | `TOO_MANY_VIOLATIONS` | 1 | Core |
| Lock | `RUNTIME_LOCK_MISMATCH` | 4 | Node |
| Lock | `PACKAGE_LOCK_MISMATCH` | 4 | Node |
| Lock | `ARTIFACT_LOCK_MISMATCH` | 4 | Both |
| Lock | `ONTOLOGY_LOCK_MISMATCH` | 4 | Node |
| Lock | `SBOM_MISMATCH` | 4 | Node |
| Output | `INPUT_OUTPUT_OVERLAP` | 4 | Node |
| Output | `UNSAFE_OUTPUT_PATH` | 4 | Node |
| Output | `OUTPUT_EXISTS` | 4 | Node |
| Output | `OUTPUT_NOT_OWNED` | 4 | Node |
| Output | `OUTPUT_LOCKED` | 4 | Node |
| Output | `OUTPUT_RECOVERY_REQUIRED` | 4 | Node |
| Operational | `BUILD_TIMEOUT` | 6 | Both |
| Operational | `MEMORY_LIMIT_EXCEEDED` | 6 | Node |
| Internal | `INTERNAL_COMPILER_ERROR` | 5 | Both |

Fixture-contract check codes (Section 27) appear as violation entries under `FIXTURE_CONTRACT_FAILED` and are not separate top-level codes. `OUTPUT_LOCKED` is additionally named by the informative OPFS profile of Section 11.6 for embedders that create a shared publication target.

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

The association sentence row records character provenance. Its eligibility — that a validated `rp:PersonAssociation` licensed generation at all — is carried by `03-contract-validation.jsonld` (`validatedRoot`) and the Stage 4 selection trace, per the provenance split of Section 29.1.

## Appendix C: Change Record, v0.4.1 → v1.0

Each row resolves one finding of the v0.4.1 structured review. Section references are to this edge-canonical cut.

| Finding | Resolution | Sections |
|---|---|---|
| F-01 request-grammar capture ambiguity | Anchored ABNF with unique decomposition; adversarial suffix example and metamorphic test | 19, 45.4 |
| F-02 selected-individual identity collapse | Six-way pairwise distinctness; `owl:sameAs` prohibition among selected; two new canonical checks; rationale recorded | 21.5, 27, 46 |
| F-03 duplicate JSON members accepted in inputs | `DUPLICATE_JSON_MEMBER` on every parsed JSON document; parser strategy fixed in Phase 0 | 16.3, 45.11, 46, 48 |
| F-04 error-code binding and precedence gaps | Inline code bindings; per-lock codes; lock validation order; unified failure ordering; exit-class and host registry | 5, 12, 13.6, 45.10, 45.16, App. A |
| F-05 unimplementable stdlib output lock | OS advisory lock mandated via locked `filesystemLock` dependency in the Node host; marker schemes prohibited with rationale | 13.2, 15.2, 48, 49.1 |
| F-06 contamination positions incomplete | Prohibition extended to subject and literal-datatype positions; allowlist scope stated; negative cases added | 43.1, 43.2, 46 |
| F-07 epiphenomenal profile | Profile reframed as parameter block of a fixed program; `slideCount`/`participantOrder` load-bearing; `aspectRatio` moved to carrier; profile v3; falsifier named | 7.4, 20, 32.3, 50, 50.1 |
| F-08 annotation-as-content undocumented | Deliberate flattening of the IBE/`has text value` pattern owned in Source Basis with ingestion rule | 4.1 |
| F-09 `sourceCommit` self-reference | Packaging-injected core constant; runtime non-verifiability stated | 6.7, 13.2, 37, 49.8 |
| F-10 key order undefined for optional members | Union-across-occurrences rule with `html:Attribute` worked example | 36.3 |
| F-11 bidirectional controls unconstrained | Bidi controls and noncharacters prohibited; ZWJ/ZWNJ deliberately retained | 22, 45.5, 46 |
| F-12 `derivedFrom` membership unprincipled | Character provenance defined; eligibility provenance assigned to Stage 3/4; canonical `05` updated | 29.1, App. B |
| F-13 unbound Table 31.1 and intent tokens | Table bound to `rule:html-document-projection-v1-0`; `rule:navigation-intent-token-v1-0` introduced; equality invariant | 31.1, 31.3, 32.5 |
| F-14 lock-value normativity unclassified | Three normativity classes; Node re-lock policy within the 24.x line | 13.1 |
| F-15 ontology-lock hash absent from runtime lock | `ontologyLockSha256` added to the Node host lock | 13.2, 13.6 |
| F-16 carrier payload termination risk | `</style`/`</script` byte prohibitions; revalidator defensive check; conformance test | 32.3, 32.4, 32.5, 45.17 |
| F-17 sandbox network claim | Network absence attributed to locked script; `allow-scripts` only | 34 |
| F-18 prohibited meta-type drift | One Prohibited Meta-Type Set, referenced uniformly | 8.3, 21.1–21.4 |
| F-19 schedule optimism | ~22.5-day plan; substrate spike Phase 3 and browser host Phase 4 front-loaded | 48 |

Additional editorial changes carried from the draft: release-position and identifier-continuity statements; upstream-oddity notes in the ontology lock; rule-IRI series advanced to `-v1-0`; `selectedIndividualsPairwiseDistinct` in the validation report; prior-lineage sentinel rejection; publication-substrate extraction note.

## Appendix D: Edge-Canonical Re-Cut Record

This appendix records the deltas between the unratified v1.0 draft of 2026-08-15 and this cut. No finding resolution of Appendix C was weakened; every relocation preserves the obligation and moves only its address.

### D.1 Decision Register

| ID | Decision | Sections |
|---|---|---|
| EC-01 | Re-cut v1.0 as edge-canonical rather than shipping a non-EC 1.0 into an EC-first portfolio; the prior draft is marked superseded-unratified and no rule semantics change | Front matter |
| EC-02 | Strict host-independent core manifest: environment attestation (Node host lock, package lock, SBOM, bundle SRI) is host and release evidence, never per-run manifest content; the core fingerprint is therefore host-invariant | 6.1, 13, 37, 45.20 |
| EC-03 | Static-artifact enforcement via packaging-injected embedded digests, making `ARTIFACT_LOCK_MISMATCH` a core code with Both applicability; Node host lock verification retained as the evidence chain | 6.7, 13.4, 13.8, 12.5 |
| EC-04 | Ontology lock scoped to Node host verification and release evidence; the vendored ontologies are not core inputs and the core manifest does not list what the core cannot hash | 13.3, 37 |
| EC-05 | Runtime DOM dependency replaced by a project-owned deterministic subset revalidator with a byte round-trip; full-HTML5 parsing (conformance DOM implementation plus at least one real engine) demoted to release evidence | 32.5, 45.21, 45.22 |
| EC-06 | Common Platform Surface defined as a closed allowlist; enforced by static scan plus poisoned-global harness; `WebAssembly` banned in the v1.0 core for auditability | 6.4, 6.5, 45.18, 45.19 |
| EC-07 | `filesystemLock` scoped to the Node host; the publication-exclusion requirement is host-conditional; Web Locks (`navigator.locks`, auto-released on context termination) named as the required binding in the informative OPFS profile, since the v1.0 Browser host has no shared mutable target | 11.3, 11.6, 15.2 |
| EC-08 | Browser publication is embedder handoff of the canonical artifact byte map; no durability claim; the distribution verifier operates over byte maps, filesystem optional | 11.3, 39 |
| EC-09 | Core API is asynchronous because the CPS digest primitive is; scheduling MUST NOT influence bytes | 6.3, 36.1 |
| EC-10 | Browser host artifact is one deterministic ES-module bundle with SRI, recorded in `browser-host.lock.json`; bundler locked and SBOM-enumerated; reproducible-bundle evidence required | 13.5, 13.7, 49.1 |
| EC-11 | Supervision via terminable workers in both hosts; `BUILD_TIMEOUT` Both; `MEMORY_LIMIT_EXCEEDED` Node-normative only; abnormal worker termination without a result reports `INTERNAL_COMPILER_ERROR` | 10.6, 11.2, App. A |
| EC-12 | `INVALID_CORE_REQUEST` added (exit 2, Both); the error-report builder is core-exported so host-phase failures share the deterministic reporting path | 6.3, 15.8, 42, App. A |

### D.2 Section Map, Draft → Re-Cut

| Draft v1.0 | This cut | Note |
|---|---|---|
| Front matter | Front matter | Release position and change lists updated |
| 1–5 | 1–5 | 5 adds scope tags |
| — | 6 | New: Edge-Canonical Architecture |
| 6 | 7 | Ontology and contract design |
| 7 | 8 | Definitions; adds 8.8 core/host terms |
| 8 | 9 | Repository restructured core/host |
| 9 | 10, 12 | CLI → Node host profile; 9.7 → unified ordering |
| — | 11 | New: Browser host profile |
| 10 | 13 | Locks; adds 13.7, 13.8 |
| 11 | 14, 16 | Trust split: acquisition (Node) vs content (core) |
| 12 | 16.2, 10.6, 11.2 | Limits stay core; guards become supervision |
| 13–27 | 17–31 | Core pipeline, renumbered, content preserved |
| 28 | 32 | 28.5 replaced by 32.5 subset revalidator |
| 29–37 | 33–41 | 33 (core manifest) rewritten host-independent at 37 |
| 38 | 15 | Output safety → Node host profile |
| 39–41 | 42–44 | Reports, contamination, anti-hardcoding |
| 42 | 45 | Adds 45.18–45.22 |
| 43–47 | 46–50 | Negatives, scope, plan, DoD, finding |
| App. A–C | App. A–C | A adds Hosts column and `INVALID_CORE_REQUEST` |
| — | App. D | This record |

---

*End of specification.*
