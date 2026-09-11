import type { TenantConfigInput } from "../config/tenant-schema";

/**
 * College tenant. Same components as the school tenant, different vocabulary,
 * different theme preset and a different structured-data type.
 */
export const rawConfig = {
  id: "apex-technology",
  slug: "apex-technology",
  organizationType: "college",
  siteUrl: "https://apex-technology.example.com",
  defaultLocale: "en",
  supportedLocales: ["en"],

  brand: {
    name: "Apex Institute of Technology",
    shortName: "Apex",
    tagline: "Engineering questions. Thoughtful design. A demonstration catalogue.",
    description:
      "A fictional higher-education catalogue with engineering and design pathways, illustrative project briefs and original space concepts. No real courses or qualifications are offered.",
    logo: "/tenants/apex-technology/logo.svg",
    logoMark: "/tenants/apex-technology/logo-mark.svg",
    logoDark: "/tenants/apex-technology/logo-dark.svg",
    favicon: "/tenants/apex-technology/favicon.svg",
    foundedYear: 1985,
    primaryCta: { kind: "page", label: "Explore admissions guidance", pageId: "conversion" },
    secondaryCta: { kind: "page", label: "Compare sample programs", pageId: "programs" },
  },

  terminology: {
    programSingular: "Program",
    programPlural: "Programs",
    departmentSingular: "Department",
    departmentPlural: "Departments",
    peopleSectionLabel: "Faculty",
    primaryConversionLabel: "Admissions",
    facilitiesLabel: "Campus life",
    audienceSingular: "Student",
    audiencePlural: "Students",
  },

  theme: { preset: "premium-university" },

  seo: {
    titleTemplate: "%s | Apex Institute of Technology",
    defaultTitle: "Apex Institute of Technology",
    defaultDescription:
      "Explore eight fictional engineering and design pathways, sample departments and illustrated campus-life concepts. A demonstration website, not a real qualification provider.",
    ogImage: "/tenants/apex-technology/social-share.png",
    twitterCard: "summary_large_image",
    robots: "index,follow",
    structuredDataType: "CollegeOrUniversity",
  },

  contact: {
    email: "hello@apex-technology.example.com",
    phone: "+44 161 496 0200",
    directionsUrl: "https://example.com/map-demo/apex-technology",
    addressLines: [
      "Demonstration address — not an actual visitor destination",
      "Apex Campus, Sciences Quarter (fictional)",
    ],
    locality: "Manchester",
    region: "England",
    postalCode: "M1 2AB",
    country: "GB",
    officeHours: [
      {
        days: "Illustrative schedule only — Monday to Friday",
        hours: "09:00 - 17:00 (not verified office hours)",
      },
    ],
  },

  social: [
    { platform: "linkedin", url: "https://linkedin.com/company/example-apex" },
    { platform: "youtube", url: "https://youtube.com/@example-apex" },
  ],

  navigation: [
    { kind: "page", label: "About", pageId: "about" },
    {
      kind: "group",
      label: "Study",
      children: [
        { kind: "page", label: "Programs", pageId: "programs" },
        { kind: "page", label: "Admissions", pageId: "conversion" },
        { kind: "page", label: "Downloads", pageId: "downloads" },
      ],
    },
    { kind: "page", label: "Campus life", pageId: "facilities" },
    { kind: "page", label: "News & events", pageId: "newsEvents" },
    { kind: "page", label: "Contact", pageId: "contact" },
  ],

  utilityLinks: [
    { kind: "page", label: "Gallery", pageId: "gallery" },
    {
      kind: "external",
      label: "Demonstration student portal",
      href: "https://portal.example.com/apex",
    },
  ],

  features: {
    announcementBar: false,
    utilityNav: true,
    stickyHeader: true,
    mobileContactBar: false,
    darkModeToggle: false,
    newsletterSignup: true,
    siteSearch: true,
    breadcrumbs: true,
  },

  pages: {
    home: { enabled: true, path: "/", navLabel: "Home" },
    about: { enabled: true, path: "/about", navLabel: "About" },
    programs: { enabled: true, path: "/programs", navLabel: "Programs" },
    conversion: { enabled: true, path: "/admissions", navLabel: "Admissions" },
    facilities: { enabled: true, path: "/campus-life", navLabel: "Campus life" },
    newsEvents: { enabled: true, path: "/news-events", navLabel: "News & events" },
    gallery: { enabled: true, path: "/gallery", navLabel: "Gallery" },
    contact: { enabled: true, path: "/contact", navLabel: "Contact" },
    downloads: { enabled: true, path: "/downloads", navLabel: "Downloads" },
    policies: { enabled: true, path: "/policies", navLabel: "Policies" },
    privacy: { enabled: true, path: "/privacy", navLabel: "Privacy" },
    terms: { enabled: true, path: "/terms", navLabel: "Terms" },
  },

  detailRoutes: {
    programs: { enabled: true, path: "/programs" },
    departments: { enabled: true, path: "/departments", aliases: ["/programs/departments"] },
    people: { enabled: true, path: "/faculty", aliases: ["/about/people"] },
    news: { enabled: true, path: "/news", aliases: ["/news-events/news"] },
    events: { enabled: true, path: "/events", aliases: ["/news-events/events"] },
  },

  listings: {
    news: { pageSize: 3, categoryFiltering: true },
    events: { pageSize: 2, categoryFiltering: true },
  },

  integrations: {
    forms: {
      generalEnquiry: {
        enabled: true,
        method: "POST",
        successMessage: "The configured service accepted your enquiry. A reply is not guaranteed.",
        errorMessage:
          "Delivery could not be confirmed. Do not send personal documents to example contacts.",
        requiredFields: ["name", "email", "message"],
        consentText:
          "I understand this demonstration does not submit an enquiry or request contact.",
      },
      conversionEnquiry: {
        enabled: true,
        method: "POST",
        // Reuse the demonstration application portal, not a submission endpoint.
        externalFormUrl: "https://apply.example.com/apex",
        successMessage:
          "The configured service accepted your request. No application decision or booking is confirmed.",
        errorMessage:
          "Delivery could not be confirmed. Use a verified provider for actual admissions.",
        requiredFields: ["name", "email", "program"],
        consentText:
          "I understand this demonstration neither applies for a place nor sends personal data.",
      },
      newsletter: {
        enabled: true,
        method: "POST",
        successMessage:
          "The configured service accepted your subscription request. Newsletter delivery is not guaranteed.",
        errorMessage:
          "Delivery could not be confirmed. Do not assume a newsletter subscription is active.",
        requiredFields: ["email"],
        consentEnabled: true,
        consentText:
          "I have read the demonstration privacy notice and understand it is unapproved sample text. No address or consent record is sent to a server in demo mode; use fictional details only.",
      },
      consultation: {
        enabled: false,
        method: "POST",
        successMessage:
          "The configured service accepted your request. No appointment is confirmed.",
        errorMessage: "Delivery could not be confirmed. No appointment is confirmed.",
        requiredFields: ["name", "email"],
      },
    },
    analytics: { provider: "none" },
    portals: [
      { label: "Demonstration student portal", href: "https://portal.example.com/apex" },
      { label: "Demonstration application portal", href: "https://apply.example.com/apex" },
    ],
  },

  legal: {
    legalName: "Apex Institute of Technology (demonstration)",
    copyrightHolder: "Apex Institute of Technology (demonstration)",
    copyrightStartYear: 1985,
    privacyPolicyUpdated: "2026-09-09",
    termsUpdated: "2026-09-09",
    demoContentNotice:
      "Demonstration website: Apex, its people, dates, degree-style pathways and spaces are fictional. Counts describe the sample catalogue, not institution size. No real courses, qualifications, placements or endorsements are offered. Original illustrations are not actual premises or people. Legal text is DEMO copy, not approved customer policy; contact details are examples, not verified offices.",
  },

  contentSources: {
    news: "local",
    events: "local",
    programs: "local",
    departments: "local",
    people: "local",
    testimonials: "local",
    facilities: "local",
    gallery: "local",
    downloads: "local",
    faqs: "local",
    policies: "local",
    stats: "local",
  },

  assets: {
    basePath: "/tenants/apex-technology",
    images: "/tenants/apex-technology/images",
    documents: "/tenants/apex-technology/documents",
    socialShareImage: "/tenants/apex-technology/social-share.png",
    manifestIcon: "/tenants/apex-technology/icon-512.png",
  },
} satisfies TenantConfigInput;
