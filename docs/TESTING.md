# Testing the static site

Comprehensive testing strategy for Apex Institute of Technology across unit, component, end-to-end, and accessibility layers.

---

## 1. Test commands

```bash
# Run unit and component test suites (Vitest)
npm run test

# Run end-to-end browser tests and axe accessibility scans (Playwright)
npm run test:e2e

# Run full quality gate (format, lint, neutrality gate, typecheck, contrast, tests)
npm run check

# Audit WCAG 2.2 AA contrast compliance across theme presets
npm run check:contrast

# Lint codebase and enforce tenant neutrality in shared components
npm run lint

# Typecheck TypeScript source
npm run typecheck
```

---

## 2. Unit and component coverage

Vitest runs with jsdom environment for component tests and Node environment for unit tests. Total: **1049 tests across 38 test files**.

| Area                         | Covered behaviors                                       | Test files                                                                                                                                                                                                                                        |
| ---------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Site configuration & schemas | Zod validation, navigation links, unique page paths     | [`tests/unit/tenant-config.test.ts`](../tests/unit/tenant-config.test.ts), [`tests/unit/public-routes.test.ts`](../tests/unit/public-routes.test.ts)                                                                                              |
| SEO & metadata               | Canonical URLs, sitemap generation, JSON-LD graphs      | [`tests/unit/seo-output.test.ts`](../tests/unit/seo-output.test.ts), [`tests/unit/site-url.test.ts`](../tests/unit/site-url.test.ts), [`tests/unit/detail-route-config.test.ts`](../tests/unit/detail-route-config.test.ts)                       |
| Theming & contrast           | 30 tokens, CSS conversion, WCAG math                    | [`tests/unit/theme.test.ts`](../tests/unit/theme.test.ts), [`tests/unit/theme-contrast.test.ts`](../tests/unit/theme-contrast.test.ts)                                                                                                            |
| Sections & composition       | 36 section schemas, bound collections, feature flags    | [`tests/unit/sections.test.ts`](../tests/unit/sections.test.ts), [`tests/unit/page-compositions.test.ts`](../tests/unit/page-compositions.test.ts), [`tests/unit/interactive-integration.test.ts`](../tests/unit/interactive-integration.test.ts) |
| Collections & dates          | Sorting, upcoming vs past boundaries, reference time    | [`tests/unit/collection-dates.test.ts`](../tests/unit/collection-dates.test.ts)                                                                                                                                                                   |
| Navigation & focus           | Desktop dropdowns, mobile drawer, Tab traversal, Escape | [`tests/component/navigation.test.tsx`](../tests/component/navigation.test.tsx), [`tests/component/focus-regressions.test.tsx`](../tests/component/focus-regressions.test.tsx)                                                                    |
| UI primitives                | Button vs Link semantics, Accordion keyboard control    | [`tests/component/primitives.test.tsx`](../tests/component/primitives.test.tsx)                                                                                                                                                                   |
| Forms                        | Client Zod validation, error summary, polite status     | [`tests/component/configured-form.test.tsx`](../tests/component/configured-form.test.tsx), [`tests/unit/form-config.test.ts`](../tests/unit/form-config.test.ts)                                                                                  |
| Route transitions            | Outlet fade, announcer live region, heading focus       | [`tests/component/route-transition.test.tsx`](../tests/component/route-transition.test.tsx)                                                                                                                                                       |

---

## 3. End-to-end testing (Playwright)

[`playwright.config.ts`](../playwright.config.ts) defines two projects on port **5412**:

- `apex-technology-desktop`: 1440 × 960 viewport
- `apex-technology-mobile`: 360 × 800 viewport

The web server starts Vite preview with `--host 127.0.0.1 --port 5412 --strictPort --outDir dist`. The test lifecycle runs `npm run build` prior to starting tests.

Total: **24 tests** covering:

- Home page branding, raw prerendered HTML, and CSS tokens
- Desktop, dropdown, and mobile navigation interactions
- Tab trap boundaries and Escape return focus in dialogs
- Client-side form validation and accessible error announcements
- Full-page automated axe accessibility scans on six key routes (home, about, programs, program detail, news/events, contact)
- 404 error page recovery

---

## 4. Verification audits

These drive Chromium and output reports under `build/`:

- [`scripts/verify-static-output.mjs`](../scripts/verify-static-output.mjs) — Static HTML files, theme variables, asset isolation
- [`scripts/verify-responsive.mjs`](../scripts/verify-responsive.mjs) — Responsive audit across 7 viewports (360px–1440px), 200% zoom, 200% text scale
- [`scripts/verify-seo-output.mjs`](../scripts/verify-seo-output.mjs) — Static SEO, canonical tags, JSON-LD, sitemap
- [`scripts/verify-public-pages.mjs`](../scripts/verify-public-pages.mjs) — Route transitions, focus management, 404 recovery
- [`scripts/verify-interactive-features.mjs`](../scripts/verify-interactive-features.mjs) — Form submissions, listing controls, gallery lightbox

Related documents: [docs/ACCESSIBILITY.md](ACCESSIBILITY.md), [docs/CONFIGURATION.md](CONFIGURATION.md), [docs/ENVIRONMENT.md](ENVIRONMENT.md).
