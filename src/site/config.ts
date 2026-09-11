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
    tagline: "Engineering tomorrow. Thoughtful innovation. Inspiring excellence.",
    description:
      "A premier higher-education institute delivering world-class engineering and design degree pathways, innovative project laboratories, and modern campus facilities.",
    logo: "/tenants/apex-technology/logo.svg",
    logoMark: "/tenants/apex-technology/logo-mark.svg",
    logoDark: "/tenants/apex-technology/logo-dark.svg",
    favicon: "/tenants/apex-technology/favicon.svg",
    foundedYear: 1985,
    primaryCta: { kind: "page", label: "Explore admissions guidance", pageId: "conversion" },
    secondaryCta: { kind: "page", label: "Explore degree programs", pageId: "programs" },
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
      "Explore comprehensive undergraduate and postgraduate engineering and design pathways, dynamic academic departments, and innovative campus facilities in Manchester.",
    ogImage: "/tenants/apex-technology/social-share.png",
    twitterCard: "summary_large_image",
    robots: "index,follow",
    structuredDataType: "CollegeOrUniversity",
  },

  contact: {
    email: "hello@apex-technology.example.com",
    phone: "+44 161 496 0200",
    directionsUrl: "https://example.com/map/apex-technology",
    addressLines: ["Apex Innovation Campus", "Oxford Road, Knowledge Quarter"],
    locality: "Manchester",
    region: "England",
    postalCode: "M1 2AB",
    country: "GB",
    officeHours: [
      {
        days: "Monday to Friday",
        hours: "08:30 - 17:30",
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
      label: "Student Portal",
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
        successMessage:
          "Thank you for contacting Apex Institute of Technology. Our team will review your enquiry and get back to you shortly.",
        errorMessage:
          "Unable to submit your enquiry at this time. Please contact our admissions team directly.",
        requiredFields: ["name", "email", "message"],
        consentText:
          "I agree to Apex Institute of Technology processing my contact details to respond to this enquiry.",
      },
      conversionEnquiry: {
        enabled: true,
        method: "POST",
        externalFormUrl: "https://apply.example.com/apex",
        successMessage:
          "Thank you for your admissions enquiry. Our admissions officers will be in touch with further guidance.",
        errorMessage:
          "Unable to submit your admissions enquiry. Please contact the admissions office directly.",
        requiredFields: ["name", "email", "program"],
        consentText:
          "I agree to Apex Institute of Technology processing my information to provide admissions guidance.",
      },
      newsletter: {
        enabled: true,
        method: "POST",
        successMessage: "Thank you for subscribing to Apex engineering and design news.",
        errorMessage: "Unable to complete subscription at this time. Please try again later.",
        requiredFields: ["email"],
        consentEnabled: true,
        consentText:
          "I agree to receive academic updates, research news, and event invitations from Apex Institute of Technology.",
      },
      consultation: {
        enabled: false,
        method: "POST",
        successMessage:
          "Thank you for your request. An admissions advisor will confirm your consultation.",
        errorMessage: "Unable to schedule consultation at this time. Please contact us directly.",
        requiredFields: ["name", "email"],
      },
    },
    analytics: { provider: "none" },
    portals: [
      { label: "Student Portal", href: "https://portal.example.com/apex" },
      { label: "Application Portal", href: "https://apply.example.com/apex" },
    ],
  },

  legal: {
    legalName: "Apex Institute of Technology",
    copyrightHolder: "Apex Institute of Technology",
    copyrightStartYear: 1985,
    privacyPolicyUpdated: "2026-09-09",
    termsUpdated: "2026-09-09",
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
