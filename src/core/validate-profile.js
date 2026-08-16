import { fail } from "./core-failure.js";
import {
  equalNormalizedTripleSets,
  objects,
  subjects,
} from "./normalize-graph.js";
import {
  PRESENTATION_PROFILE,
  PROJECTION,
  RDF_TYPE,
  SUPPORTED_PROFILE,
  XSD,
} from "./vocabulary.js";

function oneLiteral(graph, predicate, datatype = `${XSD}string`) {
  const values = objects(graph, SUPPORTED_PROFILE, predicate).filter(
    (object) =>
      object.kind === "literal" &&
      object.language === "" &&
      object.datatype === datatype,
  );
  if (values.length !== 1) {
    fail("UNSUPPORTED_PROFILE_CONTRACT");
  }
  return values[0].value.normalize("NFC");
}

function oneIri(graph, predicate) {
  const values = objects(graph, SUPPORTED_PROFILE, predicate).filter(
    (object) => object.kind === "iri",
  );
  if (values.length !== 1) {
    fail("UNSUPPORTED_PROFILE_CONTRACT");
  }
  return values[0].value;
}

export function validateProfile(canonicalGraph, userGraph) {
  const profileSubjects = subjects(
    userGraph,
    RDF_TYPE,
    PRESENTATION_PROFILE,
  );
  if (
    profileSubjects.length === 1 &&
    profileSubjects[0] !== SUPPORTED_PROFILE
  ) {
    fail("UNSUPPORTED_PROFILE");
  }
  if (
    profileSubjects.length !== 1 ||
    profileSubjects[0] !== SUPPORTED_PROFILE ||
    !equalNormalizedTripleSets(canonicalGraph, userGraph)
  ) {
    fail("UNSUPPORTED_PROFILE_CONTRACT");
  }

  const slideCountText = oneLiteral(
    userGraph,
    `${PROJECTION}slideCount`,
    `${XSD}integer`,
  );
  const slideCount = Number(slideCountText);
  const participantOrder = oneLiteral(
    userGraph,
    `${PROJECTION}participantOrder`,
  );
  if (slideCount !== 2 || !Number.isSafeInteger(slideCount)) {
    fail("UNSUPPORTED_PROFILE_CONTRACT");
  }
  if (participantOrder !== "utf16-code-unit-ascending-label") {
    fail("UNSUPPORTED_PROFILE_CONTRACT");
  }

  return {
    id: SUPPORTED_PROFILE,
    slideCount,
    participantOrder,
    eligibleSourceClass: oneIri(
      userGraph,
      `${PROJECTION}eligibleSourceClass`,
    ),
    overviewRule: oneIri(userGraph, `${PROJECTION}overviewRule`),
    associationTemplate: oneLiteral(
      userGraph,
      `${PROJECTION}associationTemplate`,
    ),
    documentTitleTemplate: oneLiteral(
      userGraph,
      `${PROJECTION}documentTitleTemplate`,
    ),
    participantSlideTitle: oneLiteral(
      userGraph,
      `${PROJECTION}participantSlideTitle`,
    ),
    advanceLabel: oneLiteral(userGraph, `${PROJECTION}advanceLabel`),
    backLabel: oneLiteral(userGraph, `${PROJECTION}backLabel`),
    outputFormat: oneIri(userGraph, `${PROJECTION}outputFormat`),
  };
}
