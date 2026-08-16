import assert from "node:assert/strict";
import test from "node:test";

import {
  canonicalCoreRequest,
  cloneCoreRequest,
} from "../phase2/core-request-fixture.mjs";
import { clone, encodeJson, phase5Inputs, sourceNode } from "./phase5-fixture.mjs";

const { buildErrorReport, compileCore } = await import(
  "../../build/phase2/relationship-presentation-core.skeleton.bundle.mjs"
);
const encoder = new TextEncoder();

function assertFailure(result, code) {
  assert.equal(result.status, "error");
  assert.equal(result.code, code);
  assert.equal(result.statusLine, `status=error code=${code}\n`);
  assert.deepEqual(
    result.errorReport,
    buildErrorReport({ code, violations: [] }),
  );
}

function assertSuccess(result) {
  assert.equal(result.status, "success");
  assert.match(result.coreFingerprint, /^[0-9a-f]{64}$/u);
}

async function requestWithText(text) {
  const request = cloneCoreRequest(await canonicalCoreRequest());
  request.inputs.request = encoder.encode(text);
  return request;
}

test("the request parser applies the anchored greedy grammar and BOM policy", async () => {
  for (const text of [
    "Create a three-slide presentation explaining Relationship 42 to a general audience.\n",
    "Create a two-slide presentation explaining Relationship 42",
    "Create a two-slide presentation explaining  to a general audience.\n",
    " Create a two-slide presentation explaining Relationship 42 to a general audience.\n",
    "Create a two-slide presentation explaining Relationship 42 to a general audience.\n\n",
  ]) {
    assertFailure(await compileCore(await requestWithText(text)), "REQUEST_GRAMMAR_MISMATCH");
  }

  const tooLong = `Create a two-slide presentation explaining ${"a".repeat(257)} to a general audience.`;
  assertFailure(await compileCore(await requestWithText(tooLong)), "DESIGNATOR_TOO_LONG");
  for (const hostile of ["\u0007", "\u202e", "\uffff"]) {
    const text = `Create a two-slide presentation explaining A${hostile}B to a general audience.`;
    assertFailure(await compileCore(await requestWithText(text)), "INVALID_CRITICAL_STRING");
  }

  const bom = cloneCoreRequest(await canonicalCoreRequest());
  bom.inputs.request = new Uint8Array([0xef, 0xbb, 0xbf, ...bom.inputs.request]);
  assertSuccess(await compileCore(bom));
});

test("the terminal suffix uniquely captures an interior grammar suffix", async () => {
  const { parsed } = await phase5Inputs();
  const source = clone(parsed.source);
  const designator = "Alpha to a general audience. Beta";
  sourceNode(source, "/relationship-42-identifier").label = designator;
  const request = cloneCoreRequest(await canonicalCoreRequest());
  request.inputs.source = encodeJson(source);
  request.inputs.request = encoder.encode(
    `Create a two-slide presentation explaining ${designator} to a general audience.\n`,
  );
  assertSuccess(await compileCore(request));
});

test("request and label scalar boundaries pass at 256", async () => {
  const { parsed } = await phase5Inputs();
  const source = clone(parsed.source);
  const designator = "D".repeat(256);
  sourceNode(source, "/relationship-42-identifier").label = designator;
  sourceNode(source, "/alice-name").label = "N".repeat(256);
  const request = cloneCoreRequest(await canonicalCoreRequest());
  request.inputs.source = encodeJson(source);
  request.inputs.request = encoder.encode(
    `Create a two-slide presentation explaining ${designator} to a general audience.\r\n`,
  );
  assertSuccess(await compileCore(request));
});

test("request resolution compares NFC-normalized designator labels", async () => {
  const { parsed } = await phase5Inputs();
  const source = clone(parsed.source);
  sourceNode(source, "/relationship-42-identifier").label = "Cafe\u0301";
  const request = cloneCoreRequest(await canonicalCoreRequest());
  request.inputs.source = encodeJson(source);
  request.inputs.request = encoder.encode(
    "Create a two-slide presentation explaining Café to a general audience.\n",
  );
  assertSuccess(await compileCore(request));
});

test("profile identity and expanded triple-set equality are both enforced", async () => {
  const { parsed } = await phase5Inputs();
  const unknown = cloneCoreRequest(await canonicalCoreRequest());
  const unknownProfile = clone(parsed.userProfile);
  unknownProfile["@id"] = "profile:unknown";
  unknown.inputs.userProfile = encodeJson(unknownProfile);
  assertFailure(await compileCore(unknown), "UNSUPPORTED_PROFILE");

  const changed = cloneCoreRequest(await canonicalCoreRequest());
  const changedProfile = clone(parsed.userProfile);
  changedProfile["projection:advanceLabel"] = "Continue";
  changed.inputs.userProfile = encodeJson(changedProfile);
  assertFailure(await compileCore(changed), "UNSUPPORTED_PROFILE_CONTRACT");

  const unknownOrder = cloneCoreRequest(await canonicalCoreRequest());
  const unknownOrderProfile = clone(parsed.userProfile);
  unknownOrderProfile["projection:participantOrder"] = "locale-dependent";
  unknownOrder.inputs.userProfile = encodeJson(unknownOrderProfile);
  assertFailure(
    await compileCore(unknownOrder),
    "UNSUPPORTED_PROFILE_CONTRACT",
  );

  const extra = cloneCoreRequest(await canonicalCoreRequest());
  const extraProfile = clone(parsed.userProfile);
  extraProfile["projection:unexpected"] = "value";
  extra.inputs.userProfile = encodeJson(extraProfile);
  assertFailure(await compileCore(extra), "UNSUPPORTED_PROFILE_CONTRACT");

  const ordering = cloneCoreRequest(await canonicalCoreRequest());
  ordering.inputs.userProfile = encodeJson(changedProfile);
  ordering.inputs.request = encoder.encode("invalid request");
  assertFailure(await compileCore(ordering), "REQUEST_GRAMMAR_MISMATCH");
});
