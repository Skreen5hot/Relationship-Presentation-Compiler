// <define:__RPC_ARTIFACT_DIGESTS__>
var define_RPC_ARTIFACT_DIGESTS_default = { context: "6e27b066fa6f205e130f322f479c89edd0c5e64a12800f3bcb9ea1117822b484", contract: "09dffb9112967a8e725244e8caa03e055a3f88761af545459a773a5a01722322", canonicalProfile: "cfa9db81b1388b11342e7a4433f259acc49595d8b801072bccd0587c0305c296", carrierStyle: "ffcf45b266ad10b4dc1f21d604beec4db52a3a618f13541444ed77e6f3a8cc3d", carrierNavigation: "94d1406758a8fe887a8d39f3559b505099ab08d5e2af39834b7f52bee5e914ad" };

// src/core/build-constants.js
var EMBEDDED_ARTIFACT_DIGESTS = define_RPC_ARTIFACT_DIGESTS_default;

// src/core/error-report.js
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
function buildErrorReport(errorData) {
  const orderedViolations = [...errorData.violations ?? []].sort(compareViolations).slice(0, 100).map((violation) => {
    const normalized = { code: violation.code };
    if (violation.source !== void 0) {
      normalized.source = violation.source;
    }
    normalized.message = violation.message;
    return normalized;
  });
  const tooManyViolations = (errorData.violations?.length ?? 0) > 100;
  const code = tooManyViolations ? "TOO_MANY_VIOLATIONS" : errorData.code;
  const report = {
    errorVersion: "error-report-v1.0",
    code
  };
  if (code === "FIXTURE_CONTRACT_FAILED" || code === "TOO_MANY_VIOLATIONS") {
    report.contractVersion = errorData.contractVersion ?? "person-association-contract-v1.0";
  }
  report.violations = orderedViolations;
  return new TextEncoder().encode(`${JSON.stringify(report, null, 2)}
`);
}

// src/core/json-scan.js
var UTF8_BOM = [239, 187, 191];
var MAX_JSON_DEPTH = 64;
var JsonScanError = class extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
};
function isWhitespace(code) {
  return code === 32 || code === 9 || code === 10 || code === 13;
}
function isDigit(code) {
  return code >= 48 && code <= 57;
}
function isHexDigit(code) {
  return isDigit(code) || code >= 65 && code <= 70 || code >= 97 && code <= 102;
}
function syntaxError() {
  return new JsonScanError("INVALID_JSON_SYNTAX");
}
function decodeUtf8Input(bytes) {
  const hasBom = bytes.length >= UTF8_BOM.length && UTF8_BOM.every((value, index) => bytes[index] === value);
  const content = hasBom ? bytes.subarray(UTF8_BOM.length) : bytes;
  const decoder = new TextDecoder("utf-8", {
    fatal: true,
    ignoreBOM: true
  });
  return { hadBom: hasBom, text: decoder.decode(content) };
}
function scanJsonText(text) {
  let index = 0;
  let maximumDepth = 0;
  let rootState = "value";
  const stack = [];
  function skipWhitespace() {
    while (index < text.length && isWhitespace(text.charCodeAt(index))) {
      index += 1;
    }
  }
  function parseString() {
    if (text.charCodeAt(index) !== 34) {
      throw syntaxError();
    }
    const start = index;
    index += 1;
    while (index < text.length) {
      const code = text.charCodeAt(index);
      if (code === 34) {
        index += 1;
        return JSON.parse(text.slice(start, index));
      }
      if (code < 32) {
        throw syntaxError();
      }
      if (code !== 92) {
        index += 1;
        continue;
      }
      index += 1;
      const escape = text.charCodeAt(index);
      if (escape === 34 || escape === 47 || escape === 92 || escape === 98 || escape === 102 || escape === 110 || escape === 114 || escape === 116) {
        index += 1;
        continue;
      }
      if (escape !== 117) {
        throw syntaxError();
      }
      for (let offset = 1; offset <= 4; offset += 1) {
        if (!isHexDigit(text.charCodeAt(index + offset))) {
          throw syntaxError();
        }
      }
      index += 5;
    }
    throw syntaxError();
  }
  function parseNumber() {
    if (text.charCodeAt(index) === 45) {
      index += 1;
    }
    if (text.charCodeAt(index) === 48) {
      index += 1;
      if (isDigit(text.charCodeAt(index))) {
        throw syntaxError();
      }
    } else {
      const firstDigit = text.charCodeAt(index);
      if (firstDigit < 49 || firstDigit > 57) {
        throw syntaxError();
      }
      do {
        index += 1;
      } while (isDigit(text.charCodeAt(index)));
    }
    if (text.charCodeAt(index) === 46) {
      index += 1;
      if (!isDigit(text.charCodeAt(index))) {
        throw syntaxError();
      }
      while (isDigit(text.charCodeAt(index))) {
        index += 1;
      }
    }
    const exponent = text.charCodeAt(index);
    if (exponent === 69 || exponent === 101) {
      index += 1;
      const sign = text.charCodeAt(index);
      if (sign === 43 || sign === 45) {
        index += 1;
      }
      if (!isDigit(text.charCodeAt(index))) {
        throw syntaxError();
      }
      while (isDigit(text.charCodeAt(index))) {
        index += 1;
      }
    }
  }
  function parseLiteral(literal) {
    if (text.slice(index, index + literal.length) !== literal) {
      throw syntaxError();
    }
    index += literal.length;
  }
  function consumeValue() {
    if (stack.length === 0) {
      if (rootState !== "value") {
        throw syntaxError();
      }
      rootState = "done";
      return;
    }
    const parent = stack[stack.length - 1];
    if (parent.state !== "value" && parent.state !== "valueOrEnd") {
      throw syntaxError();
    }
    parent.state = "commaOrEnd";
  }
  function openContainer(kind) {
    consumeValue();
    stack.push({
      kind,
      keys: kind === "object" ? /* @__PURE__ */ new Set() : void 0,
      state: kind === "object" ? "keyOrEnd" : "valueOrEnd"
    });
    maximumDepth = Math.max(maximumDepth, stack.length);
    if (maximumDepth > MAX_JSON_DEPTH) {
      throw new JsonScanError("JSON_TOO_DEEP");
    }
  }
  function closeContainer(expectedKind) {
    const current = stack.at(-1);
    if (current?.kind !== expectedKind) {
      throw syntaxError();
    }
    stack.pop();
    index += 1;
  }
  while (true) {
    skipWhitespace();
    if (stack.length === 0 && rootState === "done") {
      if (index !== text.length) {
        throw syntaxError();
      }
      break;
    }
    const current = stack.at(-1);
    const state = current?.state ?? rootState;
    const code = text.charCodeAt(index);
    if (state === "keyOrEnd" || state === "key") {
      if (state === "keyOrEnd" && code === 125) {
        closeContainer("object");
        continue;
      }
      const key = parseString();
      if (current.keys.has(key)) {
        throw new JsonScanError("DUPLICATE_JSON_MEMBER");
      }
      current.keys.add(key);
      current.state = "colon";
      continue;
    }
    if (state === "colon") {
      if (code !== 58) {
        throw syntaxError();
      }
      index += 1;
      current.state = "value";
      continue;
    }
    if (state === "commaOrEnd") {
      if (current.kind === "object") {
        if (code === 125) {
          closeContainer("object");
        } else if (code === 44) {
          index += 1;
          current.state = "key";
        } else {
          throw syntaxError();
        }
      } else if (code === 93) {
        closeContainer("array");
      } else if (code === 44) {
        index += 1;
        current.state = "value";
      } else {
        throw syntaxError();
      }
      continue;
    }
    if (state === "valueOrEnd" && code === 93) {
      closeContainer("array");
      continue;
    }
    if (state !== "value" && state !== "valueOrEnd") {
      throw syntaxError();
    }
    if (code === 123) {
      index += 1;
      openContainer("object");
    } else if (code === 91) {
      index += 1;
      openContainer("array");
    } else if (code === 34) {
      parseString();
      consumeValue();
    } else if (code === 116) {
      parseLiteral("true");
      consumeValue();
    } else if (code === 102) {
      parseLiteral("false");
      consumeValue();
    } else if (code === 110) {
      parseLiteral("null");
      consumeValue();
    } else if (code === 45 || isDigit(code)) {
      parseNumber();
      consumeValue();
    } else {
      throw syntaxError();
    }
  }
  return { depth: maximumDepth, value: JSON.parse(text) };
}

// src/core/core.js
var INPUT_ROLES = [
  "context",
  "contract",
  "canonicalProfile",
  "userProfile",
  "source",
  "request",
  "carrierStyle",
  "carrierNavigation"
];
var LOCKED_INPUT_ROLES = [
  "context",
  "contract",
  "canonicalProfile",
  "carrierStyle",
  "carrierNavigation"
];
var STRUCTURAL_INPUT_ROLES = [
  "context",
  "contract",
  "canonicalProfile",
  "userProfile",
  "source",
  "request"
];
var JSON_INPUT_ROLES = /* @__PURE__ */ new Set([
  "context",
  "contract",
  "canonicalProfile",
  "userProfile",
  "source"
]);
var INPUT_LIMITS = {
  context: [64 * 1024, "CONTEXT_TOO_LARGE"],
  contract: [64 * 1024, "CONTRACT_TOO_LARGE"],
  canonicalProfile: [64 * 1024, "PROFILE_TOO_LARGE"],
  userProfile: [64 * 1024, "PROFILE_TOO_LARGE"],
  source: [1024 * 1024, "SOURCE_TOO_LARGE"],
  request: [4 * 1024, "REQUEST_TOO_LARGE"]
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
  if (ownKeys.length !== memberNames.length || ownKeys.some((key) => typeof key !== "string" || !memberNames.includes(key))) {
    return false;
  }
  return memberNames.every((name) => {
    const descriptor = Object.getOwnPropertyDescriptor(value, name);
    return descriptor !== void 0 && "value" in descriptor;
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
      if (Object.prototype.toString.call(suppliedInputs[role]) !== "[object Uint8Array]") {
        return null;
      }
      snapshots[role] = Uint8Array.prototype.slice.call(suppliedInputs[role]);
    }
  } catch {
    return null;
  }
  return snapshots;
}
function failure(code) {
  return {
    status: "error",
    statusLine: `status=error code=${code}
`,
    code,
    errorReport: buildErrorReport({ code, violations: [] })
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
async function compileCore(coreRequest) {
  const inputs = snapshotCoreRequest(coreRequest);
  if (inputs === null) {
    return failure("INVALID_CORE_REQUEST");
  }
  for (const role of LOCKED_INPUT_ROLES) {
    if (await sha256(inputs[role]) !== EMBEDDED_ARTIFACT_DIGESTS[role]) {
      return failure("ARTIFACT_LOCK_MISMATCH");
    }
  }
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
        scanJsonText(decoded.text);
      } catch (error) {
        if (error instanceof JsonScanError && (error.code === "DUPLICATE_JSON_MEMBER" || error.code === "JSON_TOO_DEEP")) {
          return failure(error.code);
        }
        return failure("INTERNAL_COMPILER_ERROR");
      }
    }
  }
  return failure("INTERNAL_COMPILER_ERROR");
}
export {
  buildErrorReport,
  compileCore
};
