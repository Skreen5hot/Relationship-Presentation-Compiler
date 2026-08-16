export const APPROVED_CONTEXT_TOKEN = "../contexts/poc.context.jsonld";

export const RDF = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
export const RDFS = "http://www.w3.org/2000/01/rdf-schema#";
export const OWL = "http://www.w3.org/2002/07/owl#";
export const SKOS = "http://www.w3.org/2004/02/skos/core#";
export const XSD = "http://www.w3.org/2001/XMLSchema#";
export const OBO = "http://purl.obolibrary.org/obo/";
export const CCO = "https://www.commoncoreontologies.org/";
export const CONTRACT =
  "https://example.org/relationship-presentation-poc/contract/";
export const PROJECTION =
  "https://example.org/relationship-presentation-poc/projection/";
export const PROFILE =
  "https://example.org/relationship-presentation-poc/profile/";
export const RULE = "https://example.org/relationship-presentation-poc/rule/";
export const RUN = "https://example.org/relationship-presentation-poc/run/";
export const HTML = "https://example.org/relationship-presentation-poc/html/";

export const RDF_TYPE = `${RDF}type`;
export const RDFS_LABEL = `${RDFS}label`;
export const OWL_IMPORTS = `${OWL}imports`;
export const OWL_DIFFERENT_FROM = `${OWL}differentFrom`;
export const OWL_SAME_AS = `${OWL}sameAs`;
export const OWL_NAMED_INDIVIDUAL = `${OWL}NamedIndividual`;
export const PERSON_ASSOCIATION = `${CONTRACT}PersonAssociation`;
export const RELATIONAL_QUALITY = `${OBO}BFO_0000145`;
export const SPECIFICALLY_DEPENDS_ON = `${OBO}BFO_0000195`;
export const PERSON = `${CCO}ont00001262`;
export const DESIGNATIVE_NAME = `${CCO}ont00000003`;
export const NON_NAME_IDENTIFIER = `${CCO}ont00000649`;
export const DESIGNATES = `${CCO}ont00001916`;
export const SUPPORTED_PROFILE = `${PROFILE}two-slide-explainer-v3`;
export const PRESENTATION_PROFILE = `${PROJECTION}PresentationProfile`;

export const META_TYPES = new Set([
  `${OWL}Class`,
  `${RDFS}Class`,
  `${RDF}Property`,
  `${OWL}ObjectProperty`,
  `${OWL}DatatypeProperty`,
  `${OWL}AnnotationProperty`,
]);

export const PROHIBITED_SOURCE_NAMESPACES = [
  PROJECTION,
  PROFILE,
  RULE,
  RUN,
  HTML,
  "https://example.org/relationship-presentation-poc/layout/",
  "https://example.org/relationship-presentation-poc/intent/",
  "http://www.w3.org/1999/xhtml",
];

export const ALLOWED_VOCABULARY_NAMESPACES = [
  RDF,
  RDFS,
  OWL,
  XSD,
  SKOS,
  OBO,
  CCO,
  CONTRACT,
];
