import { describe, expect, it } from "vitest";
import { FORM_IDS } from "@/config/form-config";
import { tenantConfigSchema } from "@/config/tenant-schema";
import { config, content } from "@/site";
import { getContactActions } from "@/lib/contact-actions";
import { resolvePageSections } from "@/routes/page-sections";

describe("interactive composition", () => {
  it("resolves all enabled form types and removes disabled form sections", () => {
    const { config: testConfig, content: testContent } = structuredClone({ config, content });
    const pages = ["contact", "conversion", "newsEvents"] as const;
    const formSections = () =>
      pages
        .flatMap((page) =>
          resolvePageSections(testConfig, testContent, page, "2026-09-09T00:00:00Z"),
        )
        .filter((section) => section.type === "enquiryForm" || section.type === "newsletter");
    for (const formId of FORM_IDS) {
      expect(formSections().some((section) => section.formId === formId)).toBe(
        testConfig.integrations.forms[formId].enabled,
      );
      expect(testConfig.integrations.forms[formId].endpoint).toBeUndefined();
    }
    testConfig.features.newsletterSignup = false;
    expect(formSections().some((section) => section.formId === "newsletter")).toBe(false);
    for (const formId of FORM_IDS) testConfig.integrations.forms[formId].enabled = false;
    expect(formSections()).toEqual([]);
  });

  it("binds listing config, authored categories and every contact action", () => {
    const sections = resolvePageSections(config, content, "newsEvents", "2026-09-09T00:00:00Z");
    for (const section of sections) {
      if (section.type === "newsGrid") expect(section.listing).toEqual(config.listings?.news);
      if (section.type === "eventsGrid") {
        expect(section.listing).toEqual(config.listings?.events);
        expect(section.items.every((item) => Boolean(item.category))).toBe(true);
      }
    }
    const downloads = resolvePageSections(
      config,
      content,
      "downloads",
      "2026-09-09T00:00:00Z",
    ).find((section) => section.type === "downloads");
    expect(downloads?.items.map((item) => item.category)).toEqual(
      content.downloads.map((item) => item.category),
    );
    expect(new Set(content.downloads.map((item) => item.category)).size).toBeGreaterThan(1);
    const contact = resolvePageSections(config, content, "contact", "2026-09-09T00:00:00Z").find(
      (section) => section.type === "contactDetails",
    );
    for (const action of getContactActions(config))
      expect(contact?.items).toContainEqual(
        expect.objectContaining({ id: action.id, href: action.href }),
      );
    expect(getContactActions(config).find((item) => item.id === "phone")?.href).toMatch(
      /^tel:\+?\d+$/,
    );
    if (config.contact.whatsapp)
      expect(getContactActions(config).find((item) => item.id === "whatsapp")?.href).toMatch(
        /^https:\/\/wa.me\/\d+$/,
      );
  });

  it("fails build validation on unrenderable form keys and bad listing controls", () => {
    expect(
      tenantConfigSchema.safeParse({
        ...config,
        listings: {
          news: { pageSize: 0, categoryFiltering: true },
          events: config.listings?.events,
        },
      }).success,
    ).toBe(false);
    expect(
      tenantConfigSchema.safeParse({
        ...config,
        integrations: {
          ...config.integrations,
          forms: {
            ...config.integrations.forms,
            generalEnquiry: {
              ...config.integrations.forms.generalEnquiry,
              requiredFields: ["password"],
            },
          },
        },
      }).success,
    ).toBe(false);
  });
});
