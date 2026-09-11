import { getIndexableRoutes } from "./route-manifest";
import type { TenantConfig } from "../config/tenant-schema";
import type { TenantContent } from "../config/content-schema";
import { absoluteSiteUrl, deploymentPath } from "../lib/site-url";

const xmlText = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("'", "&apos;");

export function createSitemap(config: TenantConfig, content: TenantContent): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${getIndexableRoutes(
    config,
    content,
  )
    .map(
      (entry) => `  <url><loc>${xmlText(absoluteSiteUrl(config.siteUrl, entry.path))}</loc></url>`,
    )
    .join("\n")}\n</urlset>\n`;
}

export function createRobots(config: TenantConfig): string {
  // Crawlers must fetch HTML to observe noindex; robots.txt is not an indexing control.
  return `User-agent: *\nAllow: ${deploymentPath(config.siteUrl, "/")}\nDisallow: ${deploymentPath(config.siteUrl, "/__styleguide")}\nSitemap: ${absoluteSiteUrl(config.siteUrl, "/sitemap.xml")}\n`;
}

export function createWebManifest(config: TenantConfig) {
  return {
    id: absoluteSiteUrl(config.siteUrl, "/"),
    name: config.brand.name,
    short_name: config.brand.shortName,
    description: config.seo.defaultDescription,
    lang: config.defaultLocale,
    display: "browser",
    start_url: absoluteSiteUrl(config.siteUrl, "/"),
    scope: absoluteSiteUrl(config.siteUrl, "/"),
    icons: [
      {
        src: absoluteSiteUrl(config.siteUrl, "/icon-192.png"),
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: absoluteSiteUrl(config.siteUrl, "/icon-512.png"),
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}

export function create404Html(spaHtml: string): string {
  // Keep React-owned head nodes intact; post-render insertion duplicates them on hydration.
  if (
    (spaHtml.match(/<meta\b[^>]*name="robots"[^>]*>/g) ?? []).length !== 1 ||
    !/<meta\b[^>]*name="robots"[^>]*content="noindex,nofollow"/.test(spaHtml) ||
    !/<title>[^<]+<\/title>/.test(spaHtml) ||
    /<link\b[^>]*rel="canonical"|<script\b[^>]*type="application\/ld\+json"/.test(spaHtml)
  ) {
    throw new Error(
      "Static fallback must render a title and noindex metadata without canonical/entity claims",
    );
  }
  return spaHtml;
}
