import { themePresets } from "./theme-presets";
import {
  THEME_TOKENS,
  cssVariableName,
  type Theme,
  type ThemePresetName,
  type ThemeTokenName,
} from "./theme-types";

/**
 * Turns a tenant's `theme` config into CSS custom properties.
 *
 * The output is inlined into `<head>` by `src/root.tsx`, so it is present in the
 * prerendered HTML before the first paint. There is no effect hook and no class
 * swap on mount, which is what makes a flash of unthemed content impossible.
 */

export interface ThemeSelection {
  preset: ThemePresetName;
  overrides?: Partial<Record<ThemeTokenName, string>> | undefined;
}

export function resolveTheme(selection: ThemeSelection): Theme {
  const preset = themePresets[selection.preset];
  if (!selection.overrides) return preset;

  const merged: Record<string, string> = { ...preset };
  for (const token of THEME_TOKENS) {
    const override = selection.overrides[token];
    if (typeof override === "string" && override.trim() !== "") {
      merged[token] = override;
    }
  }
  return merged as Theme;
}

/**
 * Values are interpolated into a stylesheet, so anything that could terminate a
 * declaration or open a new rule is refused. Tenant configs are repo-owned rather
 * than user input, but this is the one place theme data becomes executable CSS.
 */
const UNSAFE_IN_CSS_VALUE = /[;{}<>\\@]|\/\*|\*\//;

function assertSafeValue(token: ThemeTokenName, value: string): void {
  if (value.trim() === "") {
    throw new Error(`Theme token "${token}" is empty.`);
  }
  if (UNSAFE_IN_CSS_VALUE.test(value)) {
    throw new Error(`Theme token "${token}" contains characters that are unsafe in CSS.`);
  }
}

export function themeToDeclarations(theme: Theme): string[] {
  return THEME_TOKENS.map((token) => {
    const value = theme[token];
    assertSafeValue(token, value);
    return `${cssVariableName(token)}: ${value.trim()};`;
  });
}

/** A complete `:root { ... }` rule. Unlayered, so it wins over the `@layer base` reset. */
export function themeToCss(theme: Theme): string {
  return `:root {\n  ${themeToDeclarations(theme).join("\n  ")}\n}`;
}

/** Used by the dev-only styleguide preview switcher. Never runs in production. */
export function applyThemeToElement(theme: Theme, element: HTMLElement): void {
  // Validate and prepare the entire theme before touching the element. A bad value
  // late in the token list must not leave a partially applied preview behind.
  const declarations = THEME_TOKENS.map((token) => {
    const value = theme[token];
    assertSafeValue(token, value);
    return [cssVariableName(token), value.trim()] as const;
  });

  for (const [property, value] of declarations) {
    element.style.setProperty(property, value);
  }
}
