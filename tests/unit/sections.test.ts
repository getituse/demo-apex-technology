import { describe, expect, it } from "vitest";
import {
  sectionArraySchema,
  sectionSchema,
  sectionHrefSchema,
  SECTION_TYPES,
} from "@/sections/section-types";
import { sectionRegistry, isSectionType, type SectionRegistry } from "@/sections/section-registry";
import { createSectionExamples } from "@/routes/section-examples";
import { config, content } from "@/site";
import { tenantContentSchema } from "@/config/content-schema";

const examples = createSectionExamples(config);
const requiredTypes = [
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
  "enquiryForm",
];

describe("section contracts", () => {
  it("registers exactly the 36 required discriminators with exhaustive preview fixtures", () => {
    expect([...SECTION_TYPES].sort()).toEqual([...requiredTypes].sort());
    expect(Object.keys(sectionRegistry).sort()).toEqual([...requiredTypes].sort());
    expect(Object.keys(examples).sort()).toEqual([...requiredTypes].sort());
    const { hero: _hero, ...incomplete } = sectionRegistry;
    // @ts-expect-error A missing discriminator must fail registry assignment.
    const rejected: SectionRegistry = incomplete;
    expect(rejected).not.toHaveProperty("hero");
  });
  it.each(SECTION_TYPES)("validates %s and rejects unexpected fields", (type) => {
    expect(sectionSchema.safeParse(examples[type]).success).toBe(true);
    expect(sectionSchema.safeParse({ ...examples[type], injected: "unused" }).success).toBe(false);
  });
  it("previews a configured general enquiry and requires a known form identifier", () => {
    expect(examples.enquiryForm).toMatchObject({
      type: "enquiryForm",
      formId: "generalEnquiry",
      heading: "Preview enquiry",
    });
    const { formId: _formId, ...missingForm } = examples.enquiryForm;
    expect(sectionSchema.safeParse(missingForm).success).toBe(false);
    expect(sectionSchema.safeParse({ ...examples.enquiryForm, formId: "unknown" }).success).toBe(
      false,
    );
    expect(sectionSchema.safeParse({ ...examples.enquiryForm, heading: "" }).success).toBe(false);
  });
  it.each(["unknown", "constructor", "__proto__", null, 123])(
    "rejects unknown discriminator %s",
    (type) => {
      expect(isSectionType(type)).toBe(false);
      expect(sectionSchema.safeParse({ type }).success).toBe(false);
    },
  );
  it("checks all hero image counts and variants", () => {
    const hero = examples.hero;
    expect(sectionSchema.safeParse({ ...hero, variant: "editorial" }).success).toBe(true);
    expect(sectionSchema.safeParse({ ...hero, variant: "collage" }).success).toBe(false);
    expect(
      sectionSchema.safeParse({
        ...hero,
        variant: "collage",
        images: [...hero.images, ...hero.images, ...hero.images],
      }).success,
    ).toBe(true);
    expect(sectionSchema.safeParse({ ...hero, images: [] }).success).toBe(false);
    expect(sectionSchema.safeParse({ ...hero, variant: "autoplay" }).success).toBe(false);
  });
  it("requires dimensions and allows decorative image alt text", () => {
    const hero = examples.hero;
    const image = hero.images[0]!;
    expect(sectionSchema.safeParse({ ...hero, images: [{ ...image, width: 0 }] }).success).toBe(
      false,
    );
    expect(sectionSchema.safeParse({ ...hero, images: [{ ...image, alt: "" }] }).success).toBe(
      true,
    );
    expect(
      sectionSchema.safeParse({
        ...hero,
        images: [{ ...image, src: "https://example.org/photo.jpg" }],
      }).success,
    ).toBe(false);
  });
  it("requires explicit demo flags on claim-bearing items", () => {
    const { isDemoContent: _flag, ...claim } = examples.stats.items[0]!;
    expect(sectionSchema.safeParse({ ...examples.stats, items: [claim] }).success).toBe(false);
    const { isDemoContent: _personFlag, ...person } = examples.principalMessage.person;
    expect(sectionSchema.safeParse({ ...examples.principalMessage, person }).success).toBe(false);
  });
  it("rejects impossible calendar dates before cards format them", () => {
    expect(
      sectionSchema.safeParse({
        ...examples.newsGrid,
        items: [{ ...examples.newsGrid.items[0], date: "2026-02-30" }],
      }).success,
    ).toBe(false);
    expect(
      sectionSchema.safeParse({
        ...examples.eventsGrid,
        items: [{ ...examples.eventsGrid.items[0], startsAt: "2026-02-30T10:00:00Z" }],
      }).success,
    ).toBe(false);
  });
  it("rejects duplicate identifiers including hidden sections", () => {
    expect(
      sectionArraySchema.safeParse([
        { ...examples.hero, id: "same" },
        { ...examples.faq, id: "same", enabled: false },
      ]).success,
    ).toBe(false);
    expect(
      sectionSchema.safeParse({
        ...examples.stats,
        items: [examples.stats.items[0], examples.stats.items[0]],
      }).success,
    ).toBe(false);
  });
  it("validates optional page compositions with tenant content at build time", () => {
    expect(
      tenantContentSchema.safeParse({ ...content, pageSections: { home: [examples.hero] } })
        .success,
    ).toBe(true);
    expect(
      tenantContentSchema.safeParse({ ...content, pageSections: { unknown: [examples.hero] } })
        .success,
    ).toBe(false);
    expect(
      tenantContentSchema.safeParse({
        ...content,
        pageSections: { home: [{ ...examples.hero, variant: "broken" }] },
      }).success,
    ).toBe(false);
  });
  it.each([
    "javascript:alert(1)",
    "data:text/html,test",
    "//evil.test",
    "/\\evil.test",
    "/%2fexample.org",
    "/%2e%2e/secret",
    "/%00foo",
    "https://user:password@example.org",
    "http://example.org",
    "https://example.org\nfoo",
  ])("rejects unsafe section URL %s", (href) => {
    expect(sectionHrefSchema.safeParse(href).success).toBe(false);
  });
  it.each([
    "/",
    "/about",
    "/resources/guide.pdf",
    "#details",
    "mailto:hello@example.org",
    "tel:+441234567890",
    "https://example.org/info",
  ])("allows intended navigation %s", (href) => {
    expect(sectionHrefSchema.safeParse(href).success).toBe(true);
  });
});
