import {
  publishArtifactSet,
  validateOutputTarget,
} from "../../src/host-node/publication.js";

import { phase3ArtifactSet } from "./publication-fixture.mjs";

const [outputPath, crashStep] = process.argv.slice(2);
const preparedOutput = await validateOutputTarget({
  outputPath,
  replace: true,
});

await publishArtifactSet({
  artifacts: phase3ArtifactSet("replacement"),
  onJournalStep(step) {
    if (step === crashStep) {
      process.exit(86);
    }
  },
  preparedOutput,
  replace: true,
});

process.exitCode = 87;
