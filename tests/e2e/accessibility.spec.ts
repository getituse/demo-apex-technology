import AxeBuilder from "@axe-core/playwright";

import { collectionRoutes, createRouteManifest } from "../../src/routes/route-manifest";
import { expect, gotoReady, test } from "./fixtures";

const keyRoutes = ["home", "about", "programs", "detail", "newsEvents", "contact"] as const;

test.describe("accessibility: six configured key routes", () => {
  for (const key of keyRoutes) {
    test(key, async ({ page, tenant, isMobile }, testInfo) => {
      const { config, content } = tenant;
      const manifest = createRouteManifest(config, content);
      // collectionRoutes excludes aliases and the manifest excludes disabled details.
      const entry =
        key === "detail"
          ? collectionRoutes(manifest, "programs")[0]
          : manifest.find((route) => route.kind === "page" && route.pageId === key);
      expect(entry, `${config.id} must configure an enabled ${key} route`).toBeDefined();
      if (!entry) throw new Error(`Missing required ${key} route for ${config.id}`);
      if (key !== "detail") {
        expect(config.pages[key].enabled).toBe(true);
        expect(entry.path).toBe(config.pages[key].path);
      } else {
        expect(entry.kind).toBe("detail");
        expect(entry.isAlias).not.toBe(true);
      }

      await test.step(`${config.id}: ${entry.path}`, async () => {
        // Includes the fixture's hydration marker, visible H1 and document.fonts.ready.
        await gotoReady(page, entry.path);
        await expect(page.getByRole("banner")).toBeVisible();
        await expect(page.getByRole("contentinfo")).toBeVisible();

        // Default axe rules cover WCAG 2 A/AA, 2.1 AA, 2.2 AA and best practices.
        // No include/exclude, rule disabling or DOM masks: shared chrome is in scope.
        const results = await new AxeBuilder({ page }).analyze();
        const summaries = results.violations.map((violation) => ({
          id: violation.id,
          impact: violation.impact,
          description: violation.description,
          help: violation.help,
          helpUrl: violation.helpUrl,
          tags: violation.tags,
          nodes: violation.nodes.map((node) => ({
            impact: node.impact,
            target: node.target,
            html: node.html,
            failureSummary: node.failureSummary,
          })),
        }));
        const blocking = summaries.filter(
          (violation) => violation.impact === "serious" || violation.impact === "critical",
        );

        // Attach before assertions, retaining all severities and incomplete results.
        await testInfo.attach(`axe-${key}-results.json`, {
          contentType: "application/json",
          body: JSON.stringify(results, null, 2),
        });
        await testInfo.attach(`axe-${key}-violations.json`, {
          contentType: "application/json",
          body: JSON.stringify(
            {
              project: testInfo.project.name,
              tenant: config.id,
              route: key,
              path: entry.path,
              viewport: page.viewportSize(),
              blockingCount: blocking.length,
              violations: summaries,
            },
            null,
            2,
          ),
        });

        expect.soft(blocking, `Full-page serious/critical axe findings: ${entry.path}`).toEqual([]);
        await expect.soft(page.locator("h1"), "Exactly one H1 across the full page").toHaveCount(1);
        await expect.soft(page.locator("main h1")).toBeVisible();
        await expect.soft(page.locator("main h1")).toHaveText(entry.title);

        const viewport = page.viewportSize();
        expect(viewport, "Key-route projects must configure a viewport").not.toBeNull();
        if (!viewport) throw new Error("Missing configured viewport");
        if (isMobile || viewport.width < 768) {
          expect.soft(viewport.width, "Mobile accessibility coverage must run at 360px").toBe(360);
        }
        const dimensions = await page.evaluate(() => ({
          viewport: document.documentElement.clientWidth,
          innerWidth: window.innerWidth,
          contentWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
        }));
        expect
          .soft(dimensions.innerWidth, "No widened mobile layout viewport")
          .toBe(viewport.width);
        expect
          .soft(dimensions.contentWidth, `Full-page horizontal overflow at ${viewport.width}px`)
          .toBeLessThanOrEqual(dimensions.viewport);
      });
    });
  }
});
