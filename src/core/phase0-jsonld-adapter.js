import contextApi from "jsonld/lib/context.js";
import ContextResolver from "jsonld/lib/ContextResolver.js";
import expandApi from "jsonld/lib/expand.js";
import toRdfApi from "jsonld/lib/toRdf.js";

export const PHASE0_CONTEXT_TOKEN =
  "https://example.org/relationship-presentation-poc/context/poc.jsonld";

function inertDocumentLoader(contextDocument) {
  return async (url) => {
    if (url !== PHASE0_CONTEXT_TOKEN) {
      throw new Error(`Phase 0 inert loader rejected URL: ${url}`);
    }

    return {
      contextUrl: null,
      document: contextDocument,
      documentUrl: PHASE0_CONTEXT_TOKEN
    };
  };
}

function cloneJson(value) {
  if (Array.isArray(value)) {
    return value.map((item) => cloneJson(item));
  }
  if (value !== null && typeof value === "object") {
    const clone = {};
    for (const key of Object.keys(value)) {
      clone[key] = cloneJson(value[key]);
    }
    return clone;
  }
  return value;
}

export async function runPhase0ExpansionProbe(document, contextDocument) {
  const options = {
    base: "",
    contextResolver: new ContextResolver({ sharedCache: new Map() }),
    documentLoader: inertDocumentLoader(contextDocument),
    keepFreeFloatingNodes: false
  };
  const activeCtx = contextApi.getInitialContext(options);
  let expanded = await expandApi.expand({
    activeCtx,
    element: cloneJson(document),
    options
  });

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

  const dataset = toRdfApi.toRDF(expanded, {
    produceGeneralizedRdf: false,
    rdfDirection: null
  });
  const canonicalProbeBytes = new TextEncoder().encode(JSON.stringify(expanded));
  const digestBuffer = await crypto.subtle.digest("SHA-256", canonicalProbeBytes);
  const sha256 = Array.from(new Uint8Array(digestBuffer), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");

  return {
    expanded,
    quadCount: dataset.length,
    sha256
  };
}
