import assert from "node:assert/strict";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve } from "node:path";
import test from "node:test";

import { chromium } from "playwright";

import { repositoryRoot } from "../phase5/phase5-fixture.mjs";

const moduleFiles = new Map(
  [
    "browser/relationship-presentation-core.bundle.mjs",
    "src/host-browser/embed.js",
    "src/host-browser/worker-harness.js",
  ].map((path) => [`/${path}`, resolve(repositoryRoot, path)]),
);
const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".jsonld": "application/ld+json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
};

function listen(server) {
  return new Promise((resolveListen, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolveListen(server.address()));
  });
}

function close(server) {
  return new Promise((resolveClose, reject) => {
    server.close((error) => (error ? reject(error) : resolveClose()));
  });
}

test("real Chromium preserves Phase 7 meaning, accessibility, and navigation", async () => {
  const siteRoot = resolve(repositoryRoot, "site");
  const server = createServer(async (request, response) => {
    const requestPath = request.url?.split("?", 1)[0] ?? "/";
    let path = moduleFiles.get(requestPath);
    if (path === undefined) {
      const relative = requestPath === "/" ? "index.html" : requestPath.slice(1);
      if (relative.includes("..") || relative.includes("\\")) {
        response.writeHead(403);
        response.end();
        return;
      }
      path = resolve(siteRoot, relative);
      if (!path.startsWith(siteRoot)) {
        response.writeHead(403);
        response.end();
        return;
      }
    }
    try {
      const metadata = await stat(path);
      response.writeHead(200, {
        "content-length": metadata.size,
        "content-type": contentTypes[extname(path)] ?? "application/octet-stream",
      });
      createReadStream(path).pipe(response);
    } catch {
      response.writeHead(404);
      response.end();
    }
  });

  const address = await listen(server);
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const origin = `http://127.0.0.1:${address.port}`;
    const requests = [];
    page.on("request", (request) => requests.push(request.url()));
    await page.goto(`${origin}/`);

    assert.equal(
      await page.locator("iframe").getAttribute("sandbox"),
      "allow-scripts",
    );
    const frame = page.frameLocator("iframe");
    await frame.getByRole("heading", { level: 1 }).waitFor();
    assert.equal(
      await frame.getByRole("main").getAttribute("aria-label"),
      "Relationship 42 presentation",
    );
    assert.equal(await frame.getByRole("button", { name: "Next" }).count(), 1);
    await frame.getByRole("button", { name: "Next" }).click();
    assert.equal(await frame.locator("#slide-2").isVisible(), true);
    assert.equal(
      await frame.locator(":focus").getAttribute("id"),
      "slide-2-title",
    );
    await frame.getByRole("button", { name: "Previous" }).click();
    assert.equal(await frame.locator("#slide-1").isVisible(), true);
    assert.equal(
      requests.every((url) => url.startsWith(origin)),
      true,
      `Unexpected network request: ${requests.join(", ")}`,
    );

    await page.goto(`${origin}/presentation.html`);
    const main = page.getByRole("main", {
      name: "Relationship 42 presentation",
    });
    assert.equal(await main.count(), 1);
    assert.deepEqual(await page.locator("h1, h2").allTextContents(), [
      "Relationship 42",
      "Participants",
    ]);
    const next = page.getByRole("button", { name: "Next" });
    await next.focus();
    await next.press("Enter");
    assert.equal(await page.locator("#slide-2").isVisible(), true);
    assert.equal(await page.locator(":focus").getAttribute("id"), "slide-2-title");
    const previous = page.getByRole("button", { name: "Previous" });
    await previous.focus();
    await previous.press("Space");
    assert.equal(await page.locator("#slide-1").isVisible(), true);
    assert.equal(await page.locator(":focus").getAttribute("id"), "slide-1-title");
  } finally {
    await browser?.close();
    server.closeAllConnections();
    await close(server);
  }
});
