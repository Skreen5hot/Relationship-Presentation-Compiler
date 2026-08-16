import { normalizeCriticalString } from "./unicode.js";

export function iri(value) {
  return { kind: "iri", value };
}

export function isAbsoluteIri(value) {
  return (
    typeof value === "string" &&
    /^[A-Za-z][A-Za-z0-9+.-]*:/u.test(value) &&
    !/[\u0000-\u0020]/u.test(value)
  );
}

export function objects(graph, subject, predicate) {
  return graph
    .filter(
      (triple) =>
        triple.subject === subject && triple.predicate === predicate,
    )
    .map((triple) => triple.object);
}

export function namedObjects(graph, subject, predicate) {
  return objects(graph, subject, predicate)
    .filter((object) => object.kind === "iri")
    .map((object) => object.value);
}

export function subjects(graph, predicate, objectIri) {
  return graph
    .filter(
      (triple) =>
        triple.predicate === predicate &&
        triple.object.kind === "iri" &&
        triple.object.value === objectIri,
    )
    .map((triple) => triple.subject)
    .filter((subject, index, values) => values.indexOf(subject) === index);
}

export function hasIri(graph, subject, predicate, objectIri) {
  return graph.some(
    (triple) =>
      triple.subject === subject &&
      triple.predicate === predicate &&
      triple.object.kind === "iri" &&
      triple.object.value === objectIri,
  );
}

export function normalizedTripleKey(triple) {
  const object = triple.object;
  if (
    object.kind === "literal" &&
    object.language === "" &&
    object.datatype === "http://www.w3.org/2001/XMLSchema#string"
  ) {
    return JSON.stringify([
      triple.subject,
      triple.predicate,
      "literal",
      normalizeCriticalString(object.value),
      "",
      object.datatype,
    ]);
  }
  if (object.kind === "literal") {
    return JSON.stringify([
      triple.subject,
      triple.predicate,
      "literal",
      object.value,
      object.language,
      object.datatype,
    ]);
  }
  return JSON.stringify([
    triple.subject,
    triple.predicate,
    "iri",
    object.value,
  ]);
}

export function equalNormalizedTripleSets(left, right) {
  if (left.length !== right.length) {
    return false;
  }
  const rightSet = new Set(right.map((triple) => normalizedTripleKey(triple)));
  return left.every((triple) => rightSet.has(normalizedTripleKey(triple)));
}
