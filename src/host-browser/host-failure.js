import { buildErrorReport } from "../../browser/relationship-presentation-core.bundle.mjs";
import { formatErrorStatusLine } from "../core/status-line.js";

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

export function hostFailure(code) {
  return {
    status: "error",
    statusLine: formatErrorStatusLine(code),
    code,
    errorReport: buildErrorReport({ code, violations: [] }),
  };
}

export function isCanonicalErrorReport(errorReport, code) {
  if (
    Object.prototype.toString.call(errorReport) !== "[object Uint8Array]"
  ) {
    return false;
  }
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(errorReport);
    if (!text.endsWith("\n") || text.includes("\r")) {
      return false;
    }
    const parsed = JSON.parse(text);
    return (
      parsed.code === code &&
      bytesEqual(errorReport, buildErrorReport(parsed))
    );
  } catch {
    return false;
  }
}
