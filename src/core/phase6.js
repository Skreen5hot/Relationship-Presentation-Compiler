import { buildNarrative } from "./build-narrative.js";
import { buildPresentation } from "./build-presentation.js";
import { runPhase5 } from "./phase5.js";
import { selectContent } from "./select-content.js";
import { serializeJsonLd } from "./stable-jsonld.js";

export async function runPhase6(parsedInputs) {
  const phase5 = await runPhase5(parsedInputs);
  const contentManifest = selectContent(phase5.selection);
  const narrative = buildNarrative(phase5.selection, phase5.profile);
  const presentation = buildPresentation(narrative, phase5.profile);

  return {
    ...phase5,
    artifacts: {
      ...phase5.artifacts,
      "04-content-manifest.jsonld": serializeJsonLd(contentManifest),
      "05-narrative.jsonld": serializeJsonLd(narrative),
      "06-presentation.jsonld": serializeJsonLd(presentation),
    },
    stages: {
      ...phase5.stages,
      contentManifest,
      narrative,
      presentation,
    },
  };
}
