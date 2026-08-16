# Phase 6 Selection, Narrative, and Presentation Evidence

Status: accepted for implementation

Evidence date: 2026-08-16

Specification: Relationship Presentation Compiler v1.0, edge-canonical re-cut

Phase 6 implements canonical Stages 04–06. At the Phase 6 exit, a conforming
invocation built the content manifest, renderer-independent narrative, and
target-neutral presentation before returning the deterministic
`INTERNAL_COMPILER_ERROR` sentinel at Stage 07. Later phases now continue
through HTML projection, revalidated rendering, and the complete Phase 8
success result. Phase 6 itself did not claim the final artifact set.

## Closed content selection

The Stage 04 selector consumes only the validated Phase 5 neighborhood. It
emits exactly the association root, resolving designator, first sorted
participant and name, then second sorted participant and name. The six
`selectionTrace` entries are contiguous, preserve the same order, and form a
one-to-one mapping with `selectedSource`. Duplicate triples, reciprocal
difference assertions, graph order, and unrelated source facts are inert.

Participant order uses the locked profile token: normalized UTF-16 code-unit
ascending label with participant IRI as the deterministic tie break. A
late-bound fixture proves that neither example IRIs nor example labels control
selection.

## Character provenance and profile program

Every source-derived Stage 05 `TextContent` node carries a nonempty ordered
`derivedFrom` list. The association sentence lists only the name nodes whose
labels contribute characters; the document and deck titles list only the
resolving designator; participant items list their respective name nodes.
Profile-verbatim content omits `derivedFrom`.

The renderer-independent validator reconstructs all six text nodes from the
selected normalized labels, exact profile strings, and named fixed rules. It
rejects altered text, false or empty provenance, unexpected source provenance
on profile-verbatim content, and incorrect rule identity. Template replacement
is single-pass, so placeholder-looking source characters are never rescanned.

Focused synthetic checks prove that profile identity, overview rule,
association template, document-title template, participant heading, navigation
labels, and slide count are load-bearing inputs to Stages 05–06.

## Target-neutral presentation

Stage 06 projects the narrative into two ordered slides with contiguous regions
and item order. It carries semantic content references, presentation roles, and
Advance/GoBack intents. It contains no HTML namespace, element or attribute
member, DOM order, ARIA member, CSS selector, or JavaScript event name; HTML
semantics first enter at Stage 07.

The canonical fixture matches exact LF-terminated golden bytes for all six
stages. Node tests also cover late binding, participant tie ordering, unrelated
graph invariance, IRI-renaming metamorphism, nonrecursive placeholders,
provenance corruption, profile parameter consumption, and target-neutral
vocabulary. Canonical, late-bound, and hostile-placeholder requests run through
the reproducible core bundle under the supervised Chromium Worker and require
byte-identical host results.
