import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { JSDOM } from "jsdom";

import {
  checkMeta,
  checkStructuredData,
  expectedMeta,
  inventory,
  siteUrls,
  staticServer,
} from "./verify-seo-output.mjs";

function fixture() {
  const config = {
    id: "test-tenant",
    organizationType: "service-business",
    siteUrl: "https://demo.example/site/nested",
    defaultLocale: "en",
    supportedLocales: ["en"],
    brand: { name: "Test organization", description: "Sample provider.", logo: "/logo.svg" },
    legal: { demoContentNotice: "Fictional demonstration." },
    contact: {
      email: "test@example.com",
      phone: "+1 555 0100",
      addressLines: ["Sample address"],
      locality: "Example",
      country: "US",
    },
    seo: {
      defaultTitle: "Home title",
      titleTemplate: "%s | Test",
      robots: "index,follow",
      twitterCard: "summary",
      ogImage: "/share.png",
    },
    pages: {
      home: { path: "/", navLabel: "Home" },
      programs: { path: "/services", navLabel: "Services" },
    },
  };
  const entry = {
    kind: "detail",
    collection: "programs",
    slug: "advice",
    path: "/services/advice",
    pageId: "programs",
    title: "Advice",
    description: "A sample service.",
  };
  const content = { programs: [{ slug: "advice", isDemoContent: false }] };
  const urls = siteUrls(config.siteUrl, "/site/nested");
  const home = urls.absolute("/");
  const canonical = urls.absolute(entry.path);
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${home}#organization`,
        name: config.brand.name,
        url: home,
        logo: urls.absolute(config.brand.logo),
        description: "Sample provider. Fictional demonstration.",
        email: config.contact.email,
        telephone: config.contact.phone,
        address: {
          "@type": "PostalAddress",
          streetAddress: "Sample address",
          addressLocality: "Example",
          addressCountry: "US",
        },
        contactPoint: {
          "@type": "ContactPoint",
          email: config.contact.email,
          telephone: config.contact.phone,
          availableLanguage: ["en"],
        },
      },
      {
        "@type": "WebSite",
        "@id": `${home}#website`,
        name: config.brand.name,
        url: home,
        publisher: { "@id": `${home}#organization` },
        inLanguage: "en",
      },
      {
        "@type": "WebPage",
        "@id": `${canonical}#webpage`,
        name: entry.title,
        description: entry.description,
        url: canonical,
        isPartOf: { "@id": `${home}#website` },
        inLanguage: "en",
        breadcrumb: { "@id": `${canonical}#breadcrumbs` },
        mainEntity: { "@id": `${canonical}#entity` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${canonical}#breadcrumbs`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: home },
          { "@type": "ListItem", position: 2, name: "Services", item: urls.absolute("/services") },
          { "@type": "ListItem", position: 3, name: entry.title, item: canonical },
        ],
      },
      {
        "@type": "Service",
        "@id": `${canonical}#entity`,
        name: entry.title,
        description: entry.description,
        url: canonical,
        mainEntityOfPage: { "@id": `${canonical}#webpage` },
        provider: { "@id": `${home}#organization` },
      },
    ],
  };
  return { config, content, entry, urls, data };
}

function validate(fixture, data = fixture.data, tenants = []) {
  const dom = new JSDOM(
    `<head><script type="application/ld+json">${JSON.stringify(data)}</script></head>`,
  );
  try {
    return checkStructuredData(
      dom.window.document,
      fixture.config,
      fixture.content,
      fixture.entry,
      fixture.urls,
      tenants,
    );
  } finally {
    dom.window.close();
  }
}

test("root/nested bases use exact mount boundaries, never double prefix", () => {
  const root = siteUrls("https://example.com", "/");
  const nested = siteUrls("https://example.com/site/nested", "/site/nested");
  assert.equal(root.absolute("/news/item"), "https://example.com/news/item");
  assert.equal(nested.absolute("/news/item"), "https://example.com/site/nested/news/item");
  assert.equal(nested.unmount("/site/nested/news/item"), "/news/item");
  assert.equal(nested.unmount("/site/nested"), "/");
  assert.equal(nested.unmount("/site/nested-other/news/item"), null);
  assert.equal(nested.unmount("/news/item"), null);
});

test("metadata honors aliases, parent robots/image overrides and global noindex", () => {
  const { config, entry, urls } = fixture();
  entry.path = "/old/advice";
  entry.canonicalPath = "/services/advice";
  config.pages.programs.seo = { robots: "noindex,nofollow", ogImage: "/override.png" };
  let meta = expectedMeta(config, entry, urls);
  assert.equal(meta.canonical, "https://demo.example/site/nested/services/advice");
  assert.equal(meta.names.robots, "noindex,nofollow");
  assert.equal(meta.properties["og:image"], "https://demo.example/site/nested/override.png");
  config.seo.robots = "none";
  config.pages.programs.seo.robots = "index,follow";
  meta = expectedMeta(config, entry, urls);
  assert.equal(meta.names.robots, "none");
  const dom = new JSDOM("<title>Only a title</title>");
  try {
    assert.throws(() => checkMeta(dom.window.document, config, entry, urls));
  } finally {
    dom.window.close();
  }
});

test("independent JSON-LD object validation accepts a complete base-scoped Service", () => {
  const item = fixture();
  assert.deepEqual(validate(item), item.data);
  const alias = {
    ...item,
    entry: { ...item.entry, path: "/old/advice", canonicalPath: item.entry.path, isAlias: true },
  };
  assert.deepEqual(validate(alias), item.data);
});

test("all six organization kinds have independently asserted schema types", () => {
  for (const [kind, type] of Object.entries({
    school: "School",
    college: "CollegeOrUniversity",
    university: "CollegeOrUniversity",
    academy: "EducationalOrganization",
    "training-center": "EducationalOrganization",
    "service-business": "Organization",
  })) {
    const item = fixture();
    item.config.organizationType = kind;
    item.content.programs[0].structuredDataKind = "Service";
    item.data["@graph"][0]["@type"] = type;
    validate(item);
    item.data["@graph"][0]["@type"] = "WrongOrganizationType";
    assert.throws(() => validate(item));
  }
});

test("rejects quoted JSON, missing types, duplicate IDs, bad breadcrumbs and foreign tenants", () => {
  const item = fixture();
  assert.throws(() => validate(item, JSON.stringify(item.data)), /parse once into an object/);
  assert.throws(() => validate(item, item.data["@graph"]), /parse once into an object/);
  for (const mutate of [
    (data) => data["@graph"].pop(),
    (data) => {
      data["@graph"][4]["@type"] = "Course";
    },
    (data) => {
      data["@graph"][4]["@id"] = data["@graph"][0]["@id"];
    },
    (data) => {
      data["@graph"][3].itemListElement[2].position = 7;
    },
    (data) => {
      data["@graph"][4].aggregateRating = { ratingValue: 5 };
    },
  ]) {
    const corrupt = structuredClone(item.data);
    mutate(corrupt);
    assert.throws(() => validate(item, corrupt));
  }
  const leaked = structuredClone(item.data);
  leaked["@graph"][4].description += " Other brand";
  assert.throws(
    () =>
      validate(item, leaked, [
        {
          config: {
            id: "other-tenant",
            brand: { name: "Other brand" },
            siteUrl: "https://other.example",
          },
        },
      ]),
    /Foreign tenant/,
  );
});

test("strict static mount serves real detail HTML, HTTP 404 and no root/base fallback", async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "seo-verifier-test-"));
  const urls = siteUrls("https://example.com/site/nested", "/site/nested");
  const server = staticServer(directory, urls);
  try {
    fs.mkdirSync(path.join(directory, "detail"));
    fs.writeFileSync(path.join(directory, "index.html"), "<h1>Home</h1>");
    fs.writeFileSync(path.join(directory, "detail", "index.html"), "<h1>Detail</h1>");
    fs.writeFileSync(
      path.join(directory, "404.html"),
      '<h1>Page not found</h1><a href="/site/nested/">Home</a>',
    );
    assert.deepEqual(inventory(directory), ["404.html", "detail/index.html", "index.html"]);
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
    const origin = `http://127.0.0.1:${server.address().port}`;
    const detail = await fetch(`${origin}/site/nested/detail`);
    assert.equal(detail.status, 200);
    assert.equal(await detail.text(), "<h1>Detail</h1>");
    const missing = await fetch(`${origin}/site/nested/missing`);
    assert.equal(missing.status, 404);
    assert.match(await missing.text(), /Page not found/);
    const outside = await fetch(`${origin}/detail`);
    assert.equal(outside.status, 404);
    assert.equal(await outside.text(), "Outside deployment base");
    const doubled = await fetch(`${origin}/site/nested/site/nested/detail`);
    assert.equal(doubled.status, 404);
    await doubled.text();
  } finally {
    if (server.listening)
      await new Promise((resolve) => {
        server.close(resolve);
        server.closeAllConnections();
      });
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
