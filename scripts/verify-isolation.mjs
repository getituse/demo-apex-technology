import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { rawConfig as config } from "../src/site/config.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "..");
const containerRoot = path.resolve(projectRoot, "..");

const currentId = config.id;
const ALL_PROJECTS = ["greenfield-school", "apex-technology", "northstar-academy"];
const siblings = ALL_PROJECTS.filter((id) => id !== currentId);

const BRAND_PATTERNS = {
  "greenfield-school": ["Greenfield International", "greenfield-school", "tenants/greenfield-school"],
  "apex-technology": ["Apex Institute", "apex-technology", "tenants/apex-technology"],
  "northstar-academy": ["Northstar Business", "northstar-academy", "tenants/northstar-academy"],
};

console.log(`[Isolation Check] Project: ${currentId}`);
console.log(`[Isolation Check] Siblings to isolate: ${siblings.join(", ")}`);

const renamedItems = [];

try {
  // 1. Rename sibling material away
  for (const sibling of siblings) {
    const siblingPath = path.join(containerRoot, sibling);
    if (!fs.existsSync(siblingPath)) continue;

    // Try renaming the whole sibling directory first
    const tempPath = path.join(containerRoot, `_temp_${sibling}`);
    try {
      fs.renameSync(siblingPath, tempPath);
      console.log(`Renamed whole folder ${sibling} -> _temp_${sibling}`);
      renamedItems.push({ original: siblingPath, temp: tempPath });
    } catch {
      // If OS file-lock (EPERM) on top-level folder from IDE workspace root, rename its src and public
      console.log(`Top-level lock on ${sibling}; isolating via src and public subdirectories...`);
      for (const sub of ["src", "public"]) {
        const subPath = path.join(siblingPath, sub);
        const subTemp = path.join(siblingPath, `_temp_${sub}`);
        if (fs.existsSync(subPath)) {
          fs.renameSync(subPath, subTemp);
          console.log(`Renamed ${sibling}/${sub} -> ${sibling}/_temp_${sub}`);
          renamedItems.push({ original: subPath, temp: subTemp });
        }
      }
    }
  }

  // 2. Rebuild current site in total isolation
  console.log(`Rebuilding ${currentId} in total isolation...`);
  execSync("npm run build", { cwd: projectRoot, stdio: "inherit" });

  // 3. Verify dist contains home, one listing, and one detail check
  const distDir = path.join(projectRoot, "dist");
  assert(fs.existsSync(path.join(distDir, "index.html")), "Home page index.html must exist");
  const homeHtml = fs.readFileSync(path.join(distDir, "index.html"), "utf8");
  assert(homeHtml.includes("<h1"), "Home page must contain <h1>");

  // Listing check
  const listingRel = config.pages.programs.path.replace(/^\//, "");
  assert(fs.existsSync(path.join(distDir, listingRel, "index.html")), `Listing page ${listingRel} must exist`);
  const listingHtml = fs.readFileSync(path.join(distDir, listingRel, "index.html"), "utf8");
  assert(listingHtml.includes("<h1"), `Listing page ${listingRel} must contain <h1>`);

  // Detail check
  const detailRel = config.detailRoutes.programs.path.replace(/^\//, "");
  const entries = fs.readdirSync(path.join(distDir, detailRel), { withFileTypes: true });
  const detailDir = entries.find((e) => e.isDirectory());
  assert(detailDir, `At least one detail directory must exist under ${detailRel}`);
  assert(
    fs.existsSync(path.join(distDir, detailRel, detailDir.name, "index.html")),
    `Detail page ${detailRel}/${detailDir.name} must exist`,
  );
  const detailHtml = fs.readFileSync(path.join(distDir, detailRel, detailDir.name, "index.html"), "utf8");
  assert(detailHtml.includes("<h1"), `Detail page ${detailRel}/${detailDir.name} must contain <h1>`);

  console.log(`PASS verified home (/), listing (/${listingRel}), detail (/${detailRel}/${detailDir.name})`);

  // 4. Grep dist/ and src/ for sibling references
  console.log("Checking for cross-tenant contamination in dist/ and src/...");
  const forbiddenPatterns = siblings.flatMap((sib) => BRAND_PATTERNS[sib]);
  const violations = [];

  function checkText(filePath, content) {
    for (const pattern of forbiddenPatterns) {
      if (content.includes(pattern)) {
        violations.push({ file: filePath, pattern });
      }
    }
  }

  function scanDir(dir) {
    if (!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const full = path.join(dir, item.name);
      if (item.isDirectory()) {
        scanDir(full);
      } else if (item.isFile() && /\.(html|js|css|json|ts|tsx)$/.test(item.name)) {
        const content = fs.readFileSync(full, "utf8");
        checkText(path.relative(projectRoot, full), content);
      }
    }
  }

  scanDir(path.join(projectRoot, "dist"));
  scanDir(path.join(projectRoot, "src"));

  assert.equal(violations.length, 0, `Forbidden sibling patterns found: ${JSON.stringify(violations, null, 2)}`);
  console.log(`PASS 0 sibling references found across ${forbiddenPatterns.length} patterns`);

  // Write audit report
  const audit = {
    testedAt: new Date().toISOString(),
    project: currentId,
    isolatedFrom: siblings,
    homeOk: true,
    listingOk: true,
    detailOk: true,
    siblingViolations: violations.length,
    ok: true,
  };
  fs.mkdirSync(path.join(projectRoot, "build"), { recursive: true });
  fs.writeFileSync(path.join(projectRoot, "build", "isolation-audit.json"), JSON.stringify(audit, null, 2));

} finally {
  // Always restore renamed items
  for (const { original, temp } of renamedItems) {
    if (fs.existsSync(temp)) {
      console.log(`Restoring ${path.basename(temp)} -> ${path.basename(original)}`);
      fs.renameSync(temp, original);
    }
  }
}

console.log(`ISOLATION_AUDIT_EXIT=0: ${currentId} fully isolated and independent`);
