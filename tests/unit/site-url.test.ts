// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

import { config } from "../../src/site";
import {
  absoluteSiteUrl,
  deploymentPath,
  siteBasePath,
  stripSiteBase,
} from "../../src/lib/site-url";
import viteConfig from "../../vite.config";

vi.mock("@react-router/dev/vite", () => ({ reactRouter: () => ({ name: "router-fixture" }) }));

const site = "https://owner.github.io/repo";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("deployment URL helpers", () => {
  it.each([
    ["https://example.com", "/"],
    ["https://example.com/", "/"],
    [site, "/repo"],
    [`${site}/`, "/repo"],
    [`${site}/release-2`, "/repo/release-2"],
    ["https://localhost:5311/repo", "/repo"],
  ])("derives the basename of %s", (siteUrl, expected) => {
    expect(siteBasePath(siteUrl)).toBe(expected);
  });

  it.each([
    "example.com/repo",
    "http://example.com/repo",
    "//example.com/repo",
    "https:///example.com",
    "https:///example",
    "https://example.com:invalid/repo",
    "https://user:password@example.com/repo",
    "https://@example.com/repo",
    `${site}?preview=1`,
    `${site}?`,
    `${site}#heading`,
    `${site}#`,
    `${site}/../escape`,
    `${site}/./nested`,
    `${site}/%2e%2e/escape`,
    "https://example.com/%72epo",
    "https://%65xample.com/repo",
    "https://example.com/Repo",
    "https://example.com/repo_name",
    "https://example.com/-repo",
    "https://example.com/repo--name",
    "https://example.com/repo-",
    "https://example.com//",
    `${site}//`,
    `${site}//nested`,
    `${site}\\nested`,
    `${site}\n`,
    ` ${site}`,
  ])("rejects an unsafe site URL: %s", (siteUrl) => {
    expect(() => siteBasePath(siteUrl)).toThrow();
    expect(() => absoluteSiteUrl(siteUrl, "/about")).toThrow();
    expect(() => deploymentPath(siteUrl, "/about")).toThrow();
    expect(() => stripSiteBase(siteUrl, "/repo/about")).toThrow();
  });

  it.each(["/", "/about", "/news/item-1", "/assets/Guide_v2.pdf", "/unknown/page/"])(
    "joins %s without losing or duplicating separators",
    (path) => {
      expect(absoluteSiteUrl(site, path)).toBe(`${site}${path}`);
      expect(absoluteSiteUrl(`${site}/`, path)).toBe(`${site}${path}`);
      expect(deploymentPath(site, path)).toBe(`/repo${path}`);
      expect(stripSiteBase(site, deploymentPath(site, path))).toBe(path);
      expect(absoluteSiteUrl("https://example.com", path)).toBe(`https://example.com${path}`);
      expect(deploymentPath("https://example.com", path)).toBe(path);
      expect(stripSiteBase("https://example.com", path)).toBe(path);
    },
  );

  it.each([
    "",
    "about",
    "https://evil.example/path",
    "//evil.example/path",
    "/\\evil.example/path",
    "/../escape",
    "/./escape",
    "/repo/../../escape",
    "/%2e%2e/escape",
    "/%252e%252e/escape",
    "/repo%2fescape",
    "/repo%5cescape",
    "/a%20b",
    "/repo//escape",
    "/about?query=1",
    "/about#heading",
    "/about\n",
    "/about\u0000",
  ])("rejects unsafe or non-path local input: %s", (path) => {
    expect(() => absoluteSiteUrl(site, path)).toThrow(/localPath/);
    expect(() => deploymentPath(site, path)).toThrow(/localPath/);
    expect(stripSiteBase(site, path)).toBeNull();
  });

  it("strips only a complete leading base boundary", () => {
    expect(stripSiteBase(site, "/repo")).toBe("/");
    expect(stripSiteBase(site, "/repo/")).toBe("/");
    expect(stripSiteBase(site, "/repo/repo/about")).toBe("/repo/about");
    expect(stripSiteBase(site, "/repo/unknown/404.html")).toBe("/unknown/404.html");
    expect(stripSiteBase(site, "/repository/about")).toBeNull();
    expect(stripSiteBase(site, "/repo-two/about")).toBeNull();
    expect(stripSiteBase(site, "/other/repo/about")).toBeNull();
    expect(stripSiteBase(site, "/Repo/about")).toBeNull();
    expect(stripSiteBase(site, "/")).toBeNull();
    expect(stripSiteBase(`${site}/nested`, "/repo/nested/about")).toBe("/about");
    expect(stripSiteBase(`${site}/nested`, "/repo/nested-two/about")).toBeNull();
  });
});

async function configureVite() {
  if (typeof viteConfig !== "function") throw new Error("Expected a config factory");
  return viteConfig({ command: "serve", mode: "test" });
}

describe("Vite deployment base", () => {
  it("derives base directly from the site URL without tenant env variables", async () => {
    const basePath = siteBasePath(config.siteUrl);
    const expected = basePath === "/" ? "/" : `${basePath}/`;
    expect((await configureVite()).base).toBe(expected);
  });
});
