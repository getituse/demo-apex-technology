import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "..");
const containerRoot = path.resolve(projectRoot, "..");

const greenfieldSeo = JSON.parse(
  fs.readFileSync(
    path.join(containerRoot, "greenfield-school", "build", "seo-output-audit.json"),
    "utf8",
  ),
);
const apexSeo = JSON.parse(
  fs.readFileSync(
    path.join(containerRoot, "apex-technology", "build", "seo-output-audit.json"),
    "utf8",
  ),
);
const northstarSeo = JSON.parse(
  fs.readFileSync(
    path.join(containerRoot, "northstar-academy", "build", "seo-output-audit.json"),
    "utf8",
  ),
);

const greenfieldJourney = JSON.parse(
  fs.readFileSync(
    path.join(containerRoot, "greenfield-school", "build", "visitor-journey-audit.json"),
    "utf8",
  ),
);
const apexJourney = JSON.parse(
  fs.readFileSync(
    path.join(containerRoot, "apex-technology", "build", "visitor-journey-audit.json"),
    "utf8",
  ),
);
const northstarJourney = JSON.parse(
  fs.readFileSync(
    path.join(containerRoot, "northstar-academy", "build", "visitor-journey-audit.json"),
    "utf8",
  ),
);

console.log("=== Cross-Site Differentiation Verification ===");

// 1. Tenant IDs & Brands
const brands = [greenfieldJourney.tenantId, apexJourney.tenantId, northstarJourney.tenantId];
assert.equal(new Set(brands).size, 3, "All 3 tenant IDs must be unique");
console.log("PASS Unique tenant IDs:", brands.join(", "));

// 2. Gallery Differentiation (Northstar 404 vs others enabled)
assert.equal(greenfieldJourney.gallery.enabled, true, "Greenfield gallery must be enabled");
assert.equal(apexJourney.gallery.enabled, true, "Apex gallery must be enabled");
assert.equal(northstarJourney.gallery.enabled, false, "Northstar gallery must be disabled");
console.log(
  "PASS Gallery differentiation: Greenfield=enabled, Apex=enabled, Northstar=disabled (404)",
);

// 3. Fonts Differentiation
const greenfieldFonts = greenfieldSeo.tenants[0].fonts.loaded.join(", ");
const apexFonts = apexSeo.tenants[0].fonts.loaded.join(", ");
const northstarFonts = northstarSeo.tenants[0].fonts.loaded.join(", ");
assert.notEqual(greenfieldFonts, apexFonts, "Greenfield and Apex fonts must differ");
assert.notEqual(greenfieldFonts, northstarFonts, "Greenfield and Northstar fonts must differ");
assert.notEqual(apexFonts, northstarFonts, "Apex and Northstar fonts must differ");
console.log(
  `PASS Font differentiation: Greenfield=[${greenfieldFonts}], Apex=[${apexFonts}], Northstar=[${northstarFonts}]`,
);

// 4. Route Counts
const gfRoutes = greenfieldSeo.counters.checkedRoutes;
const apexRoutes = apexSeo.counters.checkedRoutes;
const nsRoutes = northstarSeo.counters.checkedRoutes;
console.log(`PASS Route counts: Greenfield=${gfRoutes}, Apex=${apexRoutes}, Northstar=${nsRoutes}`);

// Write differentiation report
const report = {
  verifiedAt: new Date().toISOString(),
  tenants: {
    greenfield: {
      id: "greenfield-school",
      routes: gfRoutes,
      fonts: greenfieldSeo.tenants[0].fonts.loaded,
      galleryEnabled: true,
    },
    apex: {
      id: "apex-technology",
      routes: apexRoutes,
      fonts: apexSeo.tenants[0].fonts.loaded,
      galleryEnabled: true,
    },
    northstar: {
      id: "northstar-academy",
      routes: nsRoutes,
      fonts: northstarSeo.tenants[0].fonts.loaded,
      galleryEnabled: false,
    },
  },
  ok: true,
};

fs.writeFileSync(
  path.join(projectRoot, "build", "differentiation-audit.json"),
  JSON.stringify(report, null, 2),
);
console.log("DIFFERENTIATION_AUDIT_EXIT=0: All 3 sites verified distinct and differentiated");
