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
const bannedIdentifiers = new Set([
  "Buffer",
  "Date",
  "EventSource",
  "Function",
  "Intl",
  "SharedWorker",
  "URL",
  "URLSearchParams",
  "WebAssembly",
  "WebSocket",
  "Worker",
  "XMLHttpRequest",
  "__dirname",
  "__filename",
  "caches",
  "clearImmediate",
  "clearInterval",
  "clearTimeout",
  "console",
  "document",
  "eval",
  "fetch",
  "indexedDB",
  "localStorage",
  "location",
  "navigator",
  "onmessage",
  "performance",
  "postMessage",
  "process",
  "queueMicrotask",
  "require",
  "self",
  "sessionStorage",
  "setImmediate",
  "setInterval",
  "setTimeout",
  "window"
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

function collectPatternNames(pattern, names) {
  if (!pattern) {
    return;
  }
  if (pattern.type === "Identifier") {
    names.add(pattern.name);
  } else if (pattern.type === "RestElement") {
    collectPatternNames(pattern.argument, names);
  } else if (pattern.type === "AssignmentPattern") {
    collectPatternNames(pattern.left, names);
  } else if (pattern.type === "ArrayPattern") {
    for (const element of pattern.elements) {
      collectPatternNames(element, names);
    }
  } else if (pattern.type === "ObjectPattern") {
    for (const property of pattern.properties) {
      collectPatternNames(property.value ?? property.argument, names);
    }
  }
}

function collectDeclaredNames(node, names) {
  if (!node || typeof node !== "object") {
    return;
  }
  if (node.type === "VariableDeclarator") {
    collectPatternNames(node.id, names);
  } else if (
    node.type === "FunctionDeclaration" ||
    node.type === "FunctionExpression" ||
    node.type === "ArrowFunctionExpression"
  ) {
    if (node.id) {
      collectPatternNames(node.id, names);
    }
    for (const parameter of node.params) {
      collectPatternNames(parameter, names);
    }
  } else if (node.type === "ClassDeclaration" && node.id) {
    collectPatternNames(node.id, names);
  } else if (node.type === "CatchClause") {
    collectPatternNames(node.param, names);
  } else if (node.type === "ImportSpecifier") {
    collectPatternNames(node.local, names);
  }

  for (const [key, value] of Object.entries(node)) {
    if (key === "start" || key === "end") {
      continue;
    }
    if (Array.isArray(value)) {
      for (const child of value) {
        collectDeclaredNames(child, names);
      }
    } else if (value?.type) {
      collectDeclaredNames(value, names);
    }
  }
}

function isNonReferenceIdentifier(node, parent, parentKey) {
  if (!parent) {
    return false;
  }
  if (
    parent.type === "MemberExpression" &&
    parentKey === "property" &&
    !parent.computed
  ) {
    return true;
  }
  if (
    (parent.type === "Property" || parent.type === "MethodDefinition") &&
    parentKey === "key" &&
    !parent.computed &&
    !parent.shorthand
  ) {
    return true;
  }
  if (
    parent.type === "BinaryExpression" &&
    parent.operator === "instanceof" &&
    parent.right === node
  ) {
    return true;
  }
  return false;
}

function visit(node, violations, declaredNames, parent = null, parentKey = null) {
  if (!node || typeof node !== "object") {
    return;
  }

  if (node.type === "ImportExpression") {
    violations.push("dynamic import()");
  }
  if (
    node.type === "Identifier" &&
    bannedIdentifiers.has(node.name) &&
    !declaredNames.has(node.name) &&
    !isNonReferenceIdentifier(node, parent, parentKey)
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
      root === "crypto" &&
      property !== "subtle" &&
      property !== "digest" &&
      !["getRandomValues", "randomUUID"].includes(property)
    ) {
      violations.push(`crypto.${property ?? "<computed>"}`);
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
        visit(child, violations, declaredNames, node, key);
      }
    } else if (value?.type) {
      visit(value, violations, declaredNames, node, key);
    }
  }
}

export function assertCpsSource(source, label = "core bundle") {
  const ast = parse(source, {
    allowHashBang: true,
    ecmaVersion: 2023,
    sourceType: "module"
  });
  const violations = [];
  const declaredNames = new Set();
  collectDeclaredNames(ast, declaredNames);
  visit(ast, violations, declaredNames);
  const uniqueViolations = [...new Set(violations)].sort();
  assert.deepEqual(
    uniqueViolations,
    [],
    `${label} contains CPS-prohibited syntax: ${uniqueViolations.join(", ")}`
  );
}

export const assertPhase0CpsBundle = assertCpsSource;

if (process.argv[1] && import.meta.url === new URL(`file:///${process.argv[1].replaceAll("\\", "/")}`).href) {
  const filename = process.argv[2];
  assert.ok(filename, "usage: node scripts/scan-phase0-cps.mjs <bundle>");
  assertPhase0CpsBundle(await readFile(filename, "utf8"), filename);
}
