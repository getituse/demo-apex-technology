import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import {
  greenfieldResources,
  apexResources,
  northstarResources,
} from "../src/tenants/resource-catalogue.ts";

const resourceCatalogues = {
  "greenfield-school": greenfieldResources,
  "apex-technology": apexResources,
  "northstar-academy": northstarResources,
};

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const imagesOnly = process.argv[2] === "--images-only";
if (process.argv.length > (imagesOnly ? 3 : 2))
  throw new Error("Usage: generate-editorial-assets.mjs [--images-only]");
const palettes = {
  "greenfield-school": ["#173f35", "#dde8c7", "#f5f1de", "#bb763d"],
  "apex-technology": ["#612039", "#dccdaf", "#f4f0eb", "#62737c"],
  "northstar-academy": ["#303d68", "#bcccd9", "#f4f7fa", "#ab7541"],
};
const escape = (text) =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
function artwork(subject, index, palette) {
  const [ink, soft, paper, accent] = palette;
  const shapes = [
    `<path d="M230 225q180-65 360 30v360q-180-95-360-30zm360 30q180-95 360-30v360q-180-65-360 30" fill="${soft}" stroke="${ink}" stroke-width="16"/><path d="M590 255v360M295 310l205 30m-205 60 205 30m170-90 190-30m-190 110 190-30" fill="none" stroke="${ink}" stroke-width="12"/>`,
    `<g fill="${soft}" stroke="${ink}" stroke-width="12"><rect x="250" y="210" width="170" height="170"/><circle cx="615" cy="295" r="90"/><path d="m805 380 100-175 100 175z"/><circle cx="335" cy="545" r="90"/><path d="m515 630 100-175 100 175z"/><rect x="820" y="460" width="170" height="170"/></g>`,
    `<path d="M600 650V275m0 240q-260-30-210-250 205 0 210 190m0-70q15-185 200-200 65 190-200 230" fill="${soft}" stroke="${ink}" stroke-width="16"/><path d="M390 650h420" stroke="${accent}" stroke-width="28"/>`,
    `<path d="m260 470 260-230 240 70 220 270-370 60z" fill="${soft}" stroke="${ink}" stroke-width="14"/><path d="m260 470 350 170-90-400m0 0 110 260 350 80m-350-80 130-190" fill="none" stroke="${accent}" stroke-width="12"/>`,
    `<path d="M210 210h440v270H435l-115 95v-95H210z" fill="${soft}" stroke="${ink}" stroke-width="14"/><path d="M710 335h285v235h-80v85l-110-85h-95" fill="${paper}" stroke="${accent}" stroke-width="14"/><path d="M295 300h260m-260 80h180m285 45h150" stroke="${ink}" stroke-width="14"/>`,
    `<path d="M285 545V250l430-70v295m-430-140 430-70" fill="none" stroke="${ink}" stroke-width="24"/><ellipse cx="220" cy="565" rx="80" ry="55" fill="${accent}"/><ellipse cx="650" cy="495" rx="80" ry="55" fill="${accent}"/><path d="M830 290q170 140 0 290m65-225q80 90 0 165" fill="none" stroke="${soft}" stroke-width="22"/>`,
    `<rect x="240" y="180" width="650" height="440" rx="16" fill="${soft}" stroke="${ink}" stroke-width="16"/><path d="M300 250h520M300 340h520M300 430h520M300 520h350" stroke="${paper}" stroke-width="32"/><path d="m800 200 145 390" stroke="${accent}" stroke-width="32"/>`,
    `<circle cx="505" cy="365" r="175" fill="${soft}" stroke="${ink}" stroke-width="22"/><path d="m625 500 215 175" stroke="${ink}" stroke-width="45"/><path d="M505 270v185m-95-90h190" stroke="${accent}" stroke-width="16"/>`,
    `<path d="M335 625V280l225-115 260 155v305z" fill="${soft}" stroke="${ink}" stroke-width="16"/><path d="M335 280 580 400l240-80m-240 80v225" fill="none" stroke="${ink}" stroke-width="14"/><path d="m395 420 125 60m110-40 110-45" stroke="${accent}" stroke-width="25"/>`,
    `<g fill="${soft}" stroke="${ink}" stroke-width="14"><rect x="215" y="220" width="340" height="235" rx="16"/><rect x="655" y="390" width="340" height="235" rx="16"/></g><path d="M385 455v90h205m235-155v-90H615" fill="none" stroke="${accent}" stroke-width="18"/><path d="m555 210 60 90-60 90m90 65-55 90 55 90" fill="none" stroke="${accent}" stroke-width="14"/>`,
    `<circle cx="600" cy="390" r="220" fill="${soft}"/><path d="M330 435q135-250 270 0 135-250 270 0M330 505q135-150 270 0 135-150 270 0" fill="none" stroke="${ink}" stroke-width="18"/><circle cx="470" cy="260" r="45" fill="${accent}"/><circle cx="735" cy="260" r="45" fill="${accent}"/>`,
    `<path d="M280 620V200h620v420z" fill="${soft}" stroke="${ink}" stroke-width="16"/><path d="m350 530 150-140 125 55 180-185" fill="none" stroke="${accent}" stroke-width="24"/><path d="M350 300h150m-150 70h100" stroke="${ink}" stroke-width="16"/>`,
  ];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800" role="img" aria-labelledby="title desc"><title id="title">${escape(subject)} — demo illustration</title><desc id="desc">Original demonstration artwork. Fictional visual concept, not real premises or people.</desc><rect width="1200" height="800" fill="${paper}"/><path d="M0 690 1200 620v180H0z" fill="${soft}"/><circle cx="${100 + index * 25}" cy="95" r="45" fill="${accent}" opacity="0.45"/>${shapes[index]}<path d="M65 130V65h65m940 670h65v-65" fill="none" stroke="${ink}" stroke-width="8"/></svg>`;
}

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ offline: true });
  const page = await context.newPage();
  for (const [id, catalogue] of Object.entries(resourceCatalogues)) {
    const target = path.join(root, "public/tenants", id);
    fs.mkdirSync(path.join(target, "images"), { recursive: true });
    fs.mkdirSync(path.join(target, "documents"), { recursive: true });
    for (const [index, subject] of catalogue.gallery.entries()) {
      fs.writeFileSync(
        path.join(target, "images", `gallery-${String(index + 1).padStart(2, "0")}.svg`),
        artwork(subject, index, palettes[id]),
      );
    }
    const sizes = {};
    if (imagesOnly) {
      console.log(`PASS ${id}: ${catalogue.gallery.length} original illustrations refreshed`);
      continue;
    }
    for (const document of catalogue.documents) {
      await page.setContent(
        `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${escape(document.title)}</title><style>body{font:12pt/1.65 Arial,sans-serif;color:#172431}h1{font:26pt/1.18 Georgia,serif}h2{font-size:16pt;margin-top:24pt}p{orphans:3;widows:3}aside{border:1pt solid #718096;padding:12pt;font-size:10pt}header{border-bottom:2pt solid #27384b;padding-bottom:14pt}section{break-inside:avoid}footer{margin-top:24pt;font-size:10pt}</style></head><body><header><p>${escape(catalogue.name)} · DEMONSTRATION RESOURCE</p><h1>${escape(document.title)}</h1><p>${escape(document.description)}</p></header><aside>Fictional demonstration content. Not an operational policy, application form, booking or professional advice. The organisation and contact details are examples. Do not send personal documents or payments. A real operator must review and replace this guide before launch.</aside><main>${document.sections.map((section) => `<section><h2>${escape(section.heading)}</h2>${section.paragraphs.map((text) => `<p>${escape(text)}</p>`).join("")}</section>`).join("")}</main><footer>Original demonstration writing · 9 September 2026 · No submission or reservation is made by this document.</footer></body></html>`,
      );
      const bytes = await page.pdf({
        format: "A4",
        printBackground: true,
        tagged: true,
        outline: true,
        margin: { top: "18mm", bottom: "18mm", left: "18mm", right: "18mm" },
      });
      if (!bytes.subarray(0, 5).equals(Buffer.from("%PDF-")))
        throw new Error("Invalid generated PDF");
      fs.writeFileSync(path.join(target, "documents", `${document.id}.pdf`), bytes);
      sizes[document.id] = bytes.length;
    }
    fs.writeFileSync(
      path.join(target, "documents/document-sizes.json"),
      JSON.stringify(sizes, null, 2) + "\n",
    );
    console.log(
      `PASS ${id}: ${catalogue.gallery.length} original illustrations, ${catalogue.documents.length} tagged PDFs`,
    );
  }
} finally {
  await browser.close();
}
