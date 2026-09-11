import { readFile } from "node:fs/promises";
import type { Locator, Page, Request } from "@playwright/test";

import { themePresets } from "../../src/themes/theme-presets";
import type { ThemeTokenName } from "../../src/themes/theme-types";
import type { FormFieldId } from "../../src/config/form-config";
import type { NavLink, TenantConfig } from "../../src/config/tenant-schema";
import { PAGE_IDS } from "../../src/config/tenant-schema";
import { expect, gotoNotFound, gotoReady, test, waitForReady, waitForRequests } from "./fixtures";

// Independent of the production CSS-name converter and theme resolver.
const tokenNames = {
  background: "--background",
  foreground: "--foreground",
  surface: "--surface",
  surfaceElevated: "--surface-elevated",
  card: "--card",
  cardForeground: "--card-foreground",
  primary: "--primary",
  primaryForeground: "--primary-foreground",
  secondary: "--secondary",
  secondaryForeground: "--secondary-foreground",
  accent: "--accent",
  accentForeground: "--accent-foreground",
  muted: "--muted",
  mutedForeground: "--muted-foreground",
  border: "--border",
  input: "--input",
  ring: "--ring",
  success: "--success",
  warning: "--warning",
  destructive: "--destructive",
  headerBackground: "--header-background",
  footerBackground: "--footer-background",
  footerForeground: "--footer-foreground",
  sectionTint: "--section-tint",
  radius: "--radius",
  shadowSm: "--shadow-sm",
  shadowMd: "--shadow-md",
  shadowLg: "--shadow-lg",
  fontHeading: "--font-heading",
  fontBody: "--font-body",
} as const satisfies Record<ThemeTokenName, string>;

const interactiveSelector =
  'a[href], area[href], button, input, select, textarea, summary, [tabindex], [contenteditable="true"]';

function isTabbable(element: Element): boolean {
  const style = getComputedStyle(element);
  return (
    element instanceof HTMLElement &&
    element.tabIndex >= 0 &&
    !element.matches(":disabled") &&
    !element.closest('[hidden], [inert], [aria-hidden="true"]') &&
    element.getClientRects().length > 0 &&
    style.visibility === "visible" &&
    style.display !== "none"
  );
}

async function tabbables(scope: Page | Locator): Promise<Locator[]> {
  const result: Locator[] = [];
  for (const locator of await scope.locator(interactiveSelector).all()) {
    if (await locator.evaluate(isTabbable)) result.push(locator);
  }
  return result;
}

/** Real Tab presses only, bounded by the actual currently interactive elements. */
async function tabTo(page: Page, target: Locator): Promise<void> {
  await expect(target).toBeVisible();
  const limit = (await tabbables(page)).length + 1;
  for (let step = 0; step < limit; step++) {
    if (await target.evaluate((element) => element === document.activeElement)) {
      await expect(target).toBeFocused();
      await expect(target).toHaveJSProperty("tabIndex", 0);
      expect(await target.evaluate((element) => element.matches(":focus-visible"))).toBe(true);
      return;
    }
    await page.keyboard.press("Tab");
  }
  throw new Error(`Target was not keyboard-reachable in ${limit} Tab presses`);
}

async function rawDocument(page: Page, html: string) {
  return page.evaluate((source) => {
    const document = new DOMParser().parseFromString(source, "text/html");
    return {
      headings: [...document.querySelectorAll("h1")].map((node) => node.textContent?.trim()),
      title: document.title,
      robots: [...document.querySelectorAll('meta[name="robots"]')].map((node) =>
        node.getAttribute("content"),
      ),
      canonical: document.querySelectorAll('link[rel="canonical"]').length,
      jsonLd: document.querySelectorAll('script[type="application/ld+json"]').length,
      scripts: [
        ...[...document.querySelectorAll("script[src]")].map((node) => node.getAttribute("src")),
        // Framework output bootstraps compiled route/client chunks using inline modules.
        ...[...document.querySelectorAll('script[type="module"]')].flatMap((node) =>
          [
            ...(node.textContent ?? "").matchAll(
              /(?:\bfrom\s*|\bimport\s*\(?\s*)["']([^"']+)["']/g,
            ),
          ].map((match) => match[1]),
        ),
      ],
      styles: [...document.querySelectorAll('link[rel="stylesheet"]')].map((node) =>
        node.getAttribute("href"),
      ),
      forms: [...document.querySelectorAll("form")].map((form) => ({
        controls: [...form.querySelectorAll("input, textarea, select, button")].map((control) =>
          control.matches(":disabled"),
        ),
      })),
      hydrated: document.documentElement.hasAttribute("data-hydrated"),
    };
  }, html);
}

async function expectNoOverflow(page: Page): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    width: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    viewport: document.documentElement.clientWidth,
    outerViewport: window.innerWidth,
  }));
  expect(dimensions.outerViewport).toBe(page.viewportSize()!.width);
  expect(dimensions.width, `Horizontal overflow at ${dimensions.viewport}px`).toBeLessThanOrEqual(
    dimensions.viewport,
  );
}

async function expectPageAssets(page: Page): Promise<void> {
  // Exercise real lazy loading rather than rewriting loading attributes or substituting images.
  for (const image of await page.locator("img").all()) {
    if (!(await image.isVisible())) continue;
    // This verifies lazy media, not pointer actionability. Avoid a rAF stability
    // prerequisite before scrolling; still require real viewport intersection and decoding.
    await image.evaluate((node) =>
      node.scrollIntoView({ behavior: "instant", block: "center", inline: "nearest" }),
    );
    await expect
      .poll(
        () =>
          image.evaluate((node) => {
            const box = node.getBoundingClientRect();
            return (
              box.width > 0 &&
              box.height > 0 &&
              box.bottom > 0 &&
              box.top < innerHeight &&
              box.right > 0 &&
              box.left < innerWidth
            );
          }),
        { message: "Media must intersect the actual viewport" },
      )
      .toBe(true);
    await expect
      .poll(
        () => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0),
        { message: `Image must load: ${await image.getAttribute("src")}` },
      )
      .toBe(true);
    await image.evaluate(async (node: HTMLImageElement) => {
      await node.decode();
    });
  }
  await waitForRequests(page);
  await expectNoOverflow(page);
}

async function expectNotFound(page: Page, path: string, builtHtml: string): Promise<void> {
  const response = await gotoNotFound(page, path);
  const html = await response.text();
  expect(html, "Unknown URL must serve the exact built recovery document").toBe(builtHtml);
  const raw = await rawDocument(page, html);
  expect(raw.headings).toHaveLength(1);
  expect(raw.hydrated).toBe(false);
  expect(raw.headings[0]).toMatch(/page not found/i);
  expect(raw.robots).toEqual(["noindex,nofollow"]);
  expect(raw.canonical).toBe(0);
  expect(raw.jsonLd).toBe(0);
  // The main route marker is created by the hydrated layout, not the raw fallback.
  await expect(page.locator("main [data-route-path]")).toHaveAttribute("data-route-path", path);
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator('meta[name="robots"]')).toHaveCount(1);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex,nofollow");
  await expect(
    page.locator('link[rel="canonical"], script[type="application/ld+json"]'),
  ).toHaveCount(0);
  await expectNoOverflow(page);
}

function internalLinks(config: TenantConfig) {
  const links: { link: Extract<NavLink, { kind: "page" }>; group?: string }[] = [];
  for (const item of config.navigation) {
    const children = item.kind === "group" ? item.children : [item];
    for (const link of children) {
      if (link.kind === "page" && config.pages[link.pageId].enabled) {
        links.push({ link, ...(item.kind === "group" ? { group: item.label } : {}) });
      }
    }
  }
  return links;
}

test("home ships branded HTML and every configured theme token", async ({ page, tenant }) => {
  const { config } = tenant;
  const response = await gotoReady(page, config.pages.home.path);
  const html = await response.text();
  const raw = await rawDocument(page, html);
  expect(raw.headings).toHaveLength(1);
  expect(raw.headings[0]?.length).toBeGreaterThan(0);
  expect(raw.title).toBe(config.pages.home.seo?.defaultTitle ?? config.seo.defaultTitle);
  expect(await page.title()).toBe(raw.title);
  await expect(
    page.locator("header").getByRole("img", { name: config.brand.name, exact: true }),
  ).toBeVisible();
  expect(html).not.toMatch(/@vite\/client|@react-refresh|vite-hmr|__vite_ping/);
  expect(raw.scripts.length).toBeGreaterThan(0);
  expect(raw.scripts.some((src) => src?.includes("/assets/entry.client-"))).toBe(true);
  expect(raw.styles.length).toBeGreaterThan(0);
  for (const asset of [...raw.scripts, ...raw.styles]) {
    expect(asset, "Prerendered assets must be local production bundles").toMatch(
      /^\/assets\/.+\.(?:js|css)$/,
    );
  }
  const preset = themePresets[config.theme.preset];
  expect(Object.keys(preset).sort()).toEqual(Object.keys(tokenNames).sort());
  const expectations = (Object.keys(tokenNames) as ThemeTokenName[]).map((token) => ({
    token,
    property: tokenNames[token],
    value: (config.theme.overrides?.[token] ?? preset[token]).trim(),
  }));
  const tokens = await page.evaluate((entries) => {
    const computed = getComputedStyle(document.documentElement);
    const expectedStyle = document.createElement("span").style;
    return entries.map(({ token, property, value }) => {
      expectedStyle.setProperty(property, value);
      return {
        token,
        actual: computed.getPropertyValue(property).trim(),
        expected: expectedStyle.getPropertyValue(property).trim(),
      };
    });
  }, expectations);
  for (const token of tokens) {
    expect(token.expected, `${token.token} expected CSSOM value`).not.toBe("");
    expect(token.actual, token.token).toBe(token.expected);
  }
  await expect(page.locator("h1")).toHaveCount(1);
  await expectPageAssets(page);
});

// Give each real page an independent deadline and report, rather than sharing one
// total timeout across twelve unrelated navigations and all their lazy media.
for (const id of PAGE_IDS) {
  test(`core route: ${id} renders exact configured content or a genuine disabled 404`, async ({
    page,
    tenant,
  }) => {
    const entry = tenant.config.pages[id];
    if (entry.enabled) {
      const response = await gotoReady(page, entry.path);
      const raw = await rawDocument(page, await response.text());
      expect(raw.headings).toHaveLength(1);
      const heading = id === "home" ? tenant.config.brand.name : entry.navLabel;
      const title =
        entry.seo?.defaultTitle ??
        (id === "home"
          ? tenant.config.seo.defaultTitle
          : tenant.config.seo.titleTemplate.replaceAll("%s", heading));
      expect(raw.headings).toEqual([heading]);
      expect(raw.title).toBe(title);
      expect(raw.hydrated).toBe(false);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("main h1")).toHaveText(heading);
      await expect(page).toHaveTitle(title);
      await expectPageAssets(page);
    } else {
      const builtHtml = await readFile(new URL("../../dist/404.html", import.meta.url), "utf8");
      await expectNotFound(page, entry.path, builtHtml);
    }
  });
}

test("configured primary links and dropdown children navigate through the real UI", async ({
  page,
  tenant,
}) => {
  const { config } = tenant;
  await gotoReady(page, config.pages.home.path);
  const mobile = page.viewportSize()!.width < 1024;
  const links = internalLinks(config);
  expect(links.length).toBeGreaterThan(0);
  for (const { link, group } of links) {
    await test.step(`${group ? `${group} / ` : ""}${link.label}`, async () => {
      let navigation: Locator;
      if (mobile) {
        await page.getByRole("button", { name: "Open menu", exact: true }).click();
        const dialog = page.getByRole("dialog", { name: "Menu", exact: true });
        await expect(dialog).toBeVisible();
        navigation = dialog.getByRole("navigation", { name: "Primary", exact: true });
      } else {
        navigation = page
          .locator("header")
          .getByRole("navigation", { name: "Primary", exact: true });
        if (group) {
          const trigger = navigation.getByRole("button", { name: group, exact: true });
          await trigger.click();
          await expect(trigger).toHaveAttribute("aria-expanded", "true");
        }
      }
      const target = navigation.getByRole("link", { name: link.label, exact: true });
      const path = config.pages[link.pageId].path;
      await expect(target).toHaveAttribute("href", path);
      await target.click();
      await waitForReady(page, path);
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(page.locator("main h1")).toBeFocused();
      await expectNoOverflow(page);
    });
  }
});

test("home primary CTA is reachable and actionable using only the keyboard", async ({
  page,
  tenant,
}) => {
  const { config } = tenant;
  const cta = config.brand.primaryCta;
  expect(cta.kind, "This smoke journey must never activate an external CTA").toBe("page");
  if (cta.kind !== "page") throw new Error("An internal primary CTA is required");
  expect(config.pages[cta.pageId].enabled).toBe(true);
  await gotoReady(page, config.pages.home.path);
  const target = page.locator("main").getByRole("link", { name: cta.label, exact: true }).first();
  await expect(target).toHaveAttribute("href", config.pages[cta.pageId].path);
  await tabTo(page, target);
  await page.keyboard.press("Enter");
  await waitForReady(page, config.pages[cta.pageId].path);
  await expect(page.locator("main h1")).toBeFocused();
});

test("360px drawer traps both Tab directions, restores focus and closes on navigation", async ({
  page,
  tenant,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await gotoReady(page, tenant.config.pages.home.path);
  const trigger = page.getByRole("button", {
    name: "Open menu",
    exact: true,
    includeHidden: true,
  });
  await tabTo(page, trigger);
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Menu", exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute("aria-modal", "true");
  await expect(dialog).toHaveAccessibleName("Menu");
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  const controls = await tabbables(dialog);
  expect(controls.length).toBeGreaterThan(2);
  const first = controls[0]!;
  await expect(first).toBeFocused();
  // Full forward traversal plus last -> first; then first -> last and full reverse.
  for (let index = 0; index < controls.length; index++) {
    await expect(controls[index]!).toBeFocused();
    await expect(dialog.locator(":focus")).toHaveCount(1);
    await page.keyboard.press("Tab");
  }
  await expect(first).toBeFocused();
  for (let index = controls.length - 1; index >= 0; index--) {
    await page.keyboard.press("Shift+Tab");
    await expect(controls[index]!).toBeFocused();
    await expect(dialog.locator(":focus")).toHaveCount(1);
  }
  await expect(first).toBeFocused();
  await expectNoOverflow(page);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  // A second open closes via its labelled button, with no manually placed focus.
  await page.keyboard.press("Enter");
  await expect(dialog).toBeVisible();
  const close = dialog.getByRole("button", { name: "Close", exact: true });
  await tabTo(page, close);
  await page.keyboard.press("Enter");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(dialog).toBeVisible();
  const destination = internalLinks(tenant.config).find(({ link }) => link.pageId !== "home");
  if (!destination) throw new Error("A non-home internal navigation link is required");
  const link = dialog
    .getByRole("navigation", { name: "Primary", exact: true })
    .getByRole("link", { name: destination.link.label, exact: true });
  await tabTo(page, link);
  await page.keyboard.press("Enter");
  await waitForReady(page, tenant.config.pages[destination.link.pageId].path);
  await expect(dialog).toHaveCount(0);
  await expect(page.locator("main h1")).toBeFocused();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
});

test("general enquiry validates accessibly and never sends or reports fake success", async ({
  page,
  context,
  tenant,
}, testInfo) => {
  const { config, content } = tenant;
  for (const settings of Object.values(config.integrations.forms)) {
    expect(settings.endpoint, "No E2E smoke test may contact a form provider").toBeUndefined();
  }
  const settings = config.integrations.forms.generalEnquiry;
  expect(settings.enabled).toBe(true);
  expect(config.pages.contact.enabled).toBe(true);
  const section = content.pageSections?.contact?.find(
    (entry) =>
      entry.type === "enquiryForm" && entry.formId === "generalEnquiry" && entry.enabled !== false,
  );
  expect(section, "Contact must actually compose its general enquiry form").toBeDefined();
  const title = section?.heading?.trim() || settings.title || "General enquiry";
  const response = await gotoReady(page, config.pages.contact.path);
  const raw = await rawDocument(page, await response.text());
  // Check the no-JS control contract in the actual response, not the hydrated DOM.
  // A separate javaScriptEnabled:false browser context is intentionally optional.
  expect(raw.forms.length).toBeGreaterThan(0);
  for (const staticForm of raw.forms) {
    expect(staticForm.controls.length).toBeGreaterThan(0);
    expect(staticForm.controls.every(Boolean), "Raw form controls must be disabled").toBe(true);
  }
  await expectPageAssets(page);
  const form = page.getByRole("form", { name: title, exact: true });
  const submit = form.getByRole("button", {
    name: settings.submitLabel || "Validate demonstration",
    exact: true,
  });
  await expect(submit).toBeEnabled();
  await form.scrollIntoViewIfNeeded();
  const submissions: { url: string; method: string; type: string }[] = [];
  const record = (request: Request) => {
    if (
      ["fetch", "xhr", "document", "ping"].includes(request.resourceType()) ||
      request.method() !== "GET"
    ) {
      const url = new URL(request.url());
      submissions.push({
        url: `${url.origin}${url.pathname}`,
        method: request.method(),
        type: request.resourceType(),
      });
    }
  };
  // Also abort local GET submissions before delivery. Asset loading still uses the
  // automatic guard; no response is mocked or fabricated into a successful send.
  await context.route("**/*", async (route) => {
    const request = route.request();
    if (
      ["fetch", "xhr", "document", "ping"].includes(request.resourceType()) ||
      request.method() !== "GET"
    ) {
      await route.abort("blockedbyclient");
    } else {
      await route.fallback();
    }
  });
  context.on("request", record);
  try {
    const needsConsent = settings.consentEnabled ?? Boolean(settings.consentText?.trim());
    const required = [...settings.requiredFields, ...(needsConsent ? ["consent"] : [])];
    if (needsConsent) await expect(form.locator('[name="consent"]')).not.toBeChecked();
    await expect(form.getByRole("status")).toBeEmpty();
    await submit.click();
    const summary = form.getByRole("alert", {
      name: "Please correct the following fields",
      exact: true,
    });
    await expect(summary).toBeFocused();
    await expect(summary.getByRole("link")).toHaveCount(required.length);
    await expect(form.locator('[aria-invalid="true"]')).toHaveCount(required.length);
    for (const name of required) {
      const control = form.locator(`[name="${name}"]`);
      await expect(control).toHaveAttribute("aria-invalid", "true");
      await expect(control).toHaveJSProperty("required", true);
      const id = await control.getAttribute("id");
      expect(id).toBeTruthy();
      const describedBy = (await control.getAttribute("aria-describedby"))?.split(/\s+/) ?? [];
      expect(describedBy.length).toBeGreaterThan(0);
      for (const descriptionId of describedBy) {
        const description = page.locator(`[id="${descriptionId}"]`);
        await expect(description).toBeVisible();
        await expect(description).not.toBeEmpty();
      }
      const summaryLink = summary.locator(`a[href="#${id}"]`);
      await expect(summaryLink).toHaveCount(1);
      await summaryLink.click();
      await expect(control).toBeFocused();
    }
    const values: Record<FormFieldId, string> = {
      name: "Fictional E2E Person",
      email: "fictional-e2e@example.com",
      phone: "+44 7700 900123",
      message: "Fictional test enquiry only. Do not send or store this demonstration.",
      program: "Fictional sample programme",
      organisation: "Fictional E2E Organisation",
    };
    for (const control of await form
      .locator('input:not([type="checkbox"]):not([name="website"]), textarea')
      .all()) {
      const name = await control.getAttribute("name");
      expect(name !== null && Object.hasOwn(values, name)).toBe(true);
      await control.fill(values[name as FormFieldId]);
    }
    if (needsConsent) await form.locator('[name="consent"]').check();
    await expect(form.locator('[name="website"]')).toHaveValue("");
    await submit.click();
    await expect(form.getByRole("status")).toHaveText(
      "Demonstration only. Nothing was submitted to a server.",
    );
    await expect(form.locator('[aria-invalid="true"]')).toHaveCount(0);
    await expect(form.getByRole("alert")).toHaveCount(0);
    await expect(form.getByText(settings.successMessage, { exact: true })).toHaveCount(0);
    await expect(submit).toBeEnabled();
    await expectNoOverflow(page);
  } finally {
    await testInfo.attach("demo-submission-requests.json", {
      contentType: "application/json",
      body: JSON.stringify(submissions, null, 2),
    });
    expect(
      submissions,
      "Demo validation must make no fetch/XHR/document/beacon or write request",
    ).toEqual([]);
    // Interception and listeners intentionally remain until fixture context teardown.
  }
});

test("unknown nested URL serves the built noindex 404 and recovers with the keyboard", async ({
  page,
  tenant,
}) => {
  const path = "/__e2e-missing__/nested/unavailable";
  const builtHtml = await readFile(new URL("../../dist/404.html", import.meta.url), "utf8");
  await expectNotFound(page, path, builtHtml);
  const recovery = page
    .locator("main")
    .getByRole("link", { name: tenant.config.pages.home.navLabel, exact: true });
  await expect(recovery).toHaveAttribute("href", tenant.config.pages.home.path);
  await tabTo(page, recovery);
  await page.keyboard.press("Enter");
  await waitForReady(page, tenant.config.pages.home.path);
  await expect(page.locator("main h1")).toBeFocused();
  await expect(page.locator("h1")).toHaveCount(1);
});
