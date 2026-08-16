export const CANONICAL_ARTIFACT_NAMES = [
  ".relationship-presentation-poc-owned",
  "poc.context.jsonld",
  "01-request.jsonld",
  "02-resolution.jsonld",
  "03-contract-validation.jsonld",
  "04-content-manifest.jsonld",
  "05-narrative.jsonld",
  "06-presentation.jsonld",
  "07-html-projection.jsonld",
  "08-core-manifest.json",
  "09-distribution-manifest.json",
  "presentation.html",
  "demo.html",
  "validation-report.json",
];

export const CORE_OUTPUTS = [
  ["output-context", "poc.context.jsonld"],
  ["stage-01", "01-request.jsonld"],
  ["stage-02", "02-resolution.jsonld"],
  ["stage-03", "03-contract-validation.jsonld"],
  ["stage-04", "04-content-manifest.jsonld"],
  ["stage-05", "05-narrative.jsonld"],
  ["stage-06", "06-presentation.jsonld"],
  ["stage-07", "07-html-projection.jsonld"],
  ["presentation", "presentation.html"],
];

export const DISTRIBUTION_FILES = [
  ["ownership-sentinel", ".relationship-presentation-poc-owned"],
  ["core-manifest", "08-core-manifest.json"],
  ["validation-report", "validation-report.json"],
  ["demo", "demo.html"],
];
