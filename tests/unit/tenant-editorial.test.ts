import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { config, content } from "@/site";
import { tenantContentSchema } from "@/config/content-schema";
import { resolvePageSections } from "@/routes/page-sections";
import { createRouteManifest, collectionRoutes } from "@/routes/route-manifest";
import { splitEvents } from "@/routes/collection-dates";
import { galleryIllustration } from "@/lib/placeholder-media";

const minimums = {
  news: 6,
  events: 5,
  programs: 8,
  departments: 4,
  people: 8,
  testimonials: 5,
  facilities: 6,
  gallery: 12,
  downloads: 5,
  faqs: 8,
} as const;
const root = process.cwd();

describe("complete demonstration content", () => {
  it("meets every requested collection minimum with validated non-placeholder text", () => {
    expect(tenantContentSchema.safeParse(content).success).toBe(true);
    for (const [key, count] of Object.entries(minimums))
      expect(content[key as keyof typeof minimums].length, key).toBeGreaterThanOrEqual(count);
    expect(JSON.stringify(content)).not.toMatch(/lorem ipsum|TODO|\bTBD\b/i);
    for (const item of content.news) expect(item.body.length).toBeGreaterThanOrEqual(3);
    for (const item of content.programs) {
      expect(item.body.length).toBeGreaterThanOrEqual(3);
      expect(item.highlights.length).toBeGreaterThanOrEqual(3);
    }
    expect(new Set(content.news.map((item) => item.body.join(" "))).size).toBe(content.news.length);
  });

  it("labels every attributed claim and keeps invented credentials out", () => {
    for (const key of [
      "news",
      "events",
      "programs",
      "departments",
      "people",
      "testimonials",
      "facilities",
      "stats",
    ] as const) {
      for (const item of content[key]) expect(item.isDemoContent, `${key}`).toBe(true);
    }
    for (const person of content.people) {
      expect(person.credentials).toEqual([]);
      expect(person.bio.join(" ")).toMatch(/fictional|demonstration|invented/i);
    }
    for (const quote of content.testimonials)
      expect(quote.authorRole).toMatch(/fictional|demonstration|illustrative|sample/i);
    const home = resolvePageSections(config, content, "home", "2026-09-09T12:00:00Z");
    expect(home.some((section) => section.type === "trustStrip")).toBe(false);
    const message = home.find(
      (section) => section.type === "principalMessage" || section.type === "leadershipMessage",
    );
    expect(message?.person.isDemoContent).toBe(true);
    expect(
      home.find((section) => section.type === "noticeBoard")?.items.length,
    ).toBeGreaterThanOrEqual(3);
  });

  it("links every program, department and fictional profile consistently", () => {
    const routes = createRouteManifest(config, content);
    for (const collection of ["programs", "departments", "people", "news", "events"] as const) {
      expect(collectionRoutes(routes, collection)).toHaveLength(content[collection].length);
    }
    for (const program of content.programs)
      expect(content.departments.some((item) => item.slug === program.departmentSlug)).toBe(true);
    for (const person of content.people)
      expect(content.departments.some((item) => item.slug === person.departmentSlug)).toBe(true);
    for (const department of content.departments)
      expect(content.people.some((item) => item.slug === department.leadPersonSlug)).toBe(true);
  });

  it("contains both past and upcoming fictional events at the authored reference date", () => {
    const groups = splitEvents(content.events, "2026-09-09T12:00:00Z");
    expect(groups.past).toHaveLength(2);
    expect(groups.upcoming).toHaveLength(3);
    for (const event of content.events)
      expect(event.body.join(" ")).toMatch(/fictional|sample|demonstration|illustrative/i);
  });

  it("ships twelve distinct originals without remote media or false photo claims", () => {
    const hashes = new Set<string>();
    for (const [index, item] of content.gallery.entries()) {
      expect(item.image.src).toBe(galleryIllustration(config.assets.images, index + 1).src);
      expect(item.image.alt).toMatch(/illustration/i);
      expect(item.image.alt).toMatch(/not a photograph/i);
      const bytes = readFileSync(path.join(root, "public", item.image.src.slice(1)));
      hashes.add(createHash("sha256").update(bytes).digest("hex"));
      const document = new DOMParser().parseFromString(bytes.toString("utf8"), "image/svg+xml");
      expect(document.querySelector("parsererror,script,image,foreignObject,text")).toBeNull();
      expect(document.documentElement.getAttribute("viewBox")).toBe("0 0 1200 800");
      expect(document.querySelector("desc")?.textContent).toMatch(/Original demonstration artwork/);
    }
    expect(hashes.size).toBe(12);
  });

  it("provides five real tagged PDFs with accurate size metadata", () => {
    for (const download of content.downloads) {
      expect(download.file.startsWith(`/tenants/${config.id}/documents/`)).toBe(true);
      const file = path.join(root, "public", download.file.slice(1));
      const bytes = readFileSync(file);
      expect(bytes.subarray(0, 5).toString("ascii")).toBe("%PDF-");
      expect(bytes.subarray(-25).toString("ascii")).toContain("%%EOF");
      expect(bytes.toString("latin1")).toContain("/StructTreeRoot");
      expect(download.fileSizeKb).toBe(Math.ceil(statSync(file).size / 1024));
      expect(bytes.length).toBeGreaterThan(5000);
      expect(download.title).toMatch(/sample/i);
    }
  });

  it("authors substantive privacy/terms/policies without representing them as approved", () => {
    for (const slug of ["privacy", "terms"])
      expect(content.policies.some((policy) => policy.slug === slug)).toBe(true);
    expect(content.policies.length).toBeGreaterThanOrEqual(3);
    for (const policy of content.policies) {
      expect(policy.body.length).toBeGreaterThanOrEqual(8);
      expect(policy.body.join(" ")).toMatch(/demonstration|demo|fictional/i);
      expect(policy.body.join(" ")).toMatch(
        /not.*approved|unapproved|before.*launch|review.*before/i,
      );
      expect(new Set(policy.body).size).toBe(policy.body.length);
    }
  });

  it("fails dangling lead and department links instead of silently hiding them", () => {
    const testContent = structuredClone(content);
    testContent.departments[0]!.leadPersonSlug = "unlisted-person";
    expect(tenantContentSchema.safeParse(testContent).success).toBe(false);
    testContent.departments[0]!.leadPersonSlug = testContent.people[0]!.slug;
    testContent.people[0]!.departmentSlug = "unlisted-department";
    expect(tenantContentSchema.safeParse(testContent).success).toBe(false);
  });
});

it("keeps brand, layout, navigation structure and feature sets", () => {
  const expected = {
    "greenfield-school": { org: "school", preset: "green-campus", variant: "split" },
    "apex-technology": { org: "college", preset: "premium-university", variant: "editorial" },
    "northstar-academy": { org: "academy", preset: "corporate-academy", variant: "collage" },
  }[config.id]!;
  expect(config.organizationType).toBe(expected.org);
  expect(config.theme.preset).toBe(expected.preset);
  expect(content.pageSections!.home![0]!.variant).toBe(expected.variant);
  expect(config.navigation.length).toBeGreaterThan(0);
  expect(Object.keys(config.features).length).toBeGreaterThan(0);
  expect(content.pageSections!.home!.length).toBeGreaterThan(0);
});
