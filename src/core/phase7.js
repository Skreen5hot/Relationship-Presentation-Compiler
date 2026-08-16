import { buildDemoHtml } from "./build-demo.js";
import { runPhase6 } from "./phase6.js";
import { projectHtmlDocument } from "./project-html.js";
import { renderHtmlDocument } from "./render-html.js";
import { revalidateHtmlSubset } from "./revalidate-html.js";
import { serializeJsonLd } from "./stable-jsonld.js";

export async function runPhase7(parsedInputs, options = {}) {
  const phase6 = await runPhase6(parsedInputs);
  const htmlProjection = projectHtmlDocument(
    phase6.stages.narrative,
    phase6.stages.presentation,
  );
  const presentationHtml = renderHtmlDocument(
    htmlProjection,
    parsedInputs.carrierStyle,
    parsedInputs.carrierNavigation,
  );
  revalidateHtmlSubset({
    bytes: presentationHtml,
    carrierNavigation: parsedInputs.carrierNavigation,
    carrierStyle: parsedInputs.carrierStyle,
    htmlProjection,
    narrative: phase6.stages.narrative,
    presentation: phase6.stages.presentation,
  });
  const htmlProjectionBytes = serializeJsonLd(htmlProjection);
  const artifacts = {
    ...phase6.artifacts,
    "07-html-projection.jsonld": htmlProjectionBytes,
    "presentation.html": presentationHtml,
  };
  const demoHtml =
    options.includeDemo === false
      ? undefined
      : buildDemoHtml(phase6.stages.narrative, presentationHtml);

  return {
    ...phase6,
    artifacts:
      demoHtml === undefined ? artifacts : { ...artifacts, "demo.html": demoHtml },
    stages: { ...phase6.stages, htmlProjection },
  };
}
