// @vitest-environment node
import { describe, expect, it } from "vitest";

import { config, content } from "@/site";
import { PAGE_IDS } from "@/config/tenant-schema";
import { createConfiguredRoutes, getPrerenderPaths } from "@/routes/configured-routes";
import {
  createRouteManifest,
  createRouteMeta,
  DETAIL_COLLECTIONS,
  DETAIL_PARENTS,
  detailPath,
  findPublicRoute,
  requirePublicRoute,
} from "@/routes/route-manifest";
import { withDetailContent } from "../fixtures/route-content";

describe("public route manifest", () => {
  it("registers/prerenders exactly enabled pages and present details, with unique IDs", () => {
    const manifest = createRouteManifest(config, content);
    const registered = createConfiguredRoutes(true);
    expect(registered.at(-1)).toMatchObject({ path: "*", file: "routes/not-found.tsx" });
    expect(new Set(registered.map((entry) => entry.id)).size).toBe(registered.length);
    expect(registered.slice(0, -1).map((entry) => (entry.index ? "/" : `/${entry.path}`))).toEqual(
      manifest.map((entry) => entry.path),
    );
    expect(
      registered
        .filter((entry) => !entry.index && entry.path !== "*")
        .every((entry) => entry.caseSensitive),
    ).toBe(true);
    expect(getPrerenderPaths()).toEqual(manifest.map((entry) => entry.path));
    expect(manifest.some((entry) => entry.path === "/__styleguide")).toBe(false);

    for (const pageId of PAGE_IDS) {
      const page = config.pages[pageId];
      expect(Boolean(findPublicRoute(manifest, page.path))).toBe(page.enabled);
    }
    for (const collection of DETAIL_COLLECTIONS) {
      for (const item of content[collection]) {
        expect(
          requirePublicRoute(manifest, detailPath(config, collection, item.slug)),
        ).toMatchObject({
          kind: "detail",
          collection,
          slug: item.slug,
        });
      }
    }
  });

  it("rejects unknown, malformed and disabled URLs", () => {
    const routes = createRouteManifest(config, content);
    const invalid = [
      "/not-a-page",
      "/ABOUT",
      "/about/extra",
      "/about//",
      "//about",
      "/%61bout",
      "/../about",
      "/__styleguide",
      `${config.pages.programs.path}/missing-slug`,
      `${config.pages.programs.path}/primary-years/extra`,
    ];
    for (const path of invalid) {
      expect(findPublicRoute(routes, path)).toBeUndefined();
      try {
        requirePublicRoute(routes, path);
        expect.unreachable(`Expected a 404 for ${path}`);
      } catch (error) {
        expect(error).toBeInstanceOf(Response);
        expect((error as Response).status).toBe(404);
      }
    }
    expect(
      findPublicRoute(routes, detailPath(config, "programs", "unknown-program-slug")),
    ).toBeUndefined();
  });

  it("gives every page/detail its own title, description and canonical URL", () => {
    for (const entry of createRouteManifest(config, content)) {
      const meta = createRouteMeta(config, entry);
      expect(meta).toContainEqual({
        tagName: "link",
        rel: "canonical",
        href: `${config.siteUrl}${entry.canonicalPath ?? entry.path}`,
      });
      if (entry.path !== "/") {
        expect(findPublicRoute(createRouteManifest(config, content), `${entry.path}/`)).toEqual(
          entry,
        );
      }
      expect(meta).toContainEqual({ name: "description", content: entry.description });
      expect(meta).toContainEqual({
        title:
          entry.pageId === "home"
            ? config.seo.defaultTitle
            : config.seo.titleTemplate.replaceAll("%s", entry.title),
      });
    }
    const missing = createRouteMeta(config);
    expect(missing).toContainEqual({ name: "robots", content: "noindex,nofollow" });
    expect(missing.some((tag) => "rel" in tag && tag.rel === "canonical")).toBe(false);
  });

  it("supports news, events and people without claiming nonexistent collection records", () => {
    const testSite = withDetailContent({
      config: structuredClone(config),
      content: structuredClone(content),
    });
    const routes = createRouteManifest(testSite.config, testSite.content);
    for (const collection of DETAIL_COLLECTIONS) {
      for (const item of testSite.content[collection]) {
        expect(
          findPublicRoute(routes, detailPath(testSite.config, collection, item.slug)),
        ).toMatchObject({
          kind: "detail",
          collection,
          slug: item.slug,
        });
      }
    }
  });

  it("renames details with their parent and removes them with parent/source flags", () => {
    const testSite = withDetailContent({
      config: structuredClone(config),
      content: structuredClone(content),
    });
    delete testSite.config.detailRoutes;
    const original = createRouteManifest(testSite.config, testSite.content);
    testSite.config.pages.programs.path = "/services";
    testSite.config.pages.newsEvents.path = "/updates";
    testSite.config.pages.about.path = "/company";
    const renamed = createRouteManifest(testSite.config, testSite.content);
    for (const entry of original.filter((candidate) => candidate.kind === "detail")) {
      expect(findPublicRoute(renamed, entry.path)).toBeUndefined();
      expect(
        findPublicRoute(renamed, detailPath(testSite.config, entry.collection, entry.slug)),
      ).toBeDefined();
    }
    for (const collection of DETAIL_COLLECTIONS) {
      const sourceDisabled = structuredClone(testSite.config);
      sourceDisabled.contentSources[collection] = "none";
      expect(
        createRouteManifest(sourceDisabled, testSite.content).some(
          (entry) => entry.kind === "detail" && entry.collection === collection,
        ),
      ).toBe(false);
      const pageDisabled = structuredClone(testSite.config);
      pageDisabled.pages[DETAIL_PARENTS[collection]].enabled = false;
      expect(
        createRouteManifest(pageDisabled, testSite.content).some(
          (entry) => entry.kind === "detail" && entry.collection === collection,
        ),
      ).toBe(false);
    }
  });
});

describe("route configuration safeguards", () => {
  it("includes styleguide in development routes but not production", () => {
    const devRoutes = createConfiguredRoutes(false);
    expect(devRoutes.some((entry) => entry.path === "__styleguide")).toBe(true);
    const prodRoutes = createConfiguredRoutes(true);
    expect(prodRoutes.some((entry) => entry.path === "__styleguide")).toBe(false);
  });

  it("honours per-page SEO overrides without applying them to every child", () => {
    const testSite = withDetailContent({
      config: structuredClone(config),
      content: structuredClone(content),
    });
    testSite.config.pages.programs.seo = {
      defaultTitle: "Custom listing",
      defaultDescription: "Custom description.",
    };
    const routes = createRouteManifest(testSite.config, testSite.content);
    expect(
      createRouteMeta(
        testSite.config,
        requirePublicRoute(routes, testSite.config.pages.programs.path),
      ),
    ).toEqual(
      expect.arrayContaining([
        { title: "Custom listing" },
        { name: "description", content: "Custom description." },
      ]),
    );
    const child = routes.find(
      (entry) => entry.kind === "detail" && entry.collection === "programs",
    );
    expect(createRouteMeta(testSite.config, child)).not.toContainEqual({ title: "Custom listing" });
  });

  it("fails duplicate/slash/traversal slugs and collisions even with disabled core paths", () => {
    const tenant = { config: structuredClone(config), content: structuredClone(content) };
    for (const slug of ["../secret", "with/slash", "bad%20slug"]) {
      const { config: testConfig, content: testContent } = structuredClone(tenant);
      testContent.programs[0]!.slug = slug;
      expect(() => createRouteManifest(testConfig, testContent)).toThrow(/detail path/);
    }
    const { config: testConfig, content: testContent } = structuredClone(tenant);
    testContent.programs.push(testContent.programs[0]!);
    expect(() => createRouteManifest(testConfig, testContent)).toThrow(/conflicting detail path/);
    testContent.programs.pop();
    testConfig.pages.downloads = {
      ...testConfig.pages.downloads,
      enabled: false,
      path: detailPath(testConfig, "programs", testContent.programs[0]!.slug),
    };
    expect(() => createRouteManifest(testConfig, testContent)).toThrow(/conflicting detail path/);
    testConfig.pages.downloads.path = "/about";
    expect(() => createRouteManifest(testConfig, testContent)).toThrow(
      /duplicate configured page path/,
    );
  });
});
