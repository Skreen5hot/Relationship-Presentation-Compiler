import { fail } from "./core-failure.js";
import { escapeHtmlAttribute, escapeHtmlText } from "./escape-html.js";
import { ALLOWED_ATTRIBUTES, ALLOWED_ELEMENTS } from "./render-html.js";

const RAW_ELEMENTS = new Set(["style", "script"]);
const VOID_ELEMENTS = new Set(["meta"]);
const REFERENCES = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
};
const INTENT_TOKENS = {
  "projection:Advance": "advance",
  "projection:GoBack": "back",
};

function invalid() {
  fail("INTERNAL_COMPILER_ERROR");
}

function decodeReferences(value) {
  let decoded = "";
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (character === "<" || character === ">") {
      invalid();
    }
    if (character !== "&") {
      decoded += character;
      continue;
    }
    const reference = Object.keys(REFERENCES).find((candidate) =>
      value.startsWith(candidate, index)
    );
    if (reference === undefined) {
      invalid();
    }
    decoded += REFERENCES[reference];
    index += reference.length - 1;
  }
  return decoded;
}

function parseOpening(opening) {
  const firstSpace = opening.indexOf(" ");
  const tag = firstSpace === -1 ? opening : opening.slice(0, firstSpace);
  if (!ALLOWED_ELEMENTS.has(tag)) {
    invalid();
  }
  let remaining = firstSpace === -1 ? "" : opening.slice(firstSpace);
  const attributes = [];
  const names = new Set();
  while (remaining.length > 0) {
    if (remaining[0] !== " ") {
      invalid();
    }
    remaining = remaining.slice(1);
    const match = /^[a-z][a-z-]*/u.exec(remaining);
    if (match === null) {
      invalid();
    }
    const name = match[0];
    if (!ALLOWED_ATTRIBUTES.has(name) || names.has(name)) {
      invalid();
    }
    names.add(name);
    remaining = remaining.slice(name.length);
    if (name === "hidden" && (remaining === "" || remaining[0] === " ")) {
      attributes.push({ name, value: "", valueless: true });
      continue;
    }
    if (!remaining.startsWith('="')) {
      invalid();
    }
    const closingQuote = remaining.indexOf('"', 2);
    if (closingQuote === -1) {
      invalid();
    }
    const encodedValue = remaining.slice(2, closingQuote);
    attributes.push({
      name,
      value: decodeReferences(encodedValue),
      valueless: false,
    });
    remaining = remaining.slice(closingQuote + 1);
  }
  return { attributes, tag };
}

function carrierSafe(value, elementName) {
  return !value.toLowerCase().includes(`</${elementName}`);
}

function createParser(input, carrierStyle, carrierNavigation) {
  let position = 0;

  function takeLine() {
    const end = input.indexOf("\n", position);
    if (end === -1) {
      invalid();
    }
    const line = input.slice(position, end);
    position = end + 1;
    return line;
  }

  function parseElement(depth) {
    const indentation = "  ".repeat(depth);
    const line = takeLine();
    if (!line.startsWith(`${indentation}<`)) {
      invalid();
    }
    const markup = line.slice(indentation.length);
    const openingEnd = markup.indexOf(">");
    if (openingEnd < 2 || markup[1] === "/" || markup[1] === "!") {
      invalid();
    }
    const { attributes, tag } = parseOpening(markup.slice(1, openingEnd));
    const tail = markup.slice(openingEnd + 1);
    const element = { kind: "element", tag, attributes, children: [] };

    if (VOID_ELEMENTS.has(tag)) {
      if (tail !== "") {
        invalid();
      }
      return element;
    }
    if (RAW_ELEMENTS.has(tag)) {
      if (tail !== "") {
        invalid();
      }
      const payload = tag === "style" ? carrierStyle : carrierNavigation;
      if (
        typeof payload !== "string" ||
        !payload.endsWith("\n") ||
        !carrierSafe(payload, tag) ||
        !input.startsWith(payload, position)
      ) {
        invalid();
      }
      position += payload.length;
      if (takeLine() !== `${indentation}</${tag}>`) {
        invalid();
      }
      element.raw = payload;
      return element;
    }

    if (tail !== "") {
      const closing = `</${tag}>`;
      if (!tail.endsWith(closing)) {
        invalid();
      }
      const encodedText = tail.slice(0, -closing.length);
      element.children.push({
        kind: "text",
        value: decodeReferences(encodedText),
      });
      return element;
    }

    const closingLine = `${indentation}</${tag}>`;
    while (!input.startsWith(`${closingLine}\n`, position)) {
      if (position >= input.length) {
        invalid();
      }
      element.children.push(parseElement(depth + 1));
    }
    if (takeLine() !== closingLine || element.children.length === 0) {
      invalid();
    }
    return element;
  }

  return {
    parse() {
      if (takeLine() !== "<!DOCTYPE html>") {
        invalid();
      }
      const parsedDocument = {
        kind: "document",
        children: [
          { kind: "doctype", name: "html" },
          parseElement(0),
        ],
      };
      if (position !== input.length) {
        invalid();
      }
      return parsedDocument;
    },
  };
}

function serializeAttributes(attributes) {
  return attributes
    .map((attribute) =>
      attribute.valueless
        ? ` ${attribute.name}`
        : ` ${attribute.name}="${escapeHtmlAttribute(attribute.value)}"`
    )
    .join("");
}

function serializeParsedElement(element, depth) {
  const indentation = "  ".repeat(depth);
  const opening = `<${element.tag}${serializeAttributes(element.attributes)}>`;
  if (VOID_ELEMENTS.has(element.tag)) {
    return `${indentation}${opening}\n`;
  }
  if (RAW_ELEMENTS.has(element.tag)) {
    return `${indentation}${opening}\n${element.raw}${indentation}</${
      element.tag
    }>\n`;
  }
  if (element.children.length === 1 && element.children[0].kind === "text") {
    return `${indentation}${opening}${escapeHtmlText(
      element.children[0].value,
    )}</${element.tag}>\n`;
  }
  let result = `${indentation}${opening}\n`;
  for (const child of element.children) {
    if (child.kind !== "element") {
      invalid();
    }
    result += serializeParsedElement(child, depth + 1);
  }
  return `${result}${indentation}</${element.tag}>\n`;
}

function serializeParsedDocument(parsedDocument) {
  if (
    parsedDocument.kind !== "document" ||
    parsedDocument.children.length !== 2 ||
    parsedDocument.children[0].kind !== "doctype" ||
    parsedDocument.children[0].name !== "html"
  ) {
    invalid();
  }
  return `<!DOCTYPE html>\n${serializeParsedElement(
    parsedDocument.children[1],
    0,
  )}`;
}

function graphAttributes(node) {
  return (node.attribute ?? []).map((attribute) => ({
    name: attribute.attributeName,
    value: attribute.attributeValue,
    valueless:
      attribute.attributeName === "hidden" && attribute.attributeValue === "",
  }));
}

function sameAttributes(actual, expected) {
  return (
    actual.length === expected.length &&
    actual.every(
      (attribute, index) =>
        attribute.name === expected[index].name &&
        attribute.value === expected[index].value &&
        attribute.valueless === expected[index].valueless,
    )
  );
}

function compareParsedElement(parsed, projected, carrierStyle, carrierNavigation) {
  if (
    parsed.kind !== "element" ||
    projected?.["@type"] !== "html:Element" ||
    parsed.tag !== projected.elementName ||
    !sameAttributes(parsed.attributes, graphAttributes(projected))
  ) {
    invalid();
  }
  if (RAW_ELEMENTS.has(parsed.tag)) {
    const carrier = parsed.tag === "style" ? carrierStyle : carrierNavigation;
    if (parsed.raw !== carrier || projected.hasChild !== undefined) {
      invalid();
    }
    return;
  }
  const projectedChildren = projected.hasChild ?? [];
  if (parsed.children.length !== projectedChildren.length) {
    invalid();
  }
  for (let index = 0; index < parsed.children.length; index += 1) {
    const parsedChild = parsed.children[index];
    const projectedChild = projectedChildren[index];
    if (parsedChild.kind === "text") {
      if (
        projectedChild?.["@type"] !== "html:TextNode" ||
        parsedChild.value !== projectedChild.textNodeValue
      ) {
        invalid();
      }
    } else {
      compareParsedElement(
        parsedChild,
        projectedChild,
        carrierStyle,
        carrierNavigation,
      );
    }
  }
}

function visitProjection(node, visitor) {
  visitor(node);
  for (const attribute of node.attribute ?? []) {
    visitor(attribute, node);
  }
  for (const child of node.hasChild ?? []) {
    visitProjection(child, visitor);
  }
}

function contentMap(narrative) {
  const content = [
    ...(narrative.hasDocumentContent ?? []),
    ...(narrative.hasUnit ?? []).flatMap((unit) => unit.hasContent ?? []),
  ];
  return new Map(content.map((node) => [node["@id"], node.textValue]));
}

function presentationMap(presentation) {
  const result = new Map([[presentation["@id"], presentation]]);
  for (const slide of presentation.hasSlide ?? []) {
    result.set(slide["@id"], slide);
    for (const region of slide.hasRegion ?? []) {
      result.set(region["@id"], region);
      for (const item of region.hasItem ?? []) {
        result.set(item["@id"], item);
      }
    }
  }
  return result;
}

function validateProjectionGraph(htmlProjection, narrative, presentation) {
  const ids = new Set();
  const domIds = new Set();
  const labelledBy = [];
  const content = contentMap(narrative);
  const presentationNodes = presentationMap(presentation);
  const counts = { h1: 0, h2: 0, main: 0, script: 0 };

  visitProjection(htmlProjection, (node, parent) => {
    if (typeof node?.["@id"] !== "string" || ids.has(node["@id"])) {
      invalid();
    }
    ids.add(node["@id"]);
    if (node["@type"] === "html:Element") {
      if (!ALLOWED_ELEMENTS.has(node.elementName)) {
        invalid();
      }
      if (counts[node.elementName] !== undefined) {
        counts[node.elementName] += 1;
      }
      const children = node.hasChild ?? [];
      if (children.some((child, index) => child.domOrder !== index + 1)) {
        invalid();
      }
      const hidden = (node.attribute ?? []).some(
        (attribute) => attribute.attributeName === "hidden",
      );
      if (
        node.hiddenInitially !== undefined &&
        node.hiddenInitially !== hidden
      ) {
        invalid();
      }
      if (
        (node.projectsContent !== undefined &&
          !content.has(node.projectsContent)) ||
        (node.projectsNode !== undefined &&
          !presentationNodes.has(node.projectsNode)) ||
        (node.projectsNode === "run:slide-1" && node.hiddenInitially !== false) ||
        (node.projectsNode === "run:slide-2" && node.hiddenInitially !== true)
      ) {
        invalid();
      }
    }
    if (node["@type"] === "html:Attribute") {
      if (
        !ALLOWED_ATTRIBUTES.has(node.attributeName) ||
        typeof node.attributeValue !== "string"
      ) {
        invalid();
      }
      if (node.attributeName === "id") {
        if (domIds.has(node.attributeValue)) {
          invalid();
        }
        domIds.add(node.attributeValue);
      } else if (node.attributeName === "aria-labelledby") {
        labelledBy.push(node.attributeValue);
      } else if (
        node.attributeName === "tabindex" &&
        node.attributeValue !== "-1"
      ) {
        invalid();
      } else if (node.attributeName === "data-intent") {
        const region = presentationNodes.get(node.projectsNode);
        const expected = INTENT_TOKENS[region?.intent];
        if (
          expected === undefined ||
          node.attributeValue !== expected ||
          parent?.htmlIntent !== expected
        ) {
          invalid();
        }
      }
      if (
        node.projectsContent !== undefined &&
        node.attributeValue !== content.get(node.projectsContent)
      ) {
        invalid();
      }
    }
    if (node["@type"] === "html:TextNode") {
      if (
        typeof node.textNodeValue !== "string" ||
        (node.projectsContent !== undefined &&
          node.textNodeValue !== content.get(node.projectsContent))
      ) {
        invalid();
      }
      if (
        node.projectsContent === undefined &&
        node.projectsNode === undefined
      ) {
        invalid();
      }
      if (node.projectsNode !== undefined) {
        const region = presentationNodes.get(node.projectsNode);
        if (node.textNodeValue !== region?.buttonLabel) {
          invalid();
        }
      }
    }
  });

  if (
    counts.main !== 1 ||
    counts.h1 !== 1 ||
    counts.h2 !== 1 ||
    counts.script !== 1 ||
    labelledBy.some((reference) => !domIds.has(reference))
  ) {
    invalid();
  }
}

function bytesEqual(left, right) {
  return (
    left.byteLength === right.byteLength &&
    left.every((value, index) => value === right[index])
  );
}

export function revalidateHtmlSubset({
  bytes,
  carrierNavigation,
  carrierStyle,
  htmlProjection,
  narrative,
  presentation,
}) {
  if (
    Object.prototype.toString.call(bytes) !== "[object Uint8Array]" ||
    !carrierSafe(carrierStyle, "style") ||
    !carrierSafe(carrierNavigation, "script")
  ) {
    invalid();
  }
  let source;
  try {
    source = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    invalid();
  }
  const parsed = createParser(
    source,
    carrierStyle,
    carrierNavigation,
  ).parse();
  if (
    htmlProjection?.["@type"] !== "html:Document" ||
    htmlProjection.hasChild?.length !== 2 ||
    htmlProjection.hasChild[0]?.["@type"] !== "html:Doctype" ||
    htmlProjection.hasChild[0].doctypeName !== "html" ||
    htmlProjection.hasChild[0].domOrder !== 1 ||
    htmlProjection.hasChild[1]?.domOrder !== 2
  ) {
    invalid();
  }
  compareParsedElement(
    parsed.children[1],
    htmlProjection.hasChild[1],
    carrierStyle,
    carrierNavigation,
  );
  validateProjectionGraph(htmlProjection, narrative, presentation);
  const roundTrip = new TextEncoder().encode(serializeParsedDocument(parsed));
  if (!bytesEqual(bytes, roundTrip)) {
    invalid();
  }
  return true;
}
