import type { TenantConfig } from "../config/tenant-schema";
import { sectionArraySchema, type SectionOf, type SectionType } from "../sections/section-types";
import { placeholderImage } from "../lib/placeholder-media";

export function createSectionExamples(config: TenantConfig) {
  const image = {
    src: placeholderImage(config.assets.images, "wide"),
    alt: "Original geometric demonstration illustration",
    width: 1200,
    height: 800,
  };
  const action = { label: config.pages.contact.navLabel, href: config.pages.contact.path };
  const intro = {
    heading: "Ideas, people and possibilities",
    eyebrow: "A working example",
    body: ["This preview uses illustrative content to demonstrate the configurable layout."],
    emptyMessage: "No items have been published yet.",
    demoLabel: "Illustrative example",
  };
  const card = {
    id: "example",
    title: "Practical exploration",
    summary: "Develop confidence through a focused combination of discussion and hands-on work.",
    image,
    action,
    isDemoContent: true,
  };
  const person = {
    ...card,
    title: "Alex Morgan",
    role: "Example team lead",
    credentials: ["Demonstration biography — not a real credential"],
  };
  const text = {
    id: "purpose",
    title: "Purpose and direction",
    body: ["Build useful skills through shared practice and thoughtful feedback."],
  };
  const metric = {
    id: "sample",
    value: "12",
    label: "Example metric",
    caption: "Illustration only, not an institutional statistic",
    isDemoContent: true,
  };
  const base = {
    heading: intro.heading,
    eyebrow: intro.eyebrow,
    body: intro.body,
    demoLabel: intro.demoLabel,
  };
  const examples = {
    announcementBar: {
      type: "announcementBar",
      message: "Explore the latest opportunities.",
      dismissLabel: "Dismiss preview announcement",
      actions: [action],
    },
    hero: {
      ...base,
      type: "hero",
      heading: "A clear path to what comes next",
      images: [image],
      actions: [action],
      variant: "split",
    },
    quickLinks: {
      ...intro,
      type: "quickLinks",
      items: [action, { label: config.pages.about.navLabel, href: config.pages.about.path }],
    },
    trustStrip: {
      ...intro,
      type: "trustStrip",
      items: [
        {
          id: "sample",
          label: "Illustrative partner identity",
          image: { ...image, alt: "Illustrative mark, not an accreditation" },
          isDemoContent: true,
        },
      ],
    },
    stats: { ...intro, type: "stats", items: [metric] },
    aboutSplit: { ...base, type: "aboutSplit", image },
    missionVision: {
      ...intro,
      type: "missionVision",
      items: [text, { ...text, id: "direction", title: "Looking ahead" }],
    },
    values: { ...intro, type: "values", items: [text] },
    principalMessage: {
      ...base,
      type: "principalMessage",
      person,
      quote: "Progress begins with an opportunity to ask better questions.",
    },
    leadershipMessage: {
      ...base,
      type: "leadershipMessage",
      person,
      quote: "We make room for fresh ideas and shared learning.",
    },
    programGrid: {
      ...intro,
      type: "programGrid",
      heading: config.terminology.programPlural,
      items: [
        {
          ...card,
          duration: "Sample: 12 weeks",
          level: "Introductory",
          highlights: ["Guided projects"],
        },
      ],
    },
    serviceGrid: {
      ...intro,
      type: "serviceGrid",
      items: [{ ...card, deliverables: ["Discovery session", "Written recommendations"] }],
    },
    departmentGrid: {
      ...intro,
      type: "departmentGrid",
      heading: config.terminology.departmentPlural,
      items: [{ ...card, lead: "Example team" }],
    },
    admissionsSteps: {
      ...intro,
      type: "admissionsSteps",
      heading: config.terminology.primaryConversionLabel,
      items: [text, { ...text, id: "connect", title: "Talk to the team", action }],
    },
    applicationCTA: { ...base, type: "applicationCTA", actions: [action] },
    noticeBoard: {
      ...intro,
      type: "noticeBoard",
      items: [{ ...text, date: "2026-09-08", action }],
    },
    newsGrid: {
      ...intro,
      type: "newsGrid",
      items: [{ ...card, date: "2026-09-08", category: "Example update" }],
    },
    eventsGrid: {
      ...intro,
      type: "eventsGrid",
      items: [{ ...card, startsAt: "2026-10-12T10:00:00Z", location: "Example meeting space" }],
    },
    results: { ...intro, type: "results", items: [metric] },
    placements: {
      ...intro,
      type: "placements",
      items: [{ ...card, outcome: "An illustrative next step, not an employment claim." }],
    },
    researchHighlights: { ...intro, type: "researchHighlights", items: [card] },
    facilities: {
      ...intro,
      type: "facilities",
      heading: config.terminology.facilitiesLabel,
      items: [{ ...card, features: ["Flexible work areas"] }],
    },
    campusLife: { ...intro, type: "campusLife", items: [card] },
    imageGallery: {
      ...intro,
      type: "imageGallery",
      items: [
        { id: "wide", image, caption: "Original demonstration artwork" },
        {
          id: "portrait",
          image: {
            ...image,
            src: placeholderImage(config.assets.images, "portrait"),
            width: 800,
            height: 1000,
          },
        },
      ],
    },
    facultyGrid: {
      ...intro,
      type: "facultyGrid",
      heading: config.terminology.peopleSectionLabel,
      items: [person],
    },
    teamGrid: {
      ...intro,
      type: "teamGrid",
      heading: config.terminology.peopleSectionLabel,
      items: [person],
    },
    testimonials: {
      ...intro,
      type: "testimonials",
      items: [
        {
          id: "quote",
          quote: "An illustrative quotation, not a real endorsement.",
          author: "Example participant",
          role: "Demonstration attribution",
          image,
          isDemoContent: true,
        },
      ],
    },
    alumniStories: { ...intro, type: "alumniStories", items: [card] },
    caseStudies: {
      ...intro,
      type: "caseStudies",
      items: [{ ...card, outcome: "A sample outcome for layout review." }],
    },
    downloads: { ...intro, type: "downloads", items: [] },
    faq: {
      ...intro,
      type: "faq",
      items: [
        {
          id: "start",
          question: "How do I find out more?",
          answer: ["Use the configured contact link to speak to the team."],
        },
      ],
    },
    contactDetails: {
      ...intro,
      type: "contactDetails",
      items: [
        {
          id: "email",
          label: "Email",
          value: config.contact.email,
          href: `mailto:${config.contact.email}`,
        },
      ],
    },
    map: {
      ...base,
      type: "map",
      address: config.contact.addressLines,
      directions: {
        label: "View directions",
        href: config.contact.directionsUrl ?? "https://www.openstreetmap.org/",
      },
    },
    newsletter: {
      ...base,
      type: "newsletter",
      notice: "This preview collects no email addresses. Contact the team for updates.",
      action,
    },
    finalCTA: { ...base, type: "finalCTA", actions: [action] },
    enquiryForm: {
      ...base,
      type: "enquiryForm",
      formId: "generalEnquiry",
      heading: "Preview enquiry",
    },
  } satisfies { [T in SectionType]: SectionOf<T> };
  sectionArraySchema.parse(Object.values(examples));
  return examples;
}
