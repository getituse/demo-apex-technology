/* global document, innerWidth -- Assertions execute inside Chromium. */
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const origin = process.argv[2];
if (!origin || !/^http:\/\/127\.0\.0\.1:\d+$/.test(origin))
  throw new Error("Expected a loopback dev URL");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const types = [
  "announcementBar",
  "hero",
  "quickLinks",
  "trustStrip",
  "stats",
  "aboutSplit",
  "missionVision",
  "values",
  "principalMessage",
  "leadershipMessage",
  "programGrid",
  "serviceGrid",
  "departmentGrid",
  "admissionsSteps",
  "applicationCTA",
  "noticeBoard",
  "newsGrid",
  "eventsGrid",
  "results",
  "placements",
  "researchHighlights",
  "facilities",
  "campusLife",
  "imageGallery",
  "facultyGrid",
  "teamGrid",
  "testimonials",
  "alumniStories",
  "caseStudies",
  "downloads",
  "faq",
  "contactDetails",
  "map",
  "newsletter",
  "finalCTA",
];
const browser = await chromium.launch({ headless: true });
const results = [];
let succeeded = false;
let failure;
try {
  const context = await browser.newContext({
    viewport: { width: 360, height: 800 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${origin}/__styleguide`, { waitUntil: "networkidle" });
  async function pick(label, value) {
    await page.getByRole("combobox", { name: label, exact: true }).click();
    await page.getByRole("option", { name: value, exact: true }).click();
  }
  for (const type of types) {
    await pick("Preview section type", type);
    await page.locator(`[data-section-preview] [data-section-type="${type}"]`).waitFor();
    for (const tone of ["default", "inverted"]) {
      await pick("Section background", tone);
      await page.locator("[data-section-preview]").scrollIntoViewIfNeeded();
      await page.evaluate(() => document.fonts.ready);
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
        0,
        `${type}/${tone}: overflow`,
      );
      const accessibility = await new AxeBuilder({ page })
        .include("[data-section-preview]")
        .analyze();
      assert.deepEqual(
        accessibility.violations.map((violation) => ({
          id: violation.id,
          nodes: violation.nodes.map((node) => node.target),
        })),
        [],
        `${type}/${tone}: accessibility`,
      );
    }
    results.push({ type, ok: true });
    console.log(`PASS ${type}: default/inverted accessibility and mobile layout`);
  }
  await pick("Preview section type", "hero");
  for (const width of [360, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const variant of ["split", "editorial", "collage"]) {
      await pick("Hero layout", variant);
      assert.equal(
        await page.locator("[data-section-preview] img").count(),
        variant === "collage" ? 3 : 1,
      );
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
        0,
        `${variant}/${width}: overflow`,
      );
    }
  }
  await pick("Preview section type", "imageGallery");
  const trigger = page.getByRole("button", { name: "View image: Original demonstration artwork" });
  await trigger.click();
  await page.getByRole("dialog").waitFor();
  await page.keyboard.press("ArrowRight");
  await page.getByRole("dialog").getByText("Image 2 of 2").waitFor();
  await page.keyboard.press("Escape");
  await page.getByRole("dialog").waitFor({ state: "detached" });
  await trigger.waitFor();
  await page.waitForFunction(
    () =>
      document.activeElement?.getAttribute("aria-label") ===
      "View image: Original demonstration artwork",
  );
  assert.deepEqual(errors, []);
  succeeded = true;
  console.log(
    "SECTIONS_AUDIT_EXIT=0: 35 types, default/inverted axe, three responsive heroes, gallery keyboard/focus",
  );
} catch (error) {
  failure = error instanceof Error ? error.message : String(error);
  console.error(failure);
  process.exitCode = 1;
} finally {
  fs.mkdirSync(path.join(root, "build"), { recursive: true });
  fs.writeFileSync(
    path.join(root, "build/section-audit.json"),
    JSON.stringify({ ok: succeeded, failure, results }, null, 2),
  );
  await browser.close();
}
