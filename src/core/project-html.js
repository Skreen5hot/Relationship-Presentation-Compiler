import { fail } from "./core-failure.js";

function narrativeContent(narrative) {
  const content = [
    ...(narrative.hasDocumentContent ?? []),
    ...(narrative.hasUnit ?? []).flatMap((unit) => unit.hasContent ?? []),
  ];
  const byId = new Map(content.map((node) => [node["@id"], node]));
  if (content.length !== 6 || byId.size !== 6) {
    fail("INTERNAL_COMPILER_ERROR");
  }
  return byId;
}

function requireText(content, id) {
  const node = content.get(id);
  if (
    node?.["@type"] !== "projection:TextContent" ||
    typeof node.textValue !== "string"
  ) {
    fail("INTERNAL_COMPILER_ERROR");
  }
  return node.textValue;
}

function requirePresentation(presentation) {
  const firstSlide = presentation.hasSlide?.[0];
  const secondSlide = presentation.hasSlide?.[1];
  const firstRegions = firstSlide?.hasRegion;
  const secondRegions = secondSlide?.hasRegion;
  const items = secondRegions?.[1]?.hasItem;
  if (
    presentation["@id"] !== "run:presentation" ||
    presentation.hasSlide?.length !== 2 ||
    firstSlide?.["@id"] !== "run:slide-1" ||
    secondSlide?.["@id"] !== "run:slide-2" ||
    firstRegions?.length !== 3 ||
    secondRegions?.length !== 3 ||
    firstRegions[0]?.["@id"] !== "run:slide-1-title-region" ||
    firstRegions[1]?.["@id"] !== "run:slide-1-message-region" ||
    firstRegions[2]?.["@id"] !== "run:slide-1-navigation-region" ||
    secondRegions[0]?.["@id"] !== "run:slide-2-title-region" ||
    secondRegions[1]?.["@id"] !== "run:slide-2-items-region" ||
    secondRegions[2]?.["@id"] !== "run:slide-2-navigation-region" ||
    items?.length !== 2 ||
    items[0]?.["@id"] !== "run:slide-2-item-region-1" ||
    items[1]?.["@id"] !== "run:slide-2-item-region-2" ||
    firstRegions[2].intent !== "projection:Advance" ||
    secondRegions[2].intent !== "projection:GoBack" ||
    typeof firstRegions[2].buttonLabel !== "string" ||
    typeof secondRegions[2].buttonLabel !== "string"
  ) {
    fail("INTERNAL_COMPILER_ERROR");
  }
  return {
    advanceLabel: firstRegions[2].buttonLabel,
    backLabel: secondRegions[2].buttonLabel,
  };
}

function textNode(id, projectsMember, projectsValue, textNodeValue) {
  return {
    "@id": id,
    "@type": "html:TextNode",
    domOrder: 1,
    [projectsMember]: projectsValue,
    textNodeValue,
  };
}

export function projectHtmlDocument(narrative, presentation) {
  const content = narrativeContent(narrative);
  const navigation = requirePresentation(presentation);
  const documentTitle = requireText(content, "run:document-title-content");
  const deckTitle = requireText(content, "run:title-content-1");
  const message = requireText(content, "run:primary-message-content-1");
  const participantTitle = requireText(content, "run:slide-title-content-2");
  const firstParticipant = requireText(
    content,
    "run:participant-item-content-1",
  );
  const secondParticipant = requireText(
    content,
    "run:participant-item-content-2",
  );

  return {
    "@context": "./poc.context.jsonld",
    "@id": "run:html-document",
    "@type": "html:Document",
    generatedBy: "rule:html-document-projection-v1-0",
    hasChild: [
      {
        "@id": "run:html-doctype",
        "@type": "html:Doctype",
        domOrder: 1,
        doctypeName: "html",
        generatedBy: "rule:html5-doctype-v1-0",
      },
      {
        "@id": "run:html-root",
        "@type": "html:Element",
        domOrder: 2,
        elementName: "html",
        generatedBy: "rule:html-document-shell-v1-0",
        attribute: [
          {
            "@id": "run:html-root-lang",
            "@type": "html:Attribute",
            attributeName: "lang",
            attributeValue: "en",
            generatedBy: "rule:document-language-v1-0",
          },
        ],
        hasChild: [
          {
            "@id": "run:html-head",
            "@type": "html:Element",
            domOrder: 1,
            elementName: "head",
            generatedBy: "rule:html-document-shell-v1-0",
            hasChild: [
              {
                "@id": "run:html-meta-charset",
                "@type": "html:Element",
                domOrder: 1,
                elementName: "meta",
                generatedBy: "rule:utf8-meta-v1-0",
                attribute: [
                  {
                    "@id": "run:html-meta-charset-attribute",
                    "@type": "html:Attribute",
                    attributeName: "charset",
                    attributeValue: "utf-8",
                    generatedBy: "rule:utf8-meta-v1-0",
                  },
                ],
              },
              {
                "@id": "run:html-meta-viewport",
                "@type": "html:Element",
                domOrder: 2,
                elementName: "meta",
                generatedBy: "rule:viewport-meta-v1-0",
                attribute: [
                  {
                    "@id": "run:html-meta-viewport-name",
                    "@type": "html:Attribute",
                    attributeName: "name",
                    attributeValue: "viewport",
                    generatedBy: "rule:viewport-meta-v1-0",
                  },
                  {
                    "@id": "run:html-meta-viewport-content",
                    "@type": "html:Attribute",
                    attributeName: "content",
                    attributeValue: "width=device-width, initial-scale=1",
                    generatedBy: "rule:viewport-meta-v1-0",
                  },
                ],
              },
              {
                "@id": "run:html-title",
                "@type": "html:Element",
                domOrder: 3,
                elementName: "title",
                projectsContent: "run:document-title-content",
                hasChild: [
                  textNode(
                    "run:html-title-text",
                    "projectsContent",
                    "run:document-title-content",
                    documentTitle,
                  ),
                ],
              },
              {
                "@id": "run:html-style",
                "@type": "html:Element",
                domOrder: 4,
                elementName: "style",
                generatedBy: "rule:carrier-style-v1-0",
              },
            ],
          },
          {
            "@id": "run:html-body",
            "@type": "html:Element",
            domOrder: 2,
            elementName: "body",
            generatedBy: "rule:html-document-shell-v1-0",
            hasChild: [
              {
                "@id": "run:html-main",
                "@type": "html:Element",
                domOrder: 1,
                elementName: "main",
                projectsNode: "run:presentation",
                attribute: [
                  {
                    "@id": "run:html-main-aria-label",
                    "@type": "html:Attribute",
                    attributeName: "aria-label",
                    attributeValue: documentTitle,
                    projectsContent: "run:document-title-content",
                  },
                ],
                hasChild: [
                  {
                    "@id": "run:html-slide-1",
                    "@type": "html:Element",
                    domOrder: 1,
                    elementName: "section",
                    projectsNode: "run:slide-1",
                    hiddenInitially: false,
                    attribute: [
                      {
                        "@id": "run:html-slide-1-id",
                        "@type": "html:Attribute",
                        attributeName: "id",
                        attributeValue: "slide-1",
                        generatedBy: "rule:stable-dom-identifiers-v1-0",
                      },
                      {
                        "@id": "run:html-slide-1-labelledby",
                        "@type": "html:Attribute",
                        attributeName: "aria-labelledby",
                        attributeValue: "slide-1-title",
                        generatedBy: "rule:heading-reference-v1-0",
                      },
                    ],
                    hasChild: [
                      {
                        "@id": "run:html-slide-1-title",
                        "@type": "html:Element",
                        domOrder: 1,
                        elementName: "h1",
                        projectsNode: "run:slide-1-title-region",
                        attribute: [
                          {
                            "@id": "run:html-slide-1-title-id",
                            "@type": "html:Attribute",
                            attributeName: "id",
                            attributeValue: "slide-1-title",
                            generatedBy: "rule:stable-dom-identifiers-v1-0",
                          },
                          {
                            "@id": "run:html-slide-1-title-tabindex",
                            "@type": "html:Attribute",
                            attributeName: "tabindex",
                            attributeValue: "-1",
                            generatedBy: "rule:navigation-focus-target-v1-0",
                          },
                        ],
                        hasChild: [
                          textNode(
                            "run:html-slide-1-title-text",
                            "projectsContent",
                            "run:title-content-1",
                            deckTitle,
                          ),
                        ],
                      },
                      {
                        "@id": "run:html-slide-1-message",
                        "@type": "html:Element",
                        domOrder: 2,
                        elementName: "p",
                        projectsNode: "run:slide-1-message-region",
                        hasChild: [
                          textNode(
                            "run:html-slide-1-message-text",
                            "projectsContent",
                            "run:primary-message-content-1",
                            message,
                          ),
                        ],
                      },
                      {
                        "@id": "run:html-slide-1-next",
                        "@type": "html:Element",
                        domOrder: 3,
                        elementName: "button",
                        projectsNode: "run:slide-1-navigation-region",
                        htmlIntent: "advance",
                        attribute: [
                          {
                            "@id": "run:html-slide-1-next-type",
                            "@type": "html:Attribute",
                            attributeName: "type",
                            attributeValue: "button",
                            generatedBy: "rule:native-button-v1-0",
                          },
                          {
                            "@id": "run:html-slide-1-next-intent",
                            "@type": "html:Attribute",
                            attributeName: "data-intent",
                            attributeValue: "advance",
                            generatedBy:
                              "rule:navigation-intent-token-v1-0",
                            projectsNode: "run:slide-1-navigation-region",
                          },
                        ],
                        hasChild: [
                          textNode(
                            "run:html-slide-1-next-text",
                            "projectsNode",
                            "run:slide-1-navigation-region",
                            navigation.advanceLabel,
                          ),
                        ],
                      },
                    ],
                  },
                  {
                    "@id": "run:html-slide-2",
                    "@type": "html:Element",
                    domOrder: 2,
                    elementName: "section",
                    projectsNode: "run:slide-2",
                    hiddenInitially: true,
                    attribute: [
                      {
                        "@id": "run:html-slide-2-id",
                        "@type": "html:Attribute",
                        attributeName: "id",
                        attributeValue: "slide-2",
                        generatedBy: "rule:stable-dom-identifiers-v1-0",
                      },
                      {
                        "@id": "run:html-slide-2-labelledby",
                        "@type": "html:Attribute",
                        attributeName: "aria-labelledby",
                        attributeValue: "slide-2-title",
                        generatedBy: "rule:heading-reference-v1-0",
                      },
                      {
                        "@id": "run:html-slide-2-hidden",
                        "@type": "html:Attribute",
                        attributeName: "hidden",
                        attributeValue: "",
                        generatedBy: "rule:initial-slide-visibility-v1-0",
                      },
                    ],
                    hasChild: [
                      {
                        "@id": "run:html-slide-2-title",
                        "@type": "html:Element",
                        domOrder: 1,
                        elementName: "h2",
                        projectsNode: "run:slide-2-title-region",
                        attribute: [
                          {
                            "@id": "run:html-slide-2-title-id",
                            "@type": "html:Attribute",
                            attributeName: "id",
                            attributeValue: "slide-2-title",
                            generatedBy: "rule:stable-dom-identifiers-v1-0",
                          },
                          {
                            "@id": "run:html-slide-2-title-tabindex",
                            "@type": "html:Attribute",
                            attributeName: "tabindex",
                            attributeValue: "-1",
                            generatedBy: "rule:navigation-focus-target-v1-0",
                          },
                        ],
                        hasChild: [
                          textNode(
                            "run:html-slide-2-title-text",
                            "projectsContent",
                            "run:slide-title-content-2",
                            participantTitle,
                          ),
                        ],
                      },
                      {
                        "@id": "run:html-slide-2-list",
                        "@type": "html:Element",
                        domOrder: 2,
                        elementName: "ul",
                        projectsNode: "run:slide-2-items-region",
                        hasChild: [
                          {
                            "@id": "run:html-slide-2-item-1",
                            "@type": "html:Element",
                            domOrder: 1,
                            elementName: "li",
                            projectsNode: "run:slide-2-item-region-1",
                            hasChild: [
                              textNode(
                                "run:html-slide-2-item-1-text",
                                "projectsContent",
                                "run:participant-item-content-1",
                                firstParticipant,
                              ),
                            ],
                          },
                          {
                            "@id": "run:html-slide-2-item-2",
                            "@type": "html:Element",
                            domOrder: 2,
                            elementName: "li",
                            projectsNode: "run:slide-2-item-region-2",
                            hasChild: [
                              textNode(
                                "run:html-slide-2-item-2-text",
                                "projectsContent",
                                "run:participant-item-content-2",
                                secondParticipant,
                              ),
                            ],
                          },
                        ],
                      },
                      {
                        "@id": "run:html-slide-2-previous",
                        "@type": "html:Element",
                        domOrder: 3,
                        elementName: "button",
                        projectsNode: "run:slide-2-navigation-region",
                        htmlIntent: "back",
                        attribute: [
                          {
                            "@id": "run:html-slide-2-previous-type",
                            "@type": "html:Attribute",
                            attributeName: "type",
                            attributeValue: "button",
                            generatedBy: "rule:native-button-v1-0",
                          },
                          {
                            "@id": "run:html-slide-2-previous-intent",
                            "@type": "html:Attribute",
                            attributeName: "data-intent",
                            attributeValue: "back",
                            generatedBy:
                              "rule:navigation-intent-token-v1-0",
                            projectsNode: "run:slide-2-navigation-region",
                          },
                        ],
                        hasChild: [
                          textNode(
                            "run:html-slide-2-previous-text",
                            "projectsNode",
                            "run:slide-2-navigation-region",
                            navigation.backLabel,
                          ),
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                "@id": "run:html-script",
                "@type": "html:Element",
                domOrder: 2,
                elementName: "script",
                generatedBy: "rule:carrier-navigation-script-v1-0",
              },
            ],
          },
        ],
      },
    ],
  };
}
