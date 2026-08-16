import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { verifyDistributionArtifacts } from "../core/verify-distribution.js";
import { buildNodeHostFailure } from "./failure-surface.js";
import {
  assembleCoreRequest,
  InputAcquisitionError,
  validateCompilationInputs,
} from "./input-acquisition.js";
import { HostLockError, verifyNodeHostLocks } from "./locks.js";
import {
  ARTIFACT_FILENAMES,
  PublicationError,
  publishArtifactSet,
  validateOutputTarget,
  writeDetachedFailureReport,
} from "./publication.js";
import { runSupervisedCore } from "./supervisor.js";

function hostFailure(code) {
  return buildNodeHostFailure({ code, violations: [] });
}

function governingCode(error) {
  if (
    error instanceof HostLockError ||
    error instanceof InputAcquisitionError ||
    error instanceof PublicationError
  ) {
    return error.code;
  }
  return "INTERNAL_COMPILER_ERROR";
}

async function verifyPublishedOutput(preparedOutput) {
  const artifacts = Object.fromEntries(
    await Promise.all(
      ARTIFACT_FILENAMES.map(async (name) => [
        name,
        new Uint8Array(await readFile(resolve(preparedOutput.outputPath, name))),
      ]),
    ),
  );
  await verifyDistributionArtifacts(artifacts);
}

export async function runNodeCompilation(
  options,
  {
    loadOptions,
    lockEvidence,
    lockOptions,
    packageRoot,
    supervision,
  } = {},
) {
  const root = resolve(packageRoot ?? ".");
  let preparedOutput;
  try {
    const evidence =
      lockEvidence ??
      (await verifyNodeHostLocks({ packageRoot: root, ...lockOptions }));

    const defaultMode = options.defaultMode === true;
    const sourcePath = defaultMode
      ? resolve(root, "fixtures/relationship-42.jsonld")
      : options.source;
    const requestPath = defaultMode
      ? resolve(root, "fixtures/relationship-42-request.txt")
      : options.request;
    const profilePath = defaultMode
      ? resolve(root, "profiles/two-slide-explainer.jsonld")
      : options.profile;
    const outputPath = defaultMode ? resolve(root, "dist") : options.out;

    const descriptors = await validateCompilationInputs({
      artifactLock: evidence.artifactLock,
      fixedEvidencePaths: evidence.fixedEvidencePaths,
      packageRoot: root,
      profilePath,
      requestPath,
      sourcePath,
      userInputsFixed: defaultMode,
    });
    preparedOutput = await validateOutputTarget({
      defaultOutput: defaultMode,
      inputPaths: Object.entries(descriptors)
        .filter(([role]) => !role.startsWith("evidence-"))
        .map(([, { realPath }]) => realPath),
      outputPath,
      packageRoot: root,
      replace: options.replace === true,
    });

    const coreRequest = await assembleCoreRequest(descriptors, loadOptions);
    const result = await runSupervisedCore(coreRequest, supervision);
    if (result.status === "error") {
      await writeDetachedFailureReport(preparedOutput, result.errorReport);
      return result;
    }

    await publishArtifactSet({
      artifacts: result.artifacts,
      preparedOutput,
      replace: options.replace === true,
    });
    await verifyPublishedOutput(preparedOutput);
    return result;
  } catch (error) {
    const result = hostFailure(governingCode(error));
    const reportTarget = error?.preparedOutput ?? preparedOutput;
    if (reportTarget !== undefined) {
      await writeDetachedFailureReport(reportTarget, result.errorReport);
    }
    return result;
  }
}
