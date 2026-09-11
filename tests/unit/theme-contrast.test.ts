import { describe, expect, it } from "vitest";

import {
  CONTRAST_PAIRS,
  THRESHOLDS,
  auditAllPresets,
  auditPreset,
  contrastRatio,
} from "../../scripts/lib/contrast.mjs";
import { themePresets } from "@/themes/theme-presets";
import { COLOR_TOKENS, THEME_PRESET_NAMES } from "@/themes/theme-types";
import { resolveTheme } from "@/themes/apply-theme";
import { config } from "@/site";

describe("tenant effective themes", () => {
  // The script audits presets through Node type stripping and cannot import a
  // tenant config, so overridden tokens are only covered here.
  it("clears every threshold after its own overrides", () => {
    const results = auditPreset(config.id, resolveTheme(config.theme));
    expect(results.length).toBe(CONTRAST_PAIRS.length);
    expect(results.filter((result) => !result.passed)).toEqual([]);
  });

  it("actually exercises an override rather than the bare preset", () => {
    const testTheme = resolveTheme({
      ...config.theme,
      overrides: { primary: "142 76% 36%" },
    });
    expect(testTheme.primary).toBe("142 76% 36%");
  });
});

describe("contrast maths", () => {
  it("agrees with the two ratios everyone knows", () => {
    // Black on white is the WCAG maximum.
    expect(contrastRatio("0 0% 0%", "0 0% 100%")).toBeCloseTo(21, 5);
    // A colour against itself has no contrast at all.
    expect(contrastRatio("219 80% 34%", "219 80% 34%")).toBeCloseTo(1, 5);
  });

  it("matches the published ratio for #767676 on white, the classic 4.5:1 boundary", () => {
    // #767676 is HSL(0 0% 46.3%) and is the canonical minimum grey for body text.
    expect(contrastRatio("0 0% 46.3%", "0 0% 100%")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("0 0% 48%", "0 0% 100%")).toBeLessThan(4.5);
  });

  it("is symmetric", () => {
    expect(contrastRatio("215 40% 12%", "40 30% 97%")).toBeCloseTo(
      contrastRatio("40 30% 97%", "215 40% 12%"),
      10,
    );
  });

  it("rejects a value that is not an H S% L% triple", () => {
    expect(() => contrastRatio("#ffffff", "0 0% 0%")).toThrow(/H S% L%/);
    expect(() => contrastRatio("rgb(0,0,0)", "0 0% 0%")).toThrow(/H S% L%/);
    expect(() => contrastRatio("0 0% 0%", "220 50%")).toThrow(/H S% L%/);
  });
});

describe("contrast pair list", () => {
  it("only references colour tokens", () => {
    const colorTokens = new Set<string>(COLOR_TOKENS);
    for (const pair of CONTRAST_PAIRS) {
      expect(colorTokens.has(pair.foreground)).toBe(true);
      expect(colorTokens.has(pair.background)).toBe(true);
    }
  });

  it("uses only the three documented levels", () => {
    for (const pair of CONTRAST_PAIRS) {
      expect(Object.keys(THRESHOLDS)).toContain(pair.level);
    }
  });

  it("holds the thresholds the brief specifies", () => {
    expect(THRESHOLDS.body).toBe(4.5);
    expect(THRESHOLDS.large).toBe(3);
    expect(THRESHOLDS.ui).toBe(3);
  });

  it("contains no duplicate pairs", () => {
    const keys = CONTRAST_PAIRS.map((pair) => `${pair.foreground}|${pair.background}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("preset contrast", () => {
  it.each(THEME_PRESET_NAMES)("%s passes every pair", (name) => {
    const failures = auditPreset(name, themePresets[name]).filter((result) => !result.passed);

    expect(
      failures.map((failure) => `${failure.pair}: ${failure.ratio}:1 needs ${failure.required}:1`),
    ).toEqual([]);
  });

  it("checks every preset, not just the ones that happen to pass", () => {
    const results = auditAllPresets(themePresets);
    expect(results).toHaveLength(CONTRAST_PAIRS.length * THEME_PRESET_NAMES.length);
    expect(results.every((result) => result.passed)).toBe(true);
  });

  it("actually fails a preset that is too low — the gate is not vacuous", () => {
    const tooPale = { ...themePresets["modern-campus"], mutedForeground: "217 16% 75%" };
    const failures = auditPreset("too-pale", tooPale).filter((result) => !result.passed);

    expect(failures.length).toBeGreaterThan(0);
    expect(failures.some((failure) => failure.pair.startsWith("mutedForeground"))).toBe(true);
  });
});
