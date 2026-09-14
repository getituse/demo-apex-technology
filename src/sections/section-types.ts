import { z } from "zod";
import {
  nonEmptyString,
  slugSchema,
  isoDateSchema,
  isoDateTimeSchema,
  pageIdSchema,
  listingConfigSchema,
} from "../config/tenant-schema";
import { FORM_IDS } from "../config/form-config";

const calendarDate = isoDateSchema.refine((date) => {
  const parsed = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}, "must be a real calendar date");
const eventDate = isoDateTimeSchema.refine(
  (value) =>
    calendarDate.safeParse(value.slice(0, 10)).success && Number.isFinite(Date.parse(value)),
  "must be a real event date",
);

const unsafeUrlText = (value: string) =>
  /[\s\\]/.test(value) ||
  [...value].some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127);

export const sectionHrefSchema = nonEmptyString.refine((href) => {
  if (unsafeUrlText(href)) return false;
  if (/^mailto:[^@?]+@[^@?]+\.[^@?]+$/.test(href) || /^tel:\+?[0-9()-]+$/.test(href)) return true;
  if (/^#[a-z][\w-]*$/i.test(href)) return true;
  try {
    if (href.startsWith("https://")) {
      const url = new URL(href);
      return !url.username && !url.password;
    }
    const decoded = decodeURIComponent(href);
    return (
      decoded.startsWith("/") &&
      !decoded.startsWith("//") &&
      !unsafeUrlText(decoded) &&
      !decoded.split(/[/?#]/).includes("..")
    );
  } catch {
    return false;
  }
}, "must be a safe local, HTTPS, email or telephone link");

const localAsset = sectionHrefSchema.refine(
  (value) => value.startsWith("/") && !/[?#]/.test(value),
  "must be a local asset",
);
export const sectionImageSchema = z
  .object({
    src: localAsset,
    alt: z.string(),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    focalPoint: z.enum(["center", "top", "bottom", "left", "right"]).optional(),
  })
  .strict();
export const sectionActionSchema = z
  .object({
    label: nonEmptyString,
    href: sectionHrefSchema,
    pageId: pageIdSchema.optional(),
    variant: z.enum(["primary", "secondary", "outline", "ghost"]).optional(),
  })
  .strict();
export type SectionAction = z.infer<typeof sectionActionSchema>;
export type SectionImage = z.infer<typeof sectionImageSchema>;

export const contentCardSchema = z
  .object({
    id: slugSchema,
    title: nonEmptyString,
    summary: nonEmptyString,
    image: sectionImageSchema.optional(),
    action: sectionActionSchema.optional(),
    isDemoContent: z.boolean(),
  })
  .strict();
export const programCardSchema = contentCardSchema.extend({
  duration: nonEmptyString.optional(),
  level: nonEmptyString.optional(),
  highlights: z.array(nonEmptyString).optional(),
});
export const serviceCardSchema = contentCardSchema.extend({
  deliverables: z.array(nonEmptyString).min(1),
});
export const departmentCardSchema = contentCardSchema.extend({ lead: nonEmptyString.optional() });
export const newsCardSchema = contentCardSchema.extend({
  date: calendarDate,
  category: nonEmptyString,
});
export const eventCardSchema = contentCardSchema.extend({
  startsAt: eventDate,
  location: nonEmptyString,
  category: nonEmptyString.optional(),
});
export const personCardSchema = contentCardSchema.extend({
  role: nonEmptyString,
  credentials: z.array(nonEmptyString),
});
export const testimonialCardSchema = z
  .object({
    id: slugSchema,
    quote: nonEmptyString,
    author: nonEmptyString,
    role: nonEmptyString,
    image: sectionImageSchema.optional(),
    isDemoContent: z.boolean(),
  })
  .strict();
export const facilityCardSchema = contentCardSchema.extend({ features: z.array(nonEmptyString) });
export const downloadCardSchema = z
  .object({
    id: slugSchema,
    category: nonEmptyString.optional(),
    title: nonEmptyString,
    summary: nonEmptyString.optional(),
    file: localAsset,
    fileType: z.enum(["pdf", "doc", "docx", "xls", "xlsx", "zip"]),
    fileSizeKb: z.number().positive(),
    updatedAt: calendarDate,
  })
  .strict();
export type ContentCardData = z.infer<typeof contentCardSchema>;
export type ProgramCardData = z.infer<typeof programCardSchema>;
export type ServiceCardData = z.infer<typeof serviceCardSchema>;
export type DepartmentCardData = z.infer<typeof departmentCardSchema>;
export type NewsCardData = z.infer<typeof newsCardSchema>;
export type EventCardData = z.infer<typeof eventCardSchema>;
export type PersonCardData = z.infer<typeof personCardSchema>;
export type TestimonialCardData = z.infer<typeof testimonialCardSchema>;
export type FacilityCardData = z.infer<typeof facilityCardSchema>;
export type DownloadCardData = z.infer<typeof downloadCardSchema>;

export const sectionBaseSchema = z
  .object({
    id: slugSchema.optional(),
    enabled: z.boolean().optional(),
    requiresPage: pageIdSchema.optional(),
    contentSource: z
      .enum([
        "programs",
        "departments",
        "people",
        "news",
        "upcomingEvents",
        "pastEvents",
        "facilities",
        "gallery",
        "downloads",
        "faqs",
        "testimonials",
        "stats",
        "contact",
        "navigation",
        "policies",
        "privacy",
        "terms",
      ])
      .optional(),
    variant: z.literal("default").optional(),
    background: z.enum(["default", "muted", "tint", "inverted"]).optional(),
    density: z.enum(["compact", "regular", "spacious"]).optional(),
    imageAlign: z.enum(["left", "right"]).optional(),
    heading: nonEmptyString.optional(),
    eyebrow: nonEmptyString.optional(),
    body: z.array(nonEmptyString).optional(),
    actions: z.array(sectionActionSchema).max(3).optional(),
    demoLabel: nonEmptyString.optional(),
  })
  .strict();
const collectionBase = sectionBaseSchema.extend({
  heading: nonEmptyString,
  emptyMessage: nonEmptyString,
  variant: z.enum(["grid", "list"]).optional(),
});
const storyItem = contentCardSchema.extend({ outcome: nonEmptyString.optional() });
const statItem = z
  .object({
    id: slugSchema,
    value: nonEmptyString,
    label: nonEmptyString,
    caption: nonEmptyString.optional(),
    isDemoContent: z.boolean(),
  })
  .strict();
const textItem = z
  .object({ id: slugSchema, title: nonEmptyString, body: z.array(nonEmptyString).min(1) })
  .strict();

export const announcementBarSchema = sectionBaseSchema.extend({
  type: z.literal("announcementBar"),
  message: nonEmptyString,
  dismissLabel: nonEmptyString.optional(),
});
export const heroSchema = sectionBaseSchema.extend({
  type: z.literal("hero"),
  heading: nonEmptyString,
  variant: z.enum(["split", "editorial", "collage"]).optional(),
  images: z.array(sectionImageSchema).min(1).max(3),
  keywords: z.array(nonEmptyString).optional(),
});
export const quickLinksSchema = collectionBase.extend({
  type: z.literal("quickLinks"),
  items: z.array(sectionActionSchema),
});
export const trustStripSchema = collectionBase.extend({
  type: z.literal("trustStrip"),
  items: z.array(
    z
      .object({
        id: slugSchema,
        label: nonEmptyString,
        image: sectionImageSchema.optional(),
        isDemoContent: z.boolean(),
      })
      .strict(),
  ),
});
export const statsSchema = collectionBase.extend({
  type: z.literal("stats"),
  items: z.array(statItem),
});
export const aboutSplitSchema = sectionBaseSchema.extend({
  type: z.literal("aboutSplit"),
  heading: nonEmptyString,
  image: sectionImageSchema,
  body: z.array(nonEmptyString).min(1),
});
export const missionVisionSchema = collectionBase.extend({
  type: z.literal("missionVision"),
  items: z.array(textItem),
});
export const valuesSchema = collectionBase.extend({
  type: z.literal("values"),
  items: z.array(textItem.extend({ updatedAt: calendarDate.optional() })),
});
const messageBase = sectionBaseSchema.extend({
  heading: nonEmptyString,
  quote: nonEmptyString,
  person: personCardSchema,
});
export const principalMessageSchema = messageBase.extend({ type: z.literal("principalMessage") });
export const leadershipMessageSchema = messageBase.extend({ type: z.literal("leadershipMessage") });
export const programGridSchema = collectionBase.extend({
  type: z.literal("programGrid"),
  items: z.array(programCardSchema),
});
export const serviceGridSchema = collectionBase.extend({
  type: z.literal("serviceGrid"),
  items: z.array(serviceCardSchema),
});
export const departmentGridSchema = collectionBase.extend({
  type: z.literal("departmentGrid"),
  items: z.array(departmentCardSchema),
});
export const admissionsStepsSchema = collectionBase.extend({
  type: z.literal("admissionsSteps"),
  items: z.array(textItem.extend({ action: sectionActionSchema.optional() })),
});
const ctaBase = sectionBaseSchema.extend({
  heading: nonEmptyString,
  actions: z.array(sectionActionSchema).min(1).max(3),
});
export const applicationCTASchema = ctaBase.extend({ type: z.literal("applicationCTA") });
export const noticeBoardSchema = collectionBase.extend({
  type: z.literal("noticeBoard"),
  items: z.array(
    z
      .object({
        id: slugSchema,
        title: nonEmptyString,
        date: calendarDate,
        body: z.array(nonEmptyString).min(1),
        action: sectionActionSchema.optional(),
      })
      .strict(),
  ),
});
export const newsGridSchema = collectionBase.extend({
  type: z.literal("newsGrid"),
  listing: listingConfigSchema.optional(),
  items: z.array(newsCardSchema),
});
export const eventsGridSchema = collectionBase.extend({
  type: z.literal("eventsGrid"),
  listing: listingConfigSchema.optional(),
  items: z.array(eventCardSchema),
});
export const resultsSchema = collectionBase.extend({
  type: z.literal("results"),
  items: z.array(statItem),
});
export const placementsSchema = collectionBase.extend({
  type: z.literal("placements"),
  items: z.array(storyItem),
});
export const researchHighlightsSchema = collectionBase.extend({
  type: z.literal("researchHighlights"),
  items: z.array(storyItem),
});
export const facilitiesSchema = collectionBase.extend({
  type: z.literal("facilities"),
  items: z.array(facilityCardSchema),
});
export const campusLifeSchema = collectionBase.extend({
  type: z.literal("campusLife"),
  items: z.array(contentCardSchema),
});
export const imageGallerySchema = collectionBase.extend({
  type: z.literal("imageGallery"),
  variant: z.enum(["grid", "masonry"]).optional(),
  items: z.array(
    z
      .object({ id: slugSchema, image: sectionImageSchema, caption: nonEmptyString.optional() })
      .strict(),
  ),
});
export const facultyGridSchema = collectionBase.extend({
  type: z.literal("facultyGrid"),
  items: z.array(personCardSchema),
});
export const teamGridSchema = collectionBase.extend({
  type: z.literal("teamGrid"),
  items: z.array(personCardSchema),
});
export const testimonialsSchema = collectionBase.extend({
  type: z.literal("testimonials"),
  items: z.array(testimonialCardSchema),
});
export const alumniStoriesSchema = collectionBase.extend({
  type: z.literal("alumniStories"),
  items: z.array(storyItem),
});
export const caseStudiesSchema = collectionBase.extend({
  type: z.literal("caseStudies"),
  items: z.array(storyItem),
});
export const downloadsSchema = collectionBase.extend({
  type: z.literal("downloads"),
  items: z.array(downloadCardSchema),
});
export const faqSchema = collectionBase.extend({
  type: z.literal("faq"),
  items: z.array(
    z
      .object({ id: slugSchema, question: nonEmptyString, answer: z.array(nonEmptyString).min(1) })
      .strict(),
  ),
});
export const contactDetailsSchema = collectionBase.extend({
  type: z.literal("contactDetails"),
  items: z.array(
    z
      .object({
        id: slugSchema,
        label: nonEmptyString,
        value: nonEmptyString,
        href: sectionHrefSchema.optional(),
      })
      .strict(),
  ),
});
export const mapSchema = sectionBaseSchema.extend({
  type: z.literal("map"),
  heading: nonEmptyString,
  address: z.array(nonEmptyString).min(1),
  directions: sectionActionSchema,
  image: sectionImageSchema.optional(),
});
export const newsletterSchema = sectionBaseSchema.extend({
  type: z.literal("newsletter"),
  formId: z.literal("newsletter").optional(),
  heading: nonEmptyString,
  notice: nonEmptyString,
  action: sectionActionSchema,
});
export const finalCTASchema = ctaBase.extend({ type: z.literal("finalCTA") });
export const enquiryFormSchema = sectionBaseSchema.extend({
  type: z.literal("enquiryForm"),
  heading: nonEmptyString,
  formId: z.enum(FORM_IDS),
});

export const sectionUnionSchema = z.discriminatedUnion("type", [
  announcementBarSchema,
  heroSchema,
  quickLinksSchema,
  trustStripSchema,
  statsSchema,
  aboutSplitSchema,
  missionVisionSchema,
  valuesSchema,
  principalMessageSchema,
  leadershipMessageSchema,
  programGridSchema,
  serviceGridSchema,
  departmentGridSchema,
  admissionsStepsSchema,
  applicationCTASchema,
  noticeBoardSchema,
  newsGridSchema,
  eventsGridSchema,
  resultsSchema,
  placementsSchema,
  researchHighlightsSchema,
  facilitiesSchema,
  campusLifeSchema,
  imageGallerySchema,
  facultyGridSchema,
  teamGridSchema,
  testimonialsSchema,
  alumniStoriesSchema,
  caseStudiesSchema,
  downloadsSchema,
  faqSchema,
  contactDetailsSchema,
  mapSchema,
  newsletterSchema,
  finalCTASchema,
  enquiryFormSchema,
]);
export type SectionConfig = z.infer<typeof sectionUnionSchema>;
export type SectionType = SectionConfig["type"];
export type SectionOf<T extends SectionType> = Extract<SectionConfig, { type: T }>;
export interface SectionComponentProps<T extends SectionType = SectionType> {
  section: SectionOf<T>;
  headingLevel?: "h1" | "h2" | "h3";
}
export const SECTION_TYPES = sectionUnionSchema.options.map((schema) => schema.shape.type.value);
export const sectionSchema = sectionUnionSchema.superRefine((section, ctx) => {
  if (section.contentSource) {
    const supported: Record<NonNullable<SectionConfig["contentSource"]>, readonly SectionType[]> = {
      programs: ["programGrid", "serviceGrid"],
      departments: ["departmentGrid"],
      people: ["facultyGrid", "teamGrid"],
      news: ["newsGrid"],
      upcomingEvents: ["eventsGrid"],
      pastEvents: ["eventsGrid"],
      facilities: ["facilities"],
      gallery: ["imageGallery"],
      downloads: ["downloads"],
      faqs: ["faq"],
      testimonials: ["testimonials"],
      stats: ["stats", "results"],
      contact: ["contactDetails"],
      navigation: ["quickLinks"],
      policies: ["values"],
      privacy: ["values"],
      terms: ["values"],
    };
    if (!supported[section.contentSource].includes(section.type))
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["contentSource"],
        message: "content source is incompatible with section type",
      });
    if ("items" in section && section.items.length)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["items"],
        message: "bound sections must not duplicate collection items",
      });
  }
  if (
    section.type === "hero" &&
    section.images.length !== (section.variant === "collage" ? 3 : 1)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["images"],
      message: "collage needs three images; other heroes need one",
    });
  }
  if ("items" in section) {
    const ids = new Set<string>();
    section.items.forEach((item, index) => {
      if (!("id" in item)) return;
      if (ids.has(item.id))
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["items", index, "id"],
          message: "duplicate item id",
        });
      ids.add(item.id);
    });
  }
});
export const sectionArraySchema = z.array(sectionSchema).superRefine((sections, ctx) => {
  const ids = new Set<string>();
  sections.forEach((section, index) => {
    if (!section.id) return;
    if (ids.has(section.id))
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [index, "id"],
        message: "duplicate section id",
      });
    ids.add(section.id);
  });
});
