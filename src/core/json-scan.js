const UTF8_BOM = [0xef, 0xbb, 0xbf];
const MAX_JSON_DEPTH = 64;

export class JsonScanError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

function isWhitespace(code) {
  return code === 0x20 || code === 0x09 || code === 0x0a || code === 0x0d;
}

function isDigit(code) {
  return code >= 0x30 && code <= 0x39;
}

function isHexDigit(code) {
  return (
    isDigit(code) ||
    (code >= 0x41 && code <= 0x46) ||
    (code >= 0x61 && code <= 0x66)
  );
}

function syntaxError() {
  return new JsonScanError("INVALID_JSON_SYNTAX");
}

export function decodeUtf8Input(bytes) {
  const hasBom =
    bytes.length >= UTF8_BOM.length &&
    UTF8_BOM.every((value, index) => bytes[index] === value);
  const content = hasBom ? bytes.subarray(UTF8_BOM.length) : bytes;
  const decoder = new TextDecoder("utf-8", {
    fatal: true,
    ignoreBOM: true,
  });
  return { hadBom: hasBom, text: decoder.decode(content) };
}

export function scanJsonText(text) {
  let index = 0;
  let maximumDepth = 0;
  let rootState = "value";
  const stack = [];

  function skipWhitespace() {
    while (index < text.length && isWhitespace(text.charCodeAt(index))) {
      index += 1;
    }
  }

  function parseString() {
    if (text.charCodeAt(index) !== 0x22) {
      throw syntaxError();
    }
    const start = index;
    index += 1;

    while (index < text.length) {
      const code = text.charCodeAt(index);
      if (code === 0x22) {
        index += 1;
        return JSON.parse(text.slice(start, index));
      }
      if (code < 0x20) {
        throw syntaxError();
      }
      if (code !== 0x5c) {
        index += 1;
        continue;
      }

      index += 1;
      const escape = text.charCodeAt(index);
      if (
        escape === 0x22 ||
        escape === 0x2f ||
        escape === 0x5c ||
        escape === 0x62 ||
        escape === 0x66 ||
        escape === 0x6e ||
        escape === 0x72 ||
        escape === 0x74
      ) {
        index += 1;
        continue;
      }
      if (escape !== 0x75) {
        throw syntaxError();
      }
      for (let offset = 1; offset <= 4; offset += 1) {
        if (!isHexDigit(text.charCodeAt(index + offset))) {
          throw syntaxError();
        }
      }
      index += 5;
    }
    throw syntaxError();
  }

  function parseNumber() {
    if (text.charCodeAt(index) === 0x2d) {
      index += 1;
    }

    if (text.charCodeAt(index) === 0x30) {
      index += 1;
      if (isDigit(text.charCodeAt(index))) {
        throw syntaxError();
      }
    } else {
      const firstDigit = text.charCodeAt(index);
      if (firstDigit < 0x31 || firstDigit > 0x39) {
        throw syntaxError();
      }
      do {
        index += 1;
      } while (isDigit(text.charCodeAt(index)));
    }

    if (text.charCodeAt(index) === 0x2e) {
      index += 1;
      if (!isDigit(text.charCodeAt(index))) {
        throw syntaxError();
      }
      while (isDigit(text.charCodeAt(index))) {
        index += 1;
      }
    }

    const exponent = text.charCodeAt(index);
    if (exponent === 0x45 || exponent === 0x65) {
      index += 1;
      const sign = text.charCodeAt(index);
      if (sign === 0x2b || sign === 0x2d) {
        index += 1;
      }
      if (!isDigit(text.charCodeAt(index))) {
        throw syntaxError();
      }
      while (isDigit(text.charCodeAt(index))) {
        index += 1;
      }
    }
  }

  function parseLiteral(literal) {
    if (text.slice(index, index + literal.length) !== literal) {
      throw syntaxError();
    }
    index += literal.length;
  }

  function consumeValue() {
    if (stack.length === 0) {
      if (rootState !== "value") {
        throw syntaxError();
      }
      rootState = "done";
      return;
    }

    const parent = stack[stack.length - 1];
    if (parent.state !== "value" && parent.state !== "valueOrEnd") {
      throw syntaxError();
    }
    parent.state = "commaOrEnd";
  }

  function openContainer(kind) {
    consumeValue();
    stack.push({
      kind,
      keys: kind === "object" ? new Set() : undefined,
      state: kind === "object" ? "keyOrEnd" : "valueOrEnd",
    });
    maximumDepth = Math.max(maximumDepth, stack.length);
    if (maximumDepth > MAX_JSON_DEPTH) {
      throw new JsonScanError("JSON_TOO_DEEP");
    }
  }

  function closeContainer(expectedKind) {
    const current = stack.at(-1);
    if (current?.kind !== expectedKind) {
      throw syntaxError();
    }
    stack.pop();
    index += 1;
  }

  while (true) {
    skipWhitespace();
    if (stack.length === 0 && rootState === "done") {
      if (index !== text.length) {
        throw syntaxError();
      }
      break;
    }

    const current = stack.at(-1);
    const state = current?.state ?? rootState;
    const code = text.charCodeAt(index);

    if (state === "keyOrEnd" || state === "key") {
      if (state === "keyOrEnd" && code === 0x7d) {
        closeContainer("object");
        continue;
      }
      const key = parseString();
      if (current.keys.has(key)) {
        throw new JsonScanError("DUPLICATE_JSON_MEMBER");
      }
      current.keys.add(key);
      current.state = "colon";
      continue;
    }

    if (state === "colon") {
      if (code !== 0x3a) {
        throw syntaxError();
      }
      index += 1;
      current.state = "value";
      continue;
    }

    if (state === "commaOrEnd") {
      if (current.kind === "object") {
        if (code === 0x7d) {
          closeContainer("object");
        } else if (code === 0x2c) {
          index += 1;
          current.state = "key";
        } else {
          throw syntaxError();
        }
      } else if (code === 0x5d) {
        closeContainer("array");
      } else if (code === 0x2c) {
        index += 1;
        current.state = "value";
      } else {
        throw syntaxError();
      }
      continue;
    }

    if (state === "valueOrEnd" && code === 0x5d) {
      closeContainer("array");
      continue;
    }
    if (state !== "value" && state !== "valueOrEnd") {
      throw syntaxError();
    }

    if (code === 0x7b) {
      index += 1;
      openContainer("object");
    } else if (code === 0x5b) {
      index += 1;
      openContainer("array");
    } else if (code === 0x22) {
      parseString();
      consumeValue();
    } else if (code === 0x74) {
      parseLiteral("true");
      consumeValue();
    } else if (code === 0x66) {
      parseLiteral("false");
      consumeValue();
    } else if (code === 0x6e) {
      parseLiteral("null");
      consumeValue();
    } else if (code === 0x2d || isDigit(code)) {
      parseNumber();
      consumeValue();
    } else {
      throw syntaxError();
    }
  }

  return { depth: maximumDepth, value: JSON.parse(text) };
}

export function parseJsonBytes(bytes) {
  const decoded = decodeUtf8Input(bytes);
  return { ...decoded, ...scanJsonText(decoded.text) };
}
