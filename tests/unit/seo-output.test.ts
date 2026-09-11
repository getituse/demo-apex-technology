import { describe, expect, it } from "vitest";

import { tenantContentSchema } from "@/config/content-schema";
import { config, content } from "@/site";
import {
  ORGANIZATION_SCHEMA_TYPES,
  ORGANIZATION_TYPES,
  pageConfigSchema,
  type OrganizationType,
} from "@/config/tenant-schema";
import { getPrerenderPaths } from "@/routes/configured-routes";
import {
  createRouteManifest,
  createRouteMeta,
  findPublicRoute,
  getIndexableRoutes,
  requirePublicRoute,
  routeRobots,
} from "@/routes/route-manifest";
import { createSitemap } from "@/routes/static-artifacts";
import { createStructuredData, type JsonLdNode, type JsonLdValue } from "@/routes/structured-data";

async function tenantFixture() {
  return { config: structuredClone(config), content: structuredClone(content) };
}

function graphNodes(data: JsonLdNode): JsonLdNode[] {
  expect(data["@context"]).toBe("https://schema.org");
  const graph = data["@graph"];
  if (
    !Array.isArray(graph) ||
    graph.some((node) => node === null || typeof node !== "object" || Array.isArray(node))
  ) {
    throw new Error("Expected a JSON-LD object graph");
  }
  return graph as JsonLdNode[];
}

function nodeOfType(graph: JsonLdNode[], type: string): JsonLdNode {
  const matches = graph.filter((node) => node["@type"] === type);
  expect(matches, type).toHaveLength(1);
  return matches[0]!;
}

function nestedKeys(value: JsonLdValue): string[] {
  if (Array.isArray(value)) return value.flatMap(nestedKeys);
  if (value === null || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, child]) => [key, ...nestedKeys(child)]);
}

function sitemapLocations(xml: string): string[] {
  const document = new DOMParser().parseFromString(xml, "application/xml");
  expect(document.querySelector("parsererror")).toBeNull();
  expect(document.documentElement.localName).toBe("urlset");
  expect(document.documentElement.namespaceURI).toBe("http://www.sitemaps.org/schemas/sitemap/0.9");
  return Array.from(document.querySelectorAll("url > loc"), (node) => node.textContent ?? "");
}

const organizationTypes = {
  school: "School",
  college: "CollegeOrUniversity",
  university: "CollegeOrUniversity",
  academy: "EducationalOrganization",
  "training-center": "EducationalOrganization",
  "service-business": "Organization",
} as const satisfies Record<OrganizationType, string>;

describe("organization schema mapping", () => {
  it("exports the complete six-type mapping", () => {
    expect(Object.keys(organizationTypes).sort()).toEqual([...ORGANIZATION_TYPES].sort());
    expect(ORGANIZATION_SCHEMA_TYPES).toEqual(organizationTypes);
  });

  it.each(ORGANIZATION_TYPES)("maps %s with the correct default program kind", async (type) => {
    const { config, content } = await tenantFixture();
    config.organizationType = type;
    config.seo.structuredDataType = organizationTypes[type];
    const record = content.programs[0]!;
    delete record.structuredDataKind;
    const route = createRouteManifest(config, content).find(
      (entry) => entry.kind === "detail" && entry.collection === "programs" && !entry.isAlias,
    )!;
    const graph = graphNodes(createStructuredData(config, content, route));
    const organizationId = `${config.siteUrl}/#organization`;
    expect(nodeOfType(graph, organizationTypes[type])).toMatchObject({
      "@id": organizationId,
      name: config.brand.name,
      url: `${config.siteUrl}/`,
      logo: `${config.siteUrl}${config.brand.logo}`,
      email: config.contact.email,
      telephone: config.contact.phone,
      address: {
        "@type": "PostalAddress",
        streetAddress: config.contact.addressLines.join(", "),
        addressLocality: config.contact.locality,
        addressCountry: config.contact.country,
      },
      contactPoint: {
        "@type": "ContactPoint",
        email: config.contact.email,
        telephone: config.contact.phone,
        availableLanguage: config.supportedLocales,
      },
    });
    const expectedKind = type === "service-business" ? "Service" : "Course";
    expect(nodeOfType(graph, expectedKind)).toMatchObject({
      name: record.name,
      provider: { "@id": organizationId },
    });
    expect(
      graph.some((node) => node["@type"] === (expectedKind === "Course" ? "Service" : "Course")),
    ).toBe(false);
  });
});

describe("SEO output", () => {
  it("supplies complete metadata and one object descriptor on every public route", async () => {
    const { config, content } = await tenantFixture();
    for (const entry of createRouteManifest(config, content)) {
      const meta = createRouteMeta(config, entry, content);
      const title =
        entry.kind === "page" && entry.pageId === "home"
          ? config.seo.defaultTitle
          : config.seo.titleTemplate.replaceAll("%s", entry.title);
      const canonical = `${config.siteUrl}${entry.canonicalPath ?? entry.path}`;
      const image = `${config.siteUrl}${config.seo.ogImage}`;
      expect(meta, entry.path).toEqual(
        expect.arrayContaining([
          { title },
          { name: "description", content: entry.description },
          { tagName: "link", rel: "canonical", href: canonical },
          { name: "robots", content: config.seo.robots },
          { property: "og:title", content: title },
          { property: "og:description", content: entry.description },
          { property: "og:url", content: canonical },
          { property: "og:image", content: image },
          { property: "og:site_name", content: config.brand.name },
          { property: "og:locale", content: config.defaultLocale.replace("-", "_") },
          {
            property: "og:type",
            content: entry.kind === "detail" && entry.collection === "news" ? "article" : "website",
          },
          { name: "twitter:card", content: config.seo.twitterCard },
          { name: "twitter:title", content: title },
          { name: "twitter:description", content: entry.description },
          { name: "twitter:image", content: image },
        ]),
      );
      const descriptors = meta.filter((tag) => "script:ld+json" in tag);
      expect(descriptors).toEqual([
        { "script:ld+json": createStructuredData(config, content, entry) },
      ]);
      expect(createRouteMeta(config, entry).some((tag) => "script:ld+json" in tag)).toBe(false);
    }
  });

  it("keeps graph identities, fictional notices and alias breadcrumbs consistent", async () => {
    const { config, content } = await tenantFixture();
    const routes = createRouteManifest(config, content);
    expect(routes.some((entry) => entry.isAlias)).toBe(true);
    for (const entry of routes) {
      const data = createStructuredData(config, content, entry);
      const graph = graphNodes(data);
      const homeUrl = `${config.siteUrl}${config.pages.home.path}`;
      const pageUrl = `${config.siteUrl}${entry.canonicalPath ?? entry.path}`;
      const organization = nodeOfType(graph, organizationTypes[config.organizationType]);
      const expectedOrgDescription = config.legal.demoContentNotice
        ? `${config.brand.description} ${config.legal.demoContentNotice}`
        : config.brand.description;
      expect(organization.description).toBe(expectedOrgDescription);
      if (config.legal.demoContentNotice) {
        expect(organization.description).toMatch(/fictional|demonstration/i);
      }
      expect(nodeOfType(graph, "WebSite")).toMatchObject({
        "@id": `${homeUrl}#website`,
        url: homeUrl,
        publisher: { "@id": `${homeUrl}#organization` },
      });
      const page = nodeOfType(graph, "WebPage");
      expect(page).toMatchObject({
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: entry.title,
        description: entry.description,
        isPartOf: { "@id": `${homeUrl}#website` },
      });
      expect(new Set(graph.map((node) => node["@id"])).size).toBe(graph.length);
      if (entry.kind === "detail") {
        expect(nodeOfType(graph, "BreadcrumbList")).toEqual({
          "@type": "BreadcrumbList",
          "@id": `${pageUrl}#breadcrumbs`,
          itemListElement: [
            { "@type": "ListItem", position: 1, name: config.pages.home.navLabel, item: homeUrl },
            {
              "@type": "ListItem",
              position: 2,
              name: config.pages[entry.pageId].navLabel,
              item: `${config.siteUrl}${config.pages[entry.pageId].path}`,
            },
            { "@type": "ListItem", position: 3, name: entry.title, item: pageUrl },
          ],
        });
        expect(page.breadcrumb).toEqual({ "@id": `${pageUrl}#breadcrumbs` });
      } else {
        expect(graph.some((node) => node["@type"] === "BreadcrumbList")).toBe(false);
        expect(page).not.toHaveProperty("mainEntity");
      }
      if (entry.isAlias) {
        expect(data).toEqual(
          createStructuredData(config, content, requirePublicRoute(routes, entry.canonicalPath!)),
        );
      }
      const keys = nestedKeys(data);
      for (const key of [
        "offers",
        "aggregateRating",
        "ratingValue",
        "ratingCount",
        "reviewCount",
        "review",
        "reviews",
        "award",
        "awards",
        "accreditation",
        "accreditedBy",
        "hasCredential",
      ]) {
        expect(keys, `${entry.path}: ${key}`).not.toContain(key);
      }
    }
  });

  it("uses authored entities without inventing facts", async () => {
    const { config, content } = await tenantFixture();
    for (const entry of createRouteManifest(config, content)) {
      if (entry.kind !== "detail" || entry.isAlias) continue;
      const graph = graphNodes(createStructuredData(config, content, entry));
      const page = nodeOfType(graph, "WebPage");
      const entity = graph.find((node) => node["@id"] === `${config.siteUrl}${entry.path}#entity`);
      if (entry.collection === "people" || entry.collection === "departments") {
        expect(entity).toBeUndefined();
        expect(page).not.toHaveProperty("mainEntity");
        continue;
      }
      const record = content[entry.collection].find((item) => item.slug === entry.slug)!;
      expect(entity).toMatchObject({
        name: entry.title,
        url: `${config.siteUrl}${entry.path}`,
        mainEntityOfPage: { "@id": `${config.siteUrl}${entry.path}#webpage` },
        image: `${config.siteUrl}${record.image!.src}`,
      });
      expect(record.isDemoContent).toBe(false);
      expect(entity?.description).toContain(entry.description);
      if (record.isDemoContent) {
        expect(entity?.description).toMatch(/fictional demonstration/i);
        expect(entity?.description).toMatch(/not a real/i);
      }
      expect(page.mainEntity).toEqual({ "@id": `${config.siteUrl}${entry.path}#entity` });
      if (entry.collection === "news") {
        const article = content.news.find((item) => item.slug === entry.slug)!;
        expect(entity).toMatchObject({
          "@type": "NewsArticle",
          headline: article.title,
          datePublished: article.publishedAt,
          articleSection: article.category,
          articleBody: article.body.join("\n\n"),
          publisher: { "@id": `${config.siteUrl}/#organization` },
        });
        expect(entity).not.toHaveProperty("dateModified");
        expect(entity).not.toHaveProperty("author");
      } else if (entry.collection === "events") {
        const event = content.events.find((item) => item.slug === entry.slug)!;
        expect(entity).toMatchObject({
          "@type": "Event",
          startDate: event.startsAt,
          organizer: { "@id": `${config.siteUrl}/#organization` },
          location: { "@type": "Place", name: event.location },
        });
        if (event.endsAt) expect(entity?.endDate).toBe(event.endsAt);
        else expect(entity).not.toHaveProperty("endDate");
      } else {
        const program = content.programs.find((item) => item.slug === entry.slug)!;
        const kind = program.structuredDataKind ?? "Course";
        expect(entity).toMatchObject({
          "@type": kind,
          provider: { "@id": `${config.siteUrl}/#organization` },
        });
        if (kind === "Course") {
          expect(entity?.teaches).toEqual(program.highlights);
          expect(entity?.educationalLevel).toBe(program.levelLabel);
        } else {
          expect(entity).not.toHaveProperty("teaches");
          expect(entity).not.toHaveProperty("educationalLevel");
        }
      }
    }
  });

  it("omits structured data and canonical claims for unknown/404 descriptors", async () => {
    const { config, content } = await tenantFixture();
    const missing = findPublicRoute(createRouteManifest(config, content), "/not-a-real-route");
    expect(missing).toBeUndefined();
    const meta = createRouteMeta(config, missing, content);
    expect(meta).toContainEqual({ name: "robots", content: "noindex,nofollow" });
    expect(
      meta.some((tag) => "script:ld+json" in tag || ("rel" in tag && tag.rel === "canonical")),
    ).toBe(false);
  });

  it("sitemaps exactly canonical indexable routes, while prerender retains aliases", async () => {
    const { config, content } = await tenantFixture();
    const routes = createRouteManifest(config, content);
    const paths = getPrerenderPaths();
    const expected = routes.filter((entry) => !entry.isAlias);
    expect(getIndexableRoutes(config, content)).toEqual(expected);
    const locations = sitemapLocations(createSitemap(config, content));
    expect(locations).toEqual(expected.map((entry) => `${config.siteUrl}${entry.path}`));
    expect(new Set(locations).size).toBe(locations.length);
    expect(paths).toEqual(routes.map((entry) => entry.path));
    for (const alias of routes.filter((entry) => entry.isAlias)) {
      expect(paths).toContain(alias.path);
      expect(locations).not.toContain(`${config.siteUrl}${alias.path}`);
    }
    expect(paths).not.toContain("/__styleguide");
    expect(paths).not.toContain("/404");
  });

  it.each(["about", "programs", "newsEvents"] as const)(
    "noindex on %s excludes its children from indexing, not prerender",
    async (pageId) => {
      const { config, content } = await tenantFixture();
      const original = createRouteManifest(config, content);
      config.pages[pageId].seo = { robots: "noindex,nofollow" };
      const descendants = original.filter((entry) => entry.pageId === pageId);
      expect(descendants.some((entry) => entry.kind === "detail")).toBe(true);
      for (const entry of descendants) {
        expect(routeRobots(config, entry)).toBe("noindex,nofollow");
        expect(createRouteMeta(config, entry, content)).toContainEqual({
          name: "robots",
          content: "noindex,nofollow",
        });
      }
      const expected = original.filter((entry) => entry.pageId !== pageId && !entry.isAlias);
      expect(getIndexableRoutes(config, content)).toEqual(expected);
      expect(sitemapLocations(createSitemap(config, content))).toEqual(
        expected.map((entry) => `${config.siteUrl}${entry.path}`),
      );
      expect(original.map((entry) => entry.path)).toHaveLength(original.length);
    },
  );

  it("global noindex dominates page index directives without removing prerenders", async () => {
    const { config, content } = await tenantFixture();
    const original = createRouteManifest(config, content);
    config.seo.robots = "noindex,nofollow";
    for (const page of Object.values(config.pages)) page.seo = { robots: "index,follow" };
    for (const entry of original) {
      expect(routeRobots(config, entry)).toBe("noindex,nofollow");
      expect(createRouteMeta(config, entry, content)).toContainEqual({
        name: "robots",
        content: "noindex,nofollow",
      });
    }
    expect(getIndexableRoutes(config, content)).toEqual([]);
    expect(sitemapLocations(createSitemap(config, content))).toEqual([]);
    expect(original.map((entry) => entry.path)).toHaveLength(original.length);
  });
});

describe("tenant-specific metadata and overrides", () => {
  it.each(["home", "about", "programs", "contact"] as const)(
    "gives valid %s metadata",
    async (pageId) => {
      const { config, content } = await tenantFixture();
      const entry = requirePublicRoute(
        createRouteManifest(config, content),
        config.pages[pageId].path,
      );
      const meta = createRouteMeta(config, entry, content);
      const title = meta.flatMap((tag) => ("title" in tag ? [tag.title] : []))[0];
      expect(typeof title === "string" && title.length > 0).toBe(true);
      expect(typeof entry.description === "string" && entry.description.length > 0).toBe(true);
      const canonical = meta.flatMap((tag) =>
        "rel" in tag && tag.rel === "canonical" && "href" in tag ? [tag.href] : [],
      )[0];
      expect(typeof canonical === "string" && canonical.length > 0).toBe(true);
    },
  );

  it("validates page SEO overrides without replacing child copy", async () => {
    const { config, content } = await tenantFixture();
    expect(pageConfigSchema.safeParse(config.pages.programs).success).toBe(true);
    const override = {
      defaultTitle: "Custom catalogue & advice",
      defaultDescription: "A deliberately different listing description.",
      robots: "noindex,nofollow" as const,
      ogImage: `/tenants/${config.id}/custom-share.png`,
    };
    expect(pageConfigSchema.parse({ ...config.pages.programs, seo: override }).seo).toEqual(
      override,
    );
    expect(
      pageConfigSchema.safeParse({ ...config.pages.programs, seo: { robots: "unknown" } }).success,
    ).toBe(false);
    expect(
      pageConfigSchema.safeParse({
        ...config.pages.programs,
        seo: { ogImage: "javascript:alert(1)" },
      }).success,
    ).toBe(false);
    config.pages.programs.seo = override;
    config.seo.twitterSite = "@Example";
    const routes = createRouteManifest(config, content);
    const listing = requirePublicRoute(routes, config.pages.programs.path);
    expect(createRouteMeta(config, listing, content)).toEqual(
      expect.arrayContaining([
        { title: override.defaultTitle },
        { name: "description", content: override.defaultDescription },
        { name: "twitter:site", content: "@Example" },
      ]),
    );
    for (const entry of routes.filter((entry) => entry.pageId === "programs")) {
      const meta = createRouteMeta(config, entry, content);
      expect(meta).toEqual(
        expect.arrayContaining([
          { name: "robots", content: override.robots },
          { property: "og:image", content: `${config.siteUrl}${override.ogImage}` },
          { name: "twitter:image", content: `${config.siteUrl}${override.ogImage}` },
        ]),
      );
      if (entry.kind === "detail") {
        expect(meta).toContainEqual({
          title: config.seo.titleTemplate.replaceAll("%s", entry.title),
        });
        expect(meta).toContainEqual({ name: "description", content: entry.description });
        expect(entry.description).not.toBe(override.defaultDescription);
      }
    }
    const unrelated = requirePublicRoute(routes, config.pages.contact.path);
    expect(createRouteMeta(config, unrelated, content)).toContainEqual({
      property: "og:image",
      content: `${config.siteUrl}${config.seo.ogImage}`,
    });
    expect(routeRobots(config, unrelated)).toBe("index,follow");
  });
});

describe("authored service semantics", () => {
  it("marks programs with their configured structuredDataKind or Course default", async () => {
    const { config, content } = await tenantFixture();
    const routes = createRouteManifest(config, content).filter(
      (entry) => entry.kind === "detail" && entry.collection === "programs" && !entry.isAlias,
    );
    const types = routes.map(
      (entry) =>
        graphNodes(createStructuredData(config, content, entry)).find(
          (node) => node["@id"] === `${config.siteUrl}${entry.path}#entity`,
        )?.["@type"],
    );
    const expectedServices = content.programs.filter(
      (p) => p.structuredDataKind === "Service",
    ).length;
    const expectedCourses = content.programs.length - expectedServices;
    expect(types.filter((type) => type === "Service")).toHaveLength(expectedServices);
    expect(types.filter((type) => type === "Course")).toHaveLength(expectedCourses);
  });

  it.each(["Course", "Service"] as const)(
    "validates and honours an explicit %s override over organization defaults",
    async (kind) => {
      const { config, content } = await tenantFixture();
      config.organizationType = kind === "Course" ? "service-business" : "academy";
      config.seo.structuredDataType = organizationTypes[config.organizationType];
      content.programs[0]!.structuredDataKind = kind;
      expect(tenantContentSchema.parse(content).programs[0]?.structuredDataKind).toBe(kind);
      const route = createRouteManifest(config, content).find(
        (entry) => entry.kind === "detail" && entry.collection === "programs" && !entry.isAlias,
      )!;
      expect(nodeOfType(graphNodes(createStructuredData(config, content, route)), kind).name).toBe(
        content.programs[0]!.name,
      );
      const invalid = structuredClone(content);
      Object.assign(invalid.programs[0]!, { structuredDataKind: "Product" });
      expect(tenantContentSchema.safeParse(invalid).success).toBe(false);
    },
  );

  it("omits absent images/end dates and respects non-demo records", async () => {
    const { config, content } = await tenantFixture();
    for (const collection of ["programs", "events", "news"] as const) {
      const record = content[collection][0]!;
      delete record.image;
      record.isDemoContent = false;
    }
    delete content.events[0]!.endsAt;
    content.events[0]!.startsAt = "2026-10-01";
    const routes = createRouteManifest(config, content);
    for (const collection of ["programs", "events", "news"] as const) {
      const route = routes.find(
        (entry) =>
          entry.kind === "detail" &&
          entry.collection === collection &&
          entry.slug === content[collection][0]!.slug &&
          !entry.isAlias,
      )!;
      const entity = graphNodes(createStructuredData(config, content, route)).find(
        (node) => node["@id"] === `${config.siteUrl}${route.path}#entity`,
      )!;
      expect(entity.description).toBe(route.description);
      expect(entity).not.toHaveProperty("image");
      if (collection === "events") {
        expect(entity.startDate).toBe("2026-10-01");
        expect(entity).not.toHaveProperty("endDate");
      }
    }
  });
});

describe("siteUrl-based output", () => {
  it.each([
    ["https://deployment.example", "https://deployment.example"],
    ["https://deployment.example/", "https://deployment.example"],
    ["https://deployment.example/preview/site", "https://deployment.example/preview/site"],
    ["https://deployment.example/preview/site/", "https://deployment.example/preview/site"],
  ])("joins canonical, image, breadcrumb and sitemap paths at %s", async (siteUrl, base) => {
    const { config, content } = await tenantFixture();
    config.siteUrl = siteUrl;
    const routes = createRouteManifest(config, content);
    for (const entry of routes) {
      const canonical = `${base}${entry.canonicalPath ?? entry.path}`;
      expect(createRouteMeta(config, entry, content)).toEqual(
        expect.arrayContaining([
          { tagName: "link", rel: "canonical", href: canonical },
          { property: "og:url", content: canonical },
          { property: "og:image", content: `${base}${config.seo.ogImage}` },
          { name: "twitter:image", content: `${base}${config.seo.ogImage}` },
        ]),
      );
      const graph = graphNodes(createStructuredData(config, content, entry));
      const orgType = ORGANIZATION_SCHEMA_TYPES[config.organizationType];
      expect(nodeOfType(graph, orgType).logo).toBe(`${base}${config.brand.logo}`);
      expect(nodeOfType(graph, "WebPage").url).toBe(canonical);
      if (entry.kind === "detail") {
        expect(nodeOfType(graph, "BreadcrumbList").itemListElement).toEqual([
          { "@type": "ListItem", position: 1, name: config.pages.home.navLabel, item: `${base}/` },
          {
            "@type": "ListItem",
            position: 2,
            name: config.pages[entry.pageId].navLabel,
            item: `${base}${config.pages[entry.pageId].path}`,
          },
          { "@type": "ListItem", position: 3, name: entry.title, item: canonical },
        ]);
        const record = content[entry.collection].find((item) => item.slug === entry.slug)!;
        const entity = graph.find((node) => node["@id"] === `${canonical}#entity`);
        if (entity && record.image) expect(entity.image).toBe(`${base}${record.image.src}`);
      }
    }
    expect(sitemapLocations(createSitemap(config, content))).toEqual(
      routes.filter((entry) => !entry.isAlias).map((entry) => `${base}${entry.path}`),
    );
  });
});
