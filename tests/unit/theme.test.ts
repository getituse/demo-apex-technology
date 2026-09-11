import { describe, expect, it } from "vitest";

import { resolveTheme, themeToCss, themeToDeclarations } from "@/themes/apply-theme";
import { themePresets } from "@/themes/theme-presets";
import {
  COLOR_TOKENS,
  SCALAR_TOKENS,
  THEME_PRESET_NAMES,
  THEME_TOKENS,
  cssVariableName,
  type Theme,
} from "@/themes/theme-types";
import { SEMANTIC_TOKENS, THEME_PRESETS } from "@/config/tenant-schema";

describe("theme token vocabulary", () => {
  it("is the section 8 list, in order", () => {
    expect([...THEME_TOKENS]).toEqual([
      "background",
      "foreground",
      "surface",
      "surfaceElevated",
      "card",
      "cardForeground",
      "primary",
      "primaryForeground",
      "secondary",
      "secondaryForeground",
      "accent",
      "accentForeground",
      "muted",
      "mutedForeground",
      "border",
      "input",
      "ring",
      "success",
      "warning",
      "destructive",
      "headerBackground",
      "footerBackground",
      "footerForeground",
      "sectionTint",
      "radius",
      "shadowSm",
      "shadowMd",
      "shadowLg",
      "fontHeading",
      "fontBody",
    ]);
  });

  it("splits into colours and scalars with nothing lost or duplicated", () => {
    expect([...COLOR_TOKENS, ...SCALAR_TOKENS]).toEqual([...THEME_TOKENS]);
    expect(new Set(THEME_TOKENS).size).toBe(THEME_TOKENS.length);
  });

  it("is the same set the tenant schema validates overrides against", () => {
    expect([...SEMANTIC_TOKENS]).toEqual([...THEME_TOKENS]);
    expect([...THEME_PRESETS]).toEqual([...THEME_PRESET_NAMES]);
  });

  it("maps camelCase tokens to kebab-case custom properties", () => {
    expect(cssVariableName("surfaceElevated")).toBe("--surface-elevated");
    expect(cssVariableName("shadowSm")).toBe("--shadow-sm");
    expect(cssVariableName("background")).toBe("--background");
  });
});

describe("theme presets", () => {
  it("has all six presets and no others", () => {
    expect(Object.keys(themePresets).sort()).toEqual([...THEME_PRESET_NAMES].sort());
  });

  it.each(THEME_PRESET_NAMES)("%s defines every token exactly once", (name) => {
    const preset = themePresets[name];
    expect(Object.keys(preset).sort()).toEqual([...THEME_TOKENS].sort());
  });

  it.each(THEME_PRESET_NAMES)("%s has no empty token values", (name) => {
    for (const token of THEME_TOKENS) {
      expect(themePresets[name][token].trim()).not.toBe("");
    }
  });

  it.each(THEME_PRESET_NAMES)("%s states every colour as an H S%% L%% triple", (name) => {
    for (const token of COLOR_TOKENS) {
      expect(themePresets[name][token]).toMatch(/^-?[\d.]+ [\d.]+% [\d.]+%$/);
    }
  });

  it("gives each preset a distinct radius, so they are not one layout in six tints", () => {
    const radii = THEME_PRESET_NAMES.map((name) => themePresets[name].radius);
    expect(new Set(radii).size).toBe(THEME_PRESET_NAMES.length);
  });

  it("gives each preset a distinct primary and shadow ramp", () => {
    const primaries = THEME_PRESET_NAMES.map((name) => themePresets[name].primary);
    const shadows = THEME_PRESET_NAMES.map((name) => themePresets[name].shadowMd);
    expect(new Set(primaries).size).toBe(THEME_PRESET_NAMES.length);
    expect(new Set(shadows).size).toBe(THEME_PRESET_NAMES.length);
  });

  it("uses a serif heading stack only where the design system says it should", () => {
    expect(themePresets["classic-academic"].fontHeading).toMatch(/serif/);
    expect(themePresets["premium-university"].fontHeading).toMatch(/serif/);
    expect(themePresets["modern-campus"].fontHeading).not.toMatch(/\bui-serif\b/);
    expect(themePresets["corporate-academy"].fontHeading).not.toMatch(/\bui-serif\b/);
  });
});

describe("resolveTheme", () => {
  it("returns the preset untouched when there are no overrides", () => {
    expect(resolveTheme({ preset: "green-campus" })).toEqual(themePresets["green-campus"]);
  });

  it("merges a tenant override over the preset", () => {
    const resolved = resolveTheme({
      preset: "corporate-academy",
      overrides: { primary: "300 50% 30%", radius: "2rem" },
    });

    expect(resolved.primary).toBe("300 50% 30%");
    expect(resolved.radius).toBe("2rem");
    expect(resolved.accent).toBe(themePresets["corporate-academy"].accent);
  });

  it("does not mutate the preset it merged from", () => {
    const before = themePresets["modern-campus"].primary;
    resolveTheme({ preset: "modern-campus", overrides: { primary: "10 10% 10%" } });
    expect(themePresets["modern-campus"].primary).toBe(before);
  });

  it("ignores an override that is undefined or blank rather than emitting an empty var", () => {
    const resolved = resolveTheme({
      preset: "modern-campus",
      overrides: { primary: "   ", accent: undefined },
    });

    expect(resolved.primary).toBe(themePresets["modern-campus"].primary);
    expect(resolved.accent).toBe(themePresets["modern-campus"].accent);
  });

  it("still produces a complete theme after merging", () => {
    const resolved = resolveTheme({
      preset: "primary-school",
      overrides: { sectionTint: "0 0% 95%" },
    });
    expect(Object.keys(resolved).sort()).toEqual([...THEME_TOKENS].sort());
  });
});

describe("themeToCss", () => {
  it.each(THEME_PRESET_NAMES)(
    "serializes exact CSS values for %s including trimmed tenant overrides",
    (preset) => {
      const overrides = {
        primary: "  180 45% 22%  ",
        surfaceElevated: "  210 20% 98%  ",
        radius: "  1.25rem  ",
        fontHeading: '  "Fixture Heading", serif  ',
      };
      const expected = { ...themePresets[preset], ...overrides };
      const sheet = new CSSStyleSheet();
      sheet.insertRule(themeToCss(resolveTheme({ preset, overrides })), 0);
      expect(sheet.cssRules).toHaveLength(1);
      const rule = sheet.cssRules[0] as CSSStyleRule;
      expect(rule.selectorText).toBe(":root");
      expect(rule.style.length).toBe(THEME_TOKENS.length);
      for (const token of THEME_TOKENS) {
        // Derive names independently so a broken serializer/name helper cannot
        // produce the same wrong name on both sides of this assertion.
        const property = `--${token.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;
        expect(rule.style.getPropertyValue(property), property).toBe(expected[token].trim());
        expect(rule.style.getPropertyPriority(property), property).toBe("");
      }
    },
  );

  it("emits one declaration per token, on :root", () => {
    const css = themeToCss(themePresets["classic-academic"]);

    expect(css.startsWith(":root {")).toBe(true);
    expect(themeToDeclarations(themePresets["classic-academic"])).toHaveLength(THEME_TOKENS.length);
    for (const token of THEME_TOKENS) {
      expect(css).toContain(`${cssVariableName(token)}: `);
    }
  });

  it.each(THEME_PRESET_NAMES)("emits valid CSS for %s", (name) => {
    const css = themeToCss(themePresets[name]);
    const openBraces = (css.match(/\{/g) ?? []).length;
    const closeBraces = (css.match(/\}/g) ?? []).length;

    expect(openBraces).toBe(1);
    expect(closeBraces).toBe(1);
  });

  it("refuses a value that could break out of the declaration", () => {
    const hostile = {
      ...themePresets["modern-campus"],
      primary: "0 0% 0%; } body { display: none",
    } as Theme;

    expect(() => themeToCss(hostile)).toThrow(/unsafe in CSS/);
  });

  it("refuses a value containing a comment sequence", () => {
    const hostile = { ...themePresets["modern-campus"], fontBody: "Inter */" } as Theme;
    expect(() => themeToCss(hostile)).toThrow(/unsafe in CSS/);
  });

  it("refuses an empty value", () => {
    const empty = { ...themePresets["modern-campus"], accent: "  " } as Theme;
    expect(() => themeToCss(empty)).toThrow(/is empty/);
  });
});
