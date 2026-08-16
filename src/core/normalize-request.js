import { fail } from "./core-failure.js";
import {
  isCriticalStringValid,
  normalizeCriticalString,
  scalarLength,
} from "./unicode.js";

const PREFIX = "Create a two-slide presentation explaining ";
const SUFFIX = " to a general audience.";

export function normalizeRequest(requestText) {
  let text = requestText;
  if (text.endsWith("\r\n")) {
    text = text.slice(0, -2);
  } else if (text.endsWith("\n")) {
    text = text.slice(0, -1);
  }

  if (!text.startsWith(PREFIX) || !text.endsWith(SUFFIX)) {
    fail("REQUEST_GRAMMAR_MISMATCH");
  }
  const designator = normalizeCriticalString(
    text.slice(PREFIX.length, text.length - SUFFIX.length),
  );
  if (designator.length === 0) {
    fail("REQUEST_GRAMMAR_MISMATCH");
  }
  const length = scalarLength(designator);
  if (length === null || !isCriticalStringValid(designator)) {
    fail("INVALID_CRITICAL_STRING");
  }
  if (length > 256) {
    fail("DESIGNATOR_TOO_LONG");
  }
  return designator;
}
