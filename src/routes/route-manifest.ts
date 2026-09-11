import type { MetaDescriptor } from "react-router";

import type { TenantContent } from "../config/content-schema";
import { absoluteSiteUrl } from "../lib/site-url";
import { createStructuredData } from "./structured-data";
import {
  DETAIL_COLLECTIONS,
  PAGE_IDS,
  detailRoutesSchema,
  routePathSchema,
  slugSchema,
  type DetailCollection,
  type PageId,
  type TenantConfig,
} from "../config/tenant-schema";

/** No registry imports: this module is also used by the single-tenant browser bundle. */
export { DETAIL_COLLECTIONS, type DetailCollection } from "../config/tenant-schema";

export const DETAIL_PARENTS = {
  programs: "programs",
  departments: "programs",
  people: "about",
  news: "newsEvents",
  events: "newsEvents",
} as const satisfies Record<DetailCollection, PageId>;

interface RouteInfo {
  path: string;
  /** Aliases keep their request path, but share the primary route's metadata URL. */
  canonicalPath?: string;
  isAlias?: boolean;
  title: string;
  description: string;
  pageId: PageId;
}

export interface PageRoute extends RouteInfo {
  kind: "page";
}

export interface DetailRoute extends RouteInfo {
  kind: "detail";
  collection: DetailCollection;
  slug: string;
}

export type PublicRoute = PageRoute | DetailRoute;

function appendDetailSlug(base: string, slug: string): string {
  // Reject request/content parameters before ever interpolating them into a path.
  if (!slugSchema.safeParse(slug).success || slug !== slug.trim()) {
    throw new Error(`Invalid detail path slug: ${slug}`);
  }
  if (base === "/" || !routePathSchema.safeParse(base).success || base !== base.trim()) {
    throw new Error(`Invalid detail path base: ${base}`);
  }
  return `${base}/${slug}`;
}

/** Explicit bases stay fixed; omitted settings follow the historical parent path. */
export function detailPath(
  config: TenantConfig,
  collection: DetailCollection,
  slug: string,
): string {
  const parent = config.pages[DETAIL_PARENTS[collection]].path;
  const segment = collection === "programs" ? "" : `/${collection}`;
  const base = config.detailRoutes?.[collection]?.path ?? `${parent}${segment}`;
  return appendDetailSlug(base, slug);
}

export function createRouteManifest(config: TenantConfig, content: TenantContent): PublicRoute[] {
  const detailRoutes = detailRoutesSchema.parse(config.detailRoutes ?? {});
  const result: PublicRoute[] = [];
  // Reserve every core path, including disabled ones: a detail may never resurrect one.
  const corePaths = new Set<string>();
  for (const pageId of PAGE_IDS) {
    const page = config.pages[pageId];
    if (!routePathSchema.safeParse(page.path).success || corePaths.has(page.path)) {
      throw new Error(`Invalid or duplicate configured page path: ${page.path}`);
    }
    corePaths.add(page.path);
    if (!page.enabled) continue;
    result.push({
      kind: "page",
      pageId,
      path: page.path,
      title: pageId === "home" ? config.brand.name : page.navLabel,
      description:
        page.seo?.defaultDescription ??
        (pageId === "home"
          ? config.seo.defaultDescription
          : `${page.navLabel}. ${config.brand.description}`),
    });
  }

  const paths = new Set(corePaths);
  for (const collection of DETAIL_COLLECTIONS) {
    const pageId = DETAIL_PARENTS[collection];
    const settings = detailRoutes[collection];
    if (
      !config.pages[pageId].enabled ||
      config.contentSources[collection] !== "local" ||
      settings?.enabled === false
    ) {
      continue;
    }
    for (const item of content[collection]) {
      const path = detailPath(config, collection, item.slug);
      const primary: DetailRoute = {
        kind: "detail",
        pageId,
        collection,
        slug: item.slug,
        path,
        title: "title" in item ? item.title : item.name,
        description:
          "excerpt" in item ? item.excerpt : "summary" in item ? item.summary : item.role,
      };
      const aliases = (settings?.aliases ?? []).map((base): DetailRoute => ({
        ...primary,
        path: appendDetailSlug(base, item.slug),
        canonicalPath: path,
        isAlias: true,
      }));
      for (const entry of [primary, ...aliases]) {
        if (paths.has(entry.path)) {
          throw new Error(`Invalid or conflicting detail path: ${entry.path}`);
        }
        paths.add(entry.path);
        result.push(entry);
      }
    }
  }
  return result;
}

/** Card lists and related content must not surface duplicate alias entries. */
export function collectionRoutes(
  routes: readonly PublicRoute[],
  collection: DetailCollection,
): DetailRoute[] {
  return routes.filter(
    (entry): entry is DetailRoute =>
      entry.kind === "detail" && entry.collection === collection && !entry.isAlias,
  );
}

/** Canonical, indexable public routes; prerendering deliberately includes more. */
export function getIndexableRoutes(config: TenantConfig, content: TenantContent): PublicRoute[] {
  const routes = createRouteManifest(config, content);
  const directives = config.seo.robots.toLowerCase().split(/[\s,]+/);
  if (directives.includes("noindex") || directives.includes("none")) return [];
  return routes.filter(
    (entry) =>
      !entry.isAlias &&
      !routeRobots(config, entry)
        .split(/[\s,]+/i)
        .some((directive) => /^(noindex|none)$/i.test(directive)),
  );
}

export function routeRobots(config: TenantConfig, entry: PublicRoute): string {
  if (config.seo.robots.split(/[\s,]+/).some((directive) => /^(noindex|none)$/i.test(directive)))
    return config.seo.robots;
  return config.pages[entry.pageId].seo?.robots ?? config.seo.robots;
}

/**
 * A single trailing slash is a static-host directory alias, with an unslashed
 * canonical URL. Otherwise match exactly: no decoding, traversal or extra segments.
 */
export function findPublicRoute(routes: readonly PublicRoute[], pathname: string) {
  const path =
    pathname.length > 1 && pathname.endsWith("/") && !pathname.endsWith("//")
      ? pathname.slice(0, -1)
      : pathname;
  return routes.find((entry) => entry.path === path);
}

export function requirePublicRoute(routes: readonly PublicRoute[], pathname: string): PublicRoute {
  const entry = findPublicRoute(routes, pathname);
  if (!entry) throw new Response("Page not found", { status: 404, statusText: "Not Found" });
  return entry;
}

export function createRouteMeta(
  config: TenantConfig,
  entry?: PublicRoute,
  content?: TenantContent,
): MetaDescriptor[] {
  if (!entry) {
    return [
      { title: config.seo.titleTemplate.replaceAll("%s", "404 — Page not found") },
      { name: "description", content: "The requested page is not available." },
      { name: "robots", content: "noindex,nofollow" },
    ];
  }
  const page = config.pages[entry.pageId];
  const title =
    entry.kind === "page"
      ? (page.seo?.defaultTitle ??
        (entry.pageId === "home"
          ? config.seo.defaultTitle
          : config.seo.titleTemplate.replaceAll("%s", entry.title)))
      : config.seo.titleTemplate.replaceAll("%s", entry.title);
  const canonical = absoluteSiteUrl(config.siteUrl, entry.canonicalPath ?? entry.path);
  const image = absoluteSiteUrl(config.siteUrl, page.seo?.ogImage ?? config.seo.ogImage);
  return [
    { title },
    { name: "description", content: entry.description },
    { tagName: "link", rel: "canonical", href: canonical },
    { name: "robots", content: routeRobots(config, entry) },
    { property: "og:title", content: title },
    { property: "og:description", content: entry.description },
    { property: "og:url", content: canonical },
    { property: "og:image", content: image },
    {
      property: "og:type",
      content: entry.kind === "detail" && entry.collection === "news" ? "article" : "website",
    },
    { property: "og:site_name", content: config.brand.name },
    { property: "og:locale", content: config.defaultLocale.replace("-", "_") },
    { name: "twitter:card", content: config.seo.twitterCard },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: entry.description },
    { name: "twitter:image", content: image },
    ...(config.seo.twitterSite ? [{ name: "twitter:site", content: config.seo.twitterSite }] : []),
    // React Router serializes this object with script-closing characters escaped as Unicode.
    ...(content ? [{ "script:ld+json": createStructuredData(config, content, entry) }] : []),
  ];
}
