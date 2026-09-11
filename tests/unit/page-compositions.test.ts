import { describe, expect, it } from "vitest";
import { config, content } from "@/site";
import { PAGE_IDS } from "@/config/tenant-schema";
import { sectionSchema } from "@/sections/section-types";
import { resolvePageSections } from "@/routes/page-sections";
import { dateTimestamp, newestNews, splitEvents } from "@/routes/collection-dates";
import { createSitemap } from "@/routes/static-artifacts";
import { createRouteManifest, getIndexableRoutes } from "@/routes/route-manifest";
import { withDetailContent } from "../fixtures/route-content";

const now = "2026-09-08T12:00:00Z";
describe("UTC collection ordering", () => {
  it("orders news newest first without mutating authored records", () => {
    const records = [
      { slug: "old", publishedAt: "2026-01-01" },
      { slug: "new", publishedAt: "2026-09-01" },
    ];
    expect(newestNews(records).map((item) => item.slug)).toEqual(["new", "old"]);
    expect(records[0]?.slug).toBe("old");
  });
  it("separates past events and includes ongoing and all-day current events", () => {
    const records = [
      { slug: "later", startsAt: "2026-09-10" },
      { slug: "ended", startsAt: "2026-09-07" },
      { slug: "today", startsAt: "2026-09-08" },
      { slug: "ongoing", startsAt: "2026-09-07T10:00:00Z", endsAt: "2026-09-09T10:00:00Z" },
      { slug: "hour-ago", startsAt: "2026-09-08T13:00:00+02:00" },
    ];
    const groups = splitEvents(records, now);
    expect(groups.upcoming.map((event) => event.slug)).toEqual(["ongoing", "today", "later"]);
    expect(groups.past.map((event) => event.slug)).toEqual(["hour-ago", "ended"]);
    expect(
      splitEvents([{ slug: "day", startsAt: "2026-09-08" }], "2026-09-09T00:00:00Z").past,
    ).toHaveLength(1);
  });
  it.each(["2026-02-30", "not-a-date"])("fails invalid dates %s", (value) =>
    expect(() => dateTimestamp(value)).toThrow(),
  );
});

describe("tenant page compositions", () => {
  it("supplies validated sections for every page and preserves full-width ordering", () => {
    expect(Object.keys(content.pageSections ?? {}).sort()).toEqual([...PAGE_IDS].sort());
    for (const pageId of PAGE_IDS) {
      const sections = resolvePageSections(config, content, pageId, now);
      expect(sections.length > 0).toBe(config.pages[pageId].enabled);
      expect(sections.every((section) => sectionSchema.safeParse(section).success)).toBe(true);
    }
    const home = resolvePageSections(config, content, "home", now);
    expect(home[0]).toMatchObject({ type: "hero", heading: config.brand.name });
    expect(home[0]?.actions).toHaveLength(2);
    expect(home.at(-1)?.type).toBe("finalCTA");
    expect(home.some((section) => section.type === "trustStrip")).toBe(false);
  });
  it("hydrates collection data instead of keeping stale snapshots and excludes disabled targets", () => {
    const tenant = withDetailContent({
      config: structuredClone(config),
      content: structuredClone(content),
    });
    const sections = resolvePageSections(tenant.config, tenant.content, "programs", now);
    const programs = sections.find(
      (section) => section.type === "programGrid" || section.type === "serviceGrid",
    );
    expect(programs && "items" in programs ? programs.items.length : 0).toBe(
      tenant.content.programs.length,
    );
    tenant.config.pages.programs.enabled = false;
    const home = resolvePageSections(tenant.config, tenant.content, "home", now);
    expect(
      home.some((section) => section.type === "programGrid" || section.type === "serviceGrid"),
    ).toBe(false);
    expect(
      home
        .flatMap((section) => section.actions ?? [])
        .some((action) => action.href === tenant.config.pages.programs.path),
    ).toBe(false);
  });
  it("re-resolves logical CTA targets after core paths are renamed", () => {
    const tenant = {
      config: structuredClone(config),
      content: structuredClone(content),
    };
    tenant.config.pages.conversion.path = "/apply";
    const home = resolvePageSections(tenant.config, tenant.content, "home", now);
    expect(home[0]?.actions?.[0]?.href).toBe("/apply");
    expect(home.at(-1)?.actions?.[0]?.href).toBe("/apply");
  });
  it("orders bound news/events from the same snapshot and preserves explicit empty states", () => {
    const tenant = withDetailContent({
      config: structuredClone(config),
      content: structuredClone(content),
    });
    const firstNews = tenant.content.news[0]!;
    const firstEvent = tenant.content.events[0]!;
    tenant.content.news = [
      { ...firstNews, slug: "old", publishedAt: "2026-01-01" },
      { ...firstNews, slug: "new", publishedAt: "2026-09-01" },
    ];
    tenant.content.events = [
      { ...firstEvent, slug: "past", startsAt: "2026-08-01", endsAt: undefined },
      { ...firstEvent, slug: "future", startsAt: "2026-10-01", endsAt: undefined },
    ];
    const sections = resolvePageSections(tenant.config, tenant.content, "newsEvents", now);
    const news = sections.find((section) => section.type === "newsGrid");
    expect(news?.items.map((item) => item.id)).toEqual(["new", "old"]);
    const events = sections.filter((section) => section.type === "eventsGrid");
    expect(events.map((section) => section.items.map((item) => item.id))).toEqual([
      ["future"],
      ["past"],
    ]);
    tenant.config.contentSources.news = "none";
    expect(
      resolvePageSections(tenant.config, tenant.content, "newsEvents", now).find(
        (section) => section.type === "newsGrid",
      )?.items,
    ).toEqual([]);
  });
  it("sitemap contains only canonical enabled indexable paths", () => {
    const { config: testConfig, content: testContent } = {
      config: structuredClone(config),
      content: structuredClone(content),
    };
    const sitemap = createSitemap(testConfig, testContent);
    const locations = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
    expect(locations).toEqual(
      getIndexableRoutes(testConfig, testContent).map((entry) => testConfig.siteUrl + entry.path),
    );
    for (const entry of createRouteManifest(testConfig, testContent).filter(
      (entry) => entry.isAlias,
    ))
      expect(locations).not.toContain(testConfig.siteUrl + entry.path);
    testConfig.pages.programs.enabled = false;
    expect(createSitemap(testConfig, testContent)).not.toContain(
      `${testConfig.siteUrl}${testConfig.pages.programs.path}</loc>`,
    );
    testConfig.seo.robots = "noindex,nofollow";
    expect(createSitemap(testConfig, testContent)).not.toContain("<loc>");
  });
});

it("selects hero and configurable education/business arrangements", () => {
  const hero = content.pageSections?.home?.[0];
  const expectedVariant = {
    "greenfield-school": "split",
    "apex-technology": "editorial",
    "northstar-academy": "collage",
  }[config.id];
  expect(hero?.variant).toBe(expectedVariant);
  expect(hero?.type).toBe("hero");
  expect(content.pageSections?.home?.length).toBeGreaterThan(0);
  if (config.id === "northstar-academy") {
    expect(content.pageSections?.home?.some((section) => section.type === "serviceGrid")).toBe(
      true,
    );
  }
  if (config.id === "apex-technology") {
    expect(
      content.pageSections?.about?.some((section) => section.type === "researchHighlights"),
    ).toBe(true);
  }
});

it("rejects mismatched sources and conflicting inline snapshots", () => {
  expect(
    sectionSchema.safeParse({
      type: "stats",
      heading: "Numbers",
      emptyMessage: "None",
      items: [],
      contentSource: "programs",
    }).success,
  ).toBe(false);
  expect(
    sectionSchema.safeParse({
      type: "stats",
      heading: "Numbers",
      emptyMessage: "None",
      items: [{ id: "one", value: "1", label: "One", isDemoContent: true }],
      contentSource: "stats",
    }).success,
  ).toBe(false);
});
