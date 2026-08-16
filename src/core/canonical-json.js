const encoder = new TextEncoder();

function serialize(value) {
  if (
    value === null ||
    typeof value === "boolean" ||
    typeof value === "string"
  ) {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new TypeError(
        "Canonical manifest numbers must be non-negative safe integers",
      );
    }
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(serialize).join(",")}]`;
  }
  if (value !== null && typeof value === "object") {
    const keys = Object.keys(value).sort();
    return `{${keys
      .map((key) => `${JSON.stringify(key)}:${serialize(value[key])}`)
      .join(",")}}`;
  }
  throw new TypeError("Value is outside the canonical manifest JSON domain");
}

export function serializeCanonicalJson(value) {
  return encoder.encode(`${serialize(value)}\n`);
}

export function serializePlainJson(value) {
  return encoder.encode(`${JSON.stringify(value, null, 2)}\n`);
}
