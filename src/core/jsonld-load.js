import contextApi from "jsonld/lib/context.js";
import ContextResolver from "jsonld/lib/ContextResolver.js";
import expandApi from "jsonld/lib/expand.js";
import toRdfApi from "jsonld/lib/toRdf.js";

import { fail } from "./core-failure.js";
import {
  ALLOWED_VOCABULARY_NAMESPACES,
  APPROVED_CONTEXT_TOKEN,
  OWL_IMPORTS,
  PROHIBITED_SOURCE_NAMESPACES,
} from "./vocabulary.js";

const MAX_CONTEXT_TERMS = 250;
const MAX_TRIPLES = 5_000;

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function cloneValue(value) {
  if (Array.isArray(value)) {
    return value.map((item) => cloneValue(item));
  }
  if (isObject(value)) {
    const clone = {};
    for (const key of Object.keys(value)) {
      Object.defineProperty(clone, key, {
        configurable: true,
        enumerable: true,
        value: cloneValue(value[key]),
        writable: true,
      });
    }
    return clone;
  }
  return value;
}

function equalJsonValue(left, right) {
  if (left === right) {
    return true;
  }
  if (Array.isArray(left) || Array.isArray(right)) {
    return (
      Array.isArray(left) &&
      Array.isArray(right) &&
      left.length === right.length &&
      left.every((value, index) => equalJsonValue(value, right[index]))
    );
  }
  if (!isObject(left) || !isObject(right)) {
    return false;
  }
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  return (
    leftKeys.length === rightKeys.length &&
    leftKeys.every(
      (key, index) =>
        key === rightKeys[index] && equalJsonValue(left[key], right[key]),
    )
  );
}

function isAbsoluteIri(value) {
  return (
    typeof value === "string" &&
    /^[A-Za-z][A-Za-z0-9+.-]*:/u.test(value) &&
    !/[\u0000-\u0020]/u.test(value)
  );
}

function isCompilerOrVocabularyNamespace(value) {
  return [...ALLOWED_VOCABULARY_NAMESPACES, ...PROHIBITED_SOURCE_NAMESPACES].some(
    (namespace) => value.startsWith(namespace),
  );
}

function validateInlineContext(inlineContext, canonicalTerms) {
  if (!isObject(inlineContext)) {
    fail("LOCAL_CONTEXT_NOT_APPROVED");
  }
  const entries = Object.entries(inlineContext);
  if (entries.length > MAX_CONTEXT_TERMS) {
    fail("TOO_MANY_CONTEXT_TERMS");
  }

  for (const [term, definition] of entries) {
    if (
      term === "@base" ||
      term === "@vocab" ||
      term === "@language" ||
      term === "@direction" ||
      term === "@import"
    ) {
      fail(
        term === "@import"
          ? "JSONLD_IMPORT_NOT_SUPPORTED"
          : "LOCAL_CONTEXT_NOT_APPROVED",
      );
    }
    if (Object.prototype.hasOwnProperty.call(canonicalTerms, term)) {
      if (!equalJsonValue(definition, canonicalTerms[term])) {
        fail("CONTEXT_TERM_REDEFINITION");
      }
      continue;
    }
    if (isObject(definition) && "@context" in definition) {
      fail("LOCAL_CONTEXT_NOT_APPROVED");
    }
    if (term.startsWith("@")) {
      fail("LOCAL_CONTEXT_NOT_APPROVED");
    }
    if (
      !isObject(definition) ||
      Object.keys(definition).length !== 2 ||
      typeof definition["@id"] !== "string" ||
      definition["@prefix"] !== true ||
      !isAbsoluteIri(definition["@id"]) ||
      isCompilerOrVocabularyNamespace(definition["@id"])
    ) {
      fail("CONTEXT_TERM_REDEFINITION");
    }
  }
}

function approveContexts(value, canonicalTerms) {
  if (Array.isArray(value)) {
    return value.map((item) => approveContexts(item, canonicalTerms));
  }
  if (!isObject(value)) {
    return value;
  }

  const clone = {};
  for (const [key, child] of Object.entries(value)) {
    if (key === "@import") {
      fail("JSONLD_IMPORT_NOT_SUPPORTED");
    }
    if (key === "@context") {
      if (typeof child === "string") {
        if (/^https?:/iu.test(child)) {
          fail("REMOTE_CONTEXT_NOT_SUPPORTED");
        }
        if (/^file:/iu.test(child) || child !== APPROVED_CONTEXT_TOKEN) {
          fail("LOCAL_CONTEXT_NOT_APPROVED");
        }
        Object.defineProperty(clone, key, {
          configurable: true,
          enumerable: true,
          value: cloneValue(canonicalTerms),
          writable: true,
        });
      } else {
        if (
          Array.isArray(child) &&
          child.some(
            (entry) =>
              typeof entry === "string" && /^https?:/iu.test(entry),
          )
        ) {
          fail("REMOTE_CONTEXT_NOT_SUPPORTED");
        }
        validateInlineContext(child, canonicalTerms);
        Object.defineProperty(clone, key, {
          configurable: true,
          enumerable: true,
          value: cloneValue(child),
          writable: true,
        });
      }
      continue;
    }
    if (isObject(child) && "@context" in child) {
      fail("LOCAL_CONTEXT_NOT_APPROVED");
    }
    Object.defineProperty(clone, key, {
      configurable: true,
      enumerable: true,
      value: approveContexts(child, canonicalTerms),
      writable: true,
    });
  }
  return clone;
}

function termKey(term) {
  if (term.termType === "Literal") {
    return [
      "literal",
      term.value,
      term.language,
      term.datatype?.value ?? "",
    ];
  }
  return [term.termType, term.value];
}

function quadKey(quad) {
  return JSON.stringify([
    termKey(quad.subject),
    termKey(quad.predicate),
    termKey(quad.object),
    termKey(quad.graph),
  ]);
}

function normalizedObject(term) {
  if (term.termType === "NamedNode") {
    return { kind: "iri", value: term.value };
  }
  return {
    kind: "literal",
    value: term.value,
    language: term.language ?? "",
    datatype: term.datatype.value,
  };
}

function normalizeDataset(dataset, role) {
  const unique = new Map();
  for (const quad of dataset) {
    if (quad.graph.termType !== "DefaultGraph") {
      fail("NAMED_GRAPH_NOT_SUPPORTED");
    }
    if (
      quad.subject.termType === "BlankNode" ||
      quad.object.termType === "BlankNode"
    ) {
      fail("BLANK_NODE_NOT_SUPPORTED");
    }
    if (
      quad.subject.termType !== "NamedNode" ||
      quad.predicate.termType !== "NamedNode" ||
      (quad.object.termType !== "NamedNode" &&
        quad.object.termType !== "Literal")
    ) {
      fail("INTERNAL_COMPILER_ERROR");
    }
    unique.set(quadKey(quad), {
      subject: quad.subject.value,
      predicate: quad.predicate.value,
      object: normalizedObject(quad.object),
    });
  }
  if (unique.size > MAX_TRIPLES) {
    fail("TOO_MANY_TRIPLES");
  }
  const triples = [...unique.values()];
  if (
    role === "source" &&
    triples.some((triple) => triple.predicate === OWL_IMPORTS)
  ) {
    fail("OWL_IMPORTS_NOT_SUPPORTED");
  }
  return triples;
}

export async function expandTrustedDocument(
  jsonDocument,
  canonicalContextDocument,
  role,
) {
  const canonicalTerms = canonicalContextDocument?.["@context"];
  if (!isObject(canonicalTerms)) {
    fail("INTERNAL_COMPILER_ERROR");
  }
  if (Object.keys(canonicalTerms).length > MAX_CONTEXT_TERMS) {
    fail("TOO_MANY_CONTEXT_TERMS");
  }
  if (
    (role === "contract" || role === "canonicalProfile") &&
    jsonDocument?.["@context"] !== APPROVED_CONTEXT_TOKEN
  ) {
    fail("LOCAL_CONTEXT_NOT_APPROVED");
  }

  const approvedDocument = approveContexts(jsonDocument, canonicalTerms);
  const options = {
    base: "",
    contextResolver: new ContextResolver({ sharedCache: new Map() }),
    documentLoader: async () => {
      throw new Error("The inert JSON-LD loader rejected an external document.");
    },
    keepFreeFloatingNodes: false,
  };

  let expanded;
  try {
    expanded = await expandApi.expand({
      activeCtx: contextApi.getInitialContext(options),
      element: approvedDocument,
      options,
    });
  } catch {
    fail("INTERNAL_COMPILER_ERROR");
  }
  if (
    expanded !== null &&
    !Array.isArray(expanded) &&
    typeof expanded === "object" &&
    Object.keys(expanded).length === 1 &&
    "@graph" in expanded
  ) {
    expanded = expanded["@graph"];
  } else if (expanded === null) {
    expanded = [];
  }
  if (!Array.isArray(expanded)) {
    expanded = [expanded];
  }

  let dataset;
  try {
    dataset = toRdfApi.toRDF(expanded, {
      produceGeneralizedRdf: false,
      rdfDirection: null,
    });
  } catch {
    fail("INTERNAL_COMPILER_ERROR");
  }
  return normalizeDataset(dataset, role);
}
