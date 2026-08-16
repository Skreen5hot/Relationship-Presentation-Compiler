import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { parse } from "acorn";

const bannedCallNames = new Set([
  "eval",
  "clearImmediate",
  "clearInterval",
  "clearTimeout",
  "fetch",
  "queueMicrotask",
  "require",
  "setImmediate",
  "setInterval",
  "setTimeout"
]);
const bannedConstructorNames = new Set([
  "Date",
  "EventSource",
  "Function",
  "SharedWorker",
  "URL",
  "URLSearchParams",
  "WebSocket",
  "Worker",
  "XMLHttpRequest"
]);
const bannedMemberRoots = new Set([
  "Date",
  "Intl",
  "Buffer",
  "WebAssembly",
  "caches",
  "console",
  "document",
  "indexedDB",
  "localStorage",
  "navigator",
  "performance",
  "process",
  "self",
  "sessionStorage",
  "window"
]);

function memberRoot(node) {
  let current = node;
  while (current?.type === "MemberExpression") {
    current = current.object;
  }
  return current?.type === "Identifier" ? current.name : null;
}

function memberName(node) {
  if (node.computed && node.property.type === "Literal") {
    return String(node.property.value);
  }
  if (!node.computed && node.property.type === "Identifier") {
    return node.property.name;
  }
  return null;
}

function visit(node, violations) {
  if (!node || typeof node !== "object") {
    return;
  }

  if (node.type === "ImportExpression") {
    violations.push("dynamic import()");
  }
  if (
    node.type === "Identifier" &&
    ["__dirname", "__filename"].includes(node.name)
  ) {
    violations.push(node.name);
  }
  if (
    (node.type === "ImportDeclaration" ||
      node.type === "ExportAllDeclaration" ||
      node.type === "ExportNamedDeclaration") &&
    node.source?.value?.startsWith("node:")
  ) {
    violations.push(`Node builtin ${node.source.value}`);
  }
  if (node.type === "CallExpression" && node.callee.type === "Identifier") {
    if (bannedCallNames.has(node.callee.name)) {
      violations.push(`${node.callee.name}()`);
    }
    if (bannedConstructorNames.has(node.callee.name)) {
      violations.push(`${node.callee.name} called as a function`);
    }
  }
  if (node.type === "NewExpression" && node.callee.type === "Identifier") {
    if (bannedConstructorNames.has(node.callee.name)) {
      violations.push(`new ${node.callee.name}()`);
    }
  }
  if (node.type === "MemberExpression") {
    const root = memberRoot(node);
    const property = memberName(node);
    if (bannedMemberRoots.has(root)) {
      violations.push(`${root}.${property ?? "<computed>"}`);
    }
    if (root === "Math" && property === "random") {
      violations.push("Math.random");
    }
    if (root === "crypto" && ["getRandomValues", "randomUUID"].includes(property)) {
      violations.push(`crypto.${property}`);
    }
    if (
      root === "globalThis" &&
      [
        "Date",
        "EventSource",
        "Function",
        "Intl",
        "WebAssembly",
        "WebSocket",
        "Worker",
        "XMLHttpRequest",
        "document",
        "fetch",
        "navigator",
        "performance",
        "process",
        "window"
      ].includes(property)
    ) {
      violations.push(`globalThis.${property}`);
    }
    if (property === "localeCompare" || property?.startsWith("toLocale")) {
      violations.push(`locale-sensitive method ${property}`);
    }
  }

  for (const [key, value] of Object.entries(node)) {
    if (key === "start" || key === "end") {
      continue;
    }
    if (Array.isArray(value)) {
      for (const child of value) {
        visit(child, violations);
      }
    } else if (value?.type) {
      visit(value, violations);
    }
  }
}

export function assertPhase0CpsBundle(source, label = "core bundle") {
  const ast = parse(source, {
    allowHashBang: true,
    ecmaVersion: 2023,
    sourceType: "module"
  });
  const violations = [];
  visit(ast, violations);
  const uniqueViolations = [...new Set(violations)].sort();
  assert.deepEqual(
    uniqueViolations,
    [],
    `${label} contains CPS-prohibited syntax: ${uniqueViolations.join(", ")}`
  );
}

if (process.argv[1] && import.meta.url === new URL(`file:///${process.argv[1].replaceAll("\\", "/")}`).href) {
  const filename = process.argv[2];
  assert.ok(filename, "usage: node scripts/scan-phase0-cps.mjs <bundle>");
  assertPhase0CpsBundle(await readFile(filename, "utf8"), filename);
}
