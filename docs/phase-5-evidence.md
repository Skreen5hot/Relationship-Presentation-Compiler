# Phase 5 Request, Resolution, and Contract Evidence

Status: accepted for implementation

Evidence date: 2026-08-16

Specification: Relationship Presentation Compiler v1.0, edge-canonical re-cut

Phase 5 implements C3–C6 and canonical Stages 01–03. At the Phase 5 exit, a
conforming invocation crossed this entire boundary and then returned the
deterministic `INTERNAL_COMPILER_ERROR` sentinel at Stage 04. Later phases now
continue the same invocation through the complete Phase 8 success result.
Phase 5 itself did not claim a successful v1.0 build.

## Trusted JSON-LD graph

The core processes contract, canonical profile, user profile, and source in the
normative order with the locked JSON-LD 1.1 processor. The approved context
token is replaced only by the supplied digest-verified context; the injected
loader rejects every external document. Contexts are inspected before
expansion for remote or local references, imports, reserved-term changes,
scoped contexts, and the 250-entry limit.

Expansion produces one default graph, collapses duplicate triples, preserves
literal language and datatype metadata, and rejects named graphs, blank nodes,
`owl:imports`, and more than 5,000 collapsed triples. The JSON-LD dependency is
inside the deterministic browser bundle and passes the existing CPS static and
poisoned-global gates.

## Request and profile boundary

The request parser removes at most one LF or CRLF, applies the anchored template
by unique prefix/suffix decomposition, NFC-normalizes the captured designator,
counts Unicode scalars, and rejects controls, bidirectional controls, Unicode
noncharacters, and excess length. Interior copies of the grammar suffix remain
part of the designator.

The user profile is compared with the locked canonical profile as an expanded,
duplicate-collapsed RDF triple set after NFC normalization of untagged strings.
Profile identity, datatype and IRI equality, additional triples, and the
participant-order token are binding. `slideCount`, `participantOrder`, the
eligible class, output format, and all later-stage strings are extracted as the
fixed projection program's parameter block.

## Closed-world contract

Resolution uses exact normalized identifier-label equality and follows one
direct designates edge. Validation enforces the direct Person Association and
BFO types; two distinct Person participants; `owl:differentFrom`; one valid
Designative Name per participant; six pairwise-distinct selected IRIs; and no
selected `owl:sameAs` assertion.

Namespace checks cover subject, predicate, IRI object, type object, and literal
datatype positions. They distinguish prohibited projection contamination,
non-allowlisted vocabulary, and misuse of the local contract namespace. The
source is also rejected if it already contains the single-pass generated
association sentence. Critical name labels apply the same NFC and Unicode
discipline as the request.

## Canonical artifacts and evidence

`fixtures/relationship-42.jsonld` and its request produce byte-identical
goldens for `01-request.jsonld`, `02-resolution.jsonld`, and
`03-contract-validation.jsonld`. The validation-check set serializes by code;
each generated check IRI is derived mechanically by lowercasing the code and
replacing underscores with hyphens, including
`run:check-no-source-graph-contamination`.

The focused Node matrix covers canonical and late-bound fixtures, duplicate and
reciprocal triples, input reordering, unrelated facts, request/profile/context
guards, graph limits, every selected-neighborhood category, Unicode failures,
identity collapse, namespace positions, generated-content contamination, and a
source lint for canonical fixture leakage. Representative C3–C6 cases run
again through the reference Worker in pinned Chromium and require byte-identical
codes, status lines, and error-report bytes against direct Node execution.
