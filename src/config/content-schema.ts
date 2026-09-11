import { z } from "zod";
import { sectionArraySchema } from "../sections/section-types";

import {
  assetPathSchema,
  httpsUrlSchema,
  imageSchema,
  isoDateSchema,
  isoDateTimeSchema,
  nonEmptyString,
  pageIdSchema,
  slugSchema,
  type ContentCollection,
} from "./tenant-schema";

/**
 * Editable content, separate from structural configuration.
 *
 * `isDemoContent` is required on every entity that can carry a statistic, a
 * credential or an attributed claim. Section 17 of the brief forbids unlabelled
 * sample rankings, placement figures, accreditations and head counts, and a
 * required boolean is the only version of that rule a build can enforce.
 * Collections that cannot carry such a claim — gallery, downloads, FAQs,
 * policies — do not have the flag.
 */

/** Body copy is plain text, one string per paragraph. No HTML is ever injected. */
const bodySchema = z.array(nonEmptyString).min(1);

const statSchema = z.object({
  id: slugSchema,
  label: nonEmptyString,
  value: nonEmptyString,
  caption: nonEmptyString.optional(),
  isDemoContent: z.boolean(),
});
export type Stat = z.infer<typeof statSchema>;

const newsArticleSchema = z.object({
  slug: slugSchema,
  title: nonEmptyString,
  excerpt: nonEmptyString.max(320),
  body: bodySchema,
  publishedAt: isoDateSchema,
  category: nonEmptyString,
  image: imageSchema.optional(),
  isDemoContent: z.boolean(),
});
export type NewsArticle = z.infer<typeof newsArticleSchema>;

const eventSchema = z
  .object({
    slug: slugSchema,
    title: nonEmptyString,
    summary: nonEmptyString.max(320),
    body: bodySchema,
    startsAt: isoDateTimeSchema,
    endsAt: isoDateTimeSchema.optional(),
    location: nonEmptyString,
    category: nonEmptyString.optional(),
    registrationUrl: httpsUrlSchema.optional(),
    image: imageSchema.optional(),
    isDemoContent: z.boolean(),
  })
  .refine(
    (event) =>
      event.endsAt === undefined ||
      Date.parse(event.endsAt) + (event.endsAt.length === 10 ? 86400000 - 1 : 0) >=
        Date.parse(event.startsAt),
    {
      path: ["endsAt"],
      message: "must not be earlier than startsAt",
    },
  );
export type SiteEvent = z.infer<typeof eventSchema>;

/** Covers programs, courses and services — the same card, three vocabularies. */
const programSchema = z.object({
  slug: slugSchema,
  structuredDataKind: z.enum(["Course", "Service"]).optional(),
  name: nonEmptyString,
  summary: nonEmptyString.max(320),
  body: bodySchema,
  departmentSlug: slugSchema.optional(),
  levelLabel: nonEmptyString.optional(),
  durationLabel: nonEmptyString.optional(),
  highlights: z.array(nonEmptyString).min(1),
  image: imageSchema.optional(),
  isDemoContent: z.boolean(),
});
export type Program = z.infer<typeof programSchema>;

const departmentSchema = z.object({
  slug: slugSchema,
  name: nonEmptyString,
  summary: nonEmptyString.max(320),
  body: bodySchema,
  leadPersonSlug: slugSchema.optional(),
  image: imageSchema.optional(),
  isDemoContent: z.boolean(),
});
export type Department = z.infer<typeof departmentSchema>;

/** Faculty, instructors or team, depending on `terminology.peopleSectionLabel`. */
const personSchema = z.object({
  slug: slugSchema,
  name: nonEmptyString,
  role: nonEmptyString,
  departmentSlug: slugSchema.optional(),
  credentials: z.array(nonEmptyString),
  bio: bodySchema,
  email: z.string().email().optional(),
  image: imageSchema.optional(),
  isDemoContent: z.boolean(),
});
export type Person = z.infer<typeof personSchema>;

const testimonialSchema = z.object({
  id: slugSchema,
  quote: nonEmptyString.max(600),
  authorName: nonEmptyString,
  authorRole: nonEmptyString,
  image: imageSchema.optional(),
  isDemoContent: z.boolean(),
});
export type Testimonial = z.infer<typeof testimonialSchema>;

const facilitySchema = z.object({
  slug: slugSchema,
  name: nonEmptyString,
  summary: nonEmptyString.max(320),
  body: bodySchema,
  image: imageSchema.optional(),
  isDemoContent: z.boolean(),
});
export type Facility = z.infer<typeof facilitySchema>;

const galleryItemSchema = z.object({
  id: slugSchema,
  album: nonEmptyString,
  image: imageSchema,
  caption: nonEmptyString.optional(),
});
export type GalleryItem = z.infer<typeof galleryItemSchema>;

const downloadSchema = z.object({
  id: slugSchema,
  category: nonEmptyString.optional(),
  title: nonEmptyString,
  description: nonEmptyString.optional(),
  file: assetPathSchema,
  fileType: z.enum(["pdf", "doc", "docx", "xls", "xlsx", "zip"]),
  fileSizeKb: z.number().int().positive(),
  updatedAt: isoDateSchema,
});
export type Download = z.infer<typeof downloadSchema>;

const faqSchema = z.object({
  id: slugSchema,
  question: nonEmptyString,
  answer: bodySchema,
  category: nonEmptyString.optional(),
});
export type Faq = z.infer<typeof faqSchema>;

const policySchema = z.object({
  slug: slugSchema,
  title: nonEmptyString,
  body: bodySchema,
  updatedAt: isoDateSchema,
});
export type Policy = z.infer<typeof policySchema>;

const tenantContentObject = z.object({
  news: z.array(newsArticleSchema),
  events: z.array(eventSchema),
  programs: z.array(programSchema),
  departments: z.array(departmentSchema),
  people: z.array(personSchema),
  testimonials: z.array(testimonialSchema),
  facilities: z.array(facilitySchema),
  gallery: z.array(galleryItemSchema),
  downloads: z.array(downloadSchema),
  faqs: z.array(faqSchema),
  policies: z.array(policySchema),
  stats: z.array(statSchema),
  pageSections: z.record(pageIdSchema, sectionArraySchema).optional(),
});

/** Duplicate keys would produce duplicate prerender routes, so they fail the build. */
function reportDuplicates(
  collection: ContentCollection,
  keys: string[],
  ctx: z.RefinementCtx,
): void {
  const seen = new Set<string>();
  keys.forEach((key, index) => {
    if (seen.has(key)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [collection, index],
        message: `duplicate key "${key}" in ${collection}`,
      });
    }
    seen.add(key);
  });
}

export const tenantContentSchema = tenantContentObject.superRefine((content, ctx) => {
  reportDuplicates(
    "news",
    content.news.map((item) => item.slug),
    ctx,
  );
  reportDuplicates(
    "events",
    content.events.map((item) => item.slug),
    ctx,
  );
  reportDuplicates(
    "programs",
    content.programs.map((item) => item.slug),
    ctx,
  );
  reportDuplicates(
    "departments",
    content.departments.map((item) => item.slug),
    ctx,
  );
  reportDuplicates(
    "people",
    content.people.map((item) => item.slug),
    ctx,
  );
  reportDuplicates(
    "facilities",
    content.facilities.map((item) => item.slug),
    ctx,
  );
  reportDuplicates(
    "policies",
    content.policies.map((item) => item.slug),
    ctx,
  );
  reportDuplicates(
    "testimonials",
    content.testimonials.map((item) => item.id),
    ctx,
  );
  reportDuplicates(
    "gallery",
    content.gallery.map((item) => item.id),
    ctx,
  );
  reportDuplicates(
    "downloads",
    content.downloads.map((item) => item.id),
    ctx,
  );
  reportDuplicates(
    "faqs",
    content.faqs.map((item) => item.id),
    ctx,
  );
  reportDuplicates(
    "stats",
    content.stats.map((item) => item.id),
    ctx,
  );

  for (const program of content.programs) {
    if (
      program.departmentSlug !== undefined &&
      !content.departments.some((department) => department.slug === program.departmentSlug)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["programs"],
        message: `program "${program.slug}" references unknown department "${program.departmentSlug}"`,
      });
    }
  }
  for (const [index, person] of content.people.entries()) {
    if (
      person.departmentSlug &&
      !content.departments.some((department) => department.slug === person.departmentSlug)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["people", index, "departmentSlug"],
        message: "references an unknown department",
      });
    }
  }
  for (const [index, department] of content.departments.entries()) {
    if (
      department.leadPersonSlug &&
      !content.people.some((person) => person.slug === department.leadPersonSlug)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["departments", index, "leadPersonSlug"],
        message: "references an unknown person",
      });
    }
  }
});

export type TenantContent = z.infer<typeof tenantContentSchema>;
export type TenantContentInput = z.input<typeof tenantContentSchema>;

/** Collection keys exclude the optional page composition map. */
export const CONTENT_SCHEMA_KEYS = Object.keys(
  tenantContentObject.omit({ pageSections: true }).shape,
) as ContentCollection[];
