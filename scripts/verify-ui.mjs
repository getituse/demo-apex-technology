/* global document, getComputedStyle, innerWidth -- Playwright page callbacks execute in Chromium. */
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";

const baseUrl = process.argv[2];
if (!baseUrl || !/^http:\/\/127\.0\.0\.1:\d+$/.test(baseUrl)) {
  throw new Error(
    "Usage: node scripts/verify-ui.mjs http://127.0.0.1:<port> (a running dev tenant)",
  );
}

const browser = await chromium.launch({ headless: true });
const results = [];
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (
      message.type() === "error" ||
      message.text().includes("Blocked aria-hidden") ||
      message.text().includes("Missing `Description`")
    )
      errors.push(message.text());
  });
  await page.goto(`${baseUrl}/__styleguide`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Styleguide", exact: true }).waitFor();
  const primary = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--primary").trim(),
  );
  const picker = page.getByRole("combobox", { name: "Preview a preset" });
  await picker.click();
  await page.getByRole("option", { name: "primary-school", exact: true }).click();
  assert.equal(
    await page
      .locator("dt")
      .filter({ hasText: /^radius$/ })
      .locator("+ dd")
      .innerText(),
    "1rem",
  );
  await page.locator("header a[href='/']").click();
  await page.waitForFunction(
    (original) =>
      getComputedStyle(document.documentElement).getPropertyValue("--primary").trim() === original,
    primary,
  );
  await page.waitForFunction(() => document.activeElement === document.querySelector("main h1"));
  assert.equal(
    await page.evaluate(() => document.documentElement.style.getPropertyValue("--primary")),
    "",
  );
  results.push(
    "Theme preview updates scalar values and is removed on route exit; new heading focused.",
  );

  const group = page.locator("header nav[aria-label='Primary'] button").first();
  await group.hover();
  assert.equal(await group.getAttribute("aria-expanded"), "false");
  await group.click();
  const childLink = page.locator("header nav[aria-label='Primary'] ul ul a").first();
  await childLink.focus();
  await page.keyboard.press("Escape");
  assert.equal(await group.getAttribute("aria-expanded"), "false");
  assert(await group.evaluate((el) => el === document.activeElement));
  results.push(
    "Desktop dropdown: hover stays closed; click opens; Escape from child restores trigger.",
  );

  for (const width of [360, 1280]) {
    await page.setViewportSize({ width, height: 780 });
    await page.goto(`${baseUrl}/__styleguide`, { waitUntil: "domcontentloaded" });
    const launch = page.getByRole("button", { name: "Open modal", exact: true });
    await launch.click();
    const modal = page.getByRole("dialog", { name: "Modal title" });
    const box = await modal.boundingBox();
    assert(box);
    assert(Math.abs(box.x + box.width / 2 - width / 2) < 1);
    assert(Math.abs(box.y + box.height / 2 - 390) < 1);
    assert(box.x >= 0 && box.x + box.width <= width);
    await page.keyboard.press("Escape");
    await modal.waitFor({ state: "detached" });
    await page
      .waitForFunction(() => document.activeElement?.textContent?.trim() === "Open modal")
      .catch(async (error) => {
        console.error(
          "Modal focus diagnostics",
          await page.evaluate(() => ({
            active: document.activeElement?.outerHTML,
            hidden: [...document.querySelectorAll('[aria-hidden="true"]')].map(
              (el) => el.tagName + "." + el.className,
            ),
          })),
        );
        throw error;
      });
    results.push(`Modal centered and focus restored at ${width}px.`);
  }

  for (const reducedMotion of ["no-preference", "reduce"]) {
    await page.emulateMedia({ reducedMotion });
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto(`${baseUrl}/__styleguide`, { waitUntil: "domcontentloaded" });
    await page.getByRole("combobox", { name: "Preview a preset" }).waitFor();
    await page.locator("header a[href='/']").click();
    await page.waitForFunction(() => document.activeElement === document.querySelector("main h1"));
    const trigger = page.getByRole("button", { name: "Open menu", exact: true });
    await trigger.click();
    const drawer = page.getByRole("dialog", { name: "Menu", exact: true });
    await drawer.waitFor();
    assert.equal(await drawer.getAttribute("aria-modal"), "true");
    assert.equal(await page.evaluate(() => getComputedStyle(document.body).overflow), "hidden");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0);
    await drawer.locator("a,button").last().focus();
    await page.keyboard.press("Tab");
    assert(await drawer.evaluate((el) => el.contains(document.activeElement)));
    await page.keyboard.press("Escape");
    await drawer.waitFor({ state: "detached" });
    await page.waitForFunction(
      () => document.activeElement?.getAttribute("aria-label") === "Open menu",
    );
    await trigger.click();
    await drawer.getByRole("link", { name: "About", exact: true }).click();
    await drawer.waitFor({ state: "detached" });
    await page.waitForFunction(() => document.activeElement === document.querySelector("main h1"));
    assert.notEqual(await page.evaluate(() => getComputedStyle(document.body).overflow), "hidden");
    results.push(
      `Drawer traps focus, unlocks scroll and yields focus to route heading (${reducedMotion}).`,
    );
  }
  assert.deepEqual(errors, [], "Unexpected browser errors or accessibility warnings");
  results.forEach((result) => console.log(`PASS ${result}`));
  console.log("UI_AUDIT_EXIT=0");
} finally {
  await browser.close();
}
