/**
 * WCAG 2.2 contrast for the theme presets.
 *
 * Shared by `scripts/check-contrast.mjs` and `tests/unit/theme-contrast.test.ts`, so
 * the CI gate and the test suite can never disagree about what passes.
 *
 * Thresholds come from the brief and are not negotiable: body text 4.5:1, large text
 * and non-text UI boundaries 3:1. When a pair fails, change the preset.
 */

export const THRESHOLDS = {
  body: 4.5,
  large: 3,
  ui: 3,
};

/**
 * Every pair worth checking, with the level its role demands.
 *
 * `accent` and `secondary` are not checked against `background`: they are fills whose
 * legibility is governed by their own foreground token, which is checked. `border` is
 * checked at the UI level against every surface it is drawn on, which is stricter than
 * WCAG 1.4.11 (that exempts purely decorative separators) and is a deliberate choice —
 * this design system prefers a visible hairline to a shadow.
 */
export const CONTRAST_PAIRS = [
  // Text on its surface.
  { foreground: "foreground", background: "background", level: "body" },
  { foreground: "foreground", background: "surface", level: "body" },
  { foreground: "foreground", background: "surfaceElevated", level: "body" },
  { foreground: "foreground", background: "sectionTint", level: "body" },
  { foreground: "foreground", background: "muted", level: "body" },
  { foreground: "foreground", background: "headerBackground", level: "body" },
  { foreground: "cardForeground", background: "card", level: "body" },
  { foreground: "footerForeground", background: "footerBackground", level: "body" },

  // Filled controls.
  { foreground: "primaryForeground", background: "primary", level: "body" },
  { foreground: "secondaryForeground", background: "secondary", level: "body" },
  { foreground: "accentForeground", background: "accent", level: "body" },
  // Section 8 has no `destructiveForeground`, so a filled destructive control reuses
  // `primaryForeground`. Checking it here makes that convention enforced, not assumed.
  { foreground: "primaryForeground", background: "destructive", level: "body" },

  // De-emphasised text, which is where contrast is usually lost.
  { foreground: "mutedForeground", background: "background", level: "body" },
  { foreground: "mutedForeground", background: "surface", level: "body" },
  { foreground: "mutedForeground", background: "card", level: "body" },
  { foreground: "mutedForeground", background: "muted", level: "body" },
  { foreground: "mutedForeground", background: "sectionTint", level: "body" },

  // Brand colour used as text: links and ghost buttons.
  { foreground: "primary", background: "background", level: "body" },
  { foreground: "primary", background: "card", level: "body" },
  { foreground: "primary", background: "sectionTint", level: "body" },

  // Status colours are used as text, not only as icons.
  { foreground: "success", background: "background", level: "body" },
  { foreground: "warning", background: "background", level: "body" },
  { foreground: "destructive", background: "background", level: "body" },
  { foreground: "destructive", background: "card", level: "body" },

  // Large text.
  { foreground: "secondary", background: "background", level: "large" },
  { foreground: "secondary", background: "card", level: "large" },

  // Non-text UI boundaries.
  { foreground: "border", background: "background", level: "ui" },
  { foreground: "border", background: "surface", level: "ui" },
  { foreground: "border", background: "card", level: "ui" },
  { foreground: "border", background: "sectionTint", level: "ui" },
  { foreground: "input", background: "background", level: "ui" },
  { foreground: "input", background: "surface", level: "ui" },
  { foreground: "input", background: "card", level: "ui" },
  { foreground: "ring", background: "background", level: "ui" },
  { foreground: "ring", background: "card", level: "ui" },
  { foreground: "ring", background: "sectionTint", level: "ui" },
];

/** Parses `"215 55% 22%"`. Throws rather than guessing, so a typo cannot pass silently. */
export function parseHsl(value) {
  const match = /^\s*(-?[\d.]+)\s+(-?[\d.]+)%\s+(-?[\d.]+)%\s*$/.exec(value);
  if (!match) {
    throw new Error(`Not an "H S% L%" triple: ${JSON.stringify(value)}`);
  }

  const hue = Number(match[1]);
  const saturation = Number(match[2]) / 100;
  const lightness = Number(match[3]) / 100;

  if (saturation < 0 || saturation > 1 || lightness < 0 || lightness > 1) {
    throw new Error(`Saturation and lightness must be 0-100%: ${JSON.stringify(value)}`);
  }
  return { hue, saturation, lightness };
}

/** Returns sRGB channels in 0..1. */
export function hslToRgb(value) {
  const { hue, saturation, lightness } = parseHsl(value);

  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const sector = (((hue % 360) + 360) % 360) / 60;
  const second = chroma * (1 - Math.abs((sector % 2) - 1));
  const offset = lightness - chroma / 2;

  let rgb;
  if (sector < 1) rgb = [chroma, second, 0];
  else if (sector < 2) rgb = [second, chroma, 0];
  else if (sector < 3) rgb = [0, chroma, second];
  else if (sector < 4) rgb = [0, second, chroma];
  else if (sector < 5) rgb = [second, 0, chroma];
  else rgb = [chroma, 0, second];

  return rgb.map((channel) => channel + offset);
}

/** WCAG 2.x relative luminance. */
export function relativeLuminance(value) {
  const [red, green, blue] = hslToRgb(value).map((channel) => {
    const clamped = Math.min(1, Math.max(0, channel));
    return clamped <= 0.03928 ? clamped / 12.92 : ((clamped + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

export function contrastRatio(foreground, background) {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Rounds down, so a 4.499 never displays as a passing 4.5. */
export function roundRatio(ratio) {
  return Math.floor(ratio * 100) / 100;
}

/** Checks one preset. Returns a row per pair, each with `passed`. */
export function auditPreset(presetName, theme) {
  return CONTRAST_PAIRS.map((pair) => {
    const required = THRESHOLDS[pair.level];
    const ratio = roundRatio(contrastRatio(theme[pair.foreground], theme[pair.background]));
    return {
      presetName,
      pair: `${pair.foreground} on ${pair.background}`,
      level: pair.level,
      required,
      ratio,
      passed: ratio >= required,
    };
  });
}

export function auditAllPresets(presets) {
  return Object.entries(presets).flatMap(([name, theme]) => auditPreset(name, theme));
}
