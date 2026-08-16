import { isErrorCode } from "./error-codes.js";

const SHA256_PATTERN = /^[0-9a-f]{64}$/;

export function formatErrorStatusLine(code) {
  if (!isErrorCode(code)) {
    throw new TypeError("Cannot format a status line for an unknown error code");
  }
  return `status=error code=${code}\n`;
}

export function formatSuccessStatusLine(
  coreFingerprint,
  distributionFingerprint,
) {
  if (
    !SHA256_PATTERN.test(coreFingerprint) ||
    !SHA256_PATTERN.test(distributionFingerprint)
  ) {
    throw new TypeError("Success fingerprints must be lowercase SHA-256 values");
  }
  return (
    "status=success artifact=relationship-presentation " +
    `coreFingerprint=${coreFingerprint} ` +
    `distributionFingerprint=${distributionFingerprint}\n`
  );
}
