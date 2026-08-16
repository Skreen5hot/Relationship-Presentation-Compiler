import assert from "node:assert/strict";
import test from "node:test";

import { contextDocument, document, expectedExpanded } from "./probe-fixture.mjs";

const { runPhase0ExpansionProbe } = await import(
  "../../build/phase0/core-edge-smoke.bundle.mjs"
);

const networkGlobals = ["EventSource", "WebSocket", "XMLHttpRequest", "fetch"];

async function withPoisonedNetworkGlobals(callback) {
  const descriptors = new Map();
  for (const name of networkGlobals) {
    descriptors.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, {
      configurable: true,
      value() {
        throw new Error(`CPS poison activated: ${name}`);
      },
      writable: false
    });
  }

  try {
    return await callback();
  } finally {
    for (const [name, descriptor] of descriptors) {
      if (descriptor) {
        Object.defineProperty(globalThis, name, descriptor);
      } else {
        delete globalThis[name];
      }
    }
  }
}

test("JSON-LD expansion uses only the injected inert loader", async () => {
  const result = await withPoisonedNetworkGlobals(() =>
    runPhase0ExpansionProbe(document, contextDocument)
  );

  assert.deepEqual(result.expanded, expectedExpanded);
  assert.equal(result.quadCount, 2);
  assert.match(result.sha256, /^[0-9a-f]{64}$/u);
});

test("the inert loader rejects every unapproved context URL", async () => {
  await assert.rejects(
    runPhase0ExpansionProbe(
      { ...document, "@context": "https://invalid.example/context.jsonld" },
      contextDocument
    ),
    (error) => {
      assert.equal(error.name, "jsonld.InvalidUrl");
      assert.match(error.details.cause.message, /inert loader rejected URL/u);
      return true;
    }
  );
});
