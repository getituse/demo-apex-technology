import { tenantConfigSchema } from "../../config/tenant-schema";
import type { SectionOf } from "../../sections/section-types";
import { createPageTemplates } from "../page-templates";
import { rawConfig } from "../config";
import { editorial } from "./editorial";

const leader = editorial.people[0];
if (!leader) throw new Error("Apex leadership requires its first profile.");

const leadership: SectionOf<"leadershipMessage"> = {
  id: "leadership",
  type: "leadershipMessage",
  heading: "Engineering with purpose and precision",
  eyebrow: "Dean's Welcome",
  body: [
    "At Apex Institute of Technology, our academic leadership is dedicated to equipping the next generation of engineers, designers, and systems architects with rigorous foundations and creative agility.",
  ],
  quote:
    "Engineering begins with questions that matter: how do we build resilient systems, make our assumptions verifiable, and design technology that serves society ethically and sustainably?",
  person: {
    id: leader.slug,
    title: leader.name,
    role: leader.role,
    summary: leader.bio.join(" "),
    credentials: leader.credentials,
    image: leader.image,
    isDemoContent: leader.isDemoContent,
    action: {
      label: "Explore academic departments",
      pageId: "about",
      href: rawConfig.pages.about.path,
    },
  },
  demoLabel: undefined,
  background: "default",
};

const notices: SectionOf<"noticeBoard">["items"] = [
  {
    id: "sample-catalogue-guidance",
    title: "Admissions open for 2026/2027 academic year",
    date: "2026-09-09",
    body: [
      "Applications for undergraduate and postgraduate engineering and design programs are now being accepted. Contact our admissions team for entry guidance.",
    ],
    action: {
      label: "Explore degree programs",
      pageId: "programs",
      href: rawConfig.pages.programs.path,
    },
  },
  {
    id: "sample-calendar-guidance",
    title: "Autumn Innovation Colloquium Series announced",
    date: "2026-09-08",
    body: [
      "Join us for guest lectures from leading practitioners across robotics, sustainable infrastructure, and interactive computing.",
    ],
    action: {
      label: "View event calendar",
      pageId: "newsEvents",
      href: rawConfig.pages.newsEvents.path,
    },
  },
  {
    id: "sample-privacy-guidance",
    title: "Campus laboratory tours available every Wednesday",
    date: "2026-09-07",
    body: [
      "Experience our advanced prototyping labs, computing suites, and collaborative project studios firsthand.",
    ],
    action: {
      label: "Contact admissions",
      pageId: "contact",
      href: rawConfig.pages.contact.path,
    },
  },
];

export const pageSections = createPageTemplates(tenantConfigSchema.parse(rawConfig), {
  heroVariant: "editorial",
  heroEyebrow: "Welcome to Apex",
  heroKeywords: ["Robotics", "Computing", "Design", "Innovation"],
  heroBody: [
    "Explore undergraduate and postgraduate study pathways across eight engineering and design specialisms, led by research-active faculty in Manchester.",
    "Engage with practical project briefs, modern computing laboratories, and innovative design studios built for collaborative discovery.",
  ],
  aboutBody: [
    "A rigorous technical education requires more than lecture halls. At Apex Institute of Technology, we integrate core mathematical foundations with hands-on systems engineering, rapid prototyping, and human-centred design.",
    "Our dedicated laboratories, advanced equipment, and interdisciplinary faculty empower students to solve complex real-world challenges with technical confidence and creative integrity.",
    "From software engineering and embedded robotics to renewable energy systems and digital interaction design, Apex offers comprehensive degree programs accredited to the highest professional standards.",
  ],
  leadership,
  notices,
  homeOrder: [
    "hero",
    "quick-links",
    "trust-strip",
    "programs",
    "about",
    "stats",
    "facilities",
    "conversion-steps",
    "notices",
    "news",
    "upcoming-events",
    "leadership",
    "testimonials",
    "gallery",
    "faq",
    "final-cta",
  ],
  conversionSteps: [
    {
      id: "compare-study-routes",
      title: "Compare study routes",
      body: [
        "Explore our degree pathways, course structures, and industry accreditations to find the program that matches your career aspirations.",
      ],
      action: {
        label: "Explore programs",
        pageId: "programs",
        href: rawConfig.pages.programs.path,
      },
    },
    {
      id: "confirm-entry-details",
      title: "Confirm entry and funding details",
      body: [
        "Review entry requirements, prerequisite qualifications, international equivalencies, and available funding or scholarships.",
      ],
    },
    {
      id: "request-application-instructions",
      title: "Request application instructions",
      body: [
        "Submit your application via our online portal or connect with an admissions officer to guide your submission.",
      ],
      action: {
        label: "Contact admissions",
        pageId: "contact",
        href: rawConfig.pages.contact.path,
      },
    },
  ],
  extraAbout: [
    {
      id: "academic-departments",
      type: "departmentGrid",
      contentSource: "departments",
      requiresPage: "programs",
      heading: rawConfig.terminology.departmentPlural,
      items: [],
      emptyMessage: "No department profiles have been supplied.",
      background: "tint",
    },
    {
      id: "research",
      type: "researchHighlights",
      heading: "Research and innovation focus",
      body: [
        "Our students and faculty investigate frontier technical challenges through interdisciplinary project briefs and collaborative industry partnerships.",
      ],
      demoLabel: undefined,
      items: [
        {
          id: "repairable-sensing-brief",
          title: "How could a sensor be easier to repair?",
          summary:
            "Investigating modular enclosure design, component recyclability, and low-voltage telemetry to extend the operational lifespan of environmental sensors.",
          action: {
            label: "Explore related engineering pathways",
            pageId: "programs",
            href: rawConfig.pages.programs.path,
          },
          isDemoContent: false,
        },
        {
          id: "traceable-data-brief",
          title: "Can another reader reproduce a data transformation?",
          summary:
            "Developing rigorous data lineage frameworks, automated validation suites, and transparent auditing tools for high-throughput urban transport systems.",
          isDemoContent: false,
        },
        {
          id: "accessible-interaction-brief",
          title: "What changes when a task must work without a pointer?",
          summary:
            "Researching non-pointer interaction models, screen-reader ergonomics, and assistive input devices to ensure inclusive access to complex software systems.",
          isDemoContent: false,
        },
      ],
      emptyMessage:
        "No approved research projects or publications have been supplied. No research achievements or partnerships are claimed.",
      background: "default",
    },
    {
      id: "placements",
      type: "placements",
      heading: "Career preparation and industry placements",
      body: [
        "Apex connects students with industry leaders through accredited industrial placements, professional mentorship, and real-world project portfolios.",
      ],
      demoLabel: undefined,
      items: [
        {
          id: "portfolio-decision-narrative",
          title: "Explain one project decision",
          summary:
            "Curate a rigorous engineering portfolio documenting architectural trade-offs, code repositories, and physical prototype evaluations.",
          isDemoContent: false,
        },
        {
          id: "technical-conversation-narrative",
          title: "Practise a technical conversation",
          summary:
            "Collaborative peer technical reviews develop plain-language explanations of complex architectural diagrams, testing methodologies, and modeling assumptions.",
          isDemoContent: false,
        },
        {
          id: "opportunity-verification-narrative",
          title: "Industrial placement year",
          summary:
            "Gain a full year of paid professional experience at leading engineering firms, technology consultancies, or design studios across the UK and internationally.",
          action: {
            label: "Explore placement support",
            pageId: "programs",
            href: rawConfig.pages.programs.path,
          },
          isDemoContent: false,
        },
      ],
      emptyMessage:
        "No verified placement stories or outcomes have been supplied. No employment rate, recruiter relationship or placement guarantee is claimed.",
      background: "tint",
    },
    {
      id: "laboratories-and-campus-life",
      type: "facilities",
      contentSource: "facilities",
      requiresPage: "facilities",
      heading: "Laboratories, studios and campus life",
      body: [
        "Explore our advanced computing facilities, electronics testing suites, renewable energy labs, design studios, and collaborative project commons.",
      ],
      items: [],
      emptyMessage: "No illustrated facility concepts are available.",
      demoLabel: undefined,
      actions: [
        {
          label: "Explore all campus facilities",
          pageId: "facilities",
          href: rawConfig.pages.facilities.path,
        },
      ],
      background: "default",
    },
  ],
  finalCtaBody: [
    "Take the next step in your engineering and design education. Contact our admissions team today to request course details, arrange a personal tour, or begin your application.",
  ],
});
