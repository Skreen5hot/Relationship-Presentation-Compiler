import { EMBEDDED_ARTIFACT_DIGESTS } from "./build-constants.js";
import { CoreFailure } from "./core-failure.js";
import { buildErrorReport } from "./error-report.js";
import { decodeUtf8Input, JsonScanError, scanJsonText } from "./json-scan.js";
import { runPhase5 } from "./phase5.js";

const INPUT_ROLES = [
  "context",
  "contract",
  "canonicalProfile",
  "userProfile",
  "source",
  "request",
  "carrierStyle",
  "carrierNavigation",
];
const LOCKED_INPUT_ROLES = [
  "context",
  "contract",
  "canonicalProfile",
  "carrierStyle",
  "carrierNavigation",
];
const STRUCTURAL_INPUT_ROLES = [
  "context",
  "contract",
  "canonicalProfile",
  "userProfile",
  "source",
  "request",
];
const JSON_INPUT_ROLES = new Set([
  "context",
  "contract",
  "canonicalProfile",
  "userProfile",
  "source",
]);
const INPUT_LIMITS = {
  context: [64 * 1024, "CONTEXT_TOO_LARGE"],
  contract: [64 * 1024, "CONTRACT_TOO_LARGE"],
  canonicalProfile: [64 * 1024, "PROFILE_TOO_LARGE"],
  userProfile: [64 * 1024, "PROFILE_TOO_LARGE"],
  source: [1024 * 1024, "SOURCE_TOO_LARGE"],
  request: [4 * 1024, "REQUEST_TOO_LARGE"],
};

function isPlainObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasExactDataMembers(value, memberNames) {
  if (!isPlainObject(value)) {
    return false;
  }
  const ownKeys = Reflect.ownKeys(value);
  if (
    ownKeys.length !== memberNames.length ||
    ownKeys.some((key) => typeof key !== "string" || !memberNames.includes(key))
  ) {
    return false;
  }
  return memberNames.every((name) => {
    const descriptor = Object.getOwnPropertyDescriptor(value, name);
    return descriptor !== undefined && "value" in descriptor;
  });
}

function snapshotCoreRequest(coreRequest) {
  if (!hasExactDataMembers(coreRequest, ["inputs"])) {
    return null;
  }
  const suppliedInputs = coreRequest.inputs;
  if (!hasExactDataMembers(suppliedInputs, INPUT_ROLES)) {
    return null;
  }

  const snapshots = {};
  try {
    for (const role of INPUT_ROLES) {
      if (
        Object.prototype.toString.call(suppliedInputs[role]) !==
        "[object Uint8Array]"
      ) {
        return null;
      }
      snapshots[role] = Uint8Array.prototype.slice.call(suppliedInputs[role]);
    }
  } catch {
    return null;
  }
  return snapshots;
}

function failure(code, violations = []) {
  const governingCode =
    violations.length > 100 ? "TOO_MANY_VIOLATIONS" : code;
  return {
    status: "error",
    statusLine: `status=error code=${governingCode}\n`,
    code: governingCode,
    errorReport: buildErrorReport({ code, violations }),
  };
}

function lowercaseHex(arrayBuffer) {
  let result = "";
  for (const value of new Uint8Array(arrayBuffer)) {
    result += value.toString(16).padStart(2, "0");
  }
  return result;
}

async function sha256(bytes) {
  return lowercaseHex(await crypto.subtle.digest("SHA-256", bytes));
}

export async function compileCore(coreRequest) {
  const inputs = snapshotCoreRequest(coreRequest);
  if (inputs === null) {
    return failure("INVALID_CORE_REQUEST");
  }

  for (const role of LOCKED_INPUT_ROLES) {
    if ((await sha256(inputs[role])) !== EMBEDDED_ARTIFACT_DIGESTS[role]) {
      return failure("ARTIFACT_LOCK_MISMATCH");
    }
  }

  const parsedInputs = {};
  for (const role of STRUCTURAL_INPUT_ROLES) {
    const [limit, tooLargeCode] = INPUT_LIMITS[role];
    if (inputs[role].byteLength > limit) {
      return failure(tooLargeCode);
    }

    let decoded;
    try {
      decoded = decodeUtf8Input(inputs[role]);
    } catch {
      return failure("INVALID_UTF8");
    }

    if (JSON_INPUT_ROLES.has(role)) {
      try {
        parsedInputs[role] = scanJsonText(decoded.text).value;
      } catch (error) {
        if (
          error instanceof JsonScanError &&
          (error.code === "DUPLICATE_JSON_MEMBER" ||
            error.code === "JSON_TOO_DEEP")
        ) {
          return failure(error.code);
        }
        return failure("INTERNAL_COMPILER_ERROR");
      }
    } else {
      parsedInputs[role] = decoded.text;
    }
  }

  try {
    await runPhase5(parsedInputs);
  } catch (error) {
    if (error instanceof CoreFailure) {
      return failure(error.code, error.violations);
    }
    return failure("INTERNAL_COMPILER_ERROR");
  }

  // Stages 04–08 are deliberately introduced by Phases 6–8.
  return failure("INTERNAL_COMPILER_ERROR");
}

export { buildErrorReport };
