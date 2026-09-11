/**
 * Original demonstration artwork, not photographs, credentials or customer assets.
 * Run: node scripts/generate-demo-media.mjs
 * Uses ONLY the already-installed Playwright Chromium. Never downloads anything.
 * Sources are the SVG drawings below; outputs are committed under public/tenants.
 * Reproducible on the same OS/Chromium; system-font rasterization can vary by OS.
 * This intentionally replaces only the listed demo files, never other tenant media.
 */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

import { rawConfig as greenfield } from "../src/tenants/greenfield-school/config.ts";
import { rawConfig as apex } from "../src/tenants/apex-technology/config.ts";
import { rawConfig as northstar } from "../src/tenants/northstar-academy/config.ts";
import { themePresets } from "../src/themes/theme-presets.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tenants = [
  { id: "greenfield-school", config: greenfield, subtitle: "International School", motif: "leaf" },
  { id: "apex-technology", config: apex, subtitle: "Institute of Technology", motif: "arch" },
  { id: "northstar-academy", config: northstar, subtitle: "Business Academy", motif: "compass" },
];

function escapeXml(value) {
  return value.replace(/[&<>"']/g, (char) => {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[char];
  });
}

function svg(width, height, title, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title description">
  <title id="title">${escapeXml(title)}</title>
  <desc id="description">Original demo artwork for a fictional organisation. Not a photograph of real premises, people or an accreditation. Replace with approved customer artwork before launch.</desc>
  ${body}
</svg>\n`;
}

// 64-unit geometric brand symbols drawn here, not copied from an icon library.
function symbol(motif, ink) {
  if (motif === "leaf") {
    return `<g fill="none" stroke="${ink}" stroke-width="3" stroke-linejoin="round">
      <path d="M16 35 Q24 33 32 39 Q40 33 48 35 V48 Q40 46 32 52 Q24 46 16 48 Z"/>
      <path d="M32 39 V52 M32 35 V21"/>
      <path d="M31 30 C19 29 16 22 18 14 C29 14 33 20 31 30 Z M33 26 C33 16 39 12 48 13 C47 22 41 27 33 26 Z"/>
    </g>`;
  }
  if (motif === "arch") {
    return `<g fill="none" stroke="${ink}" stroke-width="4" stroke-linecap="square">
      <path d="M14 49 L32 15 L50 49 M23 36 H41 M26 49 L32 38 L38 49"/>
    </g>`;
  }
  return `<g fill="${ink}">
    <path d="M32 10 L38 26 L54 32 L38 38 L32 54 L26 38 L10 32 L26 26 Z"/>
    <path d="M46 13 H51 V18 H46 Z M13 46 H18 V51 H13 Z"/>
  </g>`;
}

// Abstract architectural compositions: no photographic claims and no visible text.
function scene(motif, colors) {
  const { paper, primary, accent, tint } = colors;
  const base = `<rect width="1200" height="900" fill="${paper}"/>`;
  if (motif === "leaf") {
    return `${base}
      <circle cx="895" cy="200" r="100" fill="${tint}"/>
      <path d="M0 570 Q260 400 540 555 T1200 490 V900 H0 Z" fill="${tint}"/>
      <path d="M0 735 Q350 525 680 700 T1200 610 V900 H0 Z" fill="${accent}"/>
      <path d="M330 650 V395 L600 205 L870 395 V650 Z" fill="${paper}" stroke="${primary}" stroke-width="12"/>
      <g fill="none" stroke="${primary}" stroke-width="9">
        <path d="M330 395 H870 M465 301 V650 M600 205 V650 M735 301 V650 M330 515 H870"/>
        <path d="M180 720 V500 M180 590 C100 590 90 520 100 470 C166 475 190 528 180 590 Z M184 650 C260 645 282 577 271 535 C204 540 180 590 184 650 Z"/>
      </g>
      <path d="M460 900 L565 650 H635 L780 900 Z" fill="${paper}"/>
      <path d="M0 835 Q230 750 430 820 L400 900 H0 Z M800 900 L766 834 Q1020 730 1200 815 V900 Z" fill="${primary}"/>`;
  }
  if (motif === "arch") {
    return `${base}
      <rect x="160" y="130" width="880" height="630" fill="${tint}"/>
      <path d="M245 710 V315 L600 165 L955 315 V710 Z" fill="${accent}"/>
      <path d="M310 710 V400 A290 210 0 0 1 890 400 V710 Z" fill="${primary}"/>
      <path d="M430 710 V430 A170 155 0 0 1 770 430 V710 Z" fill="${paper}"/>
      <path d="M545 710 V460 A55 60 0 0 1 655 460 V710 Z" fill="${tint}"/>
      <g fill="none" stroke="${paper}" stroke-width="6">
        <path d="M340 415 H410 M790 415 H860 M340 485 H410 M790 485 H860 M340 555 H410 M790 555 H860"/>
      </g>
      <path d="M195 710 H1005 V760 H195 Z M145 775 H1055 V825 H145 Z" fill="${primary}"/>
      <path d="M95 840 H1105 V890 H95 Z" fill="${accent}"/>
      <path d="M65 110 H335 M65 110 V380 M1135 110 H865 M1135 110 V380" fill="none" stroke="${primary}" stroke-width="4"/>`;
  }
  return `${base}
    <rect x="135" y="120" width="930" height="660" fill="${tint}"/>
    <g fill="none" stroke="${primary}" stroke-width="3" opacity="0.3">
      <path d="M135 285 H1065 M135 450 H1065 M135 615 H1065 M367 120 V780 M600 120 V780 M833 120 V780"/>
    </g>
    <path d="M225 760 V575 H405 V440 H585 V305 H765 V170 H945 V760 Z" fill="${primary}"/>
    <path d="M270 760 V635 H450 V500 H630 V365 H810 V230 H945 V760 Z" fill="${accent}"/>
    <path d="M350 780 L895 235" stroke="${paper}" stroke-width="12"/>
    <g transform="translate(510 175) scale(3)">${symbol("compass", primary)}</g>
    <rect x="75" y="805" width="1050" height="12" fill="${primary}"/>`;
}

async function main() {
  // Launch before writing outputs: a missing browser leaves existing assets untouched.
  const browser = await chromium.launch({ headless: true });
  let written = 0;
  try {
    const context = await browser.newContext({
      offline: true,
      serviceWorkers: "block",
      deviceScaleFactor: 1,
      reducedMotion: "reduce",
    });
    const networkAttempts = [];
    await context.route(/https?:\/\//, async (route) => {
      networkAttempts.push(route.request().url());
      await route.abort();
    });
    const page = await context.newPage();
    await page.setContent(`<!doctype html><html><head>
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; font-src 'none'">
      <style>html,body{margin:0;width:100%;height:100%;overflow:hidden}img{display:block;width:100%;height:100%;object-fit:cover}</style>
      </head><body><img alt="Original demonstration artwork"></body></html>`);

    for (const { id, config, subtitle, motif } of tenants) {
      // Fixed registry literals, never unchecked environment input or CLI paths.
      const base = `/tenants/${id}`;
      assert.equal(config.id, id);
      for (const [actual, expected] of [
        [config.brand.logo, `${base}/logo.svg`],
        [config.brand.logoMark, `${base}/logo-mark.svg`],
        [config.brand.logoDark, `${base}/logo-dark.svg`],
        [config.brand.favicon, `${base}/favicon.svg`],
        [config.seo.ogImage, `${base}/social-share.png`],
        [config.assets.socialShareImage, `${base}/social-share.png`],
        [config.assets.manifestIcon, `${base}/icon-512.png`],
        [config.assets.basePath, base],
        [config.assets.images, `${base}/images`],
        [config.assets.documents, `${base}/documents`],
      ]) {
        assert.equal(actual, expected, `${id}: update the generator when media paths change`);
      }

      const output = path.join(root, "public", "tenants", id);
      await mkdir(path.join(output, "images"), { recursive: true });
      await mkdir(path.join(output, "documents"), { recursive: true });
      const theme = { ...themePresets[config.theme.preset], ...config.theme.overrides };
      const color = (token) => `hsl(${theme[token]})`;
      const colors = {
        paper: color("background"),
        primary: color("primary"),
        accent: color("accent"),
        tint: color("sectionTint"),
      };
      const markBody = `<rect width="64" height="64" rx="8" fill="${colors.primary}"/>${symbol(motif, color("primaryForeground"))}`;
      const mark = svg(64, 64, `${config.brand.shortName} — demo brand mark`, markBody);
      const artwork = scene(motif, colors);
      const illustration = svg(1200, 900, `${config.brand.shortName} — demo illustration`, artwork);
      const wordmark = (dark) => {
        const ink = color(dark ? "footerForeground" : "foreground");
        return svg(
          420,
          96,
          `${config.brand.name} — demo logo`,
          `<g transform="translate(12 16)">${symbol(motif, ink)}</g>
          <text x="94" y="47" fill="${ink}" font-family="${escapeXml(theme.fontHeading)}" font-size="36" font-weight="700">${escapeXml(config.brand.shortName)}</text>
          <text x="95" y="72" fill="${ink}" font-family="${escapeXml(theme.fontBody)}" font-size="14" letter-spacing="1">${escapeXml(subtitle)}</text>`,
        );
      };
      const share = svg(
        1200,
        630,
        `${config.brand.name} — demonstration website`,
        `<rect width="1200" height="630" fill="${colors.paper}"/>
        <svg x="715" y="0" width="485" height="630" viewBox="260 0 690 900" preserveAspectRatio="xMidYMid slice">${artwork}</svg>
        <g transform="translate(64 66) scale(1.5)">${markBody}</g>
        <g fill="${color("foreground")}" font-family="${escapeXml(theme.fontHeading)}" font-weight="700">
          <text x="64" y="290" font-size="64">${escapeXml(config.brand.shortName)}</text>
          <text x="67" y="348" font-size="30">${escapeXml(subtitle)}</text>
        </g>
        <path d="M67 407 H620" stroke="${colors.primary}" stroke-width="3"/>
        <g fill="${color("foreground")}" font-family="${escapeXml(theme.fontBody)}" font-size="22">
          <text x="67" y="467">Demonstration website</text>
          <text x="67" y="505">Original illustration · not real premises</text>
        </g>`,
      );
      const sources = {
        "logo.svg": wordmark(false),
        "logo-dark.svg": wordmark(true),
        "logo-mark.svg": mark,
        "favicon.svg": mark,
        "social-share.svg": share,
        "images/demo-artwork.svg": illustration,
      };
      for (const [filename, content] of Object.entries(sources)) {
        await writeFile(path.join(output, filename), content, "utf8");
        written++;
      }
      const renders = [
        ["social-share.png", share, 1200, 630],
        ["icon-512.png", mark, 512, 512],
        ["images/placeholder-hero.jpg", illustration, 1600, 900],
        ["images/placeholder-wide.jpg", illustration, 1200, 800],
        ["images/placeholder-portrait.jpg", illustration, 800, 1000],
        ["images/placeholder-square.jpg", illustration, 800, 800],
      ];
      // Decode every authored source, including the logo variants that stay SVG.
      for (const source of Object.values(sources)) {
        await page.locator("img").evaluate(
          async (img, data) => {
            img.src = data;
            await img.decode();
          },
          `data:image/svg+xml;base64,${Buffer.from(source).toString("base64")}`,
        );
      }
      for (const [filename, source, width, height] of renders) {
        await page.setViewportSize({ width, height });
        await page.locator("img").evaluate(
          async (img, data) => {
            img.src = data;
            await img.decode();
          },
          `data:image/svg+xml;base64,${Buffer.from(source).toString("base64")}`,
        );
        const jpeg = filename.endsWith(".jpg");
        await page.screenshot({
          path: path.join(output, filename),
          type: jpeg ? "jpeg" : "png",
          ...(jpeg ? { quality: 88 } : {}),
          animations: "disabled",
        });
        written++;
      }
      console.log(`PASS ${id}: 6 authored SVGs, 2 PNGs, 4 demo JPEG illustrations`);
    }
    assert.deepEqual(networkAttempts, [], "Media generation must never attempt a network request");
    console.log(`DEMO_MEDIA_EXIT=0 — ${written} files; browser offline; no network requests`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error("DEMO_MEDIA_EXIT=1", error);
  process.exitCode = 1;
});
