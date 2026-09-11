#!/usr/bin/env node
/**
 * Fails the build if any theme preset drops below the WCAG thresholds in the brief.
 *
 * The presets are TypeScript. Rather than parse them, this loads them directly through
 * Node's built-in type stripping — which works because `theme-presets.ts` and
 * `theme-types.ts` have no runtime imports at all, only erasable type imports.
 *
 * Usage: node scripts/check-contrast.mjs [--verbose]
 */
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { THRESHOLDS, auditAllPresets } from "./lib/contrast.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PRESETS_FILE = path.join(ROOT, "src", "themes", "theme-presets.ts");
const verbose = process.argv.includes("--verbose");

async function loadPresets() {
  try {
    const module = await import(pathToFileURL(PRESETS_FILE).href);
    return module.themePresets;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      [
        `check-contrast: could not load ${path.relative(ROOT, PRESETS_FILE)}.`,
        `  ${message}`,
        "",
        `  This needs Node's built-in TypeScript stripping (Node >= 22.18). Running ${process.version}.`,
      ].join("\n"),
    );
    process.exit(1);
  }
}

const presets = await loadPresets();
const results = auditAllPresets(presets);
const failures = results.filter((result) => !result.passed);

if (verbose) {
  let currentPreset = "";
  for (const result of results) {
    if (result.presetName !== currentPreset) {
      currentPreset = result.presetName;
      console.log(`\n${currentPreset}`);
    }
    const mark = result.passed ? "ok  " : "FAIL";
    console.log(
      `  ${mark} ${result.ratio.toFixed(2).padStart(6)}:1  (needs ${result.required})  ${result.pair}`,
    );
  }
  console.log("");
}

if (failures.length > 0) {
  console.error(`\ncontrast: ${failures.length} pair(s) below threshold\n`);
  for (const failure of failures) {
    console.error(
      `  ${failure.presetName}: ${failure.pair}` +
        ` — ${failure.ratio.toFixed(2)}:1, needs ${failure.required}:1 (${failure.level})`,
    );
  }
  console.error(
    "\nFix the preset, never the threshold." +
      ` Targets: body ${THRESHOLDS.body}:1, large text ${THRESHOLDS.large}:1, UI ${THRESHOLDS.ui}:1.\n`,
  );
  process.exit(1);
}

const presetCount = Object.keys(presets).length;
console.log(`contrast: OK (${results.length} pairs across ${presetCount} presets)`);
