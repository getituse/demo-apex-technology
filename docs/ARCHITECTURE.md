# Architecture

A modern, accessible, white-label static website built with React Router v7 Framework Mode, Tailwind CSS v3, Radix UI, and Motion. There is no backend, no runtime server, and no database — every page is prerendered into static HTML, CSS, JavaScript, and static artifacts in `dist/`.

---

## 1. Layered data flow

```
src/site/config.ts                authored TypeScript, typed as TenantConfigInput
src/site/content/                 authored TypeScript, typed as TenantContentInput
                │
                ▼
src/site/index.ts                 tenantConfigSchema.parse / tenantContentSchema.parse
                │                 (module scope — invalid data fails the build)
                ▼
@/site                            imported directly by root and route modules
                │
                ▼
React Router v7 framework mode    ssr: false, appDirectory "src", prerender()
                │
                ▼
dist/                             static HTML/CSS/JS + artifacts
```

Every layer is build-time. Nothing in the shipped bundle reads a filesystem path, an environment variable, or a request header to decide what site it is.

### Validation is the boundary

[`src/site/index.ts`](../src/site/index.ts) parses configuration and editorial content at module scope:

```ts
export const config = tenantConfigSchema.parse(rawConfig);
export const content = tenantContentSchema.parse(rawContent);
```

Any Zod failure aborts `dev`, `build`, and prerender immediately. The schemas live in [`src/config/tenant-schema.ts`](../src/config/tenant-schema.ts), [`src/config/content-schema.ts`](../src/config/content-schema.ts), and [`src/config/form-config.ts`](../src/config/form-config.ts).

The schema deliberately contains **no `.default()`**. A missing field is a compile/build error rather than a silent fallback, keeping domain-specific words out of shared components. Cross-field `superRefine` rules additionally enforce that:

- `defaultLocale` is listed in `supportedLocales`.
- `features.announcementBar` cannot be true without an `announcement`.
- `pages.home` is enabled and mounted at `/`.
- Enabled page paths are unique.
- Every page-kind link in `navigation`, `utilityLinks`, `brand.primaryCta`, `brand.secondaryCta`, and `announcement.link` targets an **enabled** page.

---

## 2. The three hard separations

1. **Config and content never import components.**
   [`src/config/tenant-schema.ts`](../src/config/tenant-schema.ts) and [`src/config/content-schema.ts`](../src/config/content-schema.ts) import Zod, each other, [`src/lib/site-url.ts`](../src/lib/site-url.ts), [`src/config/form-config.ts`](../src/config/form-config.ts), [`src/themes/theme-types.ts`](../src/themes/theme-types.ts), and the section schema module [`src/sections/section-types.ts`](../src/sections/section-types.ts) — which is itself pure Zod, with no JSX and no React import. Nothing in the config layer reaches into a rendering module, so schemas can be loaded by build scripts and by [`react-router.config.ts`](../react-router.config.ts) without pulling in the application.

   The same layer keeps structure and content apart: the site schema owns brand, terminology, theme, pages, navigation, features, SEO, integrations, legal, and assets; the content schema owns the twelve editable collections — `news`, `events`, `programs`, `departments`, `people`, `testimonials`, `facilities`, `gallery`, `downloads`, `faqs`, `policies`, `stats` — plus the optional `pageSections` composition map. Collections that carry statistics, credentials, or attributed claims require `isDemoContent: boolean`.

2. **Components never import site data directly.**
   Site data (`config` and `content`) is imported by root and route modules ([`src/root.tsx`](../src/root.tsx), [`src/routes/tenant-page.tsx`](../src/routes/tenant-page.tsx), [`src/routes/tenant-detail.tsx`](../src/routes/tenant-detail.tsx), and [`src/routes/not-found.tsx`](../src/routes/not-found.tsx)). Components under [`src/components/`](../src/components) and [`src/sections/`](../src/sections) read config and content exclusively through [`src/lib/tenant/TenantProvider.tsx`](../src/lib/tenant/TenantProvider.tsx) or from props. Components stay testable against fixtures and remain decoupled.

   This is enforced mechanically: [`scripts/check-tenant-neutral.mjs`](../scripts/check-tenant-neutral.mjs) scans `src/components/` and `src/sections/` (`.ts`, `.tsx`, `.css`) for institutional names, the domain words _school_, _student_, _admission_, _faculty_, _campus_, raw hex colours, and Tailwind palette classes such as `bg-blue-600`. It runs as part of `npm run lint`.

3. **Themes are pure token records.**
   [`src/themes/theme-types.ts`](../src/themes/theme-types.ts) has no imports at all, and [`src/themes/theme-presets.ts`](../src/themes/theme-presets.ts) imports only types from it. A `Theme` is `{ readonly [K in ThemeTokenName]: string }` — 30 strings, no class names, no components, and no conditional logic. That allows [`scripts/check-contrast.mjs`](../scripts/check-contrast.mjs) to load presets directly via Node's type stripping, and makes themes swappable without editing a single component. See [docs/THEMING.md](THEMING.md).

---

## 3. Sections: discriminated union plus exhaustive registry

[`src/sections/section-types.ts`](../src/sections/section-types.ts) defines 36 per-section Zod object schemas combined by `z.discriminatedUnion("type", …)`. All of them extend a `.strict()` base carrying shared optional fields (`id`, `enabled`, `requiresPage`, `contentSource`, `variant`, `background`, `density`, `imageAlign`, `heading`, `eyebrow`, `body`, `actions`, `demoLabel`); collection sections narrow `variant` to `grid | list` and the hero narrows it to `split | editorial | collage`.

`SectionType` is derived from the union, and [`src/sections/section-registry.tsx`](../src/sections/section-registry.tsx) declares:

```ts
export type SectionRegistry = { [T in SectionType]: ComponentType<SectionComponentProps<T>> };
```

Adding a section schema without registering a component is a compile error, and each component must accept exactly its own discriminant's props.

Section-level refinements also reject a `contentSource` paired with an incompatible section type, reject bound sections that duplicate collection items, require three images for a `collage` hero and one otherwise, and reject duplicate item IDs; the array schema rejects duplicate section IDs.

[`src/routes/page-sections.ts`](../src/routes/page-sections.ts) resolves an authored section array for a page: it drops disabled sections, sections whose `requiresPage` is disabled, and form sections whose configured form (or `features.newsletterSignup`) is off. It then binds `contentSource` sections to live collection records — filtered through `contentSources`, with card actions resolved against the real route manifest so a card can never link to a route that does not exist.

---

## 4. Routing

[`src/routes/route-manifest.ts`](../src/routes/route-manifest.ts) builds one manifest from config plus content. It reserves every core page path (including disabled ones, so a detail route can never resurrect one), emits a `PageRoute` for each enabled page, then emits `DetailRoute`s for the five detail collections — `programs`, `departments`, `people`, `news`, `events` — whose parent page is enabled, whose `contentSources` entry is `"local"`, and whose `detailRoutes` entry is not explicitly disabled.

- **Detail bases.** `detailRoutes.<collection>.path` sets the base; when omitted the base falls back to the parent-relative path (`<parent>` for programs, `<parent>/<collection>` otherwise).
- **Aliases.** `detailRoutes.<collection>.aliases` produce additional routes that keep their own request path but carry `canonicalPath` pointing at the primary. Aliases are prerendered, excluded from card lists via `collectionRoutes()`, and excluded from the sitemap via `getIndexableRoutes()`.
- Slugs and bases are re-validated before interpolation, and conflicting paths throw.

One manifest drives all three consumers:

| Consumer                                                                | Uses                                                       |
| ----------------------------------------------------------------------- | ---------------------------------------------------------- |
| [`src/routes/configured-routes.ts`](../src/routes/configured-routes.ts) | route registration for [`src/routes.ts`](../src/routes.ts) |
| `prerender()` in [`react-router.config.ts`](../react-router.config.ts)  | `getPrerenderPaths()` — every path, aliases included       |
| [`src/routes/static-artifacts.ts`](../src/routes/static-artifacts.ts)   | sitemap — `getIndexableRoutes()` only                      |

Navigation, static output, and indexing cannot drift apart. Core pages render through `routes/tenant-page.tsx`, details through `routes/tenant-detail.tsx`, `/` through `routes/home.tsx`, and a catch-all `*` through `routes/not-found.tsx`. `routes/styleguide.tsx` is appended **only** when `NODE_ENV !== "production"`.

### Serialized `referenceTime`

[`src/routes/tenant-page.tsx`](../src/routes/tenant-page.tsx) returns `{ referenceTime: new Date().toISOString() }` from its `loader`. Prerendering serializes that instant into the static HTML, so initial hydration classifies upcoming versus past events exactly as the prerendered markup did. The `clientLoader` produces a fresh local snapshot for subsequent client navigation without any server request.

### Entry-only route transition

[`src/lib/motion/RouteTransition.tsx`](../src/lib/motion/RouteTransition.tsx) wraps the outlet in `AnimatePresence initial={false}` with an entry-only fade keyed on `location.pathname`; `useReducedMotion` skips the entrance entirely.

`AnimatePresence` retains a departing outlet for one render. Its route context is stale while router loader data already belongs to the destination, so [`src/routes/tenant-page.tsx`](../src/routes/tenant-page.tsx) guards with `useIsPresent()` and returns `null` when it is the departing render.

---

## 5. Head, metadata and static artifacts

- **Theme in `<head>`.** [`src/root.tsx`](../src/root.tsx) computes `themeToCss(resolveTheme(config.theme))` at module scope and renders it as an inline `<style>` after `<Links />`. It is present in the prerendered HTML before first paint — no effect hook, no class swap, and no flash of unthemed content.
- **JSON-LD.** [`src/routes/structured-data.ts`](../src/routes/structured-data.ts) returns a plain object, which `createRouteMeta` hands to React Router as a `"script:ld+json"` descriptor. React Router escapes script-closing characters when serializing it; no raw HTML is injected anywhere.
- **Fallback metadata.** The root `meta()` supplies default descriptors — including `robots: noindex,nofollow` for the static fallback — which child routes replace.
- **`buildEnd`.** [`react-router.config.ts`](../react-router.config.ts) normalises prerender output for the deployment base, then writes `sitemap.xml`, `robots.txt`, `manifest.webmanifest`, `_redirects`, `.nojekyll`, copies `favicon.svg`, derives PNG icons (`favicon-32.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`) from `assets.manifestIcon`, and writes `404.html` from the SPA fallback.

### One `siteUrl` drives every base

[`src/lib/site-url.ts`](../src/lib/site-url.ts) parses the validated `siteUrl` into an origin plus an optional lowercase kebab-case base path, and refuses credentials, encoding, query, fragment, or trailing slashes:

| Layer                  | Derivation                                                                   |
| ---------------------- | ---------------------------------------------------------------------------- |
| Vite `base`            | `siteBasePath(config.siteUrl)` in [`vite.config.ts`](../vite.config.ts)      |
| Router `basename`      | `siteBasePath(...)` in [`react-router.config.ts`](../react-router.config.ts) |
| Favicon/manifest links | `deploymentPath(...)` in [`src/root.tsx`](../src/root.tsx)                   |
| Canonical/OG/sitemap   | `absoluteSiteUrl(...)`                                                       |

---

## 6. Preview tooling that is not shipped

[`scripts/lib/static-preview.ts`](../scripts/lib/static-preview.ts) provides `staticPreview404()`, a Vite plugin used **only** when [`vite.config.ts`](../vite.config.ts) runs in preview mode (`isPreview`), alongside `appType: "mpa"`. It gives `vite preview` static-host 404 semantics — serving the built `404.html` for missing paths — and rejects traversal and reserved Windows device names. It is never part of a `dev` or `build` plugin list and never reaches `dist/`.

---

## 7. Banned

No backend. No runtime server of any kind — `ssr: false` and the server build is deleted after prerendering. No Redux, jQuery, Bootstrap, MUI, or CSS-in-JS. No `dangerouslySetInnerHTML` or raw HTML injection (ESLint rejects the former; body copy is `string[]`, one entry per paragraph). No API secrets in the frontend — `integrations` carries links only. Motion is imported from `motion/react`; `framer-motion` is banned.

---

## 8. Directory map

### `src/`

| Path                      | Contents                                                                                                                                                                                                                                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `root.tsx`                | HTML document, inline theme style, providers, error boundary, hydrate fallback                                                                                                                                                                                                                                |
| `routes.ts`               | Delegates to `createConfiguredRoutes()`                                                                                                                                                                                                                                                                       |
| `site/`                   | `config.ts` (site configuration), `index.ts` (Zod export), `content/` (editorial collections), `page-templates.ts`, `demo-media.ts`, `resource-catalogue.ts`                                                                                                                                                  |
| `config/`                 | `tenant-schema.ts`, `content-schema.ts`, `form-config.ts` (Zod schemas)                                                                                                                                                                                                                                       |
| `themes/`                 | `theme-types.ts` (token vocabulary), `theme-presets.ts` (presets), `apply-theme.ts`                                                                                                                                                                                                                           |
| `routes/`                 | `route-manifest.ts`, `configured-routes.ts`, `page-sections.ts`, `page-content.tsx`, `route-frame.tsx`, `home.tsx`, `tenant-page.tsx`, `tenant-detail.tsx`, `detail-content.tsx`, `not-found.tsx`, `collection-dates.ts`, `structured-data.ts`, `static-artifacts.ts`, `styleguide.tsx`, `SectionPreview.tsx` |
| `sections/`               | `section-types.ts`, `section-registry.tsx`, `SectionRenderer.tsx`, `section-layout.tsx`, `EditorialSections.tsx`, `CollectionSections.tsx`, `ImageGallerySection.tsx`, `GalleryViewer.tsx`, `GalleryEnhancementBoundary.tsx`, `EnquiryFormSection.tsx`                                                        |
| `components/ui/`          | Primitives: buttons, `Card`/`CardLink`, `Modal`, `Drawer`, `Accordion`, `Tabs`, `Select`, `Input`, `Textarea`, `FormField`, `Pagination`, `Notice`, `Badge`, `Breadcrumbs`, `Section`, `SectionHeader`, `Container`, `Stat`, empty/loading/error states                                                       |
| `components/layout/`      | `SiteLayout`, `SiteHeader`, `SiteFooter`, `AnnouncementBar`, `MobileContactBar`                                                                                                                                                                                                                               |
| `components/navigation/`  | `DesktopNav`, `MobileNav`, `NavItemLink`, `UtilityNav`, `SkipToContent`                                                                                                                                                                                                                                       |
| `components/cards/`       | Ten card components plus `ContentCardFrame`, `ContentCardView`, `card-date.ts`                                                                                                                                                                                                                                |
| `components/collections/` | `PaginatedCollection`                                                                                                                                                                                                                                                                                         |
| `components/forms/`       | `ConfiguredForm`                                                                                                                                                                                                                                                                                              |
| `components/media/`       | `Image.tsx` (`ResponsiveImage`)                                                                                                                                                                                                                                                                               |
| `lib/`                    | `site-url.ts`, `asset-url.ts`, `contact-actions.ts`, `placeholder-media.ts`, `cn.ts`, `motion/`, `tenant/TenantProvider.tsx`                                                                                                                                                                                  |
| `hooks/`                  | `use-dialog-return-focus.ts`, `use-route-announcement.tsx`                                                                                                                                                                                                                                                    |
| `styles/`                 | `app.css` (Tailwind layers, no `:root` token block), `fonts.css` (`@font-face`)                                                                                                                                                                                                                               |

### `scripts/`

| File                                                       | Purpose                                                                                                                  |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `project-cli.mjs`                                          | `typecheck`, `lint`, `format`, `format:check`, `check` without shell chains                                              |
| `check-tenant-neutral.mjs`                                 | Tenant neutrality gate over `src/components/` and `src/sections/`                                                        |
| `check-contrast.mjs`                                       | WCAG contrast gate over every preset                                                                                     |
| `lib/`                                                     | Shared helpers: contrast math, favicon PNG resize, prerender output normalisation, `static-preview.ts`                   |
| `generate-demo-media.mjs`, `generate-editorial-assets.mjs` | Offline original demo artwork and PDFs                                                                                   |
| `download-fonts.mjs`                                       | Maintenance-only font acquisition                                                                                        |
| `check-resource-access.mjs`                                | Dependency acquisition and network diagnostics                                                                           |
| `verify-*.mjs`                                             | Single-site audits: static output, responsive layouts, SEO, public pages, interactive features, editorial dev, base path |

Related documents: [docs/CONFIGURATION.md](CONFIGURATION.md), [docs/DEPLOYMENT.md](DEPLOYMENT.md), [docs/INTERACTIONS.md](INTERACTIONS.md), [docs/TESTING.md](TESTING.md), [docs/ENVIRONMENT.md](ENVIRONMENT.md), [docs/THEMING.md](THEMING.md).
