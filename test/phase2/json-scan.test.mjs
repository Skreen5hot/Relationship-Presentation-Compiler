import assert from "node:assert/strict";
import test from "node:test";

import {
  JsonScanError,
  parseJsonBytes,
  scanJsonText,
} from "../../src/core/json-scan.js";

function assertScanCode(source, code) {
  assert.throws(
    () => scanJsonText(source),
    (error) => error instanceof JsonScanError && error.code === code,
  );
}

test("the scanner parses valid JSON without conflating nested key scopes", () => {
  const result = scanJsonText(
    '{"a":1,"nested":{"a":2},"array":[true,false,null,-1.25e+2]}',
  );
  assert.equal(result.depth, 2);
  assert.deepEqual(result.value, {
    a: 1,
    nested: { a: 2 },
    array: [true, false, null, -125],
  });
});

test("decoded-equivalent JSON member names are duplicates", () => {
  for (const source of [
    '{"a":1,"a":2}',
    '{"a":1,"\\u0061":2}',
    '{"𝄞":1,"\\ud834\\udd1e":2}',
    '{"a":1,"nested":{"x":1,"x":2}}',
  ]) {
    assertScanCode(source, "DUPLICATE_JSON_MEMBER");
  }
});

test("the scanner enforces depth 64 without recursive call-stack dependence", () => {
  const atLimit = `${"[".repeat(64)}0${"]".repeat(64)}`;
  const beyondLimit = `${"[".repeat(65)}0${"]".repeat(65)}`;
  assert.equal(scanJsonText(atLimit).depth, 64);
  assertScanCode(beyondLimit, "JSON_TOO_DEEP");
});

test("the byte parser fatally decodes UTF-8 and strips exactly one leading BOM", () => {
  const once = new Uint8Array([0xef, 0xbb, 0xbf, 0x7b, 0x7d]);
  const parsed = parseJsonBytes(once);
  assert.equal(parsed.hadBom, true);
  assert.equal(parsed.text, "{}");
  assert.deepEqual(parsed.value, {});

  assert.throws(
    () => parseJsonBytes(new Uint8Array([0x7b, 0x22, 0x78, 0x22, 0x3a, 0xff, 0x7d])),
    TypeError,
  );
  assertScanCode('{"trailing":true,}', "INVALID_JSON_SYNTAX");
});
