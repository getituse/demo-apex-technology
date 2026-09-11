# Site Configuration Guide

This guide explains how to customize and maintain **Apex Institute of Technology** without modifying core framework code or shared components.

All site-specific identity, content, theming, and page composition live under [`src/site/`](../src/site/).

---

## 1. Directory Overview

```
src/site/
├── config.ts              Site metadata, branding, terminology, theme preset & page routes
├── index.ts               Zod validation entrypoint exporting validated config & content
├── resource-catalogue.ts  Downloadable documents and editorial resources
├── page-templates.ts      Reusable page composition helpers
└── content/
    ├── index.ts           Aggregates all editorial and section content
    ├── editorial.ts       Leadership, stats, departments, FAQs, research labs, and values
    ├── sections.ts        Page section compositions and live collection bindings
    └── media.ts           Image galleries, hero banners, and media assets
```

---

## 2. Branding and Identity (`src/site/config.ts`)

Site identity and brand attributes are defined in `rawConfig.brand`:

```ts
brand: {
  name: "Apex Institute of Technology",
  shortName: "Apex Tech",
  tagline: "Advancing engineering innovation and digital leadership",
  logo: "/tenants/apex-technology/images/logo.svg",
  favicon: "/tenants/apex-technology/favicon.svg",
}
```

- **Assets:** Brand logos, icons, and illustrations reside in `public/tenants/apex-technology/`.
- **Favicons:** Supported in SVG (`favicon.svg`) and high-resolution PNG variants (32px, 180px, 192px, 512px) generated automatically at build time into `dist/`.

---

## 3. Terminology and Domain Vocabulary

To maintain strict modularity, shared components do not hardcode institutional terminology. Instead, terminology is configured in `rawConfig.terminology`:

```ts
terminology: {
  institution: "college",
  students: "students",
  admissions: "admissions",
  faculty: "faculty",
  campus: "campus",
}
```

Components and navigation read these values dynamically via `useTenant()` context.

---

## 4. Theming and Styling

The site uses semantic CSS-variable tokens driven by Tailwind CSS and a selected theme preset.

### Active Theme Preset

Defined in `rawConfig.theme`:

```ts
theme: {
  preset: "premium-university",
  overrides: {
    // Optional token overrides satisfying theme token schema
    // e.g. primary: "#612039"
  },
}
```

Available presets in `src/themes/theme-presets.ts`:

- `premium-university` (active for Apex Institute of Technology)
- `classic-academic`
- `modern-campus`
- `primary-school`
- `green-campus`
- `corporate-academy`

All presets pass WCAG 2.2 AA contrast requirements (checked via `npm run check:contrast`).

---

## 5. Managing Pages and Navigation

Pages and routes are declared in `rawConfig.pages`:

```ts
pages: {
  home: { path: "/", navLabel: "Home", enabled: true, seo: { ... } },
  about: { path: "/about", navLabel: "About", enabled: true, seo: { ... } },
  programs: { path: "/programs", navLabel: "Academics", enabled: true, seo: { ... } },
  admissions: { path: "/admissions", navLabel: "Admissions", enabled: true, seo: { ... } },
  newsEvents: { path: "/news-events", navLabel: "News & Events", enabled: true, seo: { ... } },
  contact: { path: "/contact", navLabel: "Contact", enabled: true, seo: { ... } },
  styleguide: { path: "/__styleguide", navLabel: "Styleguide", enabled: true },
}
```

- **Enabling/Disabling Pages:** Set `enabled: false` to disable a route. Disabled pages are automatically pruned from navigation, sitemaps, and static prerendering.
- **Navigation Labels:** Change `navLabel` to update the desktop and mobile navigation menus instantly.
- **SEO Metadata:** Each page accepts a title, description, keywords, and Open Graph image.

---

## 6. Authoring Content

Content lives in [`src/site/content/`](../src/site/content/) authored in TypeScript and validated against Zod schemas at build time:

1. **Editorial Content (`src/site/content/editorial.ts`):**
   - Leadership & faculty profiles (`leadership`)
   - Research & innovation statistics (`stats`)
   - Degree programs & departments (`programs`)
   - FAQs (`faqs`)
   - Mission and engineering focus (`values`, `mission`)

2. **Page Sections (`src/site/content/sections.ts`):**
   - Each enabled page references an array of section definitions (`HeroSection`, `FeatureGridSection`, `StatsSection`, `AccordionSection`, `CollectionSection`, `GallerySection`, etc.).
   - Sections support live collection bindings (e.g. `news`, `events`, `programs`, `downloads`).

3. **Media and Downloads (`src/site/content/media.ts` and `src/site/resource-catalogue.ts`):**
   - Gallery images with responsive dimensions, alt text, and captions.
   - Downloadable curriculum guides, research briefs, and admission prospectuses.

---

## 7. Build-Time Validation

All configuration and content are strictly validated by Zod at build time:

```bash
npm run typecheck
npm run check
```

Invalid configurations (such as a missing required field, broken contrast ratio, or an unclosed route) fail the build with actionable compile-time diagnostics.
