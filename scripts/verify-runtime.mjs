import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const packageJson = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8")
);
const nodeDirectory = dirname(process.execPath);
const npmManifestPath =
  process.platform === "win32"
    ? resolve(nodeDirectory, "node_modules", "npm", "package.json")
    : resolve(nodeDirectory, "..", "lib", "node_modules", "npm", "package.json");
const npmPackage = JSON.parse(await readFile(npmManifestPath, "utf8"));

assert.equal(
  process.versions.node,
  packageJson.engines.node,
  `Node ${packageJson.engines.node} is required; executing ${process.versions.node}`
);
assert.equal(
  npmPackage.version,
  packageJson.engines.npm,
  `Node-distribution npm ${packageJson.engines.npm} is required; installed ${npmPackage.version}`
);
assert.equal(packageJson.packageManager, `npm@${npmPackage.version}`);

process.stdout.write(
  `runtime-ok node=${process.versions.node} npm=${npmPackage.version}\n`
);
