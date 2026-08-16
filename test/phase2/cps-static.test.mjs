import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { assertCpsSource } from "../../scripts/scan-phase0-cps.mjs";

const repositoryRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../..",
);

test("the Phase 2 core bundle satisfies the closed CPS static policy", async () => {
  const source = await readFile(
    resolve(
      repositoryRoot,
      "build/phase2/relationship-presentation-core.skeleton.bundle.mjs",
    ),
    "utf8",
  );
  assert.doesNotThrow(() => assertCpsSource(source, "Phase 2 core bundle"));
});

test("the CPS scanner rejects every seeded prohibited capability class", () => {
  const prohibitedSources = [
    'import "node:fs";',
    "require('fs');",
    "const ambient = process;",
    "Buffer.from('x');",
    "console.log('x');",
    "fetch('https://example.test');",
    "new XMLHttpRequest();",
    "new WebSocket('wss://example.test');",
    "new EventSource('/events');",
    "Date.now();",
    "performance.now();",
    "Math.random();",
    "crypto.getRandomValues(new Uint8Array(1));",
    "crypto.randomUUID();",
    "Intl.Collator();",
    "'a'.localeCompare('b');",
    "'a'.toLocaleUpperCase();",
    "localStorage.getItem('x');",
    "setTimeout(() => {}, 0);",
    "queueMicrotask(() => {});",
    "eval('1');",
    "new Function('return 1');",
    "import('./dynamic.js');",
    "WebAssembly.compile(new Uint8Array());",
    "new Worker('./worker.js');",
    "const page = document;",
    "const globalWindow = window;",
    "const browser = navigator;",
    "const path = location;",
  ];

  for (const source of prohibitedSources) {
    assert.throws(() => assertCpsSource(source, source), assert.AssertionError);
  }
});
