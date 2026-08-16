import { fail } from "./core-failure.js";

const REASONS = [
  "projection:ResolvedRoot",
  "projection:ResolvingDesignator",
  "projection:SpecificallyDependedOnParticipant",
  "projection:DesignatesParticipant",
  "projection:SpecificallyDependedOnParticipant",
  "projection:DesignatesParticipant",
];

export function selectContent(selection) {
  const selectedSource = [
    selection.root,
    selection.designatorNode,
    selection.participants[0]?.participant,
    selection.participants[0]?.name,
    selection.participants[1]?.participant,
    selection.participants[1]?.name,
  ];
  if (
    selectedSource.some((source) => typeof source !== "string") ||
    new Set(selectedSource).size !== 6
  ) {
    fail("INTERNAL_COMPILER_ERROR");
  }

  const selectionTrace = selectedSource.map((source, index) => ({
    "@id": `run:trace-${index + 1}`,
    "@type": "projection:SelectionTrace",
    sequence: index + 1,
    source,
    reason: REASONS[index],
  }));
  if (
    selectionTrace.length !== selectedSource.length ||
    selectionTrace.some(
      (trace, index) =>
        trace.sequence !== index + 1 || trace.source !== selectedSource[index],
    )
  ) {
    fail("INTERNAL_COMPILER_ERROR");
  }

  return {
    "@context": "./poc.context.jsonld",
    "@id": "run:manifest",
    "@type": "projection:ContentManifest",
    root: selection.root,
    selectedSource,
    selectionTrace,
    selectionRule: "rule:person-association-neighborhood-v1-0",
  };
}
