import { describe, expect, it } from "vitest";

import { tenantConfigSchema, type TenantConfigInput } from "@/config/tenant-schema";
import { rawConfig as siteConfig } from "@/site/config";

/** A fresh, valid config for each mutation test. */
function validConfig(): TenantConfigInput {
  return structuredClone(siteConfig);
}

const TOP_LEVEL_FIELDS = [
  "id",
  "slug",
  "organizationType",
  "siteUrl",
  "defaultLocale",
  "supportedLocales",
  "brand",
  "terminology",
  "theme",
  "seo",
  "contact",
  "social",
  "navigation",
  "utilityLinks",
  "features",
  "pages",
  "integrations",
  "legal",
  "contentSources",
  "assets",
] as const;

const TERMINOLOGY_FIELDS = [
  "programSingular",
  "programPlural",
  "departmentSingular",
  "departmentPlural",
  "peopleSectionLabel",
  "primaryConversionLabel",
  "facilitiesLabel",
  "audienceSingular",
  "audiencePlural",
] as const;

describe("tenantConfigSchema", () => {
  it("accepts a complete config", () => {
    expect(tenantConfigSchema.safeParse(validConfig()).success).toBe(true);
  });

  it("covers every field named in section 6 of the brief", () => {
    const config = validConfig() as unknown as Record<string, unknown>;
    for (const field of TOP_LEVEL_FIELDS) {
      expect(Object.hasOwn(config, field)).toBe(true);
    }
  });

  it.each(TOP_LEVEL_FIELDS)("rejects a config with %s missing", (field) => {
    const config = validConfig() as unknown as Record<string, unknown>;
    delete config[field];
    expect(tenantConfigSchema.safeParse(config).success).toBe(false);
  });

  describe("terminology", () => {
    it.each(TERMINOLOGY_FIELDS)("requires %s — there is no silent default", (field) => {
      const config = validConfig();
      delete (config.terminology as unknown as Record<string, unknown>)[field];

      const result = tenantConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some((issue) => issue.path.join(".") === `terminology.${field}`),
        ).toBe(true);
      }
    });

    it.each(TERMINOLOGY_FIELDS)("rejects an empty %s", (field) => {
      const config = validConfig();
      (config.terminology as unknown as Record<string, unknown>)[field] = "   ";
      expect(tenantConfigSchema.safeParse(config).success).toBe(false);
    });
  });

  describe("siteUrl", () => {
    it("accepts an absolute https origin", () => {
      const config = validConfig();
      config.siteUrl = "https://example.org";
      expect(tenantConfigSchema.safeParse(config).success).toBe(true);
    });

    it.each([
      ["http, not https", "http://example.org"],
      ["protocol-relative", "//example.org"],
      ["no scheme", "example.org"],
      ["a bare path", "/"],
      ["a trailing slash", "https://example.org/"],
      ["empty", ""],
    ])("rejects %s", (_label, value) => {
      const config = validConfig();
      config.siteUrl = value;
      expect(tenantConfigSchema.safeParse(config).success).toBe(false);
    });
  });

  describe("navigation", () => {
    it("rejects a nav entry pointing at a disabled page", () => {
      const config = validConfig();
      config.pages.about.enabled = false;

      const result = tenantConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.message.includes("about"))).toBe(true);
      }
    });

    it("rejects a utility link pointing at a disabled page", () => {
      const config = validConfig();
      config.utilityLinks = [{ kind: "page", label: "Downloads", pageId: "downloads" }];
      config.pages.downloads.enabled = false;
      expect(tenantConfigSchema.safeParse(config).success).toBe(false);
    });

    it("rejects a brand CTA pointing at a disabled page", () => {
      const config = validConfig();
      config.navigation = [{ kind: "page", label: "About", pageId: "about" }];
      config.utilityLinks = [];
      config.pages.conversion.enabled = false;
      expect(tenantConfigSchema.safeParse(config).success).toBe(false);
    });

    it("rejects an unknown pageId", () => {
      const config = validConfig() as unknown as { navigation: unknown[] };
      config.navigation = [{ kind: "page", label: "Nope", pageId: "does-not-exist" }];
      expect(tenantConfigSchema.safeParse(config).success).toBe(false);
    });

    it("requires https on external links", () => {
      const config = validConfig();
      config.navigation = [
        { kind: "external", label: "Portal", href: "http://portal.example.com" },
      ];
      expect(tenantConfigSchema.safeParse(config).success).toBe(false);
    });
  });

  describe("pages", () => {
    it("rejects a disabled home page", () => {
      const config = validConfig();
      config.pages.home.enabled = false;
      expect(tenantConfigSchema.safeParse(config).success).toBe(false);
    });

    it("rejects a home page not mounted at /", () => {
      const config = validConfig();
      config.pages.home.path = "/start";
      expect(tenantConfigSchema.safeParse(config).success).toBe(false);
    });

    it("rejects two enabled pages sharing a path", () => {
      const config = validConfig();
      config.pages.about.path = "/contact";
      expect(tenantConfigSchema.safeParse(config).success).toBe(false);
    });
  });

  describe("theme", () => {
    it("rejects an unknown preset", () => {
      const config = validConfig() as unknown as { theme: { preset: string } };
      config.theme.preset = "neon-glass";
      expect(tenantConfigSchema.safeParse(config).success).toBe(false);
    });

    it("rejects an unknown semantic token override", () => {
      const config = validConfig() as unknown as {
        theme: { preset: string; overrides?: Record<string, string> };
      };
      config.theme.overrides = { notAToken: "#ff0000" };
      expect(tenantConfigSchema.safeParse(config).success).toBe(false);
    });
  });

  it("requires defaultLocale to be listed in supportedLocales", () => {
    const config = validConfig();
    config.supportedLocales = ["fr"];
    expect(tenantConfigSchema.safeParse(config).success).toBe(false);
  });

  describe("announcement", () => {
    it("rejects an announcement bar switched on with nothing to show", () => {
      const config = validConfig();
      config.features.announcementBar = true;
      delete (config as unknown as Record<string, unknown>).announcement;

      const result = tenantConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.path.includes("announcement"))).toBe(true);
      }
    });

    it("allows an announcement to be staged while the bar is switched off", () => {
      const config = validConfig();
      config.features.announcementBar = false;
      expect(tenantConfigSchema.safeParse(config).success).toBe(true);
    });

    it("rejects an announcement link pointing at a disabled page", () => {
      const config = validConfig();
      config.announcement = {
        message: "Something is happening.",
        link: { kind: "page", label: "Find out more", pageId: "gallery" },
      };
      config.navigation = [{ kind: "page", label: "About", pageId: "about" }];
      config.pages.gallery.enabled = false;

      expect(tenantConfigSchema.safeParse(config).success).toBe(false);
    });
  });

  it("allows demo content notice to be optional", () => {
    const config = validConfig();
    delete (config.legal as unknown as Record<string, unknown>).demoContentNotice;
    expect(tenantConfigSchema.safeParse(config).success).toBe(true);
  });
});
