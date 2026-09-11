import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { config } from "@/site";
import { create404Html, createRobots, createWebManifest } from "@/routes/static-artifacts";
import { resizePng } from "../../scripts/lib/favicon-assets.mjs";

describe("static SEO artifacts", () => {
  it("publishes tenant-scoped robots and parseable manifest URLs", () => {
    const scoped = { ...config, siteUrl: "https://pages.example.com/site" };
    expect(createRobots(scoped)).toBe(
      "User-agent: *\nAllow: /site/\nDisallow: /site/__styleguide\nSitemap: https://pages.example.com/site/sitemap.xml\n",
    );
    const manifest = JSON.parse(JSON.stringify(createWebManifest(scoped)));
    expect(manifest).toMatchObject({
      name: config.brand.name,
      short_name: config.brand.shortName,
      lang: config.defaultLocale,
      start_url: "https://pages.example.com/site/",
      scope: "https://pages.example.com/site/",
      display: "browser",
    });
    expect(manifest.icons).toHaveLength(2);
    expect(manifest.icons.map((icon: { src: string }) => icon.src)).toEqual([
      "https://pages.example.com/site/icon-192.png",
      "https://pages.example.com/site/icon-512.png",
    ]);
    expect(
      createRobots({ ...scoped, seo: { ...scoped.seo, robots: "noindex,nofollow" } }),
    ).not.toContain("Disallow: /site/\n");
  });

  it.each([32, 180, 192, 512])("produces a genuine %ipx PNG without external codecs", (size) => {
    const original = readFileSync(`public${config.assets.manifestIcon}`);
    const result = resizePng(original, size);
    expect(result.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
    expect(result.readUInt32BE(16)).toBe(size);
    expect(result.readUInt32BE(20)).toBe(size);
    const data: Buffer[] = [];
    for (let offset = 8; offset < result.length;) {
      const length = result.readUInt32BE(offset);
      if (result.toString("ascii", offset + 4, offset + 8) === "IDAT")
        data.push(result.subarray(offset + 8, offset + 8 + length));
      offset += length + 12;
    }
    const pixels = inflateSync(Buffer.concat(data));
    expect(pixels.length).toBe(size * (size * (result[25] === 6 ? 4 : 3) + 1));
    expect(new Set(pixels).size).toBeGreaterThan(8);
  });

  it("preserves React-rendered noindex metadata and rejects an indexable fallback", () => {
    const testConfig = structuredClone(config);
    testConfig.seo.titleTemplate = '<img src=x onerror="alert(1)"> %s &';
    const title = renderToString(
      createElement(
        "title",
        null,
        testConfig.seo.titleTemplate.replaceAll("%s", "404 — Page not found"),
      ),
    );
    const original = `<html><head>${title}<meta name="robots" content="noindex,nofollow"/></head><body><h1>Page not found</h1><script src="/assets/entry.js"></script></body></html>`;
    const html = create404Html(original);
    expect(html).toBe(original);
    expect(() => create404Html(original.replace("noindex,nofollow", "index,follow"))).toThrow();
    expect(() =>
      create404Html(
        original.replace("</head>", '<link rel="canonical" href="https://example.org"/></head>'),
      ),
    ).toThrow();
    const document = new DOMParser().parseFromString(html, "text/html");
    expect(document.querySelectorAll("title")).toHaveLength(1);
    expect(document.querySelector('meta[name="robots"]')?.getAttribute("content")).toBe(
      "noindex,nofollow",
    );
    expect(
      document.querySelector('link[rel="canonical"],script[type="application/ld+json"],img'),
    ).toBeNull();
    expect(document.querySelector('script[src="/assets/entry.js"]')).not.toBeNull();
    expect(document.querySelector("h1")?.textContent).toBe("Page not found");
  });
});

it("rejects corrupted, truncated and unsupported icon data", () => {
  const original = readFileSync(`public${config.assets.manifestIcon}`);
  const corrupt = Buffer.from(original);
  corrupt[45] = (corrupt[45] ?? 0) ^ 255;
  expect(() => resizePng(corrupt, 32)).toThrow();
  expect(() => resizePng(original.subarray(0, 50), 32)).toThrow();
  expect(() => resizePng(Buffer.from("<svg/>"), 32)).toThrow();
  expect(() => resizePng(original, 0)).toThrow();
  expect(() => resizePng(original, 2048)).toThrow();
});
