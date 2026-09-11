import { tenantConfigSchema } from "../../config/tenant-schema";
import type { SectionOf } from "../../sections/section-types";
import { createPageTemplates } from "../page-templates";
import { rawConfig } from "../config";
import { editorial } from "./editorial";

const leader = editorial.people[0];
if (!leader) throw new Error("Apex demonstration leadership requires its first fictional profile.");

const leadership: SectionOf<"leadershipMessage"> = {
  id: "leadership",
  type: "leadershipMessage",
  heading: "A sample perspective on thoughtful engineering",
  eyebrow: "Illustrative leadership message",
  body: [
    "This quotation was written for the demonstration and assigned to a fictional character. It is not a statement by an actual academic, employee or institutional leader.",
  ],
  quote:
    "Illustrative message: begin with a question you can explain, make your assumptions visible and leave enough of a trail for someone else to challenge your answer. A useful project shows both what you learned and what you still need to test.",
  person: {
    id: leader.slug,
    title: leader.name,
    role: leader.role,
    summary: leader.bio.join(" "),
    credentials: leader.credentials,
    image: leader.image,
    isDemoContent: leader.isDemoContent,
    action: {
      label: "Explore the fictional department profiles",
      pageId: "about",
      href: rawConfig.pages.about.path,
    },
  },
  demoLabel: "Fictional person and illustrative quotation",
  background: "default",
};

const notices: SectionOf<"noticeBoard">["items"] = [
  {
    id: "sample-catalogue-guidance",
    title: "Demonstration notice: compare subjects, then verify provision",
    date: "2026-09-09",
    body: [
      "The eight pathway examples are fictional outlines, not real awarded or recognised courses. Use their project questions to prepare a discussion with a verified provider; no application or eligibility decision is made here.",
    ],
    action: {
      label: "Compare sample pathways",
      pageId: "programs",
      href: rawConfig.pages.programs.path,
    },
  },
  {
    id: "sample-calendar-guidance",
    title: "Demonstration notice: calendar entries are illustrative",
    date: "2026-09-08",
    body: [
      "July and August entries illustrate the archive; October, November and December entries illustrate future agendas. None records or announces an actual event. There are no bookings, tickets or confirmed venues.",
    ],
    action: {
      label: "Read the sample calendar",
      pageId: "newsEvents",
      href: rawConfig.pages.newsEvents.path,
    },
  },
  {
    id: "sample-privacy-guidance",
    title: "Demonstration notice: do not send personal documents",
    date: "2026-09-07",
    body: [
      "No application or enquiry submission endpoint is configured. Contact details are examples, not a verified admissions office. The privacy notice explains the static application and the hosting information an actual operator must supply.",
    ],
    action: {
      label: "Read the demo privacy notice",
      pageId: "privacy",
      href: rawConfig.pages.privacy.path,
    },
  },
];

export const pageSections = createPageTemplates(tenantConfigSchema.parse(rawConfig), {
  heroVariant: "editorial",
  heroBody: [
    "Explore engineering and design through eight fictional study pathways, four sample departments and project questions that put evidence before promises.",
    "Degree-style titles are catalogue demonstrations, not real awarded or recognised courses. People, events and illustrated spaces are fictional; no place, qualification or placement is offered.",
  ],
  aboutBody: [
    "A degree decision involves more than a course title. This demonstration catalogue connects computing, electronic systems, sustainable engineering and human-centred design through sample projects and clearly fictional profiles.",
    "Compare a repairable sensor brief, a synthetic data pipeline or an accessible interface critique. Six illustrated facility concepts show possible study settings without claiming actual premises, equipment, research achievements or delivered teaching.",
    "Apex is not a verified institution. Its pathway names, durations and biographies are examples only. Career preparation narratives explain portfolio decisions, not recruitment results; a real provider must confirm any course, support or application arrangements.",
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
        "Review the eight fictional pathway descriptions, their sample durations and department connections. Shortlist subject questions rather than treating a degree label as an actual offer or recognised qualification.",
      ],
      action: {
        label: "Explore the sample catalogue",
        pageId: "programs",
        href: rawConfig.pages.programs.path,
      },
    },
    {
      id: "confirm-entry-details",
      title: "Confirm entry and funding details",
      body: [
        "Ask a verified provider for its approved entry requirements, awarding arrangements, fees, funding information and deadlines. This demonstration has no operational admissions office and makes no eligibility or funding decision.",
      ],
    },
    {
      id: "request-application-instructions",
      title: "Request application instructions",
      body: [
        "Obtain application instructions from the real provider through a verified channel. This static demonstration submits no application, enquiry or booking; do not send identity or financial documents to the example contact details.",
      ],
      action: {
        label: "Understand the demo's privacy limits",
        pageId: "privacy",
        href: rawConfig.pages.privacy.path,
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
      heading: "Research questions — illustrative project briefs",
      body: [
        "These are proposed learning scenarios, not completed research, publications or externally commissioned work. They use synthetic inputs and report no measured findings.",
      ],
      demoLabel: "Illustrative project brief, not a research achievement",
      items: [
        {
          id: "repairable-sensing-brief",
          title: "How could a sensor be easier to repair?",
          summary:
            "A fictional brief compares two low-voltage sensor enclosure sketches. Document replaceable parts, safe inspection questions and the evidence needed to assess repair access; no prototype or tested improvement is claimed.",
          action: {
            label: "Explore related engineering pathways",
            pageId: "programs",
            href: rawConfig.pages.programs.path,
          },
          isDemoContent: true,
        },
        {
          id: "traceable-data-brief",
          title: "Can another reader reproduce a data transformation?",
          summary:
            "An illustrative project uses invented transport records to compare lineage and validation choices. Plan checks for missing inputs and record transformation assumptions; no real dataset, publication or commissioned platform is represented.",
          isDemoContent: true,
        },
        {
          id: "accessible-interaction-brief",
          title: "What changes when a task must work without a pointer?",
          summary:
            "A sample interface critique traces keyboard flow, labels and error recovery in a fictional booking concept. Separate design hypotheses from evidence and plan a future evaluation; no participant study or verified user benefit is claimed.",
          isDemoContent: true,
        },
      ],
      emptyMessage:
        "No approved research projects or publications have been supplied. No research achievements or partnerships are claimed.",
      background: "default",
    },
    {
      id: "placements",
      type: "placements",
      heading: "Career preparation — not placement outcomes",
      body: [
        "These fictional preparation narratives suggest how to discuss project work honestly. They are not alumni stories, employer relationships, vacancies or guarantees of a placement, interview or job.",
      ],
      demoLabel: "Illustrative preparation scenario",
      items: [
        {
          id: "portfolio-decision-narrative",
          title: "Explain one project decision",
          summary:
            "A sample portfolio exercise chooses one design trade-off, records alternatives and explains the author's contribution. Use synthetic or permission-cleared material and include unresolved questions rather than turning a prototype into an employment claim.",
          isDemoContent: true,
        },
        {
          id: "technical-conversation-narrative",
          title: "Practise a technical conversation",
          summary:
            "An illustrative peer discussion asks for a plain-language account of a diagram, test or modelling assumption. Practise acknowledging uncertainty and responding to a changed requirement; no recruiter session or selection outcome is involved.",
          isDemoContent: true,
        },
        {
          id: "opportunity-verification-narrative",
          title: "Check an opportunity independently",
          summary:
            "A sample planning checklist asks who is advertising an opportunity, what work it involves and how access, pay and supervision would be confirmed. The catalogue provides no employer introductions, approved vacancies or promised placements.",
          action: {
            label: "Read the demonstration limits",
            pageId: "terms",
            href: rawConfig.pages.terms.path,
          },
          isDemoContent: true,
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
      heading: "Laboratories, studios and campus life — six concepts",
      body: [
        "Explore the fictional computing and electronics laboratories, energy and design studios, reading room and project commons. Descriptions and original illustrations are planning concepts, not actual premises, equipment access or delivered services.",
      ],
      items: [],
      emptyMessage: "No illustrated facility concepts are available.",
      demoLabel: "Illustrated concept, not an actual facility",
      actions: [
        {
          label: "Explore all six space concepts",
          pageId: "facilities",
          href: rawConfig.pages.facilities.path,
        },
      ],
      background: "default",
    },
  ],
  finalCtaBody: [
    "Use the fictional catalogue to prepare questions about subjects, teaching and support. For a real study decision, independently verify the provider, qualification status and application channel. Example contact details do not accept applications or personal documents.",
  ],
});
