import { errorMetadata } from "./error-codes.js";
import { formatErrorStatusLine } from "./status-line.js";

function compareCodeUnits(left, right) {
  if (left < right) {
    return -1;
  }
  if (left > right) {
    return 1;
  }
  return 0;
}

function compareViolations(left, right) {
  const codeOrder = compareCodeUnits(left.code, right.code);
  if (codeOrder !== 0) {
    return codeOrder;
  }

  const sourceOrder = compareCodeUnits(left.source ?? "", right.source ?? "");
  if (sourceOrder !== 0) {
    return sourceOrder;
  }
  return compareCodeUnits(left.message, right.message);
}

function normalizeViolation(violation) {
  if (
    violation === null ||
    typeof violation !== "object" ||
    Array.isArray(violation) ||
    typeof violation.code !== "string" ||
    typeof violation.message !== "string" ||
    (violation.source !== undefined && typeof violation.source !== "string")
  ) {
    throw new TypeError("Error-report violations must use the v1.0 shape");
  }

  const normalized = { code: violation.code };
  if (violation.source !== undefined) {
    normalized.source = violation.source;
  }
  normalized.message = violation.message;
  return normalized;
}

function normalizeErrorData(errorData) {
  if (errorData === null || typeof errorData !== "object") {
    throw new TypeError("Error-report data must be an object");
  }
  const suppliedViolations = errorData.violations ?? [];
  if (!Array.isArray(suppliedViolations)) {
    throw new TypeError("Error-report violations must be an array");
  }

  const orderedViolations = suppliedViolations
    .map(normalizeViolation)
    .sort(compareViolations)
    .slice(0, 100);

  const tooManyViolations = suppliedViolations.length > 100;
  const code = tooManyViolations ? "TOO_MANY_VIOLATIONS" : errorData.code;
  errorMetadata(code);
  const report = {
    errorVersion: "error-report-v1.0",
    code,
  };
  if (code === "FIXTURE_CONTRACT_FAILED" || code === "TOO_MANY_VIOLATIONS") {
    const contractVersion =
      errorData.contractVersion ?? "person-association-contract-v1.0";
    if (typeof contractVersion !== "string") {
      throw new TypeError("Error-report contractVersion must be a string");
    }
    report.contractVersion = contractVersion;
  }
  report.violations = orderedViolations;

  return { code, report };
}

export function buildErrorReport(errorData) {
  const { report } = normalizeErrorData(errorData);
  return new TextEncoder().encode(`${JSON.stringify(report, null, 2)}\n`);
}

export function buildFailureResult(errorData) {
  const { code, report } = normalizeErrorData(errorData);
  return {
    status: "error",
    statusLine: formatErrorStatusLine(code),
    code,
    errorReport: new TextEncoder().encode(`${JSON.stringify(report, null, 2)}\n`),
  };
}
