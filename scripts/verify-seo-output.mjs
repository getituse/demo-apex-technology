#!/usr/bin/env node
/* global document, window, getComputedStyle, Image -- Callbacks execute in Chromium. */
/**
 * Offline, post-build audit: node scripts/verify-seo-output.mjs [--tenant=id]
 * Does not build, install, repair output, import app SEO generators, or contact a live site.
 * dist/<id> is the deploy root, mounted at siteBasePath(siteUrl). A base-prefixed
 * directory accidentally left inside dist is an error, not an alternative layout.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ORGANIZATIONS = {
  school: "School",
  college: "CollegeOrUniversity",
  university: "CollegeOrUniversity",
  academy: "EducationalOrganization",
  "training-center": "EducationalOrganization",
  "service-business": "Organization",
};
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".xml": "application/xml",
  ".txt": "text/plain",
  ".data": "text/x-script",
  ".pdf": "application/pdf",
};
const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const directives = (value) =>
  value
    .toLowerCase()
    .split(/[\s,]+/)
    .filter(Boolean);
const noindex = (value) => directives(value).some((part) => part === "noindex" || part === "none");
const sorted = (values) => [...values].sort();
const nonempty = (value, label) => assert(typeof value === "string" && value.trim(), label);

/** Independent URL joining; the app helper supplies only the deployment base. */
export function siteUrls(siteUrl, base) {
  const origin = new URL(siteUrl).origin;
  assert(base === "/" || /^\/(?:[a-z0-9-]+\/)*[a-z0-9-]+$/.test(base), "Unsafe base path");
  const mount = (local) => {
    assert(local.startsWith("/") && !local.startsWith("//"), "Expected app-relative path");
    return base === "/" ? local : `${base}${local}`;
  };
  const unmount = (pathname) => {
    if (base === "/") return pathname;
    if (pathname === base) return "/";
    return pathname.startsWith(`${base}/`) ? pathname.slice(base.length) : null;
  };
  return { origin, base, mount, unmount, absolute: (local) => origin + mount(local) };
}

export function expectedMeta(config, entry, urls) {
  const page = config.pages[entry.pageId];
  const title =
    entry.kind === "page"
      ? (page.seo?.defaultTitle ??
        (entry.pageId === "home"
          ? config.seo.defaultTitle
          : config.seo.titleTemplate.replaceAll("%s", entry.title)))
      : config.seo.titleTemplate.replaceAll("%s", entry.title);
  const robots = noindex(config.seo.robots)
    ? config.seo.robots
    : (page.seo?.robots ?? config.seo.robots);
  const canonical = urls.absolute(entry.canonicalPath ?? entry.path);
  const image = urls.absolute(page.seo?.ogImage ?? config.seo.ogImage);
  return {
    title,
    canonical,
    names: {
      description: entry.description,
      robots,
      "twitter:card": config.seo.twitterCard,
      "twitter:title": title,
      "twitter:description": entry.description,
      "twitter:image": image,
      ...(config.seo.twitterSite ? { "twitter:site": config.seo.twitterSite } : {}),
    },
    properties: {
      "og:title": title,
      "og:description": entry.description,
      "og:url": canonical,
      "og:image": image,
      "og:type": entry.kind === "detail" && entry.collection === "news" ? "article" : "website",
      "og:site_name": config.brand.name,
      "og:locale": config.defaultLocale.replace("-", "_"),
    },
  };
}

function one(document, selector) {
  const matches = document.querySelectorAll(selector);
  assert.equal(matches.length, 1, `Expected exactly one ${selector}`);
  return matches[0];
}

export function checkMeta(document, config, entry, urls) {
  const expected = expectedMeta(config, entry, urls);
  assert.equal(one(document, "head title").textContent, expected.title, "title");
  assert.equal(
    one(document, 'head link[rel="canonical"]').getAttribute("href"),
    expected.canonical,
    "canonical",
  );
  for (const [attribute, values] of [
    ["name", expected.names],
    ["property", expected.properties],
  ]) {
    for (const [key, value] of Object.entries(values)) {
      nonempty(value, `Empty expected ${key}`);
      assert.equal(
        one(document, `head meta[${attribute}="${key}"]`).getAttribute("content"),
        value,
        key,
      );
    }
  }
  if (!config.seo.twitterSite)
    assert.equal(document.querySelectorAll('meta[name="twitter:site"]').length, 0);
  assert.equal(document.documentElement.lang, config.defaultLocale, "document language");
  assert.equal(document.querySelectorAll("h1").length, 1, "raw HTML must have one H1");
  nonempty(one(document, "main h1").textContent, "Empty prerendered heading");
  assert.equal(
    document.querySelectorAll('meta[http-equiv="refresh" i]').length,
    0,
    "Alias must have real HTML, not a redirect placeholder",
  );
  return expected;
}

/** Inspect parsed objects, not serialized substrings or the app's own JSON-LD helper. */
export function checkStructuredData(document, config, content, entry, urls, tenants) {
  const script = one(document, 'head script[type="application/ld+json"]');
  assert.equal(document.querySelectorAll('script[type="application/ld+json"]').length, 1);
  const data = JSON.parse(script.textContent);
  assert(isObject(data), "JSON-LD must parse once into an object, not a string/array");
  assert.equal(data["@context"], "https://schema.org");
  assert(
    Array.isArray(data["@graph"]) && data["@graph"].every(isObject),
    "JSON-LD object graph missing",
  );
  const graph = data["@graph"];
  const home = urls.absolute(config.pages.home.path);
  const canonical = urls.absolute(entry.canonicalPath ?? entry.path);
  const organizationId = `${home}#organization`;
  const byType = (type) => {
    const matches = graph.filter((node) => node["@type"] === type);
    assert.equal(matches.length, 1, `Expected exactly one ${type} node`);
    return matches[0];
  };
  const fields = (node, expected) => {
    for (const [key, value] of Object.entries(expected))
      assert.deepEqual(node[key], value, `${node["@type"]}.${key}`);
  };
  const organizationType = ORGANIZATIONS[config.organizationType];
  nonempty(organizationType, "Unrecognized organization type");
  const requiredTypes = [organizationType, "WebSite", "WebPage"];
  fields(byType(organizationType), {
    "@id": organizationId,
    name: config.brand.name,
    url: home,
    logo: urls.absolute(config.brand.logo),
    description: `${config.brand.description} ${config.legal.demoContentNotice}`,
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
  });
  fields(byType("WebSite"), {
    "@id": `${home}#website`,
    name: config.brand.name,
    url: home,
    publisher: { "@id": organizationId },
    inLanguage: config.defaultLocale,
  });
  const page = byType("WebPage");
  fields(page, {
    "@id": `${canonical}#webpage`,
    url: canonical,
    name: entry.title,
    description: entry.description,
    isPartOf: { "@id": `${home}#website` },
    inLanguage: config.defaultLocale,
  });
  let entityType;
  if (entry.kind === "detail") {
    requiredTypes.push("BreadcrumbList");
    fields(byType("BreadcrumbList"), {
      "@id": `${canonical}#breadcrumbs`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: config.pages.home.navLabel, item: home },
        {
          "@type": "ListItem",
          position: 2,
          name: config.pages[entry.pageId].navLabel,
          item: urls.absolute(config.pages[entry.pageId].path),
        },
        { "@type": "ListItem", position: 3, name: entry.title, item: canonical },
      ],
    });
    assert.deepEqual(page.breadcrumb, { "@id": `${canonical}#breadcrumbs` });
    const item = content[entry.collection].find((record) => record.slug === entry.slug);
    assert(item, "Missing source record");
    entityType =
      entry.collection === "news"
        ? "NewsArticle"
        : entry.collection === "events"
          ? "Event"
          : entry.collection === "programs"
            ? (item.structuredDataKind ??
              (config.organizationType === "service-business" ? "Service" : "Course"))
            : undefined;
    if (entityType) {
      requiredTypes.push(entityType);
      const entity = byType(entityType);
      fields(entity, {
        "@id": `${canonical}#entity`,
        url: canonical,
        name: entry.title,
        mainEntityOfPage: { "@id": `${canonical}#webpage` },
      });
      assert.deepEqual(page.mainEntity, { "@id": `${canonical}#entity` });
      nonempty(entity.description, "Entity description missing");
      assert(
        entity.description.includes(entry.description),
        "Entity description lost authored copy",
      );
      if (item.isDemoContent)
        assert(
          /fictional demonstration/i.test(entity.description) &&
            /not a real/i.test(entity.description),
          "Demo entity is presented as real",
        );
      if (item.image) assert.equal(entity.image, urls.absolute(item.image.src));
      else assert.equal(entity.image, undefined, "Invented entity image");
      if (entityType === "NewsArticle") {
        fields(entity, {
          headline: item.title,
          datePublished: item.publishedAt,
          articleSection: item.category,
          articleBody: item.body.join("\n\n"),
          publisher: { "@id": organizationId },
          inLanguage: config.defaultLocale,
        });
        assert(Number.isFinite(Date.parse(entity.datePublished)), "Invalid publication date");
        assert.equal(entity.author, undefined, "Unauthored article author");
        assert.equal(entity.dateModified, undefined, "Unauthored modification date");
      } else if (entityType === "Event") {
        fields(entity, {
          startDate: item.startsAt,
          organizer: { "@id": organizationId },
          location: { "@type": "Place", name: item.location },
        });
        assert(Number.isFinite(Date.parse(entity.startDate)), "Invalid event start");
        assert.equal(entity.endDate, item.endsAt, "Event end must match authored presence/value");
        if (entity.endDate)
          assert(Date.parse(entity.endDate) >= Date.parse(entity.startDate), "Invalid event range");
      } else {
        fields(entity, { provider: { "@id": organizationId } });
        if (entityType === "Course") {
          assert.deepEqual(entity.teaches, item.highlights);
          assert.equal(entity.educationalLevel, item.levelLabel || undefined);
        } else {
          assert.equal(entity.teaches, undefined);
          assert.equal(entity.educationalLevel, undefined);
        }
      }
    }
  } else assert.equal(page.breadcrumb, undefined);
  if (!entityType) assert.equal(page.mainEntity, undefined, "Unexpected mainEntity");
  assert.deepEqual(
    sorted(graph.map((node) => node["@type"])),
    sorted(requiredTypes),
    "Missing or unexpected graph types",
  );
  const ids = new Set(graph.map((node) => node["@id"]));
  assert.equal(ids.size, graph.length, "Duplicate graph identities");
  for (const id of ids) {
    nonempty(id, "Missing graph @id");
    const url = new URL(id);
    assert.equal(url.origin, urls.origin, "Foreign graph origin");
    assert(urls.unmount(url.pathname) !== null, "Graph identity outside site base");
  }
  const forbidden = new Set([
    "offers",
    "aggregateRating",
    "ratingValue",
    "ratingCount",
    "reviewCount",
    "review",
    "reviews",
    "award",
    "awards",
    "accreditation",
    "accreditedBy",
    "hasCredential",
  ]);
  const visit = (value) => {
    if (Array.isArray(value)) return value.forEach(visit);
    if (!isObject(value)) return;
    if (Object.keys(value).length === 1 && "@id" in value)
      assert(ids.has(value["@id"]), `Dangling graph reference: ${value["@id"]}`);
    for (const [key, child] of Object.entries(value)) {
      assert(!forbidden.has(key), `Unauthored claim: ${key}`);
      visit(child);
    }
  };
  visit(data);
  const serialized = JSON.stringify(data);
  for (const other of tenants) {
    if (other.config.id === config.id) continue;
    for (const marker of [
      other.config.id,
      other.config.brand.name,
      `${other.config.siteUrl.replace(/\/$/, "")}/`,
    ]) {
      assert(!serialized.includes(marker), `Foreign tenant in JSON-LD: ${other.config.id}`);
    }
  }
  return data;
}

function diskPath(dist, local) {
  assert(
    local.startsWith("/") &&
      !/[\\%]/.test(local) &&
      ![...local].some((character) => character.charCodeAt(0) < 32),
    "Unsafe local path",
  );
  assert(!local.split("/").some((part) => part === "." || part === ".."), "Path traversal");
  const file = path.resolve(dist, `.${local}`);
  assert(file === dist || file.startsWith(`${dist}${path.sep}`), "Path escaped deploy root");
  return file;
}

export function inventory(dist) {
  const files = [];
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      assert(!entry.isSymbolicLink(), `Symlink in deploy output: ${entry.name}`);
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(file);
      else if (entry.isFile()) files.push(path.relative(dist, file).replaceAll("\\", "/"));
    }
  }
  visit(dist);
  return files.sort();
}

function check404(document, config, urls) {
  nonempty(one(document, "head title").textContent, "404 title missing");
  assert.equal(one(document, 'meta[name="robots"]').getAttribute("content"), "noindex,nofollow");
  assert.equal(
    document.querySelectorAll(
      'link[rel="canonical"], script[type="application/ld+json"], meta[property="og:url"]',
    ).length,
    0,
    "404 makes canonical/entity claims",
  );
  assert(/page not found/i.test(one(document, "h1").textContent), "404 lacks raw recovery heading");
  assert(
    [...document.querySelectorAll("a[href]")].some(
      (link) =>
        link.getAttribute("href") === urls.mount(config.pages.home.path) &&
        link.textContent.trim() === config.pages.home.navLabel,
    ),
    "404 lacks base-scoped home recovery link",
  );
}

/** A strict static mount: no SSR, proxy, history fallback, or alternative base lookup. */
export function staticServer(dist, urls) {
  return http.createServer((request, response) => {
    try {
      if (request.method !== "GET" && request.method !== "HEAD") {
        response.writeHead(405).end();
        return;
      }
      const requestUrl = new URL(request.url, "http://127.0.0.1");
      const local = urls.unmount(requestUrl.pathname);
      if (local === null) {
        response.writeHead(404, { "Content-Type": "text/plain" }).end("Outside deployment base");
        return;
      }
      let file = diskPath(dist, local);
      if (fs.existsSync(file) && fs.statSync(file).isDirectory())
        file = path.join(file, "index.html");
      const exists = fs.existsSync(file) && fs.statSync(file).isFile();
      if (!exists) file = path.join(dist, "404.html");
      // Also prohibit a parent symlink when this exported server is tested alone.
      const real = fs.realpathSync(file);
      const realRoot = fs.realpathSync(dist);
      assert(real.startsWith(`${realRoot}${path.sep}`), "Symlink escaped deploy root");
      const body = fs.readFileSync(file);
      response.writeHead(exists ? 200 : 404, {
        "Content-Type": MIME[path.extname(file)] ?? "application/octet-stream",
        "Content-Length": body.length,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      });
      response.end(request.method === "HEAD" ? undefined : body);
    } catch {
      response.writeHead(400, { "Content-Type": "text/plain" }).end("Invalid static request");
    }
  });
}

async function closeServer(server) {
  if (!server.listening) return;
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
    server.closeAllConnections();
  });
}

async function browserAudit(browser, tenant, urls, dist, entries, images, inspectHtml, result) {
  const { config } = tenant;
  const server = staticServer(dist, urls);
  const contexts = [];
  const problems = new Set();
  const fontRequests = new Set();
  const expectedMissing = new Set();
  let origin;
  const instrument = async (javaScriptEnabled = true) => {
    const context = await browser.newContext({
      javaScriptEnabled,
      serviceWorkers: "block",
      viewport: { width: 1280, height: 900 },
      reducedMotion: "reduce",
    });
    contexts.push(context);
    context.setDefaultTimeout(15000);
    context.setDefaultNavigationTimeout(30000);
    await context.route("**/*", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (url.origin !== origin) {
        result.counters.blockedExternal++;
        problems.add(`External request blocked: ${request.url()}`);
        await route.abort("blockedbyclient");
      } else await route.continue();
    });
    await context.routeWebSocket("**/*", (socket) => {
      problems.add(`Unexpected WebSocket blocked: ${socket.url()}`);
      socket.close();
    });
    context.on("request", (request) => {
      if (request.resourceType() === "font") fontRequests.add(request.url());
      if (new URL(request.url()).origin === origin) result.counters.localRequests++;
    });
    context.on("requestfailed", (request) => {
      // Chromium disables scripts via CSP in javaScriptEnabled:false contexts.
      // Keep reporting every other failure, including fonts/images and normal-JS scripts.
      if (
        !javaScriptEnabled &&
        request.resourceType() === "script" &&
        request.failure()?.errorText === "csp"
      )
        return;
      problems.add(`Request failed: ${request.url()} (${request.failure()?.errorText})`);
    });
    context.on("response", (response) => {
      if (response.status() < 400) return;
      const intentional =
        response.status() === 404 &&
        response.request().isNavigationRequest() &&
        expectedMissing.has(response.url());
      if (!intentional) problems.add(`HTTP ${response.status()}: ${response.url()}`);
    });
    context.on("page", (page) => {
      page.on("pageerror", (error) => problems.add(`Page error: ${error.message}`));
      page.on("console", (message) => {
        const text = message.text();
        const intentional404 =
          /^Failed to load resource: the server responded with a status of 404\b/.test(text) &&
          expectedMissing.has(message.location().url);
        if (
          (message.type() === "error" && !intentional404) ||
          /hydrat|did not match|server.render|Minified React error/i.test(text)
        )
          problems.add(`Console ${message.type()}: ${text}`);
      });
    });
    return context;
  };
  try {
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
    origin = `http://127.0.0.1:${server.address().port}`;
    const context = await instrument();
    const page = await context.newPage();
    const detail = entries.find((entry) => entry.kind === "detail" && !entry.isAlias);
    const home = entries.find((entry) => entry.kind === "page" && entry.pageId === "home");
    assert(detail && home, "Browser audit needs a canonical detail and home route");
    const localUrl = (entry) => origin + urls.mount(entry.path);
    const hydrated = async (entry) => {
      await page.waitForURL(
        (url) => url.href.replace(/\/$/, "") === localUrl(entry).replace(/\/$/, ""),
      );
      await page.waitForFunction(
        (routePath) =>
          document.querySelector("[data-route-path]")?.getAttribute("data-route-path") ===
          routePath,
        entry.path,
      );
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.locator("main h1").count(), 1);
      inspectHtml(await page.content(), entry);
      result.counters.browserStates++;
    };
    const direct = await page.goto(localUrl(detail), { waitUntil: "networkidle" });
    assert.equal(direct?.status(), 200, "Direct detail HTTP status");
    assert.equal(
      await direct.text(),
      fs.readFileSync(diskPath(dist, `${detail.path}/index.html`), "utf8"),
      "Server did not return the detail's disk HTML",
    );
    await hydrated(detail);
    const token = `${config.id}:same-document`;
    await page.evaluate((value) => {
      window.__seoAuditDocument = value;
    }, token);
    let documentRequests = 0;
    page.on("request", (request) => {
      if (request.isNavigationRequest() && request.frame() === page.mainFrame()) documentRequests++;
    });
    // Router basename links omit the root's final slash; both resolve to the same directory.
    await page
      .locator(
        `a[href=${JSON.stringify(urls.mount(home.path))}], a[href=${JSON.stringify(urls.mount(home.path).replace(/\/$/, "") || "/")}]`,
      )
      .first()
      .click();
    await hydrated(home);
    await page.goBack();
    await hydrated(detail);
    await page.goForward();
    await hydrated(home);
    assert.equal(
      await page.evaluate(() => window.__seoAuditDocument),
      token,
      "Navigation/history reloaded the document instead of using the hydrated router",
    );
    assert.equal(documentRequests, 0, "Client navigation made a document request");

    const fonts = await page.evaluate(async () => {
      await document.fonts.ready;
      const heading = document.querySelector("main h1");
      const body = document.querySelector("main p");
      const family = (element) =>
        getComputedStyle(element)
          .fontFamily.split(",")[0]
          .replaceAll('"', "")
          .replaceAll("'", "")
          .trim();
      return {
        expected: [family(heading), family(body)],
        loaded: [...document.fonts]
          .filter((face) => face.status === "loaded")
          .map((face) => face.family.replaceAll('"', "").replaceAll("'", "")),
      };
    });
    for (const family of fonts.expected)
      assert(fonts.loaded.includes(family), `Custom font not loaded: ${family}`);
    assert(fontRequests.size > 0, "No local font was requested");
    const cdp = await context.newCDPSession(page);
    try {
      await cdp.send("DOM.enable");
      await cdp.send("CSS.enable");
      const { root } = await cdp.send("DOM.getDocument");
      for (const selector of ["main h1", "main p"]) {
        const { nodeId } = await cdp.send("DOM.querySelector", { nodeId: root.nodeId, selector });
        const { fonts: actual } = await cdp.send("CSS.getPlatformFontsForNode", { nodeId });
        assert(
          actual.some((font) => font.isCustomFont && font.glyphCount > 0),
          `${selector} rendered only fallback glyphs`,
        );
      }
    } finally {
      await cdp.detach();
    }
    result.fonts = { ...fonts, requests: sorted(fontRequests) };
    for (const [pathname, dimensions] of images) {
      const decoded = await page.evaluate(async (src) => {
        const image = new Image();
        image.src = src;
        await image.decode();
        return { width: image.naturalWidth, height: image.naturalHeight };
      }, origin + pathname);
      assert(decoded.width > 0 && decoded.height > 0, `Undecodable image: ${pathname}`);
      if (dimensions) assert.deepEqual(decoded, dimensions, `Decoded dimensions: ${pathname}`);
      result.counters.decodedImages++;
    }

    for (const javaScriptEnabled of [true, false]) {
      const missingPage = javaScriptEnabled ? page : await (await instrument(false)).newPage();
      const missingUrl =
        origin + urls.mount(`/__seo-audit-missing-${javaScriptEnabled ? "js" : "no-js"}`);
      expectedMissing.add(missingUrl);
      const response = await missingPage.goto(missingUrl, { waitUntil: "networkidle" });
      assert.equal(response?.status(), 404, "Unknown URL must return HTTP 404, never blanket 200");
      assert.equal(
        await response.text(),
        fs.readFileSync(path.join(dist, "404.html"), "utf8"),
        "Unknown URL must serve the raw recovery document",
      );
      assert.equal(
        await missingPage.locator('meta[name="robots"]').getAttribute("content"),
        "noindex,nofollow",
      );
      assert.equal(
        await missingPage
          .locator('link[rel="canonical"], script[type="application/ld+json"]')
          .count(),
        0,
      );
      await missingPage.getByRole("heading", { name: /page not found/i }).waitFor();
      const recovery = missingPage
        .getByRole("link", { name: config.pages.home.navLabel, exact: true })
        .filter({ hasText: config.pages.home.navLabel })
        .first();
      assert.equal(
        (await recovery.getAttribute("href")).replace(/\/$/, ""),
        urls.mount(home.path).replace(/\/$/, ""),
      );
      if (!javaScriptEnabled) {
        const [recovered] = await Promise.all([missingPage.waitForNavigation(), recovery.click()]);
        assert.equal(recovered?.status(), 200, "No-JS home recovery status");
        await missingPage.locator("main h1").waitFor();
        assert.equal(missingPage.url(), localUrl(home));
      }
      result.counters.notFoundChecks++;
    }
  } finally {
    // Close every context even if one close fails; preserve request errors on failure too.
    const closed = await Promise.allSettled(contexts.map((context) => context.close()));
    for (const item of closed)
      if (item.status === "rejected") problems.add(`Context cleanup: ${item.reason}`);
    result.browserErrors = sorted(problems);
    await closeServer(server);
  }
  assert.deepEqual(sorted(problems), [], "Browser resource/hydration errors");
}

export async function main(args = process.argv.slice(2)) {
  // Select only a filename-safe report suffix before imports can fail. Scoped runs
  // must never truncate evidence from the separate all-tenant audit.
  const requested =
    args.length === 1 && /^--tenant=[a-z0-9-]+$/.test(args[0])
      ? args[0].slice("--tenant=".length)
      : undefined;
  const report = {
    startedAt: new Date().toISOString(),
    ok: false,
    complete: false,
    scope: requested ?? "all",
    counters: { checks: 0, passed: 0, failed: 0 },
    tenants: [],
    errors: [],
    limitations: [
      "Existing outputs only; build freshness is not independently proven.",
      "Loopback Chromium smoke test, not a live host, rich-result eligibility, or search-engine validation.",
      "Browser coverage is one direct canonical detail, home navigation/history, icons/fonts and JS/no-JS 404 per tenant; raw checks cover every manifest route.",
    ],
  };
  const output = path.join(
    ROOT,
    "build",
    requested ? `seo-output-audit-${requested}.json` : "seo-output-audit.json",
  );
  let vite;
  let browser;
  let JSDOM;
  const save = () => {
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  };
  const error = (scope, reason) => {
    report.errors.push({
      scope,
      message: (reason instanceof Error ? reason.message : String(reason)).slice(0, 6000),
    });
    report.counters.failed++;
    console.error(`FAIL ${scope}: ${report.errors.at(-1).message}`);
  };
  const check = (scope, operation) => {
    report.counters.checks++;
    try {
      const value = operation();
      report.counters.passed++;
      return { ok: true, value };
    } catch (reason) {
      error(scope, reason);
      return { ok: false };
    }
  };
  const withHtml = (html, url, operation, contentType = "text/html") => {
    // No runScripts, resources, or browser globals: JSDOM remains an inert parser.
    const dom = new JSDOM(html, { url, contentType });
    try {
      return operation(dom.window.document);
    } finally {
      dom.window.close();
    }
  };
  try {
    save();
    assert(
      args.length <= 1 && (args.length === 0 || /^--tenant=[a-z0-9-]+$/.test(args[0])),
      "Usage: verify-seo-output.mjs [--tenant=id]",
    );
    const { createServer } = await import("vite");
    ({ JSDOM } = await import("jsdom"));
    // No project Vite/React Router hooks, env files, dependency discovery or HTTP listener.
    vite = await createServer({
      root: ROOT,
      configFile: false,
      envFile: false,
      appType: "custom",
      logLevel: "error",
      resolve: { alias: { "@": path.join(ROOT, "src") } },
      server: { middlewareMode: true, hmr: false, watch: null },
      optimizeDeps: { noDiscovery: true, include: [] },
    });
    const tenant = await vite.ssrLoadModule("/src/site/index.ts");
    const { createRouteManifest, getIndexableRoutes } = await vite.ssrLoadModule(
      "/src/routes/route-manifest.ts",
    );
    const { siteBasePath } = await vite.ssrLoadModule("/src/lib/site-url.ts");
    assert(requested === undefined || requested === tenant.config.id, "Unknown audit tenant");
    const tenants = [tenant];
    const { chromium } = await import("@playwright/test");
    try {
      browser = await chromium.launch({
        headless: true,
        args: [
          "--disable-background-networking",
          "--disable-component-update",
          "--no-proxy-server",
        ],
      });
    } catch (reason) {
      error("Chromium launch (no browser download attempted)", reason);
    }
    for (const tenant of tenants) {
      const { config, content } = tenant;
      const id = config.id;
      if (requested && requested !== id) continue;
      const result = {
        id,
        ok: false,
        counters: {
          expectedRoutes: 0,
          diskRoutes: 0,
          checkedRoutes: 0,
          passedRoutes: 0,
          aliases: 0,
          indexable: 0,
          jsonLdGraphs: 0,
          assetReferences: 0,
          uniqueAssets: 0,
          decodedImages: 0,
          browserStates: 0,
          localRequests: 0,
          blockedExternal: 0,
          notFoundChecks: 0,
        },
        types: {},
        browserErrors: [],
      };
      report.tenants.push(result);
      const firstError = report.errors.length;
      try {
        const urls = siteUrls(config.siteUrl, siteBasePath(config.siteUrl));
        const dist = path.join(ROOT, "dist");
        const entries = createRouteManifest(config, content);
        const files = inventory(dist);
        const expectedFiles = entries.map((entry) =>
          entry.path === "/" ? "index.html" : `${entry.path.slice(1)}/index.html`,
        );
        const actualFiles = files.filter((file) => path.posix.basename(file) === "index.html");
        Object.assign(result.counters, {
          expectedRoutes: entries.length,
          diskRoutes: actualFiles.length,
          aliases: entries.filter((entry) => entry.isAlias).length,
        });
        result.basePath = urls.base;
        check(`${id}: exact disk routes`, () => {
          assert.equal(new Set(expectedFiles).size, entries.length);
          assert.deepEqual(
            actualFiles,
            sorted(expectedFiles),
            "Unexpected/disabled/styleguide/missing route index.html paths",
          );
        });
        check(`${id}: static-only output`, () => {
          assert(!fs.existsSync(path.join(ROOT, "build", "server")), "Build server output remains");
          for (const file of files) {
            assert(
              !/(^|\/)(?:server|node_modules|\.react-router)(?:\/|$)|(?:^|\/)(?:entry\.server\.|_worker\.js)|^functions\/.*\.[cm]?js$|__styleguide/.test(
                file,
              ),
              `Runtime/dev artifact: ${file}`,
            );
            // The production route validator legitimately contains the reserved
            // "__styleguide" string. Reject UI code, not that safety guard.
            if (/\.(?:m?js|html)$/.test(file))
              assert(
                !fs.readFileSync(path.join(dist, file), "utf8").includes("Preview a preset"),
                `Styleguide UI leaked into ${file}`,
              );
          }
          const redirects = files.includes("_redirects")
            ? fs.readFileSync(path.join(dist, "_redirects"), "utf8")
            : "";
          assert(
            !redirects
              .split(/\r?\n/)
              .some((line) => !line.trim().startsWith("#") && /\*\s+\S+\s+200\b/.test(line)),
            "Blanket SPA 200 rewrite shipped",
          );
        });
        const assets = new Set();
        const images = new Map();
        let networkHints = false;
        const asset = (value, baseUrl, allowEmbedded = false) => {
          nonempty(value, "Empty resource URL");
          if (allowEmbedded && /^(?:data:|blob:|#)/i.test(value)) return;
          const url = new URL(value, baseUrl);
          assert.equal(url.origin, urls.origin, `External resource: ${value}`);
          const local = urls.unmount(url.pathname);
          assert(local !== null, `Resource outside deployment base: ${value}`);
          let file = diskPath(dist, local);
          if (fs.existsSync(file) && fs.statSync(file).isDirectory())
            file = path.join(file, "index.html");
          assert(
            fs.existsSync(file) && fs.statSync(file).isFile(),
            `Missing resource: ${url.pathname}`,
          );
          assets.add(url.pathname);
          result.counters.assetReferences++;
          return { file, pathname: url.pathname };
        };
        const cssAssets = (source, baseUrl) => {
          const css = source.replace(/\/\*[\s\S]*?\*\//g, "");
          for (const match of css.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^\s)]*))\s*\)/g))
            asset(match[1] ?? match[2] ?? match[3], baseUrl, true);
          for (const match of css.matchAll(/@import\s+["']([^"']+)["']/g)) asset(match[1], baseUrl);
        };
        const htmlAssets = (document, requestUrl) => {
          assert.equal(
            document.querySelectorAll("base").length,
            0,
            "Unexpected HTML base hides broken links",
          );
          // DNS/preconnect hints are not fetches and cannot be blocked by routing.
          if (document.querySelector('link[rel~="preconnect"],link[rel~="dns-prefetch"]')) {
            networkHints = true;
            assert.fail("Network hints are not permitted in an offline audit");
          }
          for (const style of document.querySelectorAll("style"))
            cssAssets(style.textContent, requestUrl);
          for (const styled of document.querySelectorAll("[style]"))
            cssAssets(styled.getAttribute("style"), requestUrl);
          for (const [selector, attribute] of [
            [
              "script[src],img[src],source[src],video[src],audio[src],iframe[src],embed[src],input[src]",
              "src",
            ],
            ["video[poster]", "poster"],
            ["object[data]", "data"],
            [
              'link[rel~="stylesheet"],link[rel~="modulepreload"],link[rel~="preload"],link[rel~="icon"],link[rel="apple-touch-icon"],link[rel="manifest"]',
              "href",
            ],
          ]) {
            for (const element of document.querySelectorAll(selector))
              asset(element.getAttribute(attribute), requestUrl, true);
          }
          for (const element of document.querySelectorAll("[srcset],[imagesrcset]")) {
            for (const attribute of ["srcset", "imagesrcset"]) {
              const srcset = element.getAttribute(attribute);
              if (!srcset) continue;
              assert(
                !/data:/i.test(srcset),
                "Embedded srcset needs an explicit parser; do not silently split data URLs",
              );
              for (const candidate of srcset.split(","))
                asset(candidate.trim().split(/\s+/)[0], requestUrl);
            }
          }
          for (const link of document.querySelectorAll("a[href],area[href]")) {
            const href = link.getAttribute("href");
            if (/^(?:#|mailto:|tel:)/i.test(href)) continue;
            const url = new URL(href, requestUrl);
            if (url.origin === urls.origin) asset(href, requestUrl);
          }
          const links = new Map([
            [config.brand.favicon, 'link[rel="icon"][type="image/svg+xml"]'],
            ["/favicon-32.png", 'link[rel="icon"][sizes="32x32"]'],
            ["/apple-touch-icon.png", 'link[rel="apple-touch-icon"]'],
            ["/manifest.webmanifest", 'link[rel="manifest"]'],
          ]);
          for (const [local, selector] of links)
            assert.equal(
              one(document, selector).getAttribute("href"),
              urls.mount(local),
              `Base-scoped ${selector}`,
            );
        };
        const graphs = new Map();
        for (const entry of entries) {
          const before = report.errors.length;
          const requestUrl = urls.absolute(entry.path);
          const filename = entry.path === "/" ? "/index.html" : `${entry.path}/index.html`;
          const read = check(`${id}${entry.path}: read raw HTML`, () =>
            fs.readFileSync(diskPath(dist, filename), "utf8"),
          );
          if (read.ok) {
            check(`${id}${entry.path}: inert HTML parse`, () =>
              withHtml(read.value, requestUrl, (document) => {
                for (const [label, operation] of [
                  ["metadata", (document) => checkMeta(document, config, entry, urls)],
                  ["assets", (document) => htmlAssets(document, requestUrl)],
                  [
                    "JSON-LD",
                    (document) => {
                      const data = checkStructuredData(
                        document,
                        config,
                        content,
                        entry,
                        urls,
                        tenants,
                      );
                      graphs.set(entry.path, data);
                      result.counters.jsonLdGraphs++;
                      for (const node of data["@graph"])
                        result.types[node["@type"]] = (result.types[node["@type"]] ?? 0) + 1;
                    },
                  ],
                ])
                  check(`${id}${entry.path}: ${label}`, () => operation(document));
              }),
            );
          }
          result.counters.checkedRoutes++;
          if (before === report.errors.length) result.counters.passedRoutes++;
          if (result.counters.checkedRoutes % 10 === 0) {
            save();
            console.log(
              `${id}: inspected ${result.counters.checkedRoutes}/${entries.length} raw routes`,
            );
          }
        }
        check(`${id}: alias graph identities`, () => {
          for (const entry of entries.filter((route) => route.isAlias)) {
            assert(
              entry.canonicalPath &&
                entries.some((route) => !route.isAlias && route.path === entry.canonicalPath),
              "Alias lacks a canonical route",
            );
            assert(
              graphs.has(entry.path) && graphs.has(entry.canonicalPath),
              "Alias/canonical graph not verified",
            );
            assert.deepEqual(
              graphs.get(entry.path),
              graphs.get(entry.canonicalPath),
              `Alias graph differs: ${entry.path}`,
            );
          }
        });
        check(`${id}: sitemap canonical indexable subset`, () => {
          const indexable = entries.filter(
            (entry) => !entry.isAlias && !noindex(expectedMeta(config, entry, urls).names.robots),
          );
          result.counters.indexable = indexable.length;
          assert.deepEqual(
            sorted(getIndexableRoutes(config, content).map((entry) => entry.path)),
            sorted(indexable.map((entry) => entry.path)),
            "Indexable helper differs from independent directives",
          );
          withHtml(
            fs.readFileSync(path.join(dist, "sitemap.xml"), "utf8"),
            urls.absolute("/sitemap.xml"),
            (document) => {
              assert.equal(document.documentElement.localName, "urlset");
              assert.equal(
                document.documentElement.namespaceURI,
                "http://www.sitemaps.org/schemas/sitemap/0.9",
              );
              const locations = [...document.querySelectorAll("url > loc")].map(
                (node) => node.textContent,
              );
              assert.equal(document.querySelectorAll("url").length, locations.length);
              assert.equal(new Set(locations).size, locations.length, "Duplicate sitemap URL");
              assert.deepEqual(
                sorted(locations),
                sorted(indexable.map((entry) => urls.absolute(entry.path))),
              );
            },
            "application/xml",
          );
        });
        check(`${id}: robots`, () => {
          const lines = fs
            .readFileSync(path.join(dist, "robots.txt"), "utf8")
            .split(/\r?\n/)
            .map((line) => line.replace(/\s+#.*$/, "").trim())
            .filter((line) => line && !line.startsWith("#"));
          assert.deepEqual(
            lines,
            [
              "User-agent: *",
              `Allow: ${urls.mount("/")}`,
              `Disallow: ${urls.mount("/__styleguide")}`,
              `Sitemap: ${urls.absolute("/sitemap.xml")}`,
            ],
            "Robots must allow reading noindex directives and advertise the scoped sitemap",
          );
        });
        check(`${id}: web manifest`, () => {
          const manifest = JSON.parse(
            fs.readFileSync(path.join(dist, "manifest.webmanifest"), "utf8"),
          );
          assert(isObject(manifest));
          for (const [key, value] of Object.entries({
            id: urls.absolute("/"),
            name: config.brand.name,
            short_name: config.brand.shortName,
            description: config.seo.defaultDescription,
            lang: config.defaultLocale,
            display: "browser",
            start_url: urls.absolute("/"),
            scope: urls.absolute("/"),
          }))
            assert.equal(manifest[key], value, `Manifest ${key}`);
          assert.deepEqual(
            manifest.icons,
            [192, 512].map((size) => ({
              src: urls.absolute(`/icon-${size}.png`),
              sizes: `${size}x${size}`,
              type: "image/png",
              purpose: "any",
            })),
          );
          for (const icon of manifest.icons)
            asset(icon.src, urls.absolute("/manifest.webmanifest"));
        });
        for (const [local, size] of [
          ["/favicon-32.png", 32],
          ["/apple-touch-icon.png", 180],
          ["/icon-192.png", 192],
          ["/icon-512.png", 512],
        ]) {
          check(`${id}: actual PNG ${local}`, () => {
            const found = asset(urls.absolute(local), urls.absolute("/"));
            const bytes = fs.readFileSync(found.file);
            assert.equal(bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
            assert.equal(bytes.toString("ascii", 12, 16), "IHDR");
            assert.equal(bytes.readUInt32BE(16), size);
            assert.equal(bytes.readUInt32BE(20), size);
            // Browser decoding below checks the entire encoded file, not only IHDR.
            images.set(found.pathname, { width: size, height: size });
          });
        }
        check(`${id}: favicon and configured image files`, () => {
          const source = asset(urls.absolute(config.brand.favicon), urls.absolute("/"));
          assert.deepEqual(
            fs.readFileSync(path.join(dist, "favicon.svg")),
            fs.readFileSync(source.file),
            "Root favicon is not this tenant's favicon",
          );
          for (const local of new Set([
            "/favicon.svg",
            config.brand.favicon,
            config.brand.logo,
            config.assets.manifestIcon,
            config.assets.socialShareImage,
            config.seo.ogImage,
            ...Object.values(config.pages)
              .filter((page) => page.enabled && page.seo?.ogImage)
              .map((page) => page.seo.ogImage),
          ])) {
            const found = asset(urls.absolute(local), urls.absolute("/"));
            if (!images.has(found.pathname)) images.set(found.pathname, undefined);
          }
        });
        check(`${id}: CSS resources`, () => {
          for (const filename of files.filter((file) => file.endsWith(".css"))) {
            cssAssets(
              fs.readFileSync(path.join(dist, filename), "utf8"),
              urls.absolute(`/${filename}`),
            );
          }
        });
        check(`${id}: raw 404 recovery`, () =>
          withHtml(
            fs.readFileSync(path.join(dist, "404.html"), "utf8"),
            urls.absolute("/404.html"),
            (document) => {
              htmlAssets(document, urls.absolute("/404.html"));
              check404(document, config, urls);
            },
          ),
        );
        const inspectHtml = (html, entry) =>
          withHtml(html, urls.absolute(entry.path), (document) => {
            checkMeta(document, config, entry, urls);
            checkStructuredData(document, config, content, entry, urls, tenants);
            htmlAssets(document, urls.absolute(entry.path));
          });
        report.counters.checks++;
        try {
          assert(browser, "Browser verification unavailable; raw checks alone cannot pass");
          assert(!networkHints, "Browser skipped to prevent DNS/preconnect network hints");
          await browserAudit(browser, tenant, urls, dist, entries, images, inspectHtml, result);
          report.counters.passed++;
        } catch (reason) {
          error(`${id}: local browser`, reason);
        }
        result.counters.uniqueAssets = assets.size;
      } catch (reason) {
        error(`${id}: audit setup`, reason);
      }
      result.ok = firstError === report.errors.length;
      result.errors = report.errors.slice(firstError);
      save();
      console.log(
        `${result.ok ? "PASS" : "FAIL"} ${id}: ${result.counters.passedRoutes}/${result.counters.expectedRoutes} raw routes, ${result.counters.browserStates} browser states`,
      );
    }
    report.complete = true;
  } catch (reason) {
    error("audit", reason);
  } finally {
    for (const [label, resource] of [
      ["browser", browser],
      ["Vite", vite],
    ]) {
      if (resource)
        try {
          await resource.close();
        } catch (reason) {
          error(`${label} cleanup`, reason);
        }
    }
    report.ok =
      report.complete &&
      report.errors.length === 0 &&
      report.tenants.length > 0 &&
      report.tenants.every((tenant) => tenant.ok);
    report.counters.checks = report.counters.passed + report.counters.failed;
    for (const key of Object.keys(report.tenants[0]?.counters ?? {})) {
      report.counters[key] = report.tenants.reduce(
        (total, tenant) => total + tenant.counters[key],
        0,
      );
    }
    report.finishedAt = new Date().toISOString();
    save();
    console.log(
      `SEO_OUTPUT_AUDIT_EXIT=${report.ok ? 0 : 1}; report=${path.relative(ROOT, output).replaceAll("\\", "/")}`,
    );
  }
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main()
    .then((report) => {
      process.exitCode = report.ok ? 0 : 1;
    })
    .catch((error) => {
      // A report write failure is itself fatal and must never look like a silent pass.
      console.error("SEO_OUTPUT_AUDIT_EXIT=1: unable to finish/save audit", error);
      process.exitCode = 1;
    });
}
