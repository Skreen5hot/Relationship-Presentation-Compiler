function poison(name) {
  return function poisonedCpsCapability() {
    throw new Error(`CPS poison activated: ${name}`);
  };
}

function replaceGlobal(name, value) {
  Object.defineProperty(globalThis, name, {
    configurable: true,
    value,
    writable: false,
  });
}

export function installCpsPoison() {
  const observations = {
    decoders: [],
    digests: [],
    encoders: 0,
  };
  const OriginalTextDecoder = globalThis.TextDecoder;
  const OriginalTextEncoder = globalThis.TextEncoder;
  const originalCrypto = globalThis.crypto;
  const originalDigest = originalCrypto.subtle.digest.bind(originalCrypto.subtle);

  class InstrumentedTextDecoder extends OriginalTextDecoder {
    constructor(label, options) {
      observations.decoders.push({
        fatal: options?.fatal === true,
        label: label ?? "utf-8",
      });
      super(label, options);
    }
  }

  class InstrumentedTextEncoder extends OriginalTextEncoder {
    constructor(...arguments_) {
      observations.encoders += 1;
      super(...arguments_);
    }
  }

  replaceGlobal("TextDecoder", InstrumentedTextDecoder);
  replaceGlobal("TextEncoder", InstrumentedTextEncoder);
  replaceGlobal("crypto", {
    subtle: {
      digest(algorithm, data) {
        if (algorithm !== "SHA-256") {
          throw new Error(`CPS digest algorithm rejected: ${String(algorithm)}`);
        }
        observations.digests.push(algorithm);
        return originalDigest(algorithm, data);
      },
    },
    getRandomValues: poison("crypto.getRandomValues"),
    randomUUID: poison("crypto.randomUUID"),
  });

  for (const name of [
    "Date",
    "EventSource",
    "Function",
    "Intl",
    "SharedWorker",
    "URL",
    "URLSearchParams",
    "WebAssembly",
    "WebSocket",
    "Worker",
    "XMLHttpRequest",
    "caches",
    "clearImmediate",
    "clearInterval",
    "clearTimeout",
    "console",
    "document",
    "eval",
    "fetch",
    "indexedDB",
    "localStorage",
    "location",
    "navigator",
    "performance",
    "process",
    "queueMicrotask",
    "require",
    "self",
    "sessionStorage",
    "setImmediate",
    "setInterval",
    "setTimeout",
    "window",
  ]) {
    replaceGlobal(name, poison(name));
  }

  Object.defineProperty(Math, "random", {
    configurable: true,
    value: poison("Math.random"),
  });
  for (const [prototype, names] of [
    [String.prototype, ["localeCompare", "toLocaleLowerCase", "toLocaleUpperCase"]],
    [Object.prototype, ["toLocaleString"]],
    [Number.prototype, ["toLocaleString"]],
    [BigInt.prototype, ["toLocaleString"]],
    [Array.prototype, ["toLocaleString"]],
  ]) {
    for (const name of names) {
      Object.defineProperty(prototype, name, {
        configurable: true,
        value: poison(name),
      });
    }
  }

  return observations;
}

export function completeCpsPoison() {
  replaceGlobal("Buffer", poison("Buffer"));
}
