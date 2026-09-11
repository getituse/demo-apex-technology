import type { Config } from "@react-router/dev/config";
import fs from "node:fs";
import path from "node:path";

import { resizePng } from "./scripts/lib/favicon-assets.mjs";
import { normalizePrerenderOutput } from "./scripts/lib/prerender-output.mjs";
import { PAGE_IDS } from "./src/config/tenant-schema";
import { siteBasePath } from "./src/lib/site-url";
import { getPrerenderPaths } from "./src/routes/configured-routes";
import { resolvePageSections } from "./src/routes/page-sections";
import {
  create404Html,
  createRobots,
  createSitemap,
  createWebManifest,
} from "./src/routes/static-artifacts";
import { config, content } from "./src/site";

const publishDirectory = path.resolve("dist");

export default {
  appDirectory: "src",
  ssr: false,
  basename: siteBasePath(config.siteUrl),
  buildDirectory: "build",

  async prerender() {
    for (const pageId of PAGE_IDS) {
      resolvePageSections(config, content, pageId, new Date().toISOString());
    }
    return getPrerenderPaths();
  },

  async buildEnd({ reactRouterConfig }) {
    const directory = path.join(reactRouterConfig.buildDirectory, "client");
    normalizePrerenderOutput(directory, reactRouterConfig.basename, getPrerenderPaths());
    fs.writeFileSync(path.join(directory, "sitemap.xml"), createSitemap(config, content));
    fs.writeFileSync(path.join(directory, "robots.txt"), createRobots(config));
    fs.writeFileSync(
      path.join(directory, "manifest.webmanifest"),
      JSON.stringify(createWebManifest(config), null, 2) + "\n",
    );
    const asset = (url: string) => {
      const file = path.resolve(directory, url.slice(1));
      if (
        !url.startsWith("/") ||
        url.startsWith("//") ||
        !file.startsWith(path.resolve(directory) + path.sep) ||
        !fs.statSync(file).isFile()
      ) {
        throw new Error(`Missing/unsafe configured SEO asset: ${url}`);
      }
      return file;
    };
    asset(config.seo.ogImage);
    asset(config.assets.socialShareImage);
    for (const page of Object.values(config.pages)) {
      if (page.enabled && page.seo?.ogImage) asset(page.seo.ogImage);
    }
    fs.copyFileSync(asset(config.brand.favicon), path.join(directory, "favicon.svg"));
    const originalIcon = fs.readFileSync(asset(config.assets.manifestIcon));
    for (const [name, size] of [
      ["favicon-32.png", 32],
      ["apple-touch-icon.png", 180],
      ["icon-192.png", 192],
      ["icon-512.png", 512],
    ] as const) {
      fs.writeFileSync(path.join(directory, name), resizePng(originalIcon, size));
    }
    const fallback = fs.readFileSync(path.join(directory, "__spa-fallback.html"), "utf8");
    fs.writeFileSync(path.join(directory, "404.html"), create404Html(fallback));
    fs.writeFileSync(
      path.join(directory, "_redirects"),
      "# Serve existing files and the supplied 404.html; do not rewrite missing URLs to / with status 200.\n",
    );
    fs.writeFileSync(path.join(directory, ".nojekyll"), "");

    fs.rmSync(publishDirectory, {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 200,
    });
    fs.cpSync(directory, publishDirectory, { recursive: true });
    console.log("site build -> dist");
  },
} satisfies Config;
