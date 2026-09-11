import { z } from "zod";
import { siteBasePath } from "../lib/site-url";
import { formEndpointSchema } from "./form-config";
export { formEndpointSchema, type FormEndpointConfig } from "./form-config";

import { THEME_PRESET_NAMES, THEME_TOKENS, type ThemeTokenName } from "../themes/theme-types";

/**
 * The shape of a tenant.
 *
 * Two rules govern everything below:
 *  1. No `.default()`. A missing field must fail the build, never fall back to a
 *     value that would put "students" or "admissions" back into a shared component.
 *  2. Relative imports only inside `src/config/` and `src/tenants/`. `vite.config.ts`
 *     loads the active-tenant plugin from here at config time, before `resolve.alias`
 *     exists, so `@/` cannot be used in this subtree.
 */

/* ------------------------------------------------------------------ *
 * Primitives — also imported by content-schema.ts
 * ------------------------------------------------------------------ */

export const nonEmptyString = z.string().trim().min(1);

export const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "must be lowercase kebab-case");

export const localeSchema = z
  .string()
  .regex(/^[a-z]{2}(?:-[A-Z]{2})?$/, "must be a BCP-47 code such as en or en-GB");

/** Absolute https only. Every canonical, OG and sitemap URL is built from these. */
export const httpsUrlSchema = z
  .string()
  .url("must be an absolute URL")
  .refine((value) => value.startsWith("https://"), "must use https://");

/** Root-relative path into `public/`. */
export const assetPathSchema = z
  .string()
  .regex(/^\/\S*$/, "must be a root-relative path starting with /");

export const routePathSchema = z
  .string()
  .regex(
    /^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*)?$/,
    "must be a root-relative lowercase path such as / or /news-events",
  );

export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "must be an ISO date, YYYY-MM-DD")
  // The shape alone accepts 2026-02-30, which only fails later in the section layer.
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
  }, "must be a real calendar date");

export const isoDateTimeSchema = z
  .string()
  .datetime({ offset: true })
  .or(isoDateSchema)
  .describe("ISO date or date-time");

export const yearSchema = z.number().int().gte(1000).lte(9999);

export const phoneSchema = z
  .string()
  .regex(/^\+?[0-9][0-9 ()-]{5,19}$/, "must be a dialable phone number");

export const imageSchema = z.object({
  src: assetPathSchema,
  alt: nonEmptyString,
  // Intrinsic size is required so every image can reserve its box and avoid layout shift.
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

/* ------------------------------------------------------------------ *
 * Enumerations
 * ------------------------------------------------------------------ */

export const ORGANIZATION_TYPES = [
  "school",
  "college",
  "university",
  "academy",
  "training-center",
  "service-business",
] as const;
export const organizationTypeSchema = z.enum(ORGANIZATION_TYPES);
export type OrganizationType = z.infer<typeof organizationTypeSchema>;

export const THEME_PRESETS = THEME_PRESET_NAMES;
export const themePresetSchema = z.enum(THEME_PRESETS);
export type ThemePreset = z.infer<typeof themePresetSchema>;

/**
 * Structural page identifiers. Deliberately neutral: a component asks for
 * `pages.conversion` and labels it with `terminology.primaryConversionLabel`,
 * so the same key serves "Admissions" and "Get Started".
 */
export const PAGE_IDS = [
  "home",
  "about",
  "programs",
  "conversion",
  "facilities",
  "newsEvents",
  "gallery",
  "contact",
  "downloads",
  "policies",
  "privacy",
  "terms",
] as const;
export const pageIdSchema = z.enum(PAGE_IDS);
export type PageId = z.infer<typeof pageIdSchema>;

export const CONTENT_COLLECTIONS = [
  "news",
  "events",
  "programs",
  "departments",
  "people",
  "testimonials",
  "facilities",
  "gallery",
  "downloads",
  "faqs",
  "policies",
  "stats",
] as const;
export const contentCollectionSchema = z.enum(CONTENT_COLLECTIONS);
export type ContentCollection = z.infer<typeof contentCollectionSchema>;

/** Only collections with existing detail-page renderers can own detail routes. */
export const DETAIL_COLLECTIONS = ["programs", "departments", "people", "news", "events"] as const;
export const detailCollectionSchema = z.enum(DETAIL_COLLECTIONS);
export type DetailCollection = z.infer<typeof detailCollectionSchema>;

/**
 * Semantic theme tokens from section 8 of the brief. Owned by `src/themes/theme-types.ts`
 * and re-exported here so a tenant's `theme.overrides` keys and a preset's keys are
 * provably the same set.
 */
export const SEMANTIC_TOKENS = THEME_TOKENS;
export type SemanticToken = ThemeTokenName;

/* ------------------------------------------------------------------ *
 * Navigation
 * ------------------------------------------------------------------ */

const pageLinkSchema = z.object({
  kind: z.literal("page"),
  label: nonEmptyString,
  pageId: pageIdSchema,
});

const externalLinkSchema = z.object({
  kind: z.literal("external"),
  label: nonEmptyString,
  href: httpsUrlSchema,
});

/** A link that can appear as a leaf: in a dropdown, the utility bar or a CTA. */
export const navLinkSchema = z.discriminatedUnion("kind", [pageLinkSchema, externalLinkSchema]);
export type NavLink = z.infer<typeof navLinkSchema>;

export const navItemSchema = z.discriminatedUnion("kind", [
  pageLinkSchema,
  externalLinkSchema,
  z.object({
    kind: z.literal("group"),
    label: nonEmptyString,
    children: z.array(navLinkSchema).min(1),
  }),
]);
export type NavItem = z.infer<typeof navItemSchema>;

/* ------------------------------------------------------------------ *
 * Config sections
 * ------------------------------------------------------------------ */

export const brandSchema = z.object({
  name: nonEmptyString,
  shortName: nonEmptyString,
  tagline: nonEmptyString,
  description: nonEmptyString,
  logo: assetPathSchema,
  logoMark: assetPathSchema,
  logoDark: assetPathSchema,
  favicon: assetPathSchema,
  foundedYear: yearSchema.optional(),
  primaryCta: navLinkSchema,
  secondaryCta: navLinkSchema,
});
export type Brand = z.infer<typeof brandSchema>;

/**
 * Every field required. This is the mechanism that keeps shared components
 * tenant-neutral, so an omission has to be a build error rather than a fallback.
 */
export const terminologySchema = z.object({
  programSingular: nonEmptyString,
  programPlural: nonEmptyString,
  departmentSingular: nonEmptyString,
  departmentPlural: nonEmptyString,
  peopleSectionLabel: nonEmptyString,
  primaryConversionLabel: nonEmptyString,
  facilitiesLabel: nonEmptyString,
  audienceSingular: nonEmptyString,
  audiencePlural: nonEmptyString,
});
export type Terminology = z.infer<typeof terminologySchema>;

const tokenOverrideShape = Object.fromEntries(
  SEMANTIC_TOKENS.map((token) => [token, nonEmptyString]),
) as { [K in SemanticToken]: typeof nonEmptyString };

export const themeSchema = z.object({
  preset: themePresetSchema,
  // `.strict()` so a typo in a token name fails the build instead of being ignored.
  overrides: z.object(tokenOverrideShape).partial().strict().optional(),
});
export type ThemeConfig = z.infer<typeof themeSchema>;

export const STRUCTURED_DATA_TYPES = [
  "School",
  "CollegeOrUniversity",
  "EducationalOrganization",
  "Organization",
] as const;

export const ORGANIZATION_SCHEMA_TYPES = {
  school: "School",
  college: "CollegeOrUniversity",
  university: "CollegeOrUniversity",
  academy: "EducationalOrganization",
  "training-center": "EducationalOrganization",
  "service-business": "Organization",
} as const satisfies Record<OrganizationType, (typeof STRUCTURED_DATA_TYPES)[number]>;

export const seoSchema = z.object({
  titleTemplate: z
    .string()
    .refine((value) => value.includes("%s"), 'must contain "%s" for the page title'),
  defaultTitle: nonEmptyString,
  defaultDescription: nonEmptyString.max(320),
  ogImage: assetPathSchema,
  twitterCard: z.enum(["summary", "summary_large_image"]),
  twitterSite: z
    .string()
    .regex(/^@[A-Za-z0-9_]{1,15}$/)
    .optional(),
  robots: z.enum(["index,follow", "noindex,nofollow"]),
  structuredDataType: z.enum(STRUCTURED_DATA_TYPES),
  keywords: z.array(nonEmptyString).max(12).optional(),
});
export type SeoConfig = z.infer<typeof seoSchema>;

export const contactSchema = z.object({
  email: z.string().email(),
  phone: phoneSchema,
  whatsapp: phoneSchema.optional(),
  addressLines: z.array(nonEmptyString).min(1),
  locality: nonEmptyString,
  region: nonEmptyString.optional(),
  postalCode: nonEmptyString.optional(),
  country: z.string().regex(/^[A-Z]{2}$/, "must be an ISO 3166-1 alpha-2 country code"),
  officeHours: z
    .array(z.object({ days: nonEmptyString, hours: nonEmptyString }))
    .min(1)
    .optional(),
  mapEmbedUrl: httpsUrlSchema.optional(),
  directionsUrl: httpsUrlSchema.optional(),
});
export type ContactConfig = z.infer<typeof contactSchema>;

export const SOCIAL_PLATFORMS = ["facebook", "instagram", "linkedin", "x", "youtube"] as const;

export const socialLinkSchema = z.object({
  platform: z.enum(SOCIAL_PLATFORMS),
  url: httpsUrlSchema,
  label: nonEmptyString.optional(),
});

export const pageConfigSchema = z.object({
  enabled: z.boolean(),
  path: routePathSchema,
  navLabel: nonEmptyString,
  seo: seoSchema
    .pick({ defaultTitle: true, defaultDescription: true, robots: true, ogImage: true })
    .partial()
    .optional(),
});
export type PageConfig = z.infer<typeof pageConfigSchema>;

const pagesShape = Object.fromEntries(PAGE_IDS.map((id) => [id, pageConfigSchema])) as {
  [K in PageId]: typeof pageConfigSchema;
};
export const pagesSchema = z.object(pagesShape);
export type PagesConfig = z.infer<typeof pagesSchema>;

/** A base path, not a route pattern; slugs are appended only after validation. */
const detailBasePathSchema = routePathSchema
  .refine((path) => path !== "/", "a detail route base must not be /")
  .refine((path) => path === path.trim(), "a detail route base must not contain edge whitespace");

export const detailRouteConfigSchema = z
  .object({
    enabled: z.boolean(),
    path: detailBasePathSchema,
    aliases: z.array(detailBasePathSchema).optional(),
  })
  .strict()
  .superRefine((settings, ctx) => {
    const seen = new Set([settings.path]);
    settings.aliases?.forEach((alias, index) => {
      if (seen.has(alias)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["aliases", index],
          message: `duplicate detail route base "${alias}"`,
        });
      }
      seen.add(alias);
    });
  });
export type DetailRouteConfig = z.infer<typeof detailRouteConfigSchema>;

/** Missing collections retain their historical parent-relative routing. */
export const detailRoutesSchema = z.record(detailCollectionSchema, detailRouteConfigSchema);
export type DetailRoutesConfig = z.infer<typeof detailRoutesSchema>;

export const featureFlagsSchema = z.object({
  announcementBar: z.boolean(),
  utilityNav: z.boolean(),
  stickyHeader: z.boolean(),
  mobileContactBar: z.boolean(),
  darkModeToggle: z.boolean(),
  newsletterSignup: z.boolean(),
  siteSearch: z.boolean(),
  breadcrumbs: z.boolean(),
});
export type FeatureFlags = z.infer<typeof featureFlagsSchema>;

/** Content for the optional strip above the header. */
export const announcementSchema = z.object({
  message: nonEmptyString.max(200),
  link: navLinkSchema.optional(),
});
export type AnnouncementConfig = z.infer<typeof announcementSchema>;

/** Collection controls enhance complete prerendered lists, without server requests. */
export const listingConfigSchema = z
  .object({
    pageSize: z.number().int().min(1).max(100),
    categoryFiltering: z.boolean(),
  })
  .strict();

export const integrationsSchema = z.object({
  forms: z.object({
    generalEnquiry: formEndpointSchema,
    // Neutral name on purpose: this is "Admissions" for a school and
    // "Request a consultation" for a service business.
    conversionEnquiry: formEndpointSchema,
    newsletter: formEndpointSchema,
    consultation: formEndpointSchema,
  }),
  analytics: z.object({
    provider: z.enum(["none", "plausible", "umami", "google-analytics"]),
    siteId: nonEmptyString.optional(),
    scriptUrl: httpsUrlSchema.optional(),
  }),
  /** External portals. No credentials ever live in this repo, only links. */
  portals: z.array(z.object({ label: nonEmptyString, href: httpsUrlSchema })),
});
export type IntegrationsConfig = z.infer<typeof integrationsSchema>;

export const legalSchema = z.object({
  legalName: nonEmptyString,
  copyrightHolder: nonEmptyString,
  copyrightStartYear: yearSchema,
  registrationLine: nonEmptyString.optional(),
  privacyPolicyUpdated: isoDateSchema,
  termsUpdated: isoDateSchema,
  disclaimer: nonEmptyString.optional(),
  /** Required. Section 17 of the brief forbids unlabelled sample institutions. */
  demoContentNotice: nonEmptyString,
});
export type LegalConfig = z.infer<typeof legalSchema>;

const contentSourceSchema = z.enum(["local", "none"]);
const contentSourcesShape = Object.fromEntries(
  CONTENT_COLLECTIONS.map((collection) => [collection, contentSourceSchema]),
) as { [K in ContentCollection]: typeof contentSourceSchema };
export const contentSourcesSchema = z.object(contentSourcesShape);
export type ContentSources = z.infer<typeof contentSourcesSchema>;

export const assetsSchema = z.object({
  basePath: assetPathSchema,
  images: assetPathSchema,
  documents: assetPathSchema,
  socialShareImage: assetPathSchema,
  manifestIcon: assetPathSchema,
});
export type AssetsConfig = z.infer<typeof assetsSchema>;

/* ------------------------------------------------------------------ *
 * The tenant
 * ------------------------------------------------------------------ */

const tenantConfigObject = z.object({
  id: slugSchema,
  slug: slugSchema,
  organizationType: organizationTypeSchema,
  siteUrl: httpsUrlSchema.refine((value) => {
    if (value.endsWith("/")) return false;
    try {
      siteBasePath(value);
      return true;
    } catch {
      return false;
    }
  }, "must be an HTTPS origin with optional lowercase base path, without credentials, query, fragment or trailing slash"),
  defaultLocale: localeSchema,
  supportedLocales: z.array(localeSchema).min(1),
  brand: brandSchema,
  terminology: terminologySchema,
  theme: themeSchema,
  seo: seoSchema,
  contact: contactSchema,
  social: z.array(socialLinkSchema),
  navigation: z.array(navItemSchema).min(1),
  utilityLinks: z.array(navLinkSchema),
  features: featureFlagsSchema,
  announcement: announcementSchema.optional(),
  pages: pagesSchema,
  detailRoutes: detailRoutesSchema.optional(),
  listings: z
    .object({ news: listingConfigSchema, events: listingConfigSchema })
    .strict()
    .optional(),
  integrations: integrationsSchema,
  legal: legalSchema,
  contentSources: contentSourcesSchema,
  assets: assetsSchema,
});

/** Every page a link can point at, across navigation, utility links and CTAs. */
function collectPageTargets(
  config: z.infer<typeof tenantConfigObject>,
): { pageId: PageId; path: (string | number)[] }[] {
  const targets: { pageId: PageId; path: (string | number)[] }[] = [];

  config.navigation.forEach((item, index) => {
    if (item.kind === "page") {
      targets.push({ pageId: item.pageId, path: ["navigation", index, "pageId"] });
    } else if (item.kind === "group") {
      item.children.forEach((child, childIndex) => {
        if (child.kind === "page") {
          targets.push({
            pageId: child.pageId,
            path: ["navigation", index, "children", childIndex, "pageId"],
          });
        }
      });
    }
  });

  config.utilityLinks.forEach((link, index) => {
    if (link.kind === "page") {
      targets.push({ pageId: link.pageId, path: ["utilityLinks", index, "pageId"] });
    }
  });

  for (const key of ["primaryCta", "secondaryCta"] as const) {
    const cta = config.brand[key];
    if (cta.kind === "page") {
      targets.push({ pageId: cta.pageId, path: ["brand", key, "pageId"] });
    }
  }

  const announcementLink = config.announcement?.link;
  if (announcementLink?.kind === "page") {
    targets.push({ pageId: announcementLink.pageId, path: ["announcement", "link", "pageId"] });
  }

  return targets;
}

export const tenantConfigSchema = tenantConfigObject.superRefine((config, ctx) => {
  if (!config.supportedLocales.includes(config.defaultLocale)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["defaultLocale"],
      message: `defaultLocale "${config.defaultLocale}" is not listed in supportedLocales`,
    });
  }

  // A flag that is on with nothing to show renders an empty bar, which is worse than
  // no bar at all. Making it a build error is the only way it cannot ship unnoticed.
  if (config.features.announcementBar && config.announcement === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["announcement"],
      message: 'features.announcementBar is true, so "announcement" must be provided',
    });
  }

  if (!config.pages.home.enabled) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["pages", "home", "enabled"],
      message: "the home page cannot be disabled",
    });
  }

  if (config.pages.home.path !== "/") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["pages", "home", "path"],
      message: 'the home page must be mounted at "/"',
    });
  }

  const seenPaths = new Map<string, PageId>();
  for (const pageId of PAGE_IDS) {
    const page = config.pages[pageId];
    if (!page.enabled) continue;
    const clash = seenPaths.get(page.path);
    if (clash) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pages", pageId, "path"],
        message: `path "${page.path}" is already used by the "${clash}" page`,
      });
    } else {
      seenPaths.set(page.path, pageId);
    }
  }

  for (const target of collectPageTargets(config)) {
    if (!config.pages[target.pageId].enabled) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: target.path,
        message: `points at the "${target.pageId}" page, which is disabled in pages`,
      });
    }
  }
});

export type TenantConfig = z.infer<typeof tenantConfigSchema>;
export type TenantConfigInput = z.input<typeof tenantConfigSchema>;
