import { fail } from "./core-failure.js";
import { PROFILE } from "./vocabulary.js";

function compactProfile(iri) {
  if (typeof iri !== "string" || !iri.startsWith(PROFILE)) {
    fail("INTERNAL_COMPILER_ERROR");
  }
  return `profile:${iri.slice(PROFILE.length)}`;
}

export function buildPresentation(narrative, profile) {
  if (
    profile.slideCount !== 2 ||
    narrative.hasUnit?.length !== profile.slideCount
  ) {
    fail("INTERNAL_COMPILER_ERROR");
  }
  const presentation = {
    "@context": "./poc.context.jsonld",
    "@id": "run:presentation",
    "@type": "projection:Presentation",
    profileRef: compactProfile(profile.id),
    hasDocumentContent: ["run:document-title-content"],
    hasSlide: [
      {
        "@id": "run:slide-1",
        "@type": "projection:Slide",
        sequence: 1,
        projectsNarrativeUnit: "run:narrative-unit-1",
        hasRegion: [
          {
            "@id": "run:slide-1-title-region",
            "@type": "projection:DeckTitleRegion",
            sequence: 1,
            projectsContent: "run:title-content-1",
          },
          {
            "@id": "run:slide-1-message-region",
            "@type": "projection:PrimaryMessageRegion",
            sequence: 2,
            projectsContent: "run:primary-message-content-1",
          },
          {
            "@id": "run:slide-1-navigation-region",
            "@type": "projection:NavigationRegion",
            sequence: 3,
            intent: "projection:Advance",
            buttonLabel: profile.advanceLabel,
            generatedBy: "rule:advance-navigation-from-profile-v1-0",
          },
        ],
      },
      {
        "@id": "run:slide-2",
        "@type": "projection:Slide",
        sequence: 2,
        projectsNarrativeUnit: "run:narrative-unit-2",
        hasRegion: [
          {
            "@id": "run:slide-2-title-region",
            "@type": "projection:SlideTitleRegion",
            sequence: 1,
            projectsContent: "run:slide-title-content-2",
          },
          {
            "@id": "run:slide-2-items-region",
            "@type": "projection:ItemCollectionRegion",
            sequence: 2,
            hasItem: [
              {
                "@id": "run:slide-2-item-region-1",
                "@type": "projection:ItemRegion",
                sequence: 1,
                projectsContent: "run:participant-item-content-1",
              },
              {
                "@id": "run:slide-2-item-region-2",
                "@type": "projection:ItemRegion",
                sequence: 2,
                projectsContent: "run:participant-item-content-2",
              },
            ],
          },
          {
            "@id": "run:slide-2-navigation-region",
            "@type": "projection:NavigationRegion",
            sequence: 3,
            intent: "projection:GoBack",
            buttonLabel: profile.backLabel,
            generatedBy: "rule:back-navigation-from-profile-v1-0",
          },
        ],
      },
    ],
  };
  if (
    presentation.hasSlide.length !== profile.slideCount ||
    presentation.hasSlide.some(
      (slide, index) =>
        slide.sequence !== index + 1 ||
        slide.hasRegion.some((region, regionIndex) =>
          region.sequence !== regionIndex + 1
        ),
    )
  ) {
    fail("INTERNAL_COMPILER_ERROR");
  }
  return presentation;
}
