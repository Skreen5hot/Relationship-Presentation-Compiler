const PATH_OPTIONS = Object.freeze([
  "--source",
  "--request",
  "--profile",
  "--out",
]);
const FLAG_OPTIONS = Object.freeze(["--replace", "--help", "--version"]);
const ALL_OPTIONS = new Set([...PATH_OPTIONS, ...FLAG_OPTIONS]);

export class CliError extends Error {
  constructor(code) {
    super(code);
    this.name = "CliError";
    this.code = code;
  }
}

function fail(code) {
  throw new CliError(code);
}

export const HELP_TEXT =
  "Usage: node index.js [--source <fixture.jsonld> --request <request.txt> " +
  "--profile <profile.jsonld> --out <output-dir> [--replace]]\n" +
  "       node index.js --help\n" +
  "       node index.js --version\n";

export const VERSION_TEXT = "relationship-presentation-poc 1.0.0\n";

export function parseCliArguments(arguments_) {
  if (!Array.isArray(arguments_)) {
    throw new TypeError("CLI arguments must be an array");
  }
  if (arguments_.length === 0) {
    return Object.freeze({ defaultMode: true, mode: "compile", replace: true });
  }

  const values = {};
  const seen = new Set();
  for (let index = 0; index < arguments_.length; index += 1) {
    const option = arguments_[index];
    if (typeof option !== "string" || !ALL_OPTIONS.has(option)) {
      fail("UNKNOWN_OPTION");
    }
    if (seen.has(option)) {
      fail("DUPLICATE_OPTION");
    }
    seen.add(option);

    if (PATH_OPTIONS.includes(option)) {
      const value = arguments_[index + 1];
      if (
        typeof value !== "string" ||
        value.length === 0 ||
        value.startsWith("--")
      ) {
        fail("INVALID_CLI_OPTIONS");
      }
      values[option.slice(2)] = value;
      index += 1;
    } else {
      values[option.slice(2)] = true;
    }
  }

  const informationModes = ["help", "version"].filter(
    (name) => values[name] === true,
  );
  if (informationModes.length > 0) {
    if (informationModes.length !== 1 || seen.size !== 1) {
      fail("INVALID_CLI_OPTIONS");
    }
    return Object.freeze({ mode: informationModes[0] });
  }

  const suppliedPathCount = PATH_OPTIONS.filter((option) =>
    seen.has(option),
  ).length;
  if (suppliedPathCount === 0 || suppliedPathCount !== PATH_OPTIONS.length) {
    fail("INVALID_CLI_OPTIONS");
  }

  return Object.freeze({
    defaultMode: false,
    mode: "compile",
    out: values.out,
    profile: values.profile,
    replace: values.replace === true,
    request: values.request,
    source: values.source,
  });
}
