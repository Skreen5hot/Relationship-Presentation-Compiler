import { fail } from "./core-failure.js";
import { escapeHtmlAttribute, escapeHtmlText } from "./escape-html.js";

const ALLOWED_ELEMENTS = new Set([
  "html",
  "head",
  "meta",
  "title",
  "style",
  "body",
  "main",
  "section",
  "h1",
  "h2",
  "p",
  "ul",
  "li",
  "button",
  "script",
]);
const ALLOWED_ATTRIBUTES = new Set([
  "lang",
  "charset",
  "name",
  "content",
  "aria-label",
  "id",
  "aria-labelledby",
  "tabindex",
  "hidden",
  "type",
  "data-intent",
]);

function renderAttributes(attributes = []) {
  const names = new Set();
  let rendered = "";
  for (const attribute of attributes) {
    const name = attribute?.attributeName;
    const value = attribute?.attributeValue;
    if (
      attribute?.["@type"] !== "html:Attribute" ||
      !ALLOWED_ATTRIBUTES.has(name) ||
      names.has(name) ||
      typeof value !== "string"
    ) {
      fail("INTERNAL_COMPILER_ERROR");
    }
    names.add(name);
    if (name === "hidden" && value === "") {
      rendered += " hidden";
    } else {
      rendered += ` ${name}="${escapeHtmlAttribute(value)}"`;
    }
  }
  return rendered;
}

function renderElement(node, depth, carrierStyle, carrierNavigation) {
  const name = node?.elementName;
  if (node?.["@type"] !== "html:Element" || !ALLOWED_ELEMENTS.has(name)) {
    fail("INTERNAL_COMPILER_ERROR");
  }
  const indentation = "  ".repeat(depth);
  const opening = `<${name}${renderAttributes(node.attribute)}>`;
  if (name === "meta") {
    if (node.hasChild !== undefined) {
      fail("INTERNAL_COMPILER_ERROR");
    }
    return `${indentation}${opening}\n`;
  }
  if (name === "style" || name === "script") {
    if (node.hasChild !== undefined || node.attribute !== undefined) {
      fail("INTERNAL_COMPILER_ERROR");
    }
    const payload = name === "style" ? carrierStyle : carrierNavigation;
    if (typeof payload !== "string" || !payload.endsWith("\n")) {
      fail("INTERNAL_COMPILER_ERROR");
    }
    return `${indentation}${opening}\n${payload}${indentation}</${name}>\n`;
  }

  const children = node.hasChild;
  if (!Array.isArray(children) || children.length === 0) {
    fail("INTERNAL_COMPILER_ERROR");
  }
  if (
    children.length === 1 &&
    children[0]?.["@type"] === "html:TextNode"
  ) {
    if (typeof children[0].textNodeValue !== "string") {
      fail("INTERNAL_COMPILER_ERROR");
    }
    return `${indentation}${opening}${escapeHtmlText(
      children[0].textNodeValue,
    )}</${name}>\n`;
  }

  let rendered = `${indentation}${opening}\n`;
  for (const child of children) {
    rendered += renderElement(
      child,
      depth + 1,
      carrierStyle,
      carrierNavigation,
    );
  }
  return `${rendered}${indentation}</${name}>\n`;
}

export function renderHtmlDocument(
  htmlProjection,
  carrierStyle,
  carrierNavigation,
) {
  const children = htmlProjection?.hasChild;
  if (
    htmlProjection?.["@type"] !== "html:Document" ||
    !Array.isArray(children) ||
    children.length !== 2 ||
    children[0]?.["@type"] !== "html:Doctype" ||
    children[0].doctypeName !== "html"
  ) {
    fail("INTERNAL_COMPILER_ERROR");
  }
  const rendered = `<!DOCTYPE html>\n${renderElement(
    children[1],
    0,
    carrierStyle,
    carrierNavigation,
  )}`;
  return new TextEncoder().encode(rendered);
}

export { ALLOWED_ATTRIBUTES, ALLOWED_ELEMENTS };
