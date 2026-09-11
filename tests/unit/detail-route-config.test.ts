// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { config, content } from "@/site";
import {
  detailRoutesSchema,
  tenantConfigSchema,
  type DetailRoutesConfig,
} from "@/config/tenant-schema";
import { createConfiguredRoutes, getPrerenderPaths } from "@/routes/configured-routes";
import {
  DETAIL_COLLECTIONS,
  DETAIL_PARENTS,
  collectionRoutes,
  createRouteManifest,
  createRouteMeta,
  detailPath,
  findPublicRoute,
  getIndexableRoutes,
  requirePublicRoute,
} from "@/routes/route-manifest";
import { withDetailContent, type TenantModule } from "../fixtures/route-content";

let tenant: TenantModule;

beforeEach(async () => {
  tenant = withDetailContent({
    config: structuredClone(config),
    content: structuredClone(content),
  });
  // Keep these contract tests independent of the tenants' chosen production bases.
  delete tenant.config.detailRoutes;
  tenant.content.departments = [
    {
      slug: "example-unit",
      name: "Example unit",
      summary: "A sample unit.",
      body: ["Sample description."],
      isDemoContent: true,
    },
  ];
  // Replacing departments must also replace the full catalogue's relationships.
  for (const program of tenant.content.programs) program.departmentSlug = "example-unit";
  for (const person of tenant.content.people) person.departmentSlug = "example-unit";
  for (const collection of DETAIL_COLLECTIONS) {
    tenant.config.pages[DETAIL_PARENTS[collection]].enabled = true;
    tenant.config.contentSources[collection] = "local";
    expect(tenant.content[collection].length).toBeGreaterThan(0);
  }
});

afterEach(() => vi.restoreAllMocks());

function enableExplicitRoutes(): void {
  tenant.config.detailRoutes = {};
  for (const collection of DETAIL_COLLECTIONS) {
    tenant.config.detailRoutes[collection] = {
      enabled: true,
      path: `/details/${collection}`,
      aliases: [`/legacy/${collection}`, `/older/${collection}`],
    };
  }
}

describe("optional detail-route configuration", () => {
  it("preserves absence and accepts an empty or partial record without defaults", () => {
    const { config } = tenant;
    expect(tenantConfigSchema.parse(config)).not.toHaveProperty("detailRoutes");
    expect(detailRoutesSchema.parse({})).toEqual({});
    const settings: DetailRoutesConfig = {
      programs: { enabled: true, path: "/services" },
    };
    expect(tenantConfigSchema.parse({ ...config, detailRoutes: settings }).detailRoutes).toEqual(
      settings,
    );
  });

  it.each(DETAIL_COLLECTIONS)("accepts the existing %s collection", (collection) => {
    const detailRoutes = {
      [collection]: { enabled: true, path: `/details/${collection}`, aliases: [] },
    };
    expect(tenantConfigSchema.parse({ ...tenant.config, detailRoutes }).detailRoutes).toEqual(
      detailRoutes,
    );
  });

  it.each(["services", "faculty", "team", "gallery", "unknown"])(
    "rejects %s as a collection key rather than silently dropping it",
    (collection) => {
      const detailRoutes = { [collection]: { enabled: true, path: "/details" } };
      expect(tenantConfigSchema.safeParse({ ...tenant.config, detailRoutes }).success).toBe(false);
    },
  );

  it.each([
    { path: "/services" },
    { enabled: true },
    { enabled: "true", path: "/services" },
    { enabled: true, path: "/services", extra: true },
    { enabled: true, path: "/services", aliases: "/programs" },
    { enabled: true, path: "/services", aliases: ["/services"] },
    { enabled: true, path: "/services", aliases: ["/programs", "/programs"] },
  ])("rejects missing, invalid, extra or duplicate settings: %j", (settings) => {
    expect(
      tenantConfigSchema.safeParse({ ...tenant.config, detailRoutes: { programs: settings } })
        .success,
    ).toBe(false);
  });

  it.each([
    "/",
    "/services/:slug",
    "/services/",
    "services",
    "/../secret",
    "/%2e%2e",
    "/with_underscore",
    "/with?query",
    "/with#fragment",
    "//outside",
    "/services\\other",
    "/services\n",
  ])("rejects unsafe/pattern/root base %s for both canonical and aliases", (path) => {
    expect(detailRoutesSchema.safeParse({ programs: { enabled: true, path } }).success).toBe(false);
    expect(
      detailRoutesSchema.safeParse({
        programs: { enabled: false, path: "/services", aliases: [path] },
      }).success,
    ).toBe(false);
  });
});

describe("canonical paths and backward compatibility", () => {
  it("keeps the exact legacy detail entry shape", () => {
    const { config: testConfig, content: testContent } = withDetailContent({
      config: structuredClone(config),
      content: structuredClone(content),
    });
    delete testConfig.detailRoutes;
    const routes = createRouteManifest(testConfig, testContent);
    for (const collection of DETAIL_COLLECTIONS) {
      const pageId = DETAIL_PARENTS[collection];
      const parent = testConfig.pages[pageId].path;
      const segment = collection === "programs" ? "" : `/${collection}`;
      expect(collectionRoutes(routes, collection)).toEqual(
        testContent[collection].map((item) => ({
          kind: "detail",
          collection,
          pageId,
          slug: item.slug,
          path: `${parent}${segment}/${item.slug}`,
          title: "title" in item ? item.title : item.name,
          description:
            "excerpt" in item ? item.excerpt : "summary" in item ? item.summary : item.role,
        })),
      );
    }
    expect(createRouteManifest({ ...testConfig, detailRoutes: {} }, testContent)).toEqual(routes);
  });

  it("keeps explicit bases fixed while unspecified collections follow renamed parents", () => {
    const { config, content } = tenant;
    config.detailRoutes = {
      programs: { enabled: true, path: "/services", aliases: ["/programs"] },
      people: { enabled: true, path: "/team", aliases: ["/faculty"] },
    };
    const before = createRouteManifest(config, content);
    config.pages.programs.path = "/offerings";
    config.pages.about.path = "/company";
    config.pages.newsEvents.path = "/updates";
    const after = createRouteManifest(config, content);
    for (const entry of before.filter((route) => route.kind === "detail")) {
      if (entry.collection === "programs" || entry.collection === "people") {
        expect(requirePublicRoute(after, entry.path)).toEqual(entry);
      } else {
        expect(findPublicRoute(after, entry.path)).toBeUndefined();
        expect(
          requirePublicRoute(after, detailPath(config, entry.collection, entry.slug)),
        ).toMatchObject({ collection: entry.collection, slug: entry.slug });
      }
    }
    expect(detailPath(config, "departments", "example")).toBe("/offerings/departments/example");
    expect(detailPath(config, "news", "example")).toBe("/updates/news/example");
    expect(detailPath(config, "events", "example")).toBe("/updates/events/example");
  });

  it.each([
    ["/programs", "/faculty"],
    ["/services", "/team"],
  ])("supports explicit vocabulary %s and %s", (programs, people) => {
    const { config, content } = tenant;
    config.detailRoutes = {
      programs: { enabled: true, path: programs },
      people: { enabled: true, path: people },
    };
    const routes = createRouteManifest(config, content);
    for (const collection of ["programs", "people"] as const) {
      const base = collection === "programs" ? programs : people;
      for (const item of content[collection]) {
        expect(detailPath(config, collection, item.slug)).toBe(`${base}/${item.slug}`);
        expect(requirePublicRoute(routes, `${base}/${item.slug}`)).toMatchObject({ collection });
      }
    }
  });

  it.each(["", "../secret", "with/slash", "a\\b", "%2e%2e", "a?b", "a#b", "/root", "A", "safe\n"])(
    "rejects malformed slug %j in the public helper and manifest",
    (slug) => {
      const { config, content } = tenant;
      expect(() => detailPath(config, "programs", slug)).toThrow(/Invalid detail path slug/);
      enableExplicitRoutes();
      expect(() => detailPath(config, "programs", slug)).toThrow(/Invalid detail path slug/);
      content.programs[0]!.slug = slug;
      expect(() => createRouteManifest(config, content)).toThrow(/Invalid detail path slug/);
    },
  );

  it("rejects an invalid explicit base even when called outside schema validation", () => {
    tenant.config.detailRoutes = { programs: { enabled: true, path: "/../services" } };
    expect(() => detailPath(tenant.config, "programs", "valid-slug")).toThrow(/detail path base/);
    expect(() => createRouteManifest(tenant.config, tenant.content)).toThrow();
  });
});

describe.each(DETAIL_COLLECTIONS)("detail route gates: %s", (collection) => {
  it.each(["parent", "source", "settings"] as const)(
    "disabling %s removes canonical and every alias, including prerender registration",
    async (gate) => {
      enableExplicitRoutes();
      const { config, content } = tenant;
      const before = createRouteManifest(config, content).filter(
        (entry) => entry.kind === "detail" && entry.collection === collection,
      );
      expect(before).toHaveLength(content[collection].length * 3);
      if (gate === "parent") config.pages[DETAIL_PARENTS[collection]].enabled = false;
      if (gate === "source") config.contentSources[collection] = "none";
      if (gate === "settings") config.detailRoutes![collection]!.enabled = false;
      const routes = createRouteManifest(config, content);
      const indexable = getIndexableRoutes(config, content);
      for (const entry of before) {
        expect(findPublicRoute(routes, entry.path)).toBeUndefined();
        expect(() => requirePublicRoute(routes, entry.path)).toThrow();
        expect(indexable.some((route) => route.path === entry.path)).toBe(false);
        expect(routes.map((r) => r.path)).not.toContain(entry.path);
      }
      expect(collectionRoutes(routes, collection)).toEqual([]);
    },
  );
});

describe("detail collisions", () => {
  it.each([true, false])(
    "reserves enabled=%s core paths against canonical and aliases",
    (enabled) => {
      const { config, content } = tenant;
      config.detailRoutes = {
        programs: { enabled: true, path: "/services", aliases: ["/legacy"] },
      };
      for (const base of ["/services", "/legacy"]) {
        config.pages.downloads = {
          ...config.pages.downloads,
          enabled,
          path: `${base}/${content.programs[0]!.slug}`,
        };
        expect(() => createRouteManifest(config, content)).toThrow(/conflicting detail path/);
      }
    },
  );

  it.each([
    ["/services", "/team", ["/services"]],
    ["/services", "/legacy", []],
    ["/services", "/team", ["/legacy"]],
    ["/services", "/services", []],
  ] as const)(
    "rejects overlapping canonical/alias paths: %j %j %j",
    (programs, people, aliases) => {
      const { config, content } = tenant;
      content.people[0]!.slug = content.programs[0]!.slug;
      config.detailRoutes = {
        programs: { enabled: true, path: programs, aliases: ["/legacy"] },
        people: { enabled: true, path: people, aliases: [...aliases] },
      };
      expect(() => createRouteManifest(config, content)).toThrow(/conflicting detail path/);
    },
  );

  it("allows a base to share a core listing path without treating the base as a page", () => {
    const { config, content } = tenant;
    config.detailRoutes = { programs: { enabled: true, path: config.pages.programs.path } };
    expect(() => createRouteManifest(config, content)).not.toThrow();
  });

  it("rejects duplicate content slugs instead of deduplicating conflicting routes", () => {
    enableExplicitRoutes();
    tenant.content.programs.push(tenant.content.programs[0]!);
    expect(() => createRouteManifest(tenant.config, tenant.content)).toThrow(
      /conflicting detail path/,
    );
  });
});

describe("alias metadata, indexing and registration", () => {
  it("shares the complete canonical metadata and omits aliases from card/index lists", () => {
    enableExplicitRoutes();
    const { config, content } = tenant;
    const routes = createRouteManifest(config, content);
    const indexable = getIndexableRoutes(config, content);
    expect(indexable).toEqual(routes.filter((entry) => !entry.isAlias));
    for (const collection of DETAIL_COLLECTIONS) {
      const cards = collectionRoutes(routes, collection);
      expect(cards).toHaveLength(content[collection].length);
      expect(cards.every((entry) => !entry.isAlias)).toBe(true);
    }
    for (const alias of routes.filter((entry) => entry.isAlias)) {
      expect(alias.canonicalPath).toBeDefined();
      const primary = requirePublicRoute(routes, alias.canonicalPath!);
      expect(primary.isAlias).toBeUndefined();
      expect(createRouteMeta(config, alias)).toEqual(createRouteMeta(config, primary));
      expect(createRouteMeta(config, alias)).toEqual(
        expect.arrayContaining([
          { tagName: "link", rel: "canonical", href: `${config.siteUrl}${primary.path}` },
          { property: "og:url", content: `${config.siteUrl}${primary.path}` },
        ]),
      );
      expect(requirePublicRoute(routes, `${alias.path}/`)).toEqual(alias);
      expect(indexable).not.toContainEqual(alias);
    }
  });

  it("excludes noindex pages/details without removing their prerendered HTML", async () => {
    enableExplicitRoutes();
    const { config, content } = tenant;
    config.seo.robots = "noindex,nofollow";
    expect(getIndexableRoutes(config, content)).toEqual([]);
    const routes = createRouteManifest(config, content);
    expect(routes.map((entry) => entry.path)).toHaveLength(routes.length);
    expect(createRouteMeta(config, routes[0])).toContainEqual({
      name: "robots",
      content: "noindex,nofollow",
    });
  });

  it.each([
    ["NoInDeX , follow", false],
    ["index noindex follow", false],
    ["none", false],
    ["index, nofollow", true],
    ["index, noindexifembedded", true],
  ])("parses robots directives as whole case-insensitive tokens: %s", (robots, indexable) => {
    // Exercise the parser directly beyond today's deliberately narrow tenant SEO enum.
    Object.assign(tenant.config.seo, { robots });
    expect(getIndexableRoutes(tenant.config, tenant.content).length > 0).toBe(indexable);
  });

  it("still validates collisions when SEO has disabled indexing", () => {
    tenant.config.seo.robots = "noindex,nofollow";
    tenant.content.programs.push(tenant.content.programs[0]!);
    expect(() => getIndexableRoutes(tenant.config, tenant.content)).toThrow(
      /conflicting detail path/,
    );
  });

  it("registers/prerenders aliases with stable distinct IDs on the reused module", () => {
    const manifest = createRouteManifest(config, content);
    const registered = createConfiguredRoutes(true);
    expect(getPrerenderPaths()).toEqual(manifest.map((entry) => entry.path));
    expect(new Set(registered.map((entry) => entry.id)).size).toBe(registered.length);
    for (const entry of manifest.filter((route) => route.kind === "detail")) {
      expect(registered.find((route) => route.path === entry.path.slice(1))).toMatchObject({
        file: "routes/tenant-detail.tsx",
        caseSensitive: true,
        id: `public${entry.path.replaceAll("/", "__")}`,
      });
    }
    const previousIds = new Map(registered.map((entry) => [entry.path, entry.id]));
    for (const entry of createConfiguredRoutes(true)) {
      expect(entry.id).toBe(previousIds.get(entry.path));
    }
  });
});
