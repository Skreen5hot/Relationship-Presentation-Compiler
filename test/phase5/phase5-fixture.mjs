import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { parseJsonBytes } from "../../src/core/json-scan.js";

const repositoryRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const encoder = new TextEncoder();

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

export async function phase5Inputs() {
  const [context, contract, profile, source, request] = await Promise.all(
    [
      "contexts/poc.context.jsonld",
      "contract/person-association-contract.jsonld",
      "profiles/two-slide-explainer.jsonld",
      "fixtures/relationship-42.jsonld",
      "fixtures/relationship-42-request.txt",
    ].map(async (path) =>
      new Uint8Array(await readFile(resolve(repositoryRoot, path))),
    ),
  );
  return {
    bytes: { context, contract, profile, request, source },
    parsed: {
      context: parseJsonBytes(context).value,
      contract: parseJsonBytes(contract).value,
      canonicalProfile: parseJsonBytes(profile).value,
      userProfile: parseJsonBytes(profile).value,
      source: parseJsonBytes(source).value,
      request: new TextDecoder("utf-8", { fatal: true }).decode(request),
    },
  };
}

export async function expectedPhase5Artifacts() {
  return Object.fromEntries(
    await Promise.all(
      [
        "01-request.jsonld",
        "02-resolution.jsonld",
        "03-contract-validation.jsonld",
      ].map(async (name) => [
        name,
        new Uint8Array(
          await readFile(resolve(repositoryRoot, "expected/relationship-42", name)),
        ),
      ]),
    ),
  );
}

export function sourceNode(source, suffix) {
  return source["@graph"].find((node) => node["@id"].endsWith(suffix));
}

export function encodeJson(value) {
  return encoder.encode(`${JSON.stringify(value, null, 2)}\n`);
}

export function clone(value) {
  return cloneJson(value);
}

export { repositoryRoot };
