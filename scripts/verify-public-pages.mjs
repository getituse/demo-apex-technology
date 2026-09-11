/* global document, getComputedStyle, innerWidth -- Playwright callbacks execute in Chromium. */
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

import { rawConfig as config } from "../src/site/config.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const tenantArg = args.find((arg) => arg.startsWith("--tenant="));
const selectedTenant = tenantArg?.slice("--tenant=".length);
if (selectedTenant !== undefined && selectedTenant !== config.id)
  throw new Error("Unknown audit tenant");
const devOrigin = args.find((arg) => arg.startsWith("http://"));
if (args.length !== Number(Boolean(tenantArg)) + Number(Boolean(devOrigin)))
  throw new Error("Unexpected audit arguments");
if (devOrigin && !/^http:\/\/127\.0\.0\.1:\d+$/.test(devOrigin))
  throw new Error("Expected loopback dev origin");
const fontFamilies = ["Inter", "Lexend", "Lora", "Nunito", "Source Sans 3", "Source Serif 4"];
const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".json": "application/json",
  ".woff2": "font/woff2",
};

// Test-only file server, never included in the deployed static output.
function serve(dist) {
  return http.createServer((request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
      let filename = path.resolve(dist, `.${pathname}`);
      if (filename !== dist && !filename.startsWith(`${dist}${path.sep}`)) {
        response.writeHead(400).end();
        return;
      }
      if (fs.existsSync(filename) && fs.statSync(filename).isDirectory())
        filename = path.join(filename, "index.html");
      if (!fs.existsSync(filename)) {
        response.writeHead(404, { "Content-Type": "text/html" });
        response.end(fs.readFileSync(path.join(dist, "404.html")));
        return;
      }
      response.writeHead(200, {
        "Content-Type": mime[path.extname(filename)] ?? "application/octet-stream",
      });
      response.end(fs.readFileSync(filename));
    } catch {
      response.writeHead(400).end();
    }
  });
}

const browser = await chromium.launch({ headless: true });
let checked = 0;
const audit = {
  startedAt: new Date().toISOString(),
  ok: false,
  checked: 0,
  tenants: [],
  failure: undefined,
};
const saveAudit = () => {
  audit.checked = checked;
  fs.mkdirSync(path.join(root, "build"), { recursive: true });
  fs.writeFileSync(
    path.join(
      root,
      "build",
      selectedTenant ? `page-route-audit-${selectedTenant}.json` : "page-route-audit.json",
    ),
    JSON.stringify(audit, null, 2),
  );
};
saveAudit();
try {
  const id = config.id;
  const aboutLink = config.navigation
    .flatMap((item) => (item.kind === "group" ? item.children : [item]))
    .find((item) => item.kind === "page" && item.pageId === "about");
  assert(aboutLink, `${id}: configured about navigation target missing`);
  const dist = path.join(root, "dist");
  const paths = fs
    .readdirSync(dist, { recursive: true, encoding: "utf8" })
    .filter((file) => path.basename(file) === "index.html")
    .map(
      (file) =>
        `/${file
          .replaceAll("\\", "/")
          .replace(/index\.html$/, "")
          .replace(/\/$/, "")}`,
    );
  assert(paths.includes(config.pages.about.path), `${id}: about not prerendered`);
  const server = serve(dist);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const context = await browser.newContext({ viewport: { width: 360, height: 780 } });
  const external = [];
  const errors = [];
  const fontRequests = new Set();
  context.on("request", (request) => {
    if (request.resourceType() === "font") fontRequests.add(request.url());
  });
  await context.route("**/*", async (route) => {
    if (route.request().url().startsWith(origin)) await route.continue();
    else {
      external.push(route.request().url());
      await route.abort();
    }
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().includes("404")) errors.push(message.text());
  });
  const canonicals = new Set();
  try {
    for (const route of paths) {
      const response = await page.goto(`${origin}${route}`, { waitUntil: "networkidle" });
      assert.equal(response.status(), 200, `${id}${route}: HTTP status`);
      const html = await response.text();
      assert(html.includes("<h1"), `${id}${route}: prerendered heading missing`);
      assert(!html.includes("Page sections arrive"), `${id}${route}: old placeholder`);
      await page.waitForFunction(() => document.querySelector("main h1"));
      assert.equal(await page.locator("main h1").count(), 1, `${id}${route}: one heading`);
      assert.equal(await page.locator("[data-route-path]").count(), 1);
      await page.evaluate(() => document.fonts.ready);
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
        0,
        `${id}${route}: mobile overflow`,
      );
      assert(
        await page
          .locator("header img")
          .first()
          .evaluate(async (el) => {
            await el.decode();
            return el.complete && el.naturalWidth > 0;
          }),
        `${id}${route}: header logo did not decode`,
      );
      const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
      const rawCanonical = html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/)?.[1];
      assert.equal(canonical, rawCanonical, `${id}${route}: hydration changed canonical`);
      assert(
        paths.includes(new URL(canonical).pathname),
        `${id}${route}: canonical target missing`,
      );
      canonicals.add(canonical);
      const axe = await new AxeBuilder({ page }).include("main").analyze();
      assert.deepEqual(
        axe.violations
          .filter((item) => item.impact === "critical" || item.impact === "serious")
          .map((item) => ({ id: item.id, targets: item.nodes.map((node) => node.target) })),
        [],
        `${id}${route}: accessibility`,
      );
      checked++;
      if (checked % 10 === 0) {
        saveAudit();
        console.log(`Checked ${checked} production paths; current tenant ${id}`);
      }
    }
    const sitemap = fs.readFileSync(path.join(dist, "sitemap.xml"), "utf8");
    const locations = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
    assert.deepEqual(
      [...new Set(locations)].sort(),
      [...canonicals].sort(),
      `${id}: sitemap must match canonical pages only`,
    );
    assert.equal(locations.length, new Set(locations).size);
    await page.goto(`${origin}/`, { waitUntil: "networkidle" });
    const [expectedHeading, expectedBody] = await page.evaluate(() =>
      ["--font-heading", "--font-body"].map((token) =>
        getComputedStyle(document.documentElement)
          .getPropertyValue(token)
          .split(",")[0]
          .replaceAll('"', "")
          .trim(),
      ),
    );
    assert(fontFamilies.includes(expectedHeading) && fontFamilies.includes(expectedBody));
    const loaded = await page.evaluate(async () => {
      await document.fonts.ready;
      return Array.from(document.fonts)
        .filter((face) => face.status === "loaded")
        .map((face) => face.family.replaceAll('"', ""));
    });
    assert(loaded.includes(expectedHeading), `${id}: heading font not loaded`);
    assert(loaded.includes(expectedBody), `${id}: body font not loaded`);
    assert(new Set(loaded).size <= 2, `${id}: unused font families were loaded`);
    assert(
      fontRequests.size > 0 && fontRequests.size <= 4,
      `${id}: unexpected initial font requests`,
    );
    const cdp = await context.newCDPSession(page);
    await cdp.send("DOM.enable");
    await cdp.send("CSS.enable");
    const { root: domRoot } = await cdp.send("DOM.getDocument");
    const { nodeId } = await cdp.send("DOM.querySelector", {
      nodeId: domRoot.nodeId,
      selector: "main h1",
    });
    const { fonts: renderedFonts } = await cdp.send("CSS.getPlatformFontsForNode", { nodeId });
    assert(
      renderedFonts.some((font) => font.isCustomFont && font.glyphCount > 0),
      `${id}: heading rendered in fallback only`,
    );
    await cdp.detach();
    await page.getByRole("button", { name: "Open menu", exact: true }).click();
    await page
      .getByRole("dialog")
      .getByRole("link", { name: aboutLink.label, exact: true })
      .click();
    await page.waitForFunction(() => document.activeElement === document.querySelector("main h1"));
    assert.equal(page.url(), `${origin}${config.pages.about.path}`);
    assert.equal(await page.locator("[data-route-path]").count(), 1);
    await page.waitForFunction(
      () => getComputedStyle(document.querySelector("[data-route-path]")).opacity === "1",
    );
    await page.goBack();
    await page.waitForURL(`${origin}/`);
    await page
      .waitForFunction(() => document.activeElement === document.querySelector("main h1"))
      .catch(async (error) => {
        console.error(
          "Back navigation",
          await page.evaluate(() => ({
            active: document.activeElement?.outerHTML?.slice(0, 200),
            heading: document.querySelector("main h1")?.outerHTML,
            route: document.querySelector("[data-route-path]")?.getAttribute("data-route-path"),
          })),
        );
        throw error;
      });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.getByRole("button", { name: "Open menu", exact: true }).click();
    await page
      .getByRole("dialog")
      .getByRole("link", { name: aboutLink.label, exact: true })
      .click();
    await page.waitForFunction(() => document.activeElement === document.querySelector("main h1"));
    const missing = await page.goto(`${origin}/does-not-exist`, { waitUntil: "networkidle" });
    assert.equal(missing.status(), 404);
    await page.getByRole("heading", { name: "404 — Page not found" }).waitFor();
    assert.equal(
      await page.locator('meta[name="robots"]').getAttribute("content"),
      "noindex,nofollow",
    );
    const noJs = await browser.newContext({ javaScriptEnabled: false });
    try {
      const staticPage = await noJs.newPage();
      const absent = await staticPage.goto(`${origin}/missing-without-js`);
      assert.equal(absent.status(), 404);
      await staticPage.getByRole("heading", { name: "Page not found", exact: true }).waitFor();
      assert.equal(
        await staticPage.getByRole("link", { name: "Home", exact: true }).getAttribute("href"),
        "/",
      );
    } finally {
      await noJs.close();
    }
    for (const width of [375, 390, 768, 1024, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${origin}/`, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
        0,
        `${id}: font layout overflow at ${width}px`,
      );
    }
    const samples = await page.evaluate(async (families) => {
      const results = [];
      for (const family of families) {
        for (const weight of [400, 500, 600, 700]) {
          const faces = await document.fonts.load(
            `${weight} 20px "${family}"`,
            "Typography café ĀŁź",
          );
          results.push({
            family,
            weight,
            count: faces.length,
            loaded: faces.every((face) => face.status === "loaded"),
          });
        }
      }
      return results;
    }, fontFamilies);
    assert(
      samples.every((sample) => sample.count === 2 && sample.loaded),
      "All six fonts must decode at each supported weight and subset",
    );
    const fallbackContext = await browser.newContext({ viewport: { width: 360, height: 780 } });
    try {
      await fallbackContext.route("**/*", (route) =>
        route.request().resourceType() === "font" || !route.request().url().startsWith(origin)
          ? route.abort()
          : route.continue(),
      );
      const fallbackPage = await fallbackContext.newPage();
      await fallbackPage.goto(origin, { waitUntil: "networkidle" });
      await fallbackPage.getByRole("heading", { level: 1 }).waitFor();
      const fallbackState = await fallbackPage.evaluate(async () => {
        await document.fonts.ready;
        return {
          loaded: Array.from(document.fonts).some((face) => face.status === "loaded"),
          overflow: document.documentElement.scrollWidth - innerWidth,
        };
      });
      assert.deepEqual(
        fallbackState,
        { loaded: false, overflow: 0 },
        `${id}: failed fonts must retain a usable layout`,
      );
    } finally {
      await fallbackContext.close();
    }
    assert.deepEqual(errors, [], `${id}: runtime errors`);
    assert.deepEqual(external, [], `${id}: unwanted network dependencies`);
    if (devOrigin) {
      const development = await browser.newContext({ viewport: { width: 360, height: 800 } });
      try {
        const devPage = await development.newPage();
        const devErrors = [];
        devPage.on("pageerror", (error) => devErrors.push(error.message));
        devPage.on("console", (message) => {
          if (message.type() === "error") devErrors.push(message.text());
        });
        for (const route of paths) {
          await devPage.goto(`${devOrigin}${route}`, { waitUntil: "networkidle" });
          await devPage.locator("main h1").waitFor();
          assert.equal(await devPage.locator("main h1").count(), 1);
        }
        assert.deepEqual(devErrors, [], "Greenfield dev routes: runtime/console errors");
        console.log(`PASS dev tenant: ${paths.length} enabled routes without console errors`);
      } finally {
        await development.close();
      }
    }
    console.log(
      `PASS ${config.brand.name}: ${paths.length} paths, sitemap/aliases/axe, local fonts/media, 360–1440px, transition/focus/Back/static404`,
    );
    audit.tenants.push({
      id,
      paths: paths.length,
      devChecked: Boolean(devOrigin),
      ok: true,
    });
  } finally {
    await context.close();
    await new Promise((resolve) => server.close(resolve));
  }
  console.log(`PUBLIC_PAGES_EXIT=0 (${checked} paths)`);
  audit.ok = true;
} catch (error) {
  audit.failure = error instanceof Error ? error.message : String(error);
  process.exitCode = 1;
  console.error(audit.failure);
} finally {
  saveAudit();
  await browser.close();
}
