/* global document, innerWidth -- Browser assertions run in Chromium. */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { stripVTControlCharacters } from "node:util";
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { rawConfig as config } from "../src/site/config.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "build/editorial-browser");
const selected = process.argv[2];
if (selected && selected !== config.id)
  throw new Error("Unknown tenant for editorial verification");
const id = config.id;
fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results =
  selected && fs.existsSync(path.join(output, "results.json"))
    ? JSON.parse(fs.readFileSync(path.join(output, "results.json"), "utf8")).filter(
        (result) => result.id !== selected,
      )
    : [];
try {
  const port = 5351;
  const origin = `http://127.0.0.1:${port}`;
  const child = spawn(
    process.execPath,
    [
      "node_modules/@react-router/dev/bin.js",
      "dev",
      "--host",
      "127.0.0.1",
      "--port",
      String(port),
      "--strictPort",
    ],
    {
      cwd: root,
      shell: false,
      env: { ...process.env },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  const exited = new Promise((resolve) => child.once("close", resolve));
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    reducedMotion: "reduce",
  });
  const result = { id, ok: false, routes: [], error: undefined };
  results.push(result);
  try {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error(`Dev startup timeout: ${id}`)), 120000);
      let startup = "";
      const onData = (chunk) => {
        startup = (startup + stripVTControlCharacters(chunk.toString())).slice(-12000);
        fs.writeFileSync(path.join(output, `${id}-startup.log`), startup);
        if (startup.includes(origin)) {
          clearTimeout(timeout);
          resolve();
        }
      };
      child.stdout.on("data", onData);
      child.stderr.on("data", onData);
      child.once("error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });
      child.once("close", (code) => {
        clearTimeout(timeout);
        reject(new Error(`Dev server stopped: ${code}`));
      });
    });
    const errors = [];
    const external = [];
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await context.route("**/*", (route) => {
      if (route.request().url().startsWith(origin)) return route.continue();
      external.push(route.request().url());
      return route.abort();
    });
    const detailLinks = new Set();
    for (const [pageId, entry] of Object.entries(config.pages)) {
      if (!entry.enabled) continue;
      await page.goto(origin + entry.path, { waitUntil: "networkidle" });
      await page.locator("main h1").waitFor();
      assert.equal(await page.locator("main h1").count(), 1, `${id}/${pageId}: headings`);
      const axe = await new AxeBuilder({ page }).include("main").analyze();
      assert.deepEqual(
        axe.violations
          .filter((violation) => violation.impact === "critical" || violation.impact === "serious")
          .map((violation) => ({
            id: violation.id,
            targets: violation.nodes.map((node) => node.target),
          })),
        [],
        `${id}/${pageId}: accessibility`,
      );
      const pictures = page.locator("main img");
      await pictures.evaluateAll((images) => {
        for (const image of images) image.setAttribute("loading", "eager");
      });
      await page.waitForFunction(() =>
        Array.from(document.querySelectorAll("main img")).every(
          (image) => image.complete && image.naturalWidth > 0,
        ),
      );
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
        0,
        `${id}/${pageId}: desktop overflow`,
      );
      if (pageId === "home") {
        result.hero = await page
          .locator('[data-section-type="hero"]')
          .getAttribute("data-section-variant");
        result.sectionOrder = await page
          .locator("main [data-section-type]")
          .evaluateAll((sections) =>
            sections.map((section) => section.getAttribute("data-section-type")),
          );
        await page
          .locator('[data-section-type="hero"]')
          .screenshot({ path: path.join(output, `${id}-hero.png`) });
        await page.screenshot({ path: path.join(output, `${id}-home.png`), fullPage: true });
      }
      if (pageId === "gallery") {
        assert.equal(await page.locator('[data-section-type="imageGallery"] figure').count(), 12);
        const trigger = page.locator('[data-section-type="imageGallery"] button').first();
        await trigger.click();
        await page.getByRole("dialog").waitFor();
        await page.keyboard.press("ArrowRight");
        await page.getByRole("dialog").getByText("Image 2 of 12").waitFor();
        await page.keyboard.press("Escape");
        await page.getByRole("dialog").waitFor({ state: "detached" });
      }
      if (pageId === "downloads") {
        const links = await page
          .locator("main a[download]")
          .evaluateAll((anchors) => anchors.map((anchor) => anchor.getAttribute("href")));
        assert.equal(links.length, 5);
        for (const link of links) {
          const download = await context.request.get(origin + link);
          assert.equal(download.status(), 200);
          assert((await download.body()).subarray(0, 5).equals(Buffer.from("%PDF-")));
        }
      }
      for (const link of await page
        .locator("main a[href^='/']")
        .evaluateAll((links) => links.map((link) => link.getAttribute("href")))) {
        if (Object.values(config.detailRoutes).some((detail) => link.startsWith(`${detail.path}/`)))
          detailLinks.add(link);
      }
      await page.setViewportSize({ width: 360, height: 800 });
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
        0,
        `${id}/${pageId}: mobile overflow`,
      );
      if (pageId === "home") await page.screenshot({ path: path.join(output, `${id}-mobile.png`) });
      await page.setViewportSize({ width: 1440, height: 960 });
      result.routes.push(entry.path);
    }
    for (const detail of detailLinks) {
      await page.goto(origin + detail, { waitUntil: "networkidle" });
      await page.locator("main h1").waitFor();
      assert.equal(await page.locator("main h1").count(), 1);
      result.routes.push(detail);
    }
    assert.deepEqual(errors, [], `${id}: runtime/console errors`);
    assert.deepEqual(external, [], `${id}: external resources`);
    result.ok = true;
    console.log(
      `PASS ${id}: ${result.routes.length} dev routes, ${result.hero} hero, local images/PDFs, core axe, desktop/mobile`,
    );
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
    console.error(result.error);
    process.exitCode = 1;
  } finally {
    await context.close();
    child.kill();
    await exited;
    fs.writeFileSync(path.join(output, "results.json"), JSON.stringify(results, null, 2));
  }
} finally {
  await browser.close();
}
