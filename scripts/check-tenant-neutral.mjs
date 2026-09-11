#!/usr/bin/env node
/**
 * Fails the build if a shared component leaks anything tenant-specific.
 *
 * This is the mechanical half of the white-label contract. The rule is stated five times
 * in the brief but a grep gate is what actually keeps it true: adding tenant #4 must never
 * require editing a component.
 *
 * Checks files under src/components/ and src/sections/ for:
 *   1. Tenant names
 *   2. Domain vocabulary that belongs in tenant `terminology` config
 *   3. Raw hex colours
 *   4. Tailwind palette colour classes (bg-blue-600 etc.)
 *
 * Usage: node scripts/check-tenant-neutral.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCANNED_DIRS = ["src/components", "src/sections"];
const EXTENSIONS = new Set([".ts", ".tsx", ".css"]);

const TENANT_NAMES = ["greenfield", "apex institute", "northstar"];

// These come from tenant `terminology` config, never from a component.
const DOMAIN_WORDS = ["school", "student", "admission", "faculty", "campus"];

// Tailwind's default palette. A shared component must use semantic tokens instead.
const PALETTE = [
  "slate",
  "gray",
  "zinc",
  "neutral",
  "stone",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
];

const RULES = [
  {
    id: "tenant-name",
    test: new RegExp(`\\b(${TENANT_NAMES.join("|")})\\b`, "i"),
    message: "tenant name — move it into tenant config",
  },
  {
    id: "domain-word",
    test: new RegExp(`\\b(${DOMAIN_WORDS.join("|")})s?\\b`, "i"),
    message: "domain word — read it from tenant `terminology` instead",
  },
  {
    id: "raw-hex",
    test: /#[0-9a-f]{3,8}\b/i,
    message: "raw hex colour — use a semantic token",
  },
  {
    id: "palette-class",
    test: new RegExp(
      `\\b(?:bg|text|border|ring|from|via|to|fill|stroke|shadow|outline|decoration|divide|accent|caret|placeholder)-(?:${PALETTE.join("|")})-\\d{2,3}\\b`,
    ),
    message: "Tailwind palette class — use a semantic token",
  },
];

/** Allows a deliberate exception on the line above, e.g. an SVG that must carry a literal. */
const ALLOW_MARKER = "tenant-neutral-ignore";

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return EXTENSIONS.has(path.extname(entry.name)) ? [full] : [];
  });
}

const violations = [];

for (const dir of SCANNED_DIRS) {
  for (const file of walk(path.join(ROOT, dir))) {
    const lines = fs.readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      if (line.includes(ALLOW_MARKER)) return;
      if (i > 0 && lines[i - 1]?.includes(ALLOW_MARKER)) return;
      for (const rule of RULES) {
        const match = rule.test.exec(line);
        if (match) {
          violations.push({
            file: path.relative(ROOT, file),
            line: i + 1,
            rule: rule.id,
            found: match[0],
            message: rule.message,
          });
        }
      }
    });
  }
}

const scannedCount = SCANNED_DIRS.reduce((n, d) => n + walk(path.join(ROOT, d)).length, 0);

if (violations.length === 0) {
  console.log(`tenant-neutral: OK (${scannedCount} files scanned)`);
  process.exit(0);
}

console.error(`tenant-neutral: ${violations.length} violation(s)\n`);
for (const v of violations) {
  console.error(`  ${v.file}:${v.line}  [${v.rule}] "${v.found}" — ${v.message}`);
}
console.error(
  `\nShared components must work for any tenant. If a literal is genuinely unavoidable,\n` +
    `add a "${ALLOW_MARKER}" comment on the line or the line above, with a reason.`,
);
process.exit(1);
