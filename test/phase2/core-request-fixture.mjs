import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const encoder = new TextEncoder();

function bytes(text) {
  return encoder.encode(text);
}

export async function canonicalCoreRequest() {
  const [
    context,
    contract,
    canonicalProfile,
    source,
    request,
    carrierStyle,
    carrierNavigation,
  ] =
    await Promise.all(
      [
        "contexts/poc.context.jsonld",
        "contract/person-association-contract.jsonld",
        "profiles/two-slide-explainer.jsonld",
        "fixtures/relationship-42.jsonld",
        "fixtures/relationship-42-request.txt",
        "carrier/presentation.css",
        "carrier/navigation.js",
      ].map(async (path) => new Uint8Array(await readFile(resolve(repositoryRoot, path)))),
    );

  return {
    inputs: {
      context,
      contract,
      canonicalProfile,
      userProfile: new Uint8Array(canonicalProfile),
      source,
      request,
      carrierStyle,
      carrierNavigation,
    },
  };
}

export function cloneCoreRequest(coreRequest) {
  return {
    inputs: Object.fromEntries(
      Object.entries(coreRequest.inputs).map(([role, value]) => [
        role,
        value instanceof Uint8Array ? new Uint8Array(value) : value,
      ]),
    ),
  };
}

export function comparableResult(result) {
  return {
    ...result,
    errorReport:
      result.errorReport === undefined ? undefined : [...result.errorReport],
  };
}

export { bytes };
