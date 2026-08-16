import assert from "node:assert/strict";
import test from "node:test";

import {
  ERROR_CODE_ENTRIES,
  errorMetadata,
  exitCodeForErrorCode,
} from "../../src/core/error-codes.js";
import {
  buildErrorReport,
  buildFailureResult,
} from "../../src/core/error-report.js";
import {
  buildNodeHostFailure,
  mapNodeResultToTerminal,
} from "../../src/host-node/failure-surface.js";
import {
  canonicalCoreRequest,
  cloneCoreRequest,
} from "../phase2/core-request-fixture.mjs";
import {
  clone,
  encodeJson,
  phase5Inputs,
  sourceNode,
} from "../phase5/phase5-fixture.mjs";

const decoder = new TextDecoder("utf-8", { fatal: true });
const encoder = new TextEncoder();

const EXPECTED_REGISTRY = `
CLI|UNKNOWN_OPTION|2|Node
CLI|DUPLICATE_OPTION|2|Node
CLI|INVALID_CLI_OPTIONS|2|Node
Core interface|INVALID_CORE_REQUEST|2|Core
Input acquisition|UNSAFE_INPUT_PATH|3|Node
Input acquisition|INPUT_CHANGED_DURING_LOAD|3|Node
Input|SOURCE_TOO_LARGE|3|Core
Input|REQUEST_TOO_LARGE|3|Core
Input|PROFILE_TOO_LARGE|3|Core
Input|CONTEXT_TOO_LARGE|3|Core
Input|CONTRACT_TOO_LARGE|3|Core
Input|INVALID_UTF8|3|Core
Input|UTF8_BOM_NOT_SUPPORTED|3|Core
JSON|JSON_TOO_DEEP|3|Core
JSON|DUPLICATE_JSON_MEMBER|3|Core
JSON-LD|TOO_MANY_TRIPLES|3|Core
JSON-LD|TOO_MANY_CONTEXT_TERMS|3|Core
JSON-LD|REMOTE_CONTEXT_NOT_SUPPORTED|3|Core
JSON-LD|LOCAL_CONTEXT_NOT_APPROVED|3|Core
JSON-LD|CONTEXT_TERM_REDEFINITION|3|Core
JSON-LD|JSONLD_IMPORT_NOT_SUPPORTED|3|Core
JSON-LD|OWL_IMPORTS_NOT_SUPPORTED|3|Core
JSON-LD|BLANK_NODE_NOT_SUPPORTED|3|Core
JSON-LD|NAMED_GRAPH_NOT_SUPPORTED|3|Core
Request|REQUEST_GRAMMAR_MISMATCH|1|Core
Request|DESIGNATOR_TOO_LONG|1|Core
Request|INVALID_CRITICAL_STRING|1|Core
Profile|UNSUPPORTED_PROFILE|1|Core
Profile|UNSUPPORTED_PROFILE_CONTRACT|1|Core
Fixture|FIXTURE_CONTRACT_FAILED|1|Core
Fixture|LABEL_TOO_LONG|1|Core
Fixture|SOURCE_GRAPH_CONTAMINATED|1|Core
Fixture|LOCAL_CONTRACT_VOCABULARY_VIOLATION|1|Core
Fixture|SOURCE_NAMESPACE_NOT_ALLOWED|1|Core
Reporting|TOO_MANY_VIOLATIONS|1|Core
Lock|RUNTIME_LOCK_MISMATCH|4|Node
Lock|PACKAGE_LOCK_MISMATCH|4|Node
Lock|ARTIFACT_LOCK_MISMATCH|4|Both
Lock|ONTOLOGY_LOCK_MISMATCH|4|Node
Lock|SBOM_MISMATCH|4|Node
Output|INPUT_OUTPUT_OVERLAP|4|Node
Output|UNSAFE_OUTPUT_PATH|4|Node
Output|OUTPUT_EXISTS|4|Node
Output|OUTPUT_NOT_OWNED|4|Node
Output|OUTPUT_LOCKED|4|Node
Output|OUTPUT_RECOVERY_REQUIRED|4|Node
Operational|BUILD_TIMEOUT|6|Both
Operational|MEMORY_LIMIT_EXCEEDED|6|Node
Internal|INTERNAL_COMPILER_ERROR|5|Both
`
  .trim()
  .split("\n")
  .map((line) => {
    const [category, code, exitCode, hosts] = line.split("|");
    return { category, code, exitCode: Number(exitCode), hosts };
  });

function decodeReport(bytes) {
  const text = decoder.decode(bytes);
  assert.ok(text.endsWith("\n"));
  assert.ok(!text.includes("\r"));
  return { report: JSON.parse(text), text };
}

function compareCodeUnits(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function compareViolations(left, right) {
  return (
    compareCodeUnits(left.code, right.code) ||
    compareCodeUnits(left.source ?? "", right.source ?? "") ||
    compareCodeUnits(left.message, right.message)
  );
}

test("Appendix A is one closed 49-code registry with exact exit classes and hosts", () => {
  assert.deepEqual(ERROR_CODE_ENTRIES, EXPECTED_REGISTRY);
  assert.equal(new Set(ERROR_CODE_ENTRIES.map(({ code }) => code)).size, 49);
  assert.throws(() => errorMetadata("NOT_A_REGISTERED_CODE"), TypeError);
  assert.throws(() => exitCodeForErrorCode("FIXTURE_DETAIL_CODE"), TypeError);
});

test("every Appendix A code has one canonical report, status line, and Node exit mapping", () => {
  for (const entry of EXPECTED_REGISTRY) {
    const result = buildFailureResult({ code: entry.code, violations: [] });
    const hostResult = buildNodeHostFailure({
      code: entry.code,
      violations: [],
    });
    assert.deepEqual(hostResult, result);
    assert.equal(result.status, "error");
    assert.equal(result.code, entry.code);
    assert.equal(result.statusLine, `status=error code=${entry.code}\n`);
    assert.deepEqual(
      result.errorReport,
      buildErrorReport({ code: entry.code, violations: [] }),
    );

    const { report } = decodeReport(result.errorReport);
    const expectedKeys = ["errorVersion", "code"];
    if (
      entry.code === "FIXTURE_CONTRACT_FAILED" ||
      entry.code === "TOO_MANY_VIOLATIONS"
    ) {
      expectedKeys.push("contractVersion");
    }
    expectedKeys.push("violations");
    assert.deepEqual(Object.keys(report), expectedKeys);
    assert.equal(report.errorVersion, "error-report-v1.0");
    assert.equal(report.code, entry.code);
    assert.deepEqual(report.violations, []);

    assert.deepEqual(mapNodeResultToTerminal(result), {
      exitCode: entry.exitCode,
      stdout: "",
      stderr: `status=error code=${entry.code}\n`,
    });
  }
});

test("error reports sort by UTF-16 code units and cap the ordered set at 100", () => {
  const violations = [
    { code: "B", source: "z", message: "a" },
    { code: "A", source: "z", message: "z" },
    { code: "B", message: "z" },
    { code: "B", source: "a", message: "b" },
    { code: "B", source: "a", message: "a" },
  ];
  const { report, text } = decodeReport(
    buildErrorReport({ code: "FIXTURE_CONTRACT_FAILED", violations }),
  );
  assert.deepEqual(report.violations, [...violations].sort(compareViolations));
  assert.deepEqual(Object.keys(report), [
    "errorVersion",
    "code",
    "contractVersion",
    "violations",
  ]);
  assert.equal(
    text,
    `${JSON.stringify(report, null, 2)}\n`,
    "the report must be two-space plain JSON with one terminal LF",
  );

  const many = Array.from({ length: 101 }, (_, index) => ({
    code: `V${String(100 - index).padStart(3, "0")}`,
    message: `fixed-${index}`,
  }));
  const cappedResult = buildFailureResult({
    code: "FIXTURE_CONTRACT_FAILED",
    violations: many,
  });
  const capped = decodeReport(cappedResult.errorReport).report;
  assert.equal(cappedResult.code, "TOO_MANY_VIOLATIONS");
  assert.equal(cappedResult.statusLine, "status=error code=TOO_MANY_VIOLATIONS\n");
  assert.equal(capped.code, "TOO_MANY_VIOLATIONS");
  assert.equal(capped.violations.length, 100);
  assert.deepEqual(capped.violations, [...many].sort(compareViolations).slice(0, 100));
});

test("failure builders reject open codes, malformed violations, and noncanonical terminal results", () => {
  assert.throws(
    () => buildErrorReport({ code: "OPEN_ENDED_CODE", violations: [] }),
    TypeError,
  );
  assert.throws(
    () =>
      buildErrorReport({
        code: "INVALID_CORE_REQUEST",
        violations: [{ code: "DETAIL" }],
      }),
    TypeError,
  );
  assert.throws(
    () =>
      mapNodeResultToTerminal({
        ...buildFailureResult({
          code: "INVALID_CORE_REQUEST",
          violations: [],
        }),
        statusLine: "status=error code=INVALID_CORE_REQUEST\r\n",
      }),
    TypeError,
  );
  assert.throws(
    () =>
      mapNodeResultToTerminal({
        ...buildFailureResult({
          code: "INVALID_CORE_REQUEST",
          violations: [],
        }),
        errorReport: encoder.encode("{}\n"),
      }),
    TypeError,
  );

  const coreFingerprint = "1".repeat(64);
  const distributionFingerprint = "a".repeat(64);
  const success = {
    status: "success",
    statusLine:
      "status=success artifact=relationship-presentation " +
      `coreFingerprint=${coreFingerprint} ` +
      `distributionFingerprint=${distributionFingerprint}\n`,
    coreFingerprint,
    distributionFingerprint,
  };
  assert.deepEqual(mapNodeResultToTerminal(success), {
    exitCode: 0,
    stdout: success.statusLine,
    stderr: "",
  });
  assert.ok(!success.statusLine.includes("output"));
});

test("combined defects obey the closed C0 through C6 failure sequence", async () => {
  const { compileCore } = await import(
    "../../build/phase2/relationship-presentation-core.skeleton.bundle.mjs"
  );
  const canonical = await canonicalCoreRequest();
  const { parsed } = await phase5Inputs();

  assert.equal((await compileCore({})).code, "INVALID_CORE_REQUEST");

  const c1 = cloneCoreRequest(canonical);
  c1.inputs.carrierNavigation[0] ^= 1;
  c1.inputs.source = new Uint8Array(1024 * 1024 + 1);
  assert.equal((await compileCore(c1)).code, "ARTIFACT_LOCK_MISMATCH");

  const c2RoleOrder = cloneCoreRequest(canonical);
  c2RoleOrder.inputs.userProfile = new Uint8Array(64 * 1024 + 1);
  c2RoleOrder.inputs.source = new Uint8Array(1024 * 1024 + 1);
  assert.equal((await compileCore(c2RoleOrder)).code, "PROFILE_TOO_LARGE");

  const c2CheckOrder = cloneCoreRequest(canonical);
  c2CheckOrder.inputs.source = new Uint8Array(1024 * 1024 + 1);
  c2CheckOrder.inputs.request = encoder.encode("invalid");
  assert.equal((await compileCore(c2CheckOrder)).code, "SOURCE_TOO_LARGE");

  const c3 = cloneCoreRequest(canonical);
  const remoteSource = clone(parsed.source);
  remoteSource["@context"] = "https://contexts.example.test/remote";
  c3.inputs.source = encodeJson(remoteSource);
  c3.inputs.request = encoder.encode("invalid");
  assert.equal((await compileCore(c3)).code, "REMOTE_CONTEXT_NOT_SUPPORTED");

  const c4 = cloneCoreRequest(canonical);
  const unknownProfile = clone(parsed.userProfile);
  unknownProfile["@id"] = "profile:not-supported";
  c4.inputs.userProfile = encodeJson(unknownProfile);
  c4.inputs.request = encoder.encode("invalid");
  assert.equal((await compileCore(c4)).code, "REQUEST_GRAMMAR_MISMATCH");

  const c5 = cloneCoreRequest(canonical);
  const invalidFixture = clone(parsed.source);
  sourceNode(invalidFixture, "/relationship-42")["@type"] = [
    "RelationalQuality",
  ];
  c5.inputs.userProfile = encodeJson(unknownProfile);
  c5.inputs.source = encodeJson(invalidFixture);
  assert.equal((await compileCore(c5)).code, "UNSUPPORTED_PROFILE");

  const c6 = cloneCoreRequest(canonical);
  delete sourceNode(invalidFixture, "/alice").differentFrom;
  c6.inputs.source = encodeJson(invalidFixture);
  const c6Result = await compileCore(c6);
  assert.equal(c6Result.code, "FIXTURE_CONTRACT_FAILED");
  const violations = decodeReport(c6Result.errorReport).report.violations;
  assert.deepEqual(violations, [...violations].sort(compareViolations));
});
