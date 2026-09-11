/**
 * The semantic token vocabulary — section 8 of the brief, in the brief's order.
 *
 * This module owns the list. `src/config/tenant-schema.ts` imports it, so a tenant's
 * `theme.overrides` keys and a preset's keys can never drift apart.
 *
 * It has **no imports at all**, deliberately: `scripts/check-contrast.mjs` loads this
 * file and `theme-presets.ts` directly through Node's type stripping, which only works
 * when nothing needs module resolution at runtime.
 */

/** Tokens whose value is an HSL triple, `"H S% L%"`, ready for `hsl(var(--x) / <alpha>)`. */
export const COLOR_TOKENS = [
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
] as const;

/** Tokens whose value is a length, shadow or font stack rather than a colour. */
export const SCALAR_TOKENS = [
  "radius",
  "shadowSm",
  "shadowMd",
  "shadowLg",
  "fontHeading",
  "fontBody",
] as const;

export const THEME_TOKENS = [...COLOR_TOKENS, ...SCALAR_TOKENS] as const;

export type ColorTokenName = (typeof COLOR_TOKENS)[number];
export type ScalarTokenName = (typeof SCALAR_TOKENS)[number];
export type ThemeTokenName = (typeof THEME_TOKENS)[number];

/**
 * Exhaustive by construction. A mapped type over the union means adding a name to
 * `COLOR_TOKENS` or `SCALAR_TOKENS` is a compile error in all six presets until each
 * one fills it in — and an object literal annotated with it cannot carry extra keys.
 */
export type Theme = { readonly [K in ThemeTokenName]: string };

export const THEME_PRESET_NAMES = [
  "classic-academic",
  "modern-campus",
  "primary-school",
  "premium-university",
  "green-campus",
  "corporate-academy",
] as const;

export type ThemePresetName = (typeof THEME_PRESET_NAMES)[number];

/** Adding a preset name breaks this record until the preset exists. */
export type ThemePresetMap = { readonly [K in ThemePresetName]: Theme };

/** `surfaceElevated` -> `--surface-elevated`. */
export function cssVariableName(token: ThemeTokenName): string {
  return `--${token.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;
}
