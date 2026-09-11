# Theming and design tokens

A semantic CSS-variable token system. The palette is defined in TypeScript, contrast-verified at
build time, converted to CSS custom properties before first paint, and mapped to Tailwind utility
classes. Components use semantic class names exclusively — they never use raw hex values or Tailwind
palette classes such as `blue-600`.

---

## 1. The 30 tokens

A theme is an exhaustive record of **30 tokens** defined in [`src/themes/theme-types.ts`](../src/themes/theme-types.ts):

| Token                   | Semantic role                                                                                  |
| ----------------------- | ---------------------------------------------------------------------------------------------- |
| `background`            | Default page and container background                                                          |
| `foreground`            | Primary text colour on default background                                                      |
| `card`                  | Background for cards, panels and floating containers                                           |
| `cardForeground`        | Primary text colour inside cards and panels                                                    |
| `primary`               | Brand primary — main CTA background, active states, key emphasis                               |
| `primaryForeground`     | Legible text colour when placed on `primary`                                                   |
| `secondary`             | Secondary interactive elements and subtler badges                                              |
| `secondaryForeground`   | Text colour on `secondary`                                                                     |
| `muted`                 | De-emphasised surfaces, zebra stripes, subtle wells                                            |
| `mutedForeground`       | Secondary text: captions, timestamps, placeholder copy, helper text                            |
| `accent`                | Highlight colour for tags, chips, tertiary emphasis                                            |
| `accentForeground`      | Text on `accent` surfaces                                                                      |
| `destructive`           | Error states, dangerous actions, validation failure icons                                      |
| `destructiveForeground` | Text on `destructive` backgrounds                                                              |
| `border`                | Standard hairline borders, dividers, card outlines                                             |
| `input`                 | Border colour for form inputs and textareas in rest state                                      |
| `ring`                  | Visible keyboard focus ring (`ring-2 ring-offset-2`)                                           |
| `radius`                | Corner radius token: `0` (none), `0.375rem` (subtle), `0.5rem` (standard), `0.75rem` (rounded) |
| `fontSans`              | Primary body font-family stack                                                                 |
| `fontHeading`           | Distinctive heading font-family stack                                                          |
| `headerBg`              | Sticky/fixed header background                                                                 |
| `headerFg`              | Navigation links and branding text inside the header                                           |
| `footerBg`              | Site footer background (often darker or higher contrast)                                       |
| `footerFg`              | Primary text and links inside the site footer                                                  |
| `heroBg`                | Hero section background                                                                        |
| `heroFg`                | Hero heading, copy and element colour                                                          |
| `sectionTint`           | Subtle alternative section background for rhythm                                               |
| `badgeBg`               | Background for metadata chips and status pills                                                 |
| `badgeFg`               | Text colour inside metadata chips                                                              |
| `surfaceElevated`       | Floating dropdowns, dialogs, drawers, popovers                                                 |

Every token is required. The type `Theme` is `{ readonly [K in ThemeTokenName]: string }`: no token may be omitted or undefined.

---

## 2. Active theme and presets

Apex Institute of Technology uses the **`premium-university`** theme preset configured in [`src/site/config.ts`](../src/site/config.ts):

```ts
export const rawConfig: TenantConfigInput = {
  theme: {
    preset: "premium-university",
  },
  // ...
};
```

### Available presets

Six presets are authored in [`src/themes/theme-presets.ts`](../src/themes/theme-presets.ts):

- `premium-university` — Rich burgundy (`#722f37`), warm stone neutrals (`#faf8f5`), elegant typography.
- `classic-academic` — Traditional navy (`#1e3a8a`) and warm ivory tones.
- `modern-campus` — Fresh slate-cyan tones with high contrast.
- `primary-school` — Cheerful amber and teal tones for early-years education.
- `green-campus` — Deep forest green and emerald tones.
- `corporate-academy` — Professional charcoal and steel-blue tones.

### Custom token overrides

Any token can be overridden in [`src/site/config.ts`](../src/site/config.ts) under `theme.overrides`:

```ts
theme: {
  preset: "premium-university",
  overrides: {
    sectionTint: "#f5f2ee",
  },
}
```

`overrides` is strictly typed. Any typo causes an immediate build failure.

---

## 3. From tokens to CSS before first paint

[`src/root.tsx`](../src/root.tsx) computes `themeToCss(resolveTheme(config.theme))` at module scope and renders it as an inline `<style>` inside `<head>`:

```html
<style>
  :root { --background: #faf8f5; --foreground: #1c1917; ... }
</style>
```

- **Zero flash of unthemed content (FOUC):** The variables are in the static HTML before the first render or stylesheet execution.
- **Unlayered precedence:** The inline `:root` rule wins over Tailwind's `@layer base` resets.
- **Tailwind integration:** [`tailwind.config.ts`](../tailwind.config.ts) maps semantic utilities to these variables:

```ts
colors: {
  background: "var(--background)",
  foreground: "var(--foreground)",
  primary: {
    DEFAULT: "var(--primary)",
    foreground: "var(--primaryForeground)",
  },
  // ...
}
```

---

## 4. Typography and self-hosted fonts

The visual identity pairs **Playfair Display** (headings) with **Source Sans 3** (body text).

Fonts are self-hosted in `public/fonts/` as variable WOFF2 subsets:

- No third-party font CDNs are contacted at runtime.
- Defined in [`src/styles/fonts.css`](../src/styles/fonts.css) with `font-display: swap`.
- System font fallbacks are included in every stack.

---

## 5. Contrast verification

Every token combination must satisfy **WCAG 2.2 AA**:

- Normal text (under 18pt / 24px regular, or under 14pt / 18.5px bold): **minimum 4.5:1** contrast ratio.
- Large text (≥18pt or ≥14pt bold): **minimum 3:1** contrast ratio.
- UI components and focus rings: **minimum 3:1** against adjacent backgrounds.

Run the contrast gate across all presets:

```bash
npm run check:contrast
```

---

## 6. What this system does not do

- **No runtime theme switching in production:** The theme is prerendered at build time for optimal performance and zero client layout shift.
- **No unlabelled sample claims:** Attributed claims and metrics require `isDemoContent: true`.
- **No arbitrary color utility classes:** Components use semantic tokens, never raw hex or ad-hoc Tailwind colors.

Related documents: [docs/CONFIGURATION.md](CONFIGURATION.md), [docs/ARCHITECTURE.md](ARCHITECTURE.md), [design-system/MASTER.md](../design-system/MASTER.md).
