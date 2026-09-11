import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { rawConfig as config } from "../src/site/config.ts";
import { THEME_TOKENS, cssVariableName } from "../src/themes/theme-types.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const id = config.id;
const dist = path.join(root, "dist");

assert(fs.existsSync(dist), `${id}: dist directory missing. Run build first.`);
const html = fs.readFileSync(path.join(dist, "index.html"), "utf8");
const assets = path.join(dist, "assets");
const js = fs
  .readdirSync(assets)
  .filter((file) => file.endsWith(".js"))
  .map((file) => fs.readFileSync(path.join(assets, file), "utf8"))
  .join("");

assert(html.includes(config.brand.name), `${id}: tenant name absent`);
const themeRule = html.match(/:root\s*\{([^}]+)\}/)?.[1] ?? "";
assert.equal(
  (themeRule.match(/--[a-z-]+:/g) ?? []).length,
  THEME_TOKENS.length,
  `${id}: theme declarations`,
);
for (const token of THEME_TOKENS)
  assert(themeRule.includes(`${cssVariableName(token)}:`), `${id}: ${token} missing`);

assert(fs.existsSync(path.join(dist, "favicon.svg")), `${id}: root favicon missing`);
assert(
  fs.existsSync(path.join(dist, "tenants", id, "favicon.svg")),
  `${id}: tenant favicon missing`,
);
assert(!fs.existsSync(path.join(root, "build", "server")), `${id}: server build remains`);
assert(!html.includes("__styleguide") && !js.includes("__styleguide"), `${id}: dev route leaked`);
assert(!js.includes("Preview a preset"), `${id}: preview UI leaked`);

// Strengthened sibling absence assertion: no other brand, tenant id or asset path appears anywhere in the output
const SIBLINGS = [
  { id: "greenfield-school", name: "Greenfield International School" },
  { id: "apex-technology", name: "Apex Institute of Technology" },
  { id: "northstar-academy", name: "Northstar Business Academy" },
].filter((sibling) => sibling.id !== id);

for (const sibling of SIBLINGS) {
  assert(!html.includes(sibling.name), `${id}: ${sibling.id} brand name leaked in HTML`);
  assert(!html.includes(sibling.id), `${id}: ${sibling.id} tenant id leaked in HTML`);
  assert(!js.includes(sibling.name), `${id}: ${sibling.id} brand name leaked in JS`);
  assert(!js.includes(sibling.id), `${id}: ${sibling.id} tenant id leaked in JS`);
  assert(!js.includes(`/tenants/${sibling.id}`), `${id}: ${sibling.id} asset path leaked in JS`);
  assert(
    !fs.existsSync(path.join(dist, "tenants", sibling.id)),
    `${id}: ${sibling.id} public assets shipped`,
  );
}

// Full-dist recursive inventory check to ensure no file path contains a sibling id
function checkNoSiblingPaths(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    for (const sibling of SIBLINGS) {
      assert(
        !entry.name.includes(sibling.id),
        `${id}: file or directory ${full} contains sibling id ${sibling.id}`,
      );
    }
    if (entry.isDirectory()) {
      checkNoSiblingPaths(full);
    }
  }
}
checkNoSiblingPaths(dist);

console.log(
  `PASS ${id}: static HTML, ${THEME_TOKENS.length} tokens, favicon; no server, styleguide, or sibling brands/assets`,
);
console.log("OUTPUT_AUDIT_EXIT=0");
