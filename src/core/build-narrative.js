import { fail } from "./core-failure.js";
import {
  substituteAssociation,
  substituteRelationshipTitle,
} from "./template.js";
import { RULE } from "./vocabulary.js";

function compactRule(iri) {
  if (typeof iri !== "string" || !iri.startsWith(RULE)) {
    fail("INTERNAL_COMPILER_ERROR");
  }
  return `rule:${iri.slice(RULE.length)}`;
}

function sameValues(actual, expected) {
  return (
    Array.isArray(actual) &&
    actual.length === expected.length &&
    actual.every((value, index) => value === expected[index])
  );
}

function associationSources(template, first, second) {
  const sources = [];
  template.replace(/\{participant1\}|\{participant2\}/gu, (token) => {
    const source = token === "{participant1}" ? first.name : second.name;
    if (!sources.includes(source)) {
      sources.push(source);
    }
    return token;
  });
  return sources;
}

function expectedContent(selection, profile) {
  const first = selection.participants[0];
  const second = selection.participants[1];
  return [
    {
      id: "run:document-title-content",
      sequence: 1,
      role: "projection:DocumentTitleContent",
      text: substituteRelationshipTitle(
        profile.documentTitleTemplate,
        selection.designatorLabel,
      ),
      derivedFrom: [selection.designatorNode],
      generatedBy: "rule:document-title-from-profile-v1-0",
    },
    {
      id: "run:title-content-1",
      sequence: 1,
      role: "projection:DeckTitleContent",
      text: selection.designatorLabel,
      derivedFrom: [selection.designatorNode],
      generatedBy:
        "rule:relationship-title-from-resolving-designator-v1-0",
    },
    {
      id: "run:primary-message-content-1",
      sequence: 2,
      role: "projection:PrimaryMessageContent",
      text: substituteAssociation(
        profile.associationTemplate,
        first.label,
        second.label,
      ),
      derivedFrom: associationSources(profile.associationTemplate, first, second),
      generatedBy: compactRule(profile.overviewRule),
    },
    {
      id: "run:slide-title-content-2",
      sequence: 1,
      role: "projection:SlideTitleContent",
      text: profile.participantSlideTitle,
      generatedBy: "rule:participant-slide-title-from-profile-v1-0",
    },
    {
      id: "run:participant-item-content-1",
      sequence: 2,
      role: "projection:ParticipantItemContent",
      text: first.label,
      derivedFrom: [first.name],
      generatedBy: "rule:participant-name-label-v1-0",
    },
    {
      id: "run:participant-item-content-2",
      sequence: 3,
      role: "projection:ParticipantItemContent",
      text: second.label,
      derivedFrom: [second.name],
      generatedBy: "rule:participant-name-label-v1-0",
    },
  ];
}

export function validateNarrativeProvenance(narrative, selection, profile) {
  const units = narrative?.hasUnit;
  if (
    !Array.isArray(narrative?.hasDocumentContent) ||
    narrative.hasDocumentContent.length !== 1 ||
    !Array.isArray(units) ||
    units.length !== profile.slideCount ||
    units.some((unit, index) => unit.sequence !== index + 1)
  ) {
    fail("INTERNAL_COMPILER_ERROR");
  }

  const actualContent = [
    ...narrative.hasDocumentContent,
    ...units.flatMap((unit) =>
      Array.isArray(unit.hasContent) ? unit.hasContent : [],
    ),
  ];
  const expected = expectedContent(selection, profile);
  if (actualContent.length !== expected.length) {
    fail("INTERNAL_COMPILER_ERROR");
  }
  const byId = new Map(actualContent.map((content) => [content?.["@id"], content]));
  if (byId.size !== expected.length) {
    fail("INTERNAL_COMPILER_ERROR");
  }

  for (const record of expected) {
    const content = byId.get(record.id);
    const hasDerivedFrom = Object.prototype.hasOwnProperty.call(
      content ?? {},
      "derivedFrom",
    );
    if (
      content?.["@type"] !== "projection:TextContent" ||
      content.sequence !== record.sequence ||
      content.contentRole !== record.role ||
      content.textValue !== record.text ||
      content.generatedBy !== record.generatedBy ||
      (record.derivedFrom === undefined
        ? hasDerivedFrom
        : !hasDerivedFrom ||
          !sameValues(content.derivedFrom, record.derivedFrom) ||
          content.derivedFrom.length === 0)
    ) {
      fail("INTERNAL_COMPILER_ERROR");
    }
  }
}

function contentNode(record) {
  const node = {
    "@id": record.id,
    "@type": "projection:TextContent",
    sequence: record.sequence,
    contentRole: record.role,
    textValue: record.text,
  };
  if (record.derivedFrom !== undefined) {
    node.derivedFrom = record.derivedFrom;
  }
  node.generatedBy = record.generatedBy;
  return node;
}

export function buildNarrative(selection, profile) {
  if (
    profile.slideCount !== 2 ||
    selection.participants.length !== 2 ||
    typeof selection.designatorLabel !== "string" ||
    !profile.documentTitleTemplate.includes("{relationshipTitle}") ||
    !profile.associationTemplate.includes("{participant1}") ||
    !profile.associationTemplate.includes("{participant2}")
  ) {
    fail("INTERNAL_COMPILER_ERROR");
  }
  const content = expectedContent(selection, profile).map(contentNode);
  const narrative = {
    "@context": "./poc.context.jsonld",
    "@id": "run:narrative",
    "@type": "projection:Narrative",
    hasDocumentContent: [content[0]],
    hasUnit: [
      {
        "@id": "run:narrative-unit-1",
        "@type": "projection:NarrativeUnit",
        sequence: 1,
        hasContent: [content[1], content[2]],
      },
      {
        "@id": "run:narrative-unit-2",
        "@type": "projection:NarrativeUnit",
        sequence: 2,
        hasContent: [content[3], content[4], content[5]],
      },
    ],
  };
  validateNarrativeProvenance(narrative, selection, profile);
  return narrative;
}
