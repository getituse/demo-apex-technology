// @vitest-environment node
import { createRequire } from "node:module";
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { createRequestHandler, Meta, Outlet, ServerRouter, type ServerBuild } from "react-router";
import { describe, expect, it, vi } from "vitest";

import { ORGANIZATION_SCHEMA_TYPES } from "@/config/tenant-schema";
import { config, content } from "@/site";
import { TenantProvider } from "@/lib/tenant/TenantProvider";
import { createConfiguredRoutes } from "@/routes/configured-routes";
import { createRouteManifest, createRouteMeta, requirePublicRoute } from "@/routes/route-manifest";
import { createStructuredData } from "@/routes/structured-data";
import * as homeModule from "@/routes/home";
import * as pageModule from "@/routes/tenant-page";
import * as detailModule from "@/routes/tenant-detail";
import * as notFoundModule from "@/routes/not-found";

vi.mock("@/site", async () => import("@/site"));

// jsdom has no installed declarations; only its inert HTML parser is needed.
const { JSDOM } = createRequire(import.meta.url)("jsdom") as {
  JSDOM: new (html: string) => { window: { document: Document; close(): void } };
};

function Root() {
  return (
    <TenantProvider config={config} content={content}>
      <main>
        <Outlet />
      </main>
    </TenantProvider>
  );
}

function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Meta />
      </head>
      <body>{children}</body>
    </html>
  );
}

async function fixtureBuild(metaOverride?: typeof pageModule.meta): Promise<ServerBuild> {
  const routes: ServerBuild["routes"] = {
    root: { id: "root", path: "", module: { default: Root, Layout } },
  };
  const asset = {
    hasAction: false,
    hasLoader: false,
    hasClientAction: false,
    hasClientLoader: false,
    hasClientMiddleware: false,
    hasErrorBoundary: false,
    module: "/unused.js",
    clientActionModule: undefined,
    clientLoaderModule: undefined,
    clientMiddlewareModule: undefined,
    hydrateFallbackModule: undefined,
  };
  const assets: ServerBuild["assets"]["routes"] = { root: { ...asset, id: "root", path: "" } };
  for (const entry of createConfiguredRoutes(true)) {
    const id = entry.id!;
    const module = entry.index
      ? homeModule
      : entry.path === "*"
        ? notFoundModule
        : entry.file === "routes/tenant-detail.tsx"
          ? detailModule
          : pageModule;
    const route = {
      id,
      path: entry.path,
      index: entry.index,
      parentId: "root",
      caseSensitive: entry.caseSensitive,
    };
    routes[id] = {
      ...route,
      module: metaOverride && entry.path !== "*" ? { ...module, meta: metaOverride } : module,
    };
    assets[id] = {
      ...asset,
      ...route,
      hasLoader: "loader" in module,
      hasClientLoader: "clientLoader" in module,
      hasErrorBoundary: true,
    };
  }
  return {
    routes,
    entry: {
      module: {
        default(request, status, headers, context) {
          return new Response(
            renderToString(<ServerRouter context={context} url={request.url} />),
            {
              status,
              headers,
            },
          );
        },
      },
    },
    assets: {
      entry: { imports: [], module: "/unused.js" },
      routes: assets,
      url: "/manifest.js",
      version: "test",
    },
    publicPath: "/",
    assetsBuildDirectory: "unused",
    future: {
      v8_passThroughRequests: false,
      v8_trailingSlashAwareDataRequests: false,
      v8_middleware: false,
    },
    ssr: false,
    isSpaMode: false,
    prerender: createRouteManifest(config, content).map((entry) => entry.path),
    routeDiscovery: { mode: "initial", manifestPath: "/__manifest" },
  };
}

describe("framework prerender integration (no build required)", () => {
  it("renders real HTML and metadata through the actual framework server renderer", async () => {
    const handler = createRequestHandler(await fixtureBuild(), "test");
    for (const entry of createRouteManifest(config, content)) {
      const response = await handler(new Request(`${config.siteUrl}${entry.path}`));
      expect(response.status).toBe(200);
      const html = await response.text();
      expect(html.match(/<h1\b/g)).toHaveLength(1);
      expect(html).toContain(entry.title.replaceAll("&", "&amp;"));
      expect(html).toContain(
        `<link rel="canonical" href="${config.siteUrl}${entry.canonicalPath ?? entry.path}"`,
      );
      expect(html).toContain('name="description"');
      expect(html).not.toContain("Loading...");
      const scripts = [
        ...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g),
      ];
      expect(scripts, entry.path).toHaveLength(1);
      expect(JSON.parse(scripts[0]![1]!)).toEqual(createStructuredData(config, content, entry));
    }
  });

  it.each(["page", "detail"] as const)(
    "round-trips hostile %s metadata through the actual framework Meta without script breakout",
    async (kind) => {
      const hostile =
        '</script><script>alert(1)</script><img src=x onerror=alert(1)> & "quoted" \u2028\u2029 &amp;';
      const tenant = { config: structuredClone(config), content: structuredClone(content) };
      tenant.config.brand.name = hostile;
      tenant.config.brand.description = hostile;
      tenant.config.legal.demoContentNotice = hostile;
      tenant.config.seo.defaultTitle = hostile;
      tenant.config.seo.defaultDescription = hostile;
      const article = tenant.content.news[0]!;
      article.title = hostile;
      article.excerpt = hostile;
      article.body = [hostile];
      const routes = createRouteManifest(tenant.config, tenant.content);
      const entry =
        kind === "page"
          ? requirePublicRoute(routes, tenant.config.pages.home.path)
          : routes.find(
              (route) =>
                route.kind === "detail" &&
                route.collection === "news" &&
                route.slug === article.slug &&
                !route.isAlias,
            )!;
      const handler = createRequestHandler(
        await fixtureBuild(() => createRouteMeta(tenant.config, entry, tenant.content)),
        "test",
      );
      const response = await handler(new Request(`${config.siteUrl}${entry.path}`));
      expect(response.status).toBe(200);
      const html = await response.text();
      const dom = new JSDOM(html);
      try {
        const document = dom.window.document;
        expect(document.querySelectorAll("script")).toHaveLength(1);
        const scripts = document.querySelectorAll('head > script[type="application/ld+json"]');
        expect(scripts).toHaveLength(1);
        expect(document.querySelector("[onerror], img[src='x']")).toBeNull();
        expect(document.title).toBe(
          kind === "page" ? hostile : tenant.config.seo.titleTemplate.replaceAll("%s", hostile),
        );
        for (const selector of [
          'meta[name="description"]',
          'meta[property="og:description"]',
          'meta[name="twitter:description"]',
        ]) {
          expect(document.querySelector(selector)?.getAttribute("content")).toBe(hostile);
        }
        const text = scripts[0]!.textContent!;
        expect(text).not.toMatch(/<\/script|<img/i);
        expect(text).not.toContain("&lt;");
        expect(text).not.toContain("&quot;");
        expect(text).not.toContain("&amp;");
        expect(text).not.toContain("\u2028");
        expect(text).not.toContain("\u2029");
        expect(text).toMatch(/\\u003c/i);
        expect(text).toMatch(/\\u0026/i);
        expect(text).toMatch(/\\u2028/i);
        expect(text).toMatch(/\\u2029/i);
        const parsed: unknown = JSON.parse(text);
        expect(parsed).toEqual(createStructuredData(tenant.config, tenant.content, entry));
        expect(parsed).toMatchObject({
          "@graph": expect.arrayContaining([
            expect.objectContaining({
              "@type": ORGANIZATION_SCHEMA_TYPES[tenant.config.organizationType],
              name: hostile,
              description: `${hostile} ${hostile}`,
            }),
            expect.objectContaining({ "@type": "WebPage", name: hostile, description: hostile }),
            ...(kind === "detail"
              ? [
                  expect.objectContaining({
                    "@type": "NewsArticle",
                    headline: hostile,
                    articleBody: hostile,
                  }),
                ]
              : []),
          ]),
        });
      } finally {
        dom.window.close();
      }
    },
  );

  it("renders no JSON-LD or canonical for the framework's unknown-route page", async () => {
    // Exercise catchall metadata rendering; deployed ssr:false 404s use the generated static document.
    const handler = createRequestHandler({ ...(await fixtureBuild()), ssr: true }, "test");
    const response = await handler(new Request(`${config.siteUrl}/not-a-real-route`));
    const dom = new JSDOM(await response.text());
    try {
      const document = dom.window.document;
      expect(document.querySelector('meta[name="robots"]')?.getAttribute("content")).toBe(
        "noindex,nofollow",
      );
      expect(document.querySelector('script[type="application/ld+json"]')).toBeNull();
      expect(document.querySelector('link[rel="canonical"]')).toBeNull();
    } finally {
      dom.window.close();
    }
  });

  it("uses no serverLoader or network request during client navigation", () => {
    const serverLoader = vi.fn();
    expect(
      pageModule.clientLoader({
        request: new Request(`${config.siteUrl}/about`),
        url: new URL(`${config.siteUrl}/about`),
        pattern: "/about",
        params: {},
        context: {},
        serverLoader,
      }),
    ).toEqual({ referenceTime: expect.any(String) });
    expect(serverLoader).not.toHaveBeenCalled();
    expect(homeModule.loader).toBe(pageModule.loader);
    expect(homeModule.meta).toBe(pageModule.meta);
  });

  it("rejects unknown and disabled paths with a router 404", () => {
    for (const path of ["/missing", "/programs/missing", "/about//"]) {
      try {
        pageModule.loader({
          request: new Request(`${config.siteUrl}${path}`),
          url: new URL(`${config.siteUrl}${path}`),
          pattern: "*",
          params: {},
          context: {},
        });
        expect.unreachable("Expected 404");
      } catch (error) {
        expect(error).toBeInstanceOf(Response);
        expect((error as Response).status).toBe(404);
      }
    }
    try {
      notFoundModule.clientLoader();
      expect.unreachable("Expected 404");
    } catch (error) {
      expect((error as Response).status).toBe(404);
    }
    expect(notFoundModule.meta()).toContainEqual({ name: "robots", content: "noindex,nofollow" });
  });
});
