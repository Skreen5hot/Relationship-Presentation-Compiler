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

export function buildErrorReport(errorData) {
  const orderedViolations = [...(errorData.violations ?? [])]
    .sort(compareViolations)
    .slice(0, 100)
    .map((violation) => {
      const normalized = { code: violation.code };
      if (violation.source !== undefined) {
        normalized.source = violation.source;
      }
      normalized.message = violation.message;
      return normalized;
    });

  const tooManyViolations = (errorData.violations?.length ?? 0) > 100;
  const code = tooManyViolations ? "TOO_MANY_VIOLATIONS" : errorData.code;
  const report = {
    errorVersion: "error-report-v1.0",
    code,
  };
  if (code === "FIXTURE_CONTRACT_FAILED" || code === "TOO_MANY_VIOLATIONS") {
    report.contractVersion =
      errorData.contractVersion ?? "person-association-contract-v1.0";
  }
  report.violations = orderedViolations;

  return new TextEncoder().encode(`${JSON.stringify(report, null, 2)}\n`);
}
