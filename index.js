#!/usr/bin/env node

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  HELP_TEXT,
  parseCliArguments,
  VERSION_TEXT,
} from "./src/host-node/cli.js";
import {
  buildNodeHostFailure,
  mapNodeResultToTerminal,
} from "./src/host-node/failure-surface.js";
import { runNodeCompilation } from "./src/host-node/node-host.js";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)));

export async function main(arguments_, io = process) {
  let options;
  try {
    options = parseCliArguments(arguments_);
  } catch (error) {
    const result = buildNodeHostFailure({
      code: error?.code ?? "INTERNAL_COMPILER_ERROR",
      violations: [],
    });
    const terminal = mapNodeResultToTerminal(result);
    io.stderr.write(terminal.stderr);
    return terminal.exitCode;
  }

  if (options.mode === "help" || options.mode === "version") {
    io.stdout.write(options.mode === "help" ? HELP_TEXT : VERSION_TEXT);
    return 0;
  }

  const result = await runNodeCompilation(options, { packageRoot });
  const terminal = mapNodeResultToTerminal(result);
  io.stdout.write(terminal.stdout);
  io.stderr.write(terminal.stderr);
  return terminal.exitCode;
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2));
}
