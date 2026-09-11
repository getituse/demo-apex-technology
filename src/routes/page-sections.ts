import type { TenantContent } from "../config/content-schema";
import type { ContentCollection, PageId, TenantConfig } from "../config/tenant-schema";
import {
  sectionArraySchema,
  type SectionAction,
  type SectionConfig,
} from "../sections/section-types";
import {
  collectionRoutes,
  createRouteManifest,
  findPublicRoute,
  type DetailCollection,
} from "./route-manifest";
import { newestNews, splitEvents } from "./collection-dates";
import { getContactActions } from "../lib/contact-actions";

export function resolvePageSections(
  config: TenantConfig,
  content: TenantContent,
  pageId: PageId,
  asOf: string,
): SectionConfig[] {
  if (!config.pages[pageId].enabled) return [];
  const routes = createRouteManifest(config, content);
  const local = <K extends ContentCollection>(key: K): TenantContent[K] =>
    config.contentSources[key] === "local" ? content[key] : ([] as unknown as TenantContent[K]);
  const cardAction = (
    collection: DetailCollection,
    slug: string,
    label: string,
  ): SectionAction | undefined => {
    const route = collectionRoutes(routes, collection).find((entry) => entry.slug === slug);
    return route ? { label, href: route.path } : undefined;
  };
  const contactItems = [
    {
      id: "email",
      label: "Email",
      value: config.contact.email,
      href: `mailto:${config.contact.email}`,
    },
    {
      id: "phone",
      label: "Phone",
      value: config.contact.phone,
      href: `tel:${config.contact.phone.replace(/[^+\d]/g, "")}`,
    },
    {
      id: "address",
      label: "Address",
      value: [
        ...config.contact.addressLines,
        config.contact.locality,
        config.contact.region,
        config.contact.postalCode,
        config.contact.country,
      ]
        .filter(Boolean)
        .join(", "),
    },
    ...(config.contact.officeHours ?? []).map((hours, i) => ({
      id: `hours-${i}`,
      label: hours.days,
      value: hours.hours,
    })),
    ...getContactActions(config)
      .filter((action) => action.id !== "email" && action.id !== "phone")
      .map((action) => ({ ...action, value: action.label })),
  ];
  const allowedAction = (action: SectionAction) => {
    if (action.pageId) return config.pages[action.pageId].enabled;
    if (!action.href.startsWith("/")) return true;
    const path = action.href.split(/[?#]/)[0] ?? action.href;
    return Boolean(findPublicRoute(routes, path));
  };
  const resolvedAction = (action: SectionAction): SectionAction =>
    action.pageId ? { ...action, href: config.pages[action.pageId].path } : action;
  const templates = content.pageSections?.[pageId] ?? [];
  const resolved = templates
    .filter(
      (section) =>
        section.enabled !== false &&
        (!(section.type === "enquiryForm" || (section.type === "newsletter" && section.formId)) ||
          (config.integrations.forms[section.formId!].enabled &&
            (section.formId !== "newsletter" || config.features.newsletterSignup))) &&
        (!section.requiresPage || config.pages[section.requiresPage].enabled),
    )
    .map((template): SectionConfig => {
      const { contentSource: source, ...section } = template;
      switch (source) {
        case "programs": {
          const items = local("programs").map((item) => ({
            id: item.slug,
            title: item.name,
            summary: item.summary,
            image: item.image,
            isDemoContent: item.isDemoContent,
            action: cardAction("programs", item.slug, item.name),
          }));
          if (section.type === "serviceGrid")
            return {
              ...section,
              items: items.map((item, i) => ({
                ...item,
                deliverables: local("programs")[i]!.highlights,
              })),
            };
          if (section.type === "programGrid")
            return {
              ...section,
              items: items.map((item, i) => ({
                ...item,
                highlights: local("programs")[i]!.highlights,
                duration: local("programs")[i]!.durationLabel,
                level: local("programs")[i]!.levelLabel,
              })),
            };
          break;
        }
        case "departments":
          if (section.type === "departmentGrid")
            return {
              ...section,
              items: local("departments").map((item) => ({
                id: item.slug,
                title: item.name,
                summary: item.summary,
                image: item.image,
                isDemoContent: item.isDemoContent,
                action: cardAction("departments", item.slug, item.name),
              })),
            };
          break;
        case "people":
          if (section.type === "facultyGrid" || section.type === "teamGrid")
            return {
              ...section,
              items: local("people").map((item) => ({
                id: item.slug,
                title: item.name,
                summary: item.bio.join(" "),
                role: item.role,
                credentials: item.credentials,
                image: item.image,
                isDemoContent: item.isDemoContent,
                action: cardAction("people", item.slug, item.name),
              })),
            };
          break;
        case "news":
          if (section.type === "newsGrid")
            return {
              ...section,
              listing:
                pageId === "newsEvents"
                  ? (config.listings?.news ?? section.listing)
                  : section.listing,
              items: newestNews(local("news")).map((item) => ({
                id: item.slug,
                title: item.title,
                summary: item.excerpt,
                date: item.publishedAt,
                category: item.category,
                image: item.image,
                isDemoContent: item.isDemoContent,
                action: cardAction("news", item.slug, item.title),
              })),
            };
          break;
        case "upcomingEvents":
        case "pastEvents":
          if (section.type === "eventsGrid") {
            const groups = splitEvents(local("events"), asOf);
            return {
              ...section,
              listing:
                pageId === "newsEvents"
                  ? (config.listings?.events ?? section.listing)
                  : section.listing,
              items: groups[source === "pastEvents" ? "past" : "upcoming"].map((item) => ({
                id: item.slug,
                title: item.title,
                summary: item.summary,
                startsAt: item.startsAt,
                location: item.location,
                category: item.category,
                image: item.image,
                isDemoContent: item.isDemoContent,
                action: cardAction("events", item.slug, item.title),
              })),
            };
          }
          break;
        case "facilities":
          if (section.type === "facilities")
            return {
              ...section,
              items: local("facilities").map((item) => ({
                id: item.slug,
                title: item.name,
                summary: item.summary,
                image: item.image,
                features: item.body,
                isDemoContent: item.isDemoContent,
              })),
            };
          break;
        case "gallery":
          if (section.type === "imageGallery")
            return {
              ...section,
              items: local("gallery").map((item) => ({
                id: item.id,
                image: item.image,
                caption: `${item.album}${item.caption ? ` — ${item.caption}` : ""}`,
              })),
            };
          break;
        case "downloads":
          if (section.type === "downloads")
            return {
              ...section,
              items: local("downloads").map((item) => ({
                id: item.id,
                title: item.title,
                summary: item.description,
                file: item.file,
                fileType: item.fileType,
                fileSizeKb: item.fileSizeKb,
                updatedAt: item.updatedAt,
                category: item.category,
              })),
            };
          break;
        case "faqs":
          if (section.type === "faq")
            return {
              ...section,
              items: local("faqs").map((item) => ({
                id: item.id,
                question: item.question,
                answer: item.answer,
              })),
            };
          break;
        case "testimonials":
          if (section.type === "testimonials")
            return {
              ...section,
              items: local("testimonials").map((item) => ({
                id: item.id,
                quote: item.quote,
                author: item.authorName,
                role: item.authorRole,
                image: item.image,
                isDemoContent: item.isDemoContent,
              })),
            };
          break;
        case "stats":
          if (section.type === "stats" || section.type === "results")
            return { ...section, items: local("stats") };
          break;
        case "contact":
          if (section.type === "contactDetails") return { ...section, items: contactItems };
          break;
        case "navigation":
          if (section.type === "quickLinks")
            return {
              ...section,
              items: config.navigation
                .flatMap((item) => (item.kind === "group" ? item.children : [item]))
                .flatMap((link) =>
                  link.kind === "external"
                    ? [{ label: link.label, href: link.href }]
                    : config.pages[link.pageId].enabled
                      ? [{ label: link.label, href: config.pages[link.pageId].path }]
                      : [],
                ),
            };
          break;
        case "policies":
        case "privacy":
        case "terms":
          if (section.type === "values")
            return {
              ...section,
              items: local("policies")
                .filter((item) => source === "policies" || item.slug === source)
                .map((item) => ({
                  id: item.slug,
                  title: item.title,
                  body: item.body,
                  updatedAt: item.updatedAt,
                })),
            };
          break;
      }
      if (source) throw new Error(`Unsupported section source ${source} for ${section.type}`);
      return section;
    });
  const filtered = resolved
    .map((section) => {
      const cleaned = {
        ...section,
        actions: section.actions?.filter(allowedAction).map(resolvedAction),
      };
      if (cleaned.type === "newsletter")
        return {
          ...cleaned,
          enabled: Boolean(cleaned.formId) || allowedAction(cleaned.action),
          action: resolvedAction(cleaned.action),
        };
      if (cleaned.type === "map")
        return {
          ...cleaned,
          enabled: allowedAction(cleaned.directions),
          directions: resolvedAction(cleaned.directions),
        };
      if (cleaned.type === "principalMessage" || cleaned.type === "leadershipMessage")
        return {
          ...cleaned,
          person: {
            ...cleaned.person,
            action:
              cleaned.person.action && allowedAction(cleaned.person.action)
                ? resolvedAction(cleaned.person.action)
                : undefined,
          },
        };
      if ("items" in cleaned) {
        if (cleaned.type === "quickLinks")
          return { ...cleaned, items: cleaned.items.filter(allowedAction).map(resolvedAction) };
        if (cleaned.type === "contactDetails")
          return {
            ...cleaned,
            items: cleaned.items.map((item) =>
              item.href && !allowedAction({ label: item.label, href: item.href })
                ? { ...item, href: undefined }
                : item,
            ),
          };
        return {
          ...cleaned,
          items: cleaned.items.map((item) =>
            "action" in item && item.action
              ? {
                  ...item,
                  action: allowedAction(item.action) ? resolvedAction(item.action) : undefined,
                }
              : item,
          ),
        };
      }
      return cleaned;
    })
    .filter(
      (section) =>
        section.enabled !== false &&
        (!(section.type === "finalCTA" || section.type === "applicationCTA") ||
          Boolean(section.actions?.length)),
    );
  return sectionArraySchema.parse(filtered);
}
