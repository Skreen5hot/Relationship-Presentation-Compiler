import assert from "node:assert/strict";
import test from "node:test";

import {
  bytes,
  canonicalCoreRequest,
  cloneCoreRequest,
} from "./core-request-fixture.mjs";

const { buildErrorReport, compileCore } = await import(
  "../../build/phase2/relationship-presentation-core.skeleton.bundle.mjs"
);
const canonicalRequest = await canonicalCoreRequest();

function assertFailure(result, code) {
  assert.deepEqual(result, {
    status: "error",
    statusLine: `status=error code=${code}\n`,
    code,
    errorReport: buildErrorReport({ code, violations: [] }),
  });
}

test("CoreRequest accepts exactly one inputs object with eight Uint8Array roles", async () => {
  const accessorRequest = {};
  Object.defineProperty(accessorRequest, "inputs", {
    enumerable: true,
    get() {
      throw new Error("boundary getter must not execute");
    },
  });
  const symbolRequest = cloneCoreRequest(canonicalRequest);
  symbolRequest.inputs[Symbol("extra")] = new Uint8Array();
  const spoofedBytes = { [Symbol.toStringTag]: "Uint8Array" };
  const malformedRequests = [
    null,
    {},
    { inputs: canonicalRequest.inputs, extra: true },
    { inputs: { ...canonicalRequest.inputs, extra: new Uint8Array() } },
    {
      inputs: Object.fromEntries(
        Object.entries(canonicalRequest.inputs).filter(([role]) => role !== "source"),
      ),
    },
    { inputs: { ...canonicalRequest.inputs, source: "not bytes" } },
    { inputs: { ...canonicalRequest.inputs, source: new DataView(new ArrayBuffer(1)) } },
    { inputs: { ...canonicalRequest.inputs, source: spoofedBytes } },
    { inputs: [] },
    accessorRequest,
    symbolRequest,
  ];

  for (const malformedRequest of malformedRequests) {
    assertFailure(await compileCore(malformedRequest), "INVALID_CORE_REQUEST");
  }
});

test("CoreRequest bytes are snapshotted before the first asynchronous digest", async () => {
  const request = cloneCoreRequest(canonicalRequest);
  const resultPromise = compileCore(request);
  request.inputs.context[0] ^= 1;
  request.inputs.source.fill(0xff);
  assertFailure(await resultPromise, "INTERNAL_COMPILER_ERROR");
});

test("phase C1 binds all five locked input byte sequences", async () => {
  for (const role of [
    "context",
    "contract",
    "canonicalProfile",
    "carrierStyle",
    "carrierNavigation",
  ]) {
    const request = cloneCoreRequest(canonicalRequest);
    request.inputs[role][0] ^= 1;
    assertFailure(await compileCore(request), "ARTIFACT_LOCK_MISMATCH");
  }
});

test("phase C2 applies byte limits before decoding in fixed input order", async () => {
  const exactSource = cloneCoreRequest(canonicalRequest);
  exactSource.inputs.source = bytes(`{}${" ".repeat(1024 * 1024 - 2)}`);
  assertFailure(await compileCore(exactSource), "INTERNAL_COMPILER_ERROR");

  const oversizedSource = cloneCoreRequest(canonicalRequest);
  oversizedSource.inputs.source = bytes(`{}${" ".repeat(1024 * 1024 - 1)}`);
  assertFailure(await compileCore(oversizedSource), "SOURCE_TOO_LARGE");

  const oversizedRequest = cloneCoreRequest(canonicalRequest);
  oversizedRequest.inputs.request = bytes("x".repeat(4 * 1024 + 1));
  assertFailure(await compileCore(oversizedRequest), "REQUEST_TOO_LARGE");

  oversizedRequest.inputs.source = oversizedSource.inputs.source;
  assertFailure(await compileCore(oversizedRequest), "SOURCE_TOO_LARGE");

  const oversizedProfile = cloneCoreRequest(canonicalRequest);
  oversizedProfile.inputs.userProfile = bytes(
    `{}${" ".repeat(64 * 1024 - 1)}`,
  );
  assertFailure(await compileCore(oversizedProfile), "PROFILE_TOO_LARGE");
});

test("phase C2 uses fatal UTF-8 decoding for JSON and request inputs", async () => {
  for (const role of ["userProfile", "source", "request"]) {
    const request = cloneCoreRequest(canonicalRequest);
    request.inputs[role] = new Uint8Array([0xff]);
    assertFailure(await compileCore(request), "INVALID_UTF8");
  }
});

test("phase C2 strips one BOM and rejects duplicate or over-deep JSON", async () => {
  for (const role of ["userProfile", "source", "request"]) {
    const request = cloneCoreRequest(canonicalRequest);
    request.inputs[role] = new Uint8Array([
      0xef,
      0xbb,
      0xbf,
      ...request.inputs[role],
    ]);
    assertFailure(await compileCore(request), "INTERNAL_COMPILER_ERROR");
  }

  for (const role of ["userProfile", "source"]) {
    const duplicate = cloneCoreRequest(canonicalRequest);
    duplicate.inputs[role] = bytes('{"a":1,"\\u0061":2}');
    assertFailure(await compileCore(duplicate), "DUPLICATE_JSON_MEMBER");

    const tooDeep = cloneCoreRequest(canonicalRequest);
    tooDeep.inputs[role] = bytes(`${"[".repeat(65)}0${"]".repeat(65)}`);
    assertFailure(await compileCore(tooDeep), "JSON_TOO_DEEP");
  }
});

test("buildErrorReport has fixed ordering and deterministic truncation", () => {
  const report = JSON.parse(
    new TextDecoder().decode(
      buildErrorReport({
        code: "FIXTURE_CONTRACT_FAILED",
        contractVersion: "person-association-contract-v1.0",
        violations: [
          { code: "B", source: "z", message: "second" },
          { code: "A", message: "first" },
        ],
      }),
    ),
  );
  assert.deepEqual(report, {
    errorVersion: "error-report-v1.0",
    code: "FIXTURE_CONTRACT_FAILED",
    contractVersion: "person-association-contract-v1.0",
    violations: [
      { code: "A", message: "first" },
      { code: "B", source: "z", message: "second" },
    ],
  });

  const many = JSON.parse(
    new TextDecoder().decode(
      buildErrorReport({
        code: "FIXTURE_CONTRACT_FAILED",
        contractVersion: "person-association-contract-v1.0",
        violations: Array.from({ length: 101 }, (_, index) => ({
          code: "V",
          message: String(index).padStart(3, "0"),
        })),
      }),
    ),
  );
  assert.equal(many.code, "TOO_MANY_VIOLATIONS");
  assert.equal(many.violations.length, 100);
});
