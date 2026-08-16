# Phase 3 Node Publication-Substrate Evidence

Status: accepted for implementation

Evidence date: 2026-08-16

Specification: Relationship Presentation Compiler v1.0, edge-canonical re-cut

Phase 3 implements the Node-host publication substrate and the Section 45.13
matrix. It accepts an already-produced fourteen-file byte map; semantic
construction, manifest fingerprint verification, CLI input acquisition, and
worker supervision remain assigned to later phases.

## Output boundary and exclusion

`validateOutputTarget` resolves the real output parent and rejects final
symlinks, non-directory targets, compiler-package containment other than the
exact default `dist`, and overlap with input paths. An existing target without
replacement permission produces `OUTPUT_EXISTS` before publication.

The deterministic sibling `<basename>.lock` is opened and guarded with
`fs-native-extensions.tryLock`. Contention returns `OUTPUT_LOCKED` immediately;
the test suite proves the operating system releases the lock after abnormal
holder termination on both supported Node platforms. Target type, existence,
and replacement permission are checked again while holding the lock.

## Staging and ownership

The host snapshots exactly the fourteen named `Uint8Array` artifacts and writes
them to a unique mkdtemp-style staging directory in the output parent. Files,
the staging directory, and the parent are synchronized to the extent the
platform supports. A fresh publication is one same-parent rename; it never
falls back to copy-and-delete.

Replacement recognizes only a complete flat artifact set with ordinary files,
the `owned-output-v1.0` sentinel owned by
`relationship-presentation-poc`, and a parseable
`distribution-manifest-v1.0`. JSON parsing is fatal UTF-8 and duplicate-member
detecting. Prior-lineage sentinels, malformed metadata, missing files, and
unexpected entries produce `OUTPUT_NOT_OWNED` without adopting or deleting the
target.

## Journal and recovery

Replacement uses deterministic sibling journal and backup names. The journal
records only sibling basenames and the declared sequence; it contains no
absolute path. No mutable journal-state rewrite is needed: recovery derives the
next safe action from the existence topology while holding the output lock.

| Target | Staging | Backup | Recovery action |
| --- | --- | --- | --- |
| present | present | absent | complete both renames, then remove owned backup |
| absent | present | present | publish staging, then remove owned backup |
| present | absent | present | remove the validated owned backup |
| present | absent | absent | remove the completed journal |
| absent | absent | present | roll the validated owned backup back to target |

Every other topology, an unreadable or structurally inconsistent journal, a
temporary-journal residue, a special recovery path, or an unowned directory
produces `OUTPUT_RECOVERY_REQUIRED`. Recovery validates ownership before every
recursive removal and therefore never deletes unrecognized data.

The conformance test kills a separate Node process immediately after each of
the five observable journal boundaries: journal written, target backed up,
staging published, backup removed, and journal removed. A second invocation
recovers and publishes successfully, leaving no staging, backup, or journal
residue.

## Detached failures and deferrals

`writeDetachedFailureReport` writes the core builder's bytes only to the sibling
`<basename>.error-report.json` after output validation. It refuses symlink or
non-file report targets and never writes inside a published directory.

Phase 3 fixtures contain the required sentinel and manifest recognition fields
but deliberately do not claim valid semantic fingerprints. Phase 8 made full
distribution and core-manifest hash verification binding; Phase 10 integrates
the substrate into the end-to-end CLI, publishes the real artifact set, and
performs post-publication byte-map verification. Those later claims do not
retroactively broaden the isolated Phase 3 spike.
