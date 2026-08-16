const entries = [
  ["CLI", "UNKNOWN_OPTION", 2, "Node"],
  ["CLI", "DUPLICATE_OPTION", 2, "Node"],
  ["CLI", "INVALID_CLI_OPTIONS", 2, "Node"],
  ["Core interface", "INVALID_CORE_REQUEST", 2, "Core"],
  ["Input acquisition", "UNSAFE_INPUT_PATH", 3, "Node"],
  ["Input acquisition", "INPUT_CHANGED_DURING_LOAD", 3, "Node"],
  ["Input", "SOURCE_TOO_LARGE", 3, "Core"],
  ["Input", "REQUEST_TOO_LARGE", 3, "Core"],
  ["Input", "PROFILE_TOO_LARGE", 3, "Core"],
  ["Input", "CONTEXT_TOO_LARGE", 3, "Core"],
  ["Input", "CONTRACT_TOO_LARGE", 3, "Core"],
  ["Input", "INVALID_UTF8", 3, "Core"],
  ["Input", "UTF8_BOM_NOT_SUPPORTED", 3, "Core"],
  ["JSON", "JSON_TOO_DEEP", 3, "Core"],
  ["JSON", "DUPLICATE_JSON_MEMBER", 3, "Core"],
  ["JSON-LD", "TOO_MANY_TRIPLES", 3, "Core"],
  ["JSON-LD", "TOO_MANY_CONTEXT_TERMS", 3, "Core"],
  ["JSON-LD", "REMOTE_CONTEXT_NOT_SUPPORTED", 3, "Core"],
  ["JSON-LD", "LOCAL_CONTEXT_NOT_APPROVED", 3, "Core"],
  ["JSON-LD", "CONTEXT_TERM_REDEFINITION", 3, "Core"],
  ["JSON-LD", "JSONLD_IMPORT_NOT_SUPPORTED", 3, "Core"],
  ["JSON-LD", "OWL_IMPORTS_NOT_SUPPORTED", 3, "Core"],
  ["JSON-LD", "BLANK_NODE_NOT_SUPPORTED", 3, "Core"],
  ["JSON-LD", "NAMED_GRAPH_NOT_SUPPORTED", 3, "Core"],
  ["Request", "REQUEST_GRAMMAR_MISMATCH", 1, "Core"],
  ["Request", "DESIGNATOR_TOO_LONG", 1, "Core"],
  ["Request", "INVALID_CRITICAL_STRING", 1, "Core"],
  ["Profile", "UNSUPPORTED_PROFILE", 1, "Core"],
  ["Profile", "UNSUPPORTED_PROFILE_CONTRACT", 1, "Core"],
  ["Fixture", "FIXTURE_CONTRACT_FAILED", 1, "Core"],
  ["Fixture", "LABEL_TOO_LONG", 1, "Core"],
  ["Fixture", "SOURCE_GRAPH_CONTAMINATED", 1, "Core"],
  ["Fixture", "LOCAL_CONTRACT_VOCABULARY_VIOLATION", 1, "Core"],
  ["Fixture", "SOURCE_NAMESPACE_NOT_ALLOWED", 1, "Core"],
  ["Reporting", "TOO_MANY_VIOLATIONS", 1, "Core"],
  ["Lock", "RUNTIME_LOCK_MISMATCH", 4, "Node"],
  ["Lock", "PACKAGE_LOCK_MISMATCH", 4, "Node"],
  ["Lock", "ARTIFACT_LOCK_MISMATCH", 4, "Both"],
  ["Lock", "ONTOLOGY_LOCK_MISMATCH", 4, "Node"],
  ["Lock", "SBOM_MISMATCH", 4, "Node"],
  ["Output", "INPUT_OUTPUT_OVERLAP", 4, "Node"],
  ["Output", "UNSAFE_OUTPUT_PATH", 4, "Node"],
  ["Output", "OUTPUT_EXISTS", 4, "Node"],
  ["Output", "OUTPUT_NOT_OWNED", 4, "Node"],
  ["Output", "OUTPUT_LOCKED", 4, "Node"],
  ["Output", "OUTPUT_RECOVERY_REQUIRED", 4, "Node"],
  ["Operational", "BUILD_TIMEOUT", 6, "Both"],
  ["Operational", "MEMORY_LIMIT_EXCEEDED", 6, "Node"],
  ["Internal", "INTERNAL_COMPILER_ERROR", 5, "Both"],
];

export const ERROR_CODE_ENTRIES = Object.freeze(
  entries.map(([category, code, exitCode, hosts]) =>
    Object.freeze({ category, code, exitCode, hosts }),
  ),
);

const ERROR_CODE_INDEX = Object.freeze(
  Object.fromEntries(ERROR_CODE_ENTRIES.map((entry) => [entry.code, entry])),
);

export function isErrorCode(code) {
  return (
    typeof code === "string" &&
    Object.prototype.hasOwnProperty.call(ERROR_CODE_INDEX, code)
  );
}

export function errorMetadata(code) {
  if (!isErrorCode(code)) {
    throw new TypeError("Unknown Relationship Presentation error code");
  }
  return ERROR_CODE_INDEX[code];
}

export function exitCodeForErrorCode(code) {
  return errorMetadata(code).exitCode;
}
