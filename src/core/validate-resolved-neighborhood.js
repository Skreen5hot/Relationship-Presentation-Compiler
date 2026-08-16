import { fail } from "./core-failure.js";
import {
  hasIri,
  isAbsoluteIri,
  namedObjects,
  objects,
  subjects,
} from "./normalize-graph.js";
import {
  compareCodeUnits,
  isCriticalStringValid,
  normalizeCriticalString,
  scalarLength,
} from "./unicode.js";
import { substituteAssociation } from "./template.js";
import {
  ALLOWED_VOCABULARY_NAMESPACES,
  CONTRACT,
  DESIGNATES,
  DESIGNATIVE_NAME,
  META_TYPES,
  NON_NAME_IDENTIFIER,
  OWL_DIFFERENT_FROM,
  OWL_SAME_AS,
  PERSON,
  PERSON_ASSOCIATION,
  PROHIBITED_SOURCE_NAMESPACES,
  RDF_TYPE,
  RDFS_LABEL,
  RELATIONAL_QUALITY,
  SPECIFICALLY_DEPENDS_ON,
  XSD,
} from "./vocabulary.js";

const MESSAGES = {
  EXACTLY_ONE_NAME_PER_PARTICIPANT:
    "Each selected participant must have exactly one valid Designative Name.",
  EXACTLY_ONE_RESOLVING_DESIGNATOR:
    "Exactly one Non-Name Identifier must match the requested designator.",
  EXACTLY_TWO_PERSON_PARTICIPANTS:
    "Resolved association must specifically depend on exactly two distinct Persons.",
  NO_OWL_SAMEAS_AMONG_SELECTED:
    "No owl:sameAs assertion may connect selected individuals.",
  PARTICIPANTS_ASSERTED_DIFFERENT:
    "The selected participants must be asserted owl:differentFrom.",
  RESOLVED_ENTITY_IS_BFO_RELATIONAL_QUALITY:
    "Resolved entity must be directly typed as a BFO relational quality.",
  RESOLVED_ENTITY_IS_PERSON_ASSOCIATION:
    "Resolved entity must be directly typed as a Person Association.",
  RESOLVING_DESIGNATOR_IS_VALID:
    "Resolving designator must have one label, designate one entity, and not be meta-typed.",
  SELECTED_INDIVIDUALS_PAIRWISE_DISTINCT:
    "The six selected individuals must have pairwise-distinct absolute IRIs.",
};

function violation(code, source) {
  const result = { code };
  if (source !== undefined) {
    result.source = source;
  }
  result.message = MESSAGES[code];
  return result;
}

function namespaceAllowed(value) {
  return ALLOWED_VOCABULARY_NAMESPACES.some((namespace) =>
    value.startsWith(namespace),
  );
}

function prohibited(value) {
  return PROHIBITED_SOURCE_NAMESPACES.some((namespace) =>
    value.startsWith(namespace),
  );
}

function validateSourceNamespaces(graph) {
  for (const triple of graph) {
    const iriPositions = [triple.subject, triple.predicate];
    if (triple.object.kind === "iri") {
      iriPositions.push(triple.object.value);
    } else {
      iriPositions.push(triple.object.datatype);
    }
    if (iriPositions.some((value) => prohibited(value))) {
      fail("SOURCE_GRAPH_CONTAMINATED");
    }

    if (
      triple.subject.startsWith(CONTRACT) ||
      triple.predicate.startsWith(CONTRACT) ||
      (triple.object.kind === "literal" &&
        triple.object.datatype.startsWith(CONTRACT)) ||
      (triple.object.kind === "iri" &&
        triple.object.value.startsWith(CONTRACT) &&
        !(
          triple.predicate === RDF_TYPE &&
          triple.object.value === PERSON_ASSOCIATION
        ))
    ) {
      fail("LOCAL_CONTRACT_VOCABULARY_VIOLATION");
    }

    if (!namespaceAllowed(triple.predicate)) {
      fail("SOURCE_NAMESPACE_NOT_ALLOWED");
    }
    if (
      triple.predicate === RDF_TYPE &&
      (triple.object.kind !== "iri" || !namespaceAllowed(triple.object.value))
    ) {
      fail("SOURCE_NAMESPACE_NOT_ALLOWED");
    }
    if (
      triple.object.kind === "literal" &&
      !namespaceAllowed(triple.object.datatype)
    ) {
      fail("SOURCE_NAMESPACE_NOT_ALLOWED");
    }
  }
}

function hasMetaType(graph, subject) {
  return [...META_TYPES].some((type) => hasIri(graph, subject, RDF_TYPE, type));
}

function criticalLabel(object) {
  if (
    object.kind !== "literal" ||
    object.language !== "" ||
    object.datatype !== `${XSD}string`
  ) {
    return null;
  }
  const value = normalizeCriticalString(object.value);
  const length = scalarLength(value);
  if (length === null || !isCriticalStringValid(value)) {
    fail("INVALID_CRITICAL_STRING");
  }
  if (length > 256) {
    fail("LABEL_TOO_LONG");
  }
  return value;
}

function selectDesignator(graph, designator, violations) {
  const candidates = subjects(graph, RDF_TYPE, NON_NAME_IDENTIFIER).filter(
    (subject) =>
      objects(graph, subject, RDFS_LABEL).some(
        (object) =>
          object.kind === "literal" &&
          normalizeCriticalString(object.value) === designator,
      ),
  );
  if (candidates.length !== 1 || !isAbsoluteIri(candidates[0])) {
    violations.push(violation("EXACTLY_ONE_RESOLVING_DESIGNATOR"));
    return null;
  }

  const designatorNode = candidates[0];
  const labels = objects(graph, designatorNode, RDFS_LABEL);
  const designated = objects(graph, designatorNode, DESIGNATES);
  const designatorLabel = labels.length === 1 ? criticalLabel(labels[0]) : null;
  if (
    labels.length !== 1 ||
    designatorLabel !== designator ||
    designated.length !== 1 ||
    designated[0].kind !== "iri" ||
    !isAbsoluteIri(designated[0].value) ||
    hasMetaType(graph, designatorNode)
  ) {
    violations.push(
      violation("RESOLVING_DESIGNATOR_IS_VALID", designatorNode),
    );
    return null;
  }
  return { designatorLabel, designatorNode, root: designated[0].value };
}

function validateParticipant(graph, participant, violations) {
  if (
    !isAbsoluteIri(participant) ||
    !hasIri(graph, participant, RDF_TYPE, PERSON) ||
    hasMetaType(graph, participant)
  ) {
    violations.push(
      violation("EXACTLY_TWO_PERSON_PARTICIPANTS", participant),
    );
  }
}

function selectName(graph, participant, violations) {
  const candidates = subjects(graph, RDF_TYPE, DESIGNATIVE_NAME).filter(
    (subject) => hasIri(graph, subject, DESIGNATES, participant),
  );
  if (candidates.length !== 1 || !isAbsoluteIri(candidates[0])) {
    violations.push(
      violation("EXACTLY_ONE_NAME_PER_PARTICIPANT", participant),
    );
    return null;
  }
  const name = candidates[0];
  const designated = objects(graph, name, DESIGNATES);
  const labels = objects(graph, name, RDFS_LABEL);
  const label = labels.length === 1 ? criticalLabel(labels[0]) : null;
  if (
    designated.length !== 1 ||
    designated[0].kind !== "iri" ||
    designated[0].value !== participant ||
    labels.length !== 1 ||
    label === null ||
    label.length === 0 ||
    hasMetaType(graph, name)
  ) {
    violations.push(
      violation("EXACTLY_ONE_NAME_PER_PARTICIPANT", participant),
    );
    return null;
  }
  return { label, name, participant };
}

export function resolveAndValidate(graph, designator, profile) {
  validateSourceNamespaces(graph);
  const violations = [];
  const resolution = selectDesignator(graph, designator, violations);
  if (resolution === null) {
    fail("FIXTURE_CONTRACT_FAILED", violations);
  }

  const { designatorLabel, designatorNode, root } = resolution;
  if (!hasIri(graph, root, RDF_TYPE, profile.eligibleSourceClass)) {
    violations.push(
      violation("RESOLVED_ENTITY_IS_PERSON_ASSOCIATION", root),
    );
  }
  if (!hasIri(graph, root, RDF_TYPE, RELATIONAL_QUALITY)) {
    violations.push(
      violation("RESOLVED_ENTITY_IS_BFO_RELATIONAL_QUALITY", root),
    );
  }
  if (hasMetaType(graph, root)) {
    violations.push(
      violation("RESOLVED_ENTITY_IS_PERSON_ASSOCIATION", root),
    );
  }

  const participantObjects = objects(graph, root, SPECIFICALLY_DEPENDS_ON);
  const participants = namedObjects(graph, root, SPECIFICALLY_DEPENDS_ON).filter(
    (participant, index, values) => values.indexOf(participant) === index,
  );
  if (
    participantObjects.length !== 2 ||
    participants.length !== 2 ||
    participants.some((participant) => !isAbsoluteIri(participant))
  ) {
    violations.push(violation("EXACTLY_TWO_PERSON_PARTICIPANTS", root));
  }
  for (const participant of participants) {
    validateParticipant(graph, participant, violations);
  }
  if (
    participants.length === 2 &&
    !hasIri(
      graph,
      participants[0],
      OWL_DIFFERENT_FROM,
      participants[1],
    ) &&
    !hasIri(
      graph,
      participants[1],
      OWL_DIFFERENT_FROM,
      participants[0],
    )
  ) {
    violations.push(violation("PARTICIPANTS_ASSERTED_DIFFERENT", root));
  }

  const namedParticipants = participants.map((participant) =>
    selectName(graph, participant, violations),
  );
  const selectedNames = namedParticipants.filter((entry) => entry !== null);
  if (participants.length === 2 && selectedNames.length === 2) {
    const selected = [
      designatorNode,
      root,
      ...participants,
      ...selectedNames.map((entry) => entry.name),
    ];
    const distinct = new Set(selected);
    if (selected.length !== 6 || distinct.size !== 6) {
      violations.push(
        violation("SELECTED_INDIVIDUALS_PAIRWISE_DISTINCT", root),
      );
    }
    if (
      graph.some(
        (triple) =>
          triple.predicate === OWL_SAME_AS &&
          triple.object.kind === "iri" &&
          distinct.has(triple.subject) &&
          distinct.has(triple.object.value),
      )
    ) {
      violations.push(violation("NO_OWL_SAMEAS_AMONG_SELECTED", root));
    }
  }

  if (violations.length > 0) {
    fail("FIXTURE_CONTRACT_FAILED", violations);
  }

  selectedNames.sort(
    (left, right) =>
      compareCodeUnits(left.label, right.label) ||
      compareCodeUnits(left.participant, right.participant),
  );
  const associationSentence = substituteAssociation(
    profile.associationTemplate,
    selectedNames[0].label,
    selectedNames[1].label,
  );
  if (
    graph.some(
      (triple) =>
        triple.object.kind === "literal" &&
        triple.object.value === associationSentence,
    )
  ) {
    fail("SOURCE_GRAPH_CONTAMINATED");
  }

  return {
    designatorLabel,
    designatorNode,
    root,
    participants: selectedNames,
    associationSentence,
  };
}
