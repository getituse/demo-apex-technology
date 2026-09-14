import type { NavLink, PageId, TenantConfig } from "../config/tenant-schema";
import { placeholderImage } from "../lib/placeholder-media";
import type { SectionAction, SectionConfig, SectionOf } from "../sections/section-types";

export interface PageTemplateOptions {
  heroVariant: "split" | "editorial" | "collage";
  heroEyebrow?: string;
  heroKeywords?: string[];
  heroBody?: string[];
  aboutBody: string[];
  conversionSteps: SectionOf<"admissionsSteps">["items"];
  programVariant?: "programGrid" | "serviceGrid";
  peopleVariant?: "facultyGrid" | "teamGrid";
  /** A complete permutation of the default home section IDs, including disabled slots. */
  homeOrder?: string[];
  extraAbout?: SectionConfig[];
  finalCtaBody?: string[];
  leadership?: SectionOf<"principalMessage" | "leadershipMessage">;
  notices?: SectionOf<"noticeBoard">["items"];
  quickLinksEnabled?: boolean;
}

const faqNotice =
  "Find answers to frequently asked questions about our engineering and design degree programs, admissions criteria, campus facilities, and student life at Apex.";
const conversionNotice =
  "Our admissions office is ready to assist prospective students with degree requirements, portfolio submissions, and application guidance.";
const legalEmptyMessage =
  "This legal text has not been supplied. Please contact the academic registry for copies of our statutory policies and institutional documentation.";

function brandAction(
  config: TenantConfig,
  link: NavLink,
  variant: SectionAction["variant"],
): SectionAction {
  return {
    label: link.label,
    href: link.kind === "page" ? config.pages[link.pageId].path : link.href,
    ...(link.kind === "page" ? { pageId: link.pageId } : {}),
    variant,
  };
}

function orderHome(sections: SectionConfig[], order?: string[]): SectionConfig[] {
  if (!order) return sections;
  if (order.length !== sections.length || new Set(order).size !== sections.length) {
    throw new Error("homeOrder must include each home section ID exactly once.");
  }
  const byId = new Map(sections.map((section) => [section.id, section]));
  return order.map((id) => {
    const section = byId.get(id);
    if (!section) throw new Error(`Unknown homeOrder section ID: ${id}`);
    return section;
  });
}

/**
 * Pure content composition, safe to load before Vite aliases exist. No tenant-root
 * imports, content parsing, dates, React or collection snapshots belong here.
 * The source resolver fills the empty item arrays and filters disabled-page links.
 */
export function createPageTemplates(
  config: TenantConfig,
  options: PageTemplateOptions,
): Record<PageId, SectionConfig[]> {
  const actions = [
    brandAction(config, config.brand.primaryCta, "primary"),
    brandAction(config, config.brand.secondaryCta, "outline"),
  ];
  const heroImage = {
    src: placeholderImage(config.assets.images, "hero"),
    alt: "Apex Institute of Technology robotics and engineering laboratories",
    width: 1600,
    height: 900,
  };
  const wideImage = {
    src: placeholderImage(config.assets.images, "wide"),
    alt: "Apex Institute of Technology campus architecture and learning spaces",
    width: 1200,
    height: 800,
  };
  const portraitImage = {
    src: placeholderImage(config.assets.images, "portrait"),
    alt: "Apex Institute of Technology faculty and student research",
    width: 800,
    height: 1000,
  };

  const hero: SectionOf<"hero"> = {
    id: "hero",
    type: "hero",
    variant: options.heroVariant,
    heading: config.brand.name,
    eyebrow: options.heroEyebrow ?? `Welcome to ${config.brand.shortName}`,
    body: [config.brand.tagline, ...(options.heroBody ?? [])],
    images: options.heroVariant === "collage" ? [heroImage, portraitImage, wideImage] : [heroImage],
    actions,
    keywords: options.heroKeywords,
    background: "default",
    density: "regular",
  };
  const quickLinks: SectionOf<"quickLinks"> = {
    id: "quick-links",
    type: "quickLinks",
    enabled: options.quickLinksEnabled ?? false,
    contentSource: "navigation",
    heading: "Explore",
    items: [],
    emptyMessage: "No navigation links have been supplied.",
    density: "compact",
    background: "tint",
  };
  const trustStrip: SectionOf<"trustStrip"> = {
    id: "trust-strip",
    type: "trustStrip",
    enabled: false,
    heading: "Recognition",
    items: [],
    emptyMessage: "Accreditation and partner information will be published soon.",
    density: "compact",
  };
  const about: SectionOf<"aboutSplit"> = {
    id: "about",
    type: "aboutSplit",
    heading: `About ${config.brand.shortName}`,
    body: [...options.aboutBody],
    image: wideImage,
    imageAlign: options.heroVariant === "editorial" ? "right" : "left",
    background: "default",
    density: "regular",
  };
  const stats: SectionOf<"stats"> = {
    id: "stats",
    type: "stats",
    contentSource: "stats",
    heading: "At a glance",
    body: [
      "Key facts and metrics reflecting our academic standards, research activity, and student outcomes.",
    ],
    demoLabel: undefined,
    items: [],
    emptyMessage: "Key metrics will be published soon.",
    background: "tint",
    density: "compact",
  };
  const programs: SectionOf<"programGrid" | "serviceGrid"> = {
    id: "programs",
    type: options.programVariant ?? "programGrid",
    contentSource: "programs",
    requiresPage: "programs",
    heading: config.terminology.programPlural,
    items: [],
    emptyMessage: `No ${config.terminology.programPlural.toLowerCase()} have been supplied. Use the contact details to ask for current information.`,
    demoLabel: undefined,
    background: "default",
  };
  const departments: SectionOf<"departmentGrid"> = {
    id: "departments",
    type: "departmentGrid",
    contentSource: "departments",
    requiresPage: "programs",
    heading: config.terminology.departmentPlural,
    items: [],
    emptyMessage: `No ${config.terminology.departmentPlural.toLowerCase()} have been supplied.`,
    background: "tint",
  };
  const steps: SectionOf<"admissionsSteps"> = {
    id: "conversion-steps",
    type: "admissionsSteps",
    requiresPage: "conversion",
    heading: config.terminology.primaryConversionLabel,
    body: [
      "Our structured admissions process guides applicants through degree prerequisites, portfolio review, and enrollment.",
    ],
    items: options.conversionSteps.map((step) => ({ ...step, body: [...step.body] })),
    emptyMessage:
      "No process guidance has been supplied. Use the contact details to ask how to proceed.",
    background: "tint",
  };
  const facilities: SectionOf<"facilities"> = {
    id: "facilities",
    type: "facilities",
    contentSource: "facilities",
    requiresPage: "facilities",
    heading: config.terminology.facilitiesLabel,
    items: [],
    emptyMessage:
      "Information about our laboratories and engineering spaces will be updated shortly.",
    background: "default",
  };
  const notices: SectionOf<"noticeBoard"> = {
    id: "notices",
    type: "noticeBoard",
    heading: "Notice board",
    items: options.notices ?? [],
    emptyMessage:
      "No dated notices have been supplied. Contact the organisation for current updates.",
    background: "muted",
    density: "compact",
  };
  const news: SectionOf<"newsGrid"> = {
    id: "news",
    type: "newsGrid",
    contentSource: "news",
    requiresPage: "newsEvents",
    heading: "Latest updates",
    items: [],
    emptyMessage: "No news articles have been supplied.",
    background: "default",
  };
  const upcomingEvents: SectionOf<"eventsGrid"> = {
    id: "upcoming-events",
    type: "eventsGrid",
    contentSource: "upcomingEvents",
    requiresPage: "newsEvents",
    heading: "Upcoming events",
    items: [],
    emptyMessage:
      "No upcoming events have been supplied. Contact the organisation for current dates.",
    background: "tint",
  };
  const pastEvents: SectionOf<"eventsGrid"> = {
    id: "past-events",
    type: "eventsGrid",
    contentSource: "pastEvents",
    requiresPage: "newsEvents",
    heading: "Past events",
    items: [],
    emptyMessage: "No past events have been supplied.",
    background: "default",
  };
  const people: SectionOf<"facultyGrid" | "teamGrid"> = {
    id: "people",
    type: options.peopleVariant ?? "facultyGrid",
    contentSource: "people",
    heading: config.terminology.peopleSectionLabel,
    items: [],
    emptyMessage: "Faculty and researcher profiles will be updated shortly.",
    background: "default",
  };
  // This is deliberately an unbound, empty slot, not every person relabelled a leader.
  const leadership: SectionOf<"facultyGrid" | "teamGrid"> = {
    id: "leadership",
    type: options.peopleVariant ?? "facultyGrid",
    heading: "Leadership",
    body: [
      "Welcome to Apex Institute of Technology. Our academic leadership team is committed to advancing technical education and fostering interdisciplinary engineering innovation.",
    ],
    items: [],
    emptyMessage: "Leadership profiles will be updated shortly.",
    background: "default",
  };
  const testimonials: SectionOf<"testimonials"> = {
    id: "testimonials",
    type: "testimonials",
    contentSource: "testimonials",
    heading: "Testimonials",
    items: [],
    emptyMessage: "Student and alumni perspectives will be published soon.",
    background: "tint",
  };
  const gallery: SectionOf<"imageGallery"> = {
    id: "gallery",
    type: "imageGallery",
    contentSource: "gallery",
    requiresPage: "gallery",
    heading: config.pages.gallery.navLabel,
    items: [],
    emptyMessage: "Campus and laboratory images are being curated.",
    background: "default",
  };
  const faq: SectionOf<"faq"> = {
    id: "faq",
    type: "faq",
    contentSource: "faqs",
    heading: "Frequently asked questions",
    body: [faqNotice],
    items: [],
    emptyMessage:
      "No answers have been supplied. Please contact our admissions team for more information.",
    background: "muted",
    density: "compact",
  };
  const contact: SectionOf<"contactDetails"> = {
    id: "contact-details",
    type: "contactDetails",
    contentSource: "contact",
    heading: config.pages.contact.navLabel,
    body: [
      "Get in touch with our admissions office or academic departments. We are pleased to assist with enquiries, campus tours, and program information.",
    ],
    items: [],
    emptyMessage: "Contact details will be available shortly.",
    background: "default",
  };
  const finalCta: SectionOf<"finalCTA"> = {
    id: "final-cta",
    type: "finalCTA",
    requiresPage: "conversion",
    heading: config.terminology.primaryConversionLabel,
    body: options.finalCtaBody ?? [
      "Use the contact details to discuss your questions and confirm the next step.",
    ],
    actions,
    background: "tint",
    density: "compact",
  };
  const enquiry = (
    formId: "generalEnquiry" | "conversionEnquiry" | "consultation",
    heading: string,
  ): SectionOf<"enquiryForm"> => ({
    id: `form-${formId.toLowerCase()}`,
    type: "enquiryForm",
    formId,
    heading,
    background: "muted",
  });
  const newsletter: SectionOf<"newsletter"> = {
    id: "newsletter-form",
    type: "newsletter",
    formId: "newsletter",
    heading: "Newsletter signup",
    notice:
      "Subscribe to receive academic updates, research announcements, and engineering seminars directly to your inbox.",
    action: { label: "Email", href: `mailto:${config.contact.email}` },
    background: "muted",
  };

  const home = orderHome(
    [
      hero,
      quickLinks,
      trustStrip,
      about,
      stats,
      programs,
      steps,
      facilities,
      notices,
      news,
      upcomingEvents,
      options.leadership ?? leadership,
      testimonials,
      gallery,
      faq,
      finalCta,
    ],
    options.homeOrder,
  );
  const legalPage = (pageId: "policies" | "privacy" | "terms"): SectionConfig[] => [
    {
      id: `${pageId}-text`,
      type: "values",
      contentSource: pageId,
      variant: "list",
      heading: config.pages[pageId].navLabel,
      items: [],
      emptyMessage: legalEmptyMessage,
      background: "default",
    },
    contact,
  ];

  // Keep all page keys, even disabled ones. Registration/rendering owns page availability.
  return {
    home,
    about: [
      { ...about, heading: `About ${config.brand.shortName}` },
      ...(options.extraAbout ?? []),
      stats,
      people,
      testimonials,
      finalCta,
    ],
    programs: [
      { ...programs, heading: `Our ${config.terminology.programPlural}` },
      departments,
      faq,
      finalCta,
    ],
    conversion: [
      {
        id: "conversion-notice",
        type: "announcementBar",
        requiresPage: "conversion",
        heading: "Contact to continue",
        message: conversionNotice,
        background: "muted",
        density: "compact",
      },
      { ...steps, heading: "Application Steps & Guidance" },
      enquiry("conversionEnquiry", config.terminology.primaryConversionLabel),
      contact,
      faq,
    ],
    facilities: [{ ...facilities, heading: config.pages.facilities.navLabel }, gallery, contact],
    newsEvents: [
      { ...news, heading: config.pages.newsEvents.navLabel },
      upcomingEvents,
      pastEvents,
      notices,
      newsletter,
    ],
    gallery: [gallery, contact],
    contact: [
      contact,
      enquiry("generalEnquiry", "General enquiry"),
      enquiry("consultation", "Consultation request"),
      faq,
    ],
    downloads: [
      {
        id: "downloads",
        type: "downloads",
        contentSource: "downloads",
        requiresPage: "downloads",
        heading: config.pages.downloads.navLabel,
        items: [],
        emptyMessage:
          "No documents have been supplied. Contact the academic registry for approved course specifications and forms.",
        background: "default",
      },
      contact,
    ],
    policies: legalPage("policies"),
    privacy: legalPage("privacy"),
    terms: legalPage("terms"),
  };
}
