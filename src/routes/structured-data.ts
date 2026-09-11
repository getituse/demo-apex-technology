import type { TenantConfig } from "../config/tenant-schema";
import type { TenantContent } from "../config/content-schema";
import { ORGANIZATION_SCHEMA_TYPES } from "../config/tenant-schema";
import { absoluteSiteUrl } from "../lib/site-url";
import type { PublicRoute } from "./route-manifest";

export type JsonLdValue =
  string | number | boolean | null | JsonLdValue[] | { [key: string]: JsonLdValue };
export interface JsonLdNode {
  [key: string]: JsonLdValue;
}

export function createStructuredData(
  config: TenantConfig,
  content: TenantContent,
  route: PublicRoute,
): JsonLdNode {
  const homeUrl = absoluteSiteUrl(config.siteUrl, config.pages.home.path);
  const pageUrl = absoluteSiteUrl(config.siteUrl, route.canonicalPath ?? route.path);
  const organizationId = `${homeUrl}#organization`;
  const organization: JsonLdNode = {
    "@type": ORGANIZATION_SCHEMA_TYPES[config.organizationType],
    "@id": organizationId,
    name: config.brand.name,
    url: homeUrl,
    logo: absoluteSiteUrl(config.siteUrl, config.brand.logo),
    description: config.legal.demoContentNotice
      ? `${config.brand.description} ${config.legal.demoContentNotice}`
      : config.brand.description,
    email: config.contact.email,
    telephone: config.contact.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: config.contact.addressLines.join(", "),
      addressLocality: config.contact.locality,
      addressCountry: config.contact.country,
      ...(config.contact.region ? { addressRegion: config.contact.region } : {}),
      ...(config.contact.postalCode ? { postalCode: config.contact.postalCode } : {}),
    },
    contactPoint: {
      "@type": "ContactPoint",
      email: config.contact.email,
      telephone: config.contact.phone,
      availableLanguage: config.supportedLocales,
    },
  };
  const graph: JsonLdNode[] = [
    organization,
    {
      "@type": "WebSite",
      "@id": `${homeUrl}#website`,
      url: homeUrl,
      name: config.brand.name,
      publisher: { "@id": organizationId },
      inLanguage: config.defaultLocale,
    },
  ];
  const webPage: JsonLdNode = {
    "@type": "WebPage",
    "@id": `${pageUrl}#webpage`,
    url: pageUrl,
    name: route.title,
    description: route.description,
    isPartOf: { "@id": `${homeUrl}#website` },
    inLanguage: config.defaultLocale,
  };
  if (route.kind === "detail") {
    const breadcrumbId = `${pageUrl}#breadcrumbs`;
    graph.push({
      "@type": "BreadcrumbList",
      "@id": breadcrumbId,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: config.pages.home.navLabel, item: homeUrl },
        {
          "@type": "ListItem",
          position: 2,
          name: config.pages[route.pageId].navLabel,
          item: absoluteSiteUrl(config.siteUrl, config.pages[route.pageId].path),
        },
        { "@type": "ListItem", position: 3, name: route.title, item: pageUrl },
      ],
    });
    webPage.breadcrumb = { "@id": breadcrumbId };
    const item = content[route.collection].find((entry) => entry.slug === route.slug);
    if (!item) throw new Error(`Missing structured data record for ${route.path}`);
    const description = `${item.isDemoContent ? "Fictional demonstration content, not a real offering, event or verified claim. " : ""}${route.description}`;
    const common: JsonLdNode = {
      "@id": `${pageUrl}#entity`,
      url: pageUrl,
      name: route.title,
      description,
      mainEntityOfPage: { "@id": `${pageUrl}#webpage` },
      ...(item.image ? { image: absoluteSiteUrl(config.siteUrl, item.image.src) } : {}),
    };
    let entity: JsonLdNode | undefined;
    if (route.collection === "news" && "publishedAt" in item) {
      entity = {
        ...common,
        "@type": "NewsArticle",
        headline: item.title,
        datePublished: item.publishedAt,
        articleSection: item.category,
        articleBody: item.body.join("\n\n"),
        publisher: { "@id": organizationId },
        inLanguage: config.defaultLocale,
      };
    } else if (route.collection === "events" && "startsAt" in item) {
      entity = {
        ...common,
        "@type": "Event",
        startDate: item.startsAt,
        ...(item.endsAt ? { endDate: item.endsAt } : {}),
        organizer: { "@id": organizationId },
        location: { "@type": "Place", name: item.location },
      };
    } else if (route.collection === "programs" && "highlights" in item) {
      const kind =
        item.structuredDataKind ??
        (config.organizationType === "service-business" ? "Service" : "Course");
      entity = { ...common, "@type": kind, provider: { "@id": organizationId } };
      if (kind === "Course") {
        entity.teaches = item.highlights;
        if (item.levelLabel) entity.educationalLevel = item.levelLabel;
      }
    }
    if (entity) {
      graph.push(entity);
      webPage.mainEntity = { "@id": `${pageUrl}#entity` };
    }
  }
  graph.push(webPage);
  return { "@context": "https://schema.org", "@graph": graph };
}
