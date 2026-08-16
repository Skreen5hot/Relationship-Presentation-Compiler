import { exitCodeForErrorCode } from "../core/error-codes.js";
import { buildErrorReport, buildFailureResult } from "../core/error-report.js";
import { parseJsonBytes } from "../core/json-scan.js";
import {
  formatErrorStatusLine,
  formatSuccessStatusLine,
} from "../core/status-line.js";

function isUint8Array(value) {
  return Object.prototype.toString.call(value) === "[object Uint8Array]";
}

function bytesEqual(left, right) {
  if (left.byteLength !== right.byteLength) {
    return false;
  }
  for (let index = 0; index < left.byteLength; index += 1) {
    if (left[index] !== right[index]) {
      return false;
    }
  }
  return true;
}

export function buildNodeHostFailure(errorData) {
  return buildFailureResult(errorData);
}

export function mapNodeResultToTerminal(result) {
  if (result === null || typeof result !== "object" || Array.isArray(result)) {
    throw new TypeError("A Node terminal mapping requires a result object");
  }

  if (result.status === "success") {
    const expectedStatusLine = formatSuccessStatusLine(
      result.coreFingerprint,
      result.distributionFingerprint,
    );
    if (result.statusLine !== expectedStatusLine) {
      throw new TypeError("Success result has a noncanonical status line");
    }
    return { exitCode: 0, stdout: expectedStatusLine, stderr: "" };
  }

  if (result.status !== "error" || !isUint8Array(result.errorReport)) {
    throw new TypeError("Node result is neither canonical success nor error");
  }

  const expectedStatusLine = formatErrorStatusLine(result.code);
  if (result.statusLine !== expectedStatusLine) {
    throw new TypeError("Error result has a noncanonical status line");
  }

  let parsedReport;
  try {
    parsedReport = parseJsonBytes(result.errorReport).value;
  } catch {
    throw new TypeError("Error result has a noncanonical error report");
  }
  if (parsedReport.code !== result.code) {
    throw new TypeError("Error report and status line codes differ");
  }
  const rebuiltReport = buildErrorReport(parsedReport);
  if (!bytesEqual(result.errorReport, rebuiltReport)) {
    throw new TypeError("Error result has a noncanonical error report");
  }

  return {
    exitCode: exitCodeForErrorCode(result.code),
    stdout: "",
    stderr: expectedStatusLine,
  };
}
