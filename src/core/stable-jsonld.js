const encoder = new TextEncoder();

export function serializeJsonLd(value) {
  return encoder.encode(`${JSON.stringify(value, null, 2)}\n`);
}
