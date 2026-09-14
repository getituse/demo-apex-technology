# AGENTS.md

Operating manual and living record for Apex Institute of Technology. **Auto-loaded into every Copilot conversation here.**

> **Maintenance is mandatory.** This file is updated at the end of every task and after every bug fix.
> See [Update protocol](#update-protocol) at the bottom. If you finish work and this file is stale, the work is not finished.

---

## 1. Project

Static website for **Apex Institute of Technology**, a modern, accessible, fully responsive college and research institution site built with React Router v7 Framework Mode (prerendered static HTML and assets), Tailwind CSS v3, Radix UI, and Motion.

There is **no backend, no runtime server, and no database**. Every page is prerendered to static HTML and assets at build time into `dist/`, deployable to any static host or CDN.

- **Institution:** Apex Institute of Technology
- **Type:** `college`
- **Active Theme:** `premium-university`
- **Local Dev/Preview Port:** `5412`
- **Prerendered Routes:** 66 static routes

**Tenant neutrality principle:** Institutional identity, brand colors, terminology, navigation, enabled pages, SEO, and content come strictly from [`src/site/config.ts`](src/site/config.ts) and [`src/site/content/`](src/site/content/). Shared UI components under `src/components/` and `src/sections/` remain completely tenant-neutral and receive site data exclusively via `TenantProvider` context.

---

## 2. Standing documents

Read these before acting. They are inputs, not background reading.

| File                                               | Role                                                                                             |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| [docs/CONFIGURATION.md](docs/CONFIGURATION.md)     | How to change branding, terminology, theme, pages, forms, and editorial content.                 |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)       | System architecture, prerender pipeline, component boundaries, and data flow.                    |
| [docs/THEMING.md](docs/THEMING.md)                 | Semantic CSS-variable token system (30 tokens), presets, and typography.                         |
| [docs/CONTENT-GUIDE.md](docs/CONTENT-GUIDE.md)     | Content schemas, twelve collections, section composition, and media authoring.                   |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)           | Static hosting guide, domain configuration, SEO artifacts, and subpaths.                         |
| [docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md)     | WCAG 2.2 AA accessibility contracts, landmarks, keyboard focus, and screen reader announcements. |
| [docs/TESTING.md](docs/TESTING.md)                 | Unit, component, and E2E testing strategies, fixtures, and verification scripts.                 |
| [docs/INTERACTIONS.md](docs/INTERACTIONS.md)       | Configured forms, local pagination, filtering, and gallery lightbox behavior.                    |
| [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md)         | Machine capabilities, dependency acquisition workflows, and platform notes.                      |
| [docs/ISOLATION.md](docs/ISOLATION.md)             | Standalone verification and repository independence.                                             |
| [design-system/MASTER.md](design-system/MASTER.md) | Visual design system reference and guidelines.                                                   |
| [resolveerror.md](resolveerror.md)                 | Verified fixes for errors already hit on this machine. **Consult on any tooling failure.**       |

_Note:_ The original multi-tenant engine specifications (`complete_details.md`, `prompts.md`, `IMPLEMENTATION_PLAN.md`, `split-prompts.md`) are archived at the container root.

---

## 3. Hard rules

**TypeScript**

- Strict mode, `noUncheckedIndexedAccess`. No `any` unless an external library forces it — then a one-line comment naming the library.
- Pin `typescript@5`. TS 7.x breaks typescript-eslint's peer range. Never `--legacy-peer-deps`.

**Tenant neutrality**

- No file under `src/components/` or `src/sections/` may contain a tenant name, or the literals _school_, _student_, _admission_, _faculty_, _campus_. Those words come from site `terminology` config.
- Enforced by `scripts/check-tenant-neutral.mjs`, wired into `npm run lint`. Do not weaken it.

**Cross-repository parity policy**

- The shared engine directories (`src/components/`, `src/sections/`, `src/routes/`, `src/lib/`, `src/themes/`, `src/hooks/`, `src/styles/`, `src/config/`, `scripts/`, `public/fonts/`, and `src/root.tsx`, `src/routes.ts`) are **150 files byte-identical** across the three standalone repositories.
- A fix or modification to any shared engine component or script in one repository **must be applied to all three repositories**.
- `node scripts/engine-hash.mjs` prints the SHA-256 manifest and cumulative digest of all shared engine files.
- `node scripts/engine-hash.mjs --verify=<path-to-sister-repo>` verifies parity against a sister repository in one command (exit 0 on match, exit 1 with diff on drift).
- **Copy procedure for shared engine changes:**
  1. Apply and test the change in the originating repository.
  2. Copy the changed files to the matching relative paths in the sister repositories:
     ```bash
     # Example: copying a modified button primitive to sister repos
     cp src/components/ui/Button.tsx ../<sister-repo-1>/src/components/ui/Button.tsx
     cp src/components/ui/Button.tsx ../<sister-repo-2>/src/components/ui/Button.tsx
     ```
  3. Verify byte-identity across all repositories:
     ```bash
     node scripts/engine-hash.mjs --verify=../<sister-repo-1>
     node scripts/engine-hash.mjs --verify=../<sister-repo-2>
     ```
  4. Run `npm run check` in each sister repository to ensure no tenant neutrality or test regressions occurred.

**Styling**

- Semantic CSS-variable tokens only: `bg-background`, `text-foreground`, `bg-primary`, `border-border`, `ring-ring`, etc.
- No raw hex and no Tailwind palette classes (`blue-600`) inside a shared component.
- Modifying site appearance happens through `src/site/config.ts` theme presets or token overrides, never by editing shared components.

**Motion**

- Package `motion`, imports from `motion/react`. **Never `framer-motion`** — that is the legacy name of the same library.
- Variants live in `src/lib/motion/`. Components import them; they never define one-off animation objects.
- `MotionConfig reducedMotion="user"` at the root. `useReducedMotion` for parallax and large transforms.
- Durations: micro 150–220ms · overlays 180–300ms · section reveals 350–550ms.
- Departing outlets can render once after router loader data is removed; use presence state to skip stale page rendering, never invent a replacement hydration timestamp.

**Data**

- All site and content data validated by Zod at build time. Invalid data fails the build.
- Single-site code imports config and content directly from `@/site`.

**Accessibility** — WCAG 2.2 AA. Keyboard operable, visible focus, labelled controls, one H1 per page, focus management on route change.

**Security** — No `dangerouslySetInnerHTML`. No raw HTML injection. No API secrets in the frontend. External links get `rel="noopener noreferrer"`.

**Forms** — No endpoint means explicit no-send demonstration mode with transparent status messaging, never the configured success message. No secrets or reserved field/consent/honeypot keys in endpoint queries. Keep native controls disabled before hydration; external providers must independently validate, prevent abuse and acknowledge with readable HTTP 2xx. No cookies, redirects, automatic retries or raw response rendering.

**Local pagination** — Use buttons for local state, links only for reproducible destinations. Preserve the complete initial HTML/no-JS collection; never hide later records in a client-only data source. Keep inactive visible text at token contrast, not reduced opacity.

**SEO/hosting** — JSON-LD is an object passed to React Router `Meta`'s escaped `script:ld+json` descriptor. Render fallback metadata through root `meta`, never post-insert head nodes. Derive router, Vite and native-asset bases from validated `siteUrl`; shared-origin robots policy belongs at the origin root.

**Banned** — Redux · jQuery · Bootstrap · MUI · CSS-in-JS · any backend · runtime server.

**Design anti-patterns** — purple/pink gradients · glassmorphism · floating blobs · neon · emoji as UI icons · autoplaying carousels · text baked into images · motion on every element · fake accreditations, rankings, or statistics.

---

## 4. Architecture decisions

| Decision                                                             | Rationale                                                                                                           |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| React Router v7 Framework Mode, `ssr: false` + prerender             | Static output, no runtime server, real per-route HTML metadata emitted to `dist/`                                   |
| Direct `@/site` import for site data                                 | Single-site project has nothing to select; the module graph, not an env var, decides what ships                     |
| Content authored in TypeScript, not JSON                             | Compile-time errors against Zod-inferred types when editing configuration or content                                |
| `TenantProvider` owns site data distribution                         | Components stay decoupled and testable against fixtures; components never import `@/site` directly                  |
| Sections as a discriminated union + registry                         | Adding a section type without registering a component becomes a compile error                                       |
| Themes as exhaustive token records                                   | Adding a token breaks every preset until filled in                                                                  |
| No `.default()` anywhere in the site schema                          | A default is how domain nouns leak back in. A missing field must fail the build                                     |
| Neutral page ids (`programs`, `conversion`), not `admissions`        | The same key serves "Admissions" and "Get Started"; the label comes from `terminology`                              |
| Theme emitted as an inline `<style>` in `<head>`                     | Prerendered, so the palette is in the HTML before first paint. No effect hook, no unthemed flash                    |
| Styleguide registered conditionally in `routes.ts`                   | Rollup cannot bundle a dev route in production                                                                      |
| Three button components rather than one polymorphic one              | A link navigates and a button acts; blurring that is how a `div` ends up as the click target                        |
| `CardLink` stretches over its card                                   | Whole-card click target with one tab stop, never a clickable div                                                    |
| A feature flag must not be satisfiable without its content           | The schema requires announcement content when its flag is enabled                                                   |
| CSS centering and motion transforms use separate modal elements      | Motion cannot overwrite the positioning transform                                                                   |
| Shared route manifest drives registration and prerender              | Enabled pages/details cannot drift between navigation and static builds                                             |
| Local demo artwork and self-hosted original fonts                    | No runtime third-party resources; OFL notices ship with fonts and system stacks remain fallbacks                    |
| Entry-only outlet fade                                               | Departing data-backed pages skip rendering via presence state; first paint stays visible                            |
| VS Code process tasks + pure Node quality runner                     | Removes PowerShell quoting/policy/output failures from project validation                                           |
| Initial section HTML stays eager; gallery viewer loads near viewport | Preserves captions/images for prerender and no-JS readers while deferring the heavy interaction                     |
| Validated `pageSections` map in editorial content                    | Core pages consume section arrays; missing compositions use an explicit empty state                                 |
| Live collection bindings in section arrays                           | Authored layout stays separate from records; new items appear without stale copied card arrays                      |
| Configured canonical detail bases with prerendered aliases           | Existing deep links keep working while cards and sitemap expose one canonical URL                                   |
| Serialized route-time snapshot for date groups                       | Initial hydration uses the same event classification as prerendered HTML                                            |
| Original illustrations and tagged PDF demo guides                    | Real local media/downloads without stock-photo dependencies, invented photographs or empty links                    |
| React Router object JSON-LD + root fallback metadata                 | Framework escaping prevents script breakout; React owns head nodes before and after hydration                       |
| One validated `siteUrl` controls deployment base                     | Router links, native assets, fonts, sitemap and graph identities stay aligned                                       |
| Sitemap is the canonical indexable prerender subset                  | Aliases and noindexed pages still render; page robots applies to detail children and global noindex wins            |
| Strict four-form schema and generic ConfiguredForm                   | Known fields/consent validate with Zod; no-endpoint demos never send, async sessions abort on config change/unmount |
| Prerender all collection cards, enhance locally                      | No-JS/crawlers retain all records; page buttons/filter controls change visibility without routes or requests        |

---

## 5. Commands

**Preferred:** VS Code **Run Task → Quality gate / Dev server (port 5412)**.
These are `process` tasks with an absolute Windows Node executable, not shell tasks.

| Command                  | Purpose                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------- |
| `npm run dev`            | Dev server at `http://127.0.0.1:5412/`                                                |
| `npm run build`          | Production static build prerendering to `dist/`                                       |
| `npm run preview`        | Serve static production build from `dist/` on port 5412                               |
| `npm run check`          | Full quality gate (`format:check` + `lint` + `typecheck` + `check:contrast` + `test`) |
| `npm run test`           | Vitest unit and component tests (1049 tests)                                          |
| `npm run test:e2e`       | Playwright E2E tests + automated axe accessibility scans                              |
| `npm run check:contrast` | WCAG contrast audit for theme presets (216 pairs)                                     |
| `npm run lint`           | ESLint + tenant-neutrality gate                                                       |
| `npm run typecheck`      | TypeScript compiler typecheck (`tsc --noEmit`)                                        |
| `npm run format`         | Prettier code formatter                                                               |
| `npm run format:check`   | Check code formatting                                                                 |
| `npm run deps:verify`    | Fresh-cache two-package mirror probe (Windows x64), SHA-512 + native smoke test       |
| `npm run deps:install`   | Install existing lockfile through approved mirror; replaces project node_modules      |

### Specialized Audits

```bash
# Verify static HTML generation, theme tokens, and asset isolation
node scripts/verify-static-output.mjs

# Audit responsive layouts across 7 viewports (360px to 1440px), zoom, and text scale
node scripts/verify-responsive.mjs

# Audit static SEO metadata, canonical links, JSON-LD graphs, and sitemap
node scripts/verify-seo-output.mjs

# Verify public pages, route transitions, and focus management
node scripts/verify-public-pages.mjs

# Verify form validation, collection filters, and lightbox interactions
node scripts/verify-interactive-features.mjs

# Verify editorial and collection authoring
node scripts/verify-editorial-dev.mjs

# Verify subpath base URL deployment isolation
node scripts/verify-base-path.mjs
```

---

## 6. Machine notes

Full detail in [resolveerror.md](resolveerror.md) and [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md). The ones that shape daily work:

- **Native download resolved, 2026-09-07:** fresh-cache npm ci through Artifactory passed in 567,638ms. Both tarballs match SHA-512; the 4,829,680-byte native archive yields an 11,694,592-byte executable reporting 0.28.2. Public npm still returns 403; use `deps:install` / **Install dependencies (approved mirror)** rather than claiming the public endpoint is unblocked.
- **Inherited npm TLS setting:** effective `strict-ssl` was false before this task. Project `.npmrc` now explicitly enables it; the dependency runner also forces it and starts npm with system CA trust. Global/user settings were not changed. Do not disable certificate checks to fix a 403 or slow transfer.
- **Fonts integrated, 2026-09-07:** twelve WOFF2 files for six original families and six OFL notices ship under `public/fonts/`, with provenance/hashes. Acquisition is maintenance-only, never a normal-build step; deployed fonts come from the site itself.
- **Install is two commands:**
  ```powershell
  # 1. Resolve - public npm, metadata only
  & 'C:\Program Files\nodejs\npm.cmd' install --package-lock-only --no-audit --no-fund --prefer-offline --registry=https://registry.npmjs.org/
  # 2. Download - Artifactory, tarballs only
  & 'C:\Program Files\nodejs\npm.cmd' ci --no-audit --no-fund --registry=https://artifacts.devops.bfsaws.net/artifactory/api/npm/NPM/ --replace-registry-host=always
  ```
- **Keep `.npmrc` pointing at public npm.** That keeps `package-lock.json` portable for static cloud hosts (Cloudflare Pages, Netlify, Vercel).
- **Native esbuild works** — `esbuild.exe` (11.2 MB) arrives inside the Artifactory tarball. No `esbuild-wasm` override needed.
- **Tailwind v3, not v4.** v4's `@tailwindcss/oxide-wasm32-wasi` forces a tarball fetch during `--package-lock-only` (403 on public npm). Theming is unaffected: `theme.extend` reads `var(--token)`.
- **Bare `npm` is blocked under the current PowerShell policy.** Use the `.cmd` shim by absolute path.
- **Never spawn `npm.cmd` from Node.** Node 20+ returns `status: null` silently without `shell: true`. Spawn `node <nodedir>/node_modules/npm/bin/npm-cli.js` instead.
- **Daily checks/builds avoid PowerShell entirely:** `.vscode/tasks.json` uses `type: process` and argument arrays. `project-cli.mjs` spawns installed Node entry points serially with `shell: false`.
- **Playwright:** binds `127.0.0.1` on port `5412`. Keep `reuseExistingServer: false`.

---

- **Breadcrumbs & First Section Vertical Whitespace Removal complete (2026-09-14):** Removed the oversized vertical void between the top breadcrumbs navigation and the first section title across core pages (About, Programs, Downloads, Campus life, News & events, Contact, Admissions). In `src/routes/route-frame.tsx`, updated the header Section wrapper when `headingHidden` is true to `density="none"` with snug padding (`pt-3 pb-0 sm:pt-4 sm:pb-1`). In `src/sections/SectionRenderer.tsx`, passed `isFirst={index === 0}`. In `src/sections/section-layout.tsx`, added `!isHero && isFirst && "!pt-2 sm:!pt-3 md:!pt-4"` to `SectionFrame`, reducing the total gap between breadcrumbs and the main section heading from 88px+ down to a tight, natural 16px–20px. Zero tests executed.
- **Gallery Image Cards Soft Primary Tint Border complete (2026-09-14):** Applied a delicate, subtle 1px border with light opacity of the primary brand color (`border border-primary/20` with `hover:border-primary/40`) to all image cards in the Gallery section (`src/sections/ImageGallerySection.tsx`). Preserved `rounded-lg` corner radius and `overflow-hidden` so images sit flush inside the fine border without feeling thick or heavy, alongside smooth hover micro-lift (`hover:-translate-y-1 hover:shadow-md`) and gentle zoom (`group-hover:scale-105 duration-500`). Zero tests executed.
- **Redundant Top Header Text & Ghost Section Removal across Core Pages complete (2026-09-14):** Eliminated the redundant top header block ("Apex" eyebrow + page title like "About", "Programs", "Downloads", "Campus life", "News & events") and its empty section wrapper across all core pages. In `src/routes/page-content.tsx`, updated `sectionOwnsHeading` so any page whose active sections own persistent headings automatically hides the fallback PageFrame header and designates the first section's heading as the page's single `h1`, fully preserving WCAG 2.2 AA. In `src/routes/route-frame.tsx`, updated the `fullBleed` render condition to `{header && !headingHidden ? ... : null}` to prevent any empty padded ghost section from rendering at the top of the page. Zero tests executed.
- **Admissions Divider & Final CTA Spacing Optimization complete (2026-09-14):** Eliminated the excessive empty vertical void above the horizontal divider line and "Admissions" heading. Added `isFinalCta && "!pt-2 sm:!pt-3 lg:!pt-4"` to `SectionFrame` in `src/sections/section-layout.tsx` to remove the redundant section-top padding above the divider. Reduced padding under the divider in `FinalCTASection` (`src/sections/EditorialSections.tsx`) from `pt-6 sm:pt-8` down to `pt-3 sm:pt-4`. Updated `finalCta` and `faq` in `src/site/page-templates.ts` to `density: "compact"` (`py-6 sm:py-8`), reducing the total gap above the divider line from 112px+ down to a tight, balanced ~32–48px with 12–16px beneath the line. Zero tests executed.
- **Page Sections Vertical Spacing & Padding Optimization complete (2026-09-14):** Reduced excessive vertical spacing and bloated whitespace across all page sections. Updated `Section` density variants in `src/components/ui/Section.tsx` from oversized `py-12 sm:py-16 lg:py-20` and `py-16 sm:py-24 lg:py-32` down to balanced, compact spacing (`compact: "py-6 sm:py-8"`, `default: "py-8 sm:py-10 md:py-12 lg:py-14"`, `spacious: "py-10 sm:py-12 md:py-14 lg:py-16"`). Reduced hero bottom padding in `src/sections/section-layout.tsx` from `!pb-20` to `!pb-12`. Adjusted `about` and `finalCta` section definitions in `src/site/page-templates.ts` to `density: "regular"` to eliminate artificial double-expansion. Tightened header and divider margins in `CollectionSections.tsx` (`Collection` wrapper to `space-y-5 sm:space-y-6`, `StepsSection` gap to `gap-6`, `NewsGridSection` and `EventsGridSection` to `space-y-6`, `TestimonialsSection` wrapper to `py-2`), `ImageGallerySection.tsx` (`space-y-6`), `EnquiryFormSection.tsx` (`space-y-6`), `EditorialSections.tsx` (`SplitLayout` to `gap-6 lg:gap-10`, `FinalCTASection` border padding to `pt-6 sm:pt-8`), and `route-frame.tsx` / `detail-content.tsx` (`space-y-6`). Strict constraint observed: no test commands or verification scripts executed.
- **Infinite Horizontal Testimonials Marquee Ticker complete (2026-09-14):** Converted the Testimonials section (`TestimonialsSection` in `src/sections/CollectionSections.tsx`) from a static multi-row grid into an infinite, continuously auto-scrolling single-row horizontal marquee banner. Implemented a dual-track seamless loop (`from { transform: translateX(0); } to { transform: translateX(-50%); }`) with uniform card widths (`w-[320px] sm:w-[380px] shrink-0`) and gentle speed (`45s linear infinite`). Added interactive pause-on-hover (`hover:[animation-play-state:paused] group-hover:[animation-play-state:paused]`), smooth left and right edge fade masks (`pointer-events-none w-16 sm:w-28` matching the section background tone plus container mask-image), and full reduced motion accessibility (`motion-reduce:animate-none motion-reduce:overflow-x-auto` with duplicate track hidden via `motion-reduce:hidden` and `aria-hidden="true"`). Zero tests executed.
- **Micro-Interaction Hover Effects Across Collection & Highlight Cards complete (2026-09-14):** Implemented refined, cohesive micro-interaction hover styling across all primary card collections and metrics. Updated `ContentCardFrame` (`src/components/cards/ContentCardFrame.tsx`) with card-level `group`, smooth vertical micro-lift (`hover:-translate-y-1.5`), soft elevation shadow (`hover:shadow-lg`), accent border highlight (`hover:border-primary/30`), and inner image zoom (`group-hover:scale-105 transition-transform duration-500 ease-out` within an `overflow-hidden rounded-t` wrapper). Standardized `ProgramCard`, `FacilityCard`, `NewsCard`, `EventCard`, and `DepartmentCard` to the pure vertical micro-lift. Transformed `Metrics` (`src/sections/CollectionSections.tsx`) so each item is an independent rounded card with `border-s-2 border-border/80 bg-card/40` that lifts and highlights on hover (`hover:border-primary hover:bg-card hover:shadow-lg`) without distorting adjacent vertical borders. Updated `TextPanels`, `TestimonialCard`, and `DownloadCard` for full site-wide harmony. Complete accessibility preserved with `motion-reduce:transform-none motion-reduce:transition-none`. No test scripts executed.
- **Scroll-Triggered Viewport Detection for Running Numbers complete (2026-09-14):** Refined the animated running number counters (`RunningNumber.tsx` and `CollectionSections.tsx`) to trigger strictly when the metrics container element enters the visible viewport. Implemented container-level viewport detection using a native `IntersectionObserver` on the `<dl>` grid element in `Metrics` with `threshold: 0.3` and `rootMargin: "0px 0px -50px 0px"`. Configured one-time triggering (`once: true`) that disconnects immediately upon entry, passing a synchronized `trigger` prop to all child counters so they count up from 0 to target in unison. Refactored `RunningNumber` with `hasAnimatedRef` to prevent animation cancellation during state changes, keeping server-rendered static HTML intact for SEO/crawlers while starting client display at 0 before the threshold is scrolled into view. Full accessibility preserved with `useReducedMotion()`. Strict constraint observed: no test commands or verification scripts executed.
- **Running Number Feature for Stats & Metrics complete (2026-09-14):** Created reusable animated counter `RunningNumber` (`src/components/ui/RunningNumber.tsx`) and integrated into `Metrics` (`src/sections/CollectionSections.tsx`) and `Stat` (`src/components/ui/Stat.tsx`). Numbers ("26+", "18", "32", etc.) smoothly count up from 0 to target when scrolled into view using an `IntersectionObserver` with smooth quartic easing (`easeOutQuart`), while rendering full static numbers in server HTML for SEO and crawlers. Uses `tabular-nums` to ensure zero horizontal jitter. Full accessibility support with `useReducedMotion()`. No test scripts executed.
- **Campus Life & Latest Updates Cards Micro-Interaction Hover Effect complete (2026-09-13):** Extended the elegant, refined micro-interaction hover styling from `ProgramCard` across `FacilityCard` ("Campus life"), `NewsCard` ("Latest updates"), `EventCard` ("Upcoming events"), and `DepartmentCard` ("Departments"). Implemented smooth upward lift (`hover:-translate-y-1.5`, `-6px`), gentle tilt/float (`hover:-rotate-[0.35deg]`), deep natural elevation shadow (`hover:shadow-xl`), and token accent border glow (`hover:border-primary/30`) over `duration-300 ease-out`. Full accessibility preserved with `motion-reduce:transform-none motion-reduce:transition-none`. No test scripts executed.
- **Programs Cards Elegant Micro-Interaction Hover Effect complete (2026-09-13):** Replaced previous shake animation with an ultra-subtle, premium academic micro-interaction on `ProgramCard` components (`src/components/cards/ProgramCard.tsx`). Implemented smooth upward lift (`hover:-translate-y-1.5`, `-6px`), gentle tilt/float (`hover:-rotate-[0.35deg]`), rich soft drop-shadow (`hover:shadow-xl`), and token accent border tint (`hover:border-primary/30`) over `duration-300 ease-out`. Updated `ContentCardFrame` (`src/components/cards/ContentCardFrame.tsx`) with an optional `className` prop on `ContentCardProps` merged via `cn()`. Full accessibility preserved with `motion-reduce:transform-none motion-reduce:transition-none`. No test scripts executed.
- **Navbar Neutral Background & Hero Grid Confinement complete (2026-09-13):** Restored the navigation bar's clean, solid neutral background (`bg-header-background`) and bottom border (`border-b border-border`) with scroll shadow. Completely removed the transparent header styling and pink grid bleed from the header. Confined the pink atmospheric radial glow and tech mesh grid exclusively to the hero section, starting directly flush below the bottom border of the navbar with zero vertical gaps and bleeding edge-to-edge (100% viewport width). Inner text and image content remain neatly constrained to `max-w-7xl`.
- **Hero Background Full-Width Bleed & Transparent Navbar complete (2026-09-13):** Extended the faint pink-tinted grid background and radial glow of the homepage hero section to bleed full-width (100% viewport width) and seamlessly up behind the navigation bar to `y = 0`. Moved the atmosphere and mesh pattern to the outer `<Section>` wrapper in `src/sections/section-layout.tsx` with negative top margin (`-mt-[4.5rem] sm:-mt-20`), keeping the inner `max-w-7xl` container strictly around the text and image content. Updated `src/components/layout/SiteHeader.tsx` to render a transparent background at the top (`bg-transparent`) that transitions to `bg-header-background/95 backdrop-blur-md shadow-md` on scroll. Shared engine files synchronized across sister repositories.
- **Homepage Header Spacing & Ghost Section Elimination complete (2026-09-13):** Eliminated the tall empty white space above the homepage hero section. Fixed `src/routes/route-frame.tsx` to conditionally render the top `<Section>` only when actual header content (`breadcrumbs`, `heading`, or `demoContentNotice`) exists, preventing an empty `py-8 sm:py-10` ghost section on the homepage. Streamlined hero section density from `spacious` to `regular` in `src/site/page-templates.ts` and set snug top padding (`!pt-6 sm:!pt-8 lg:!pt-10`) in `src/sections/section-layout.tsx`. Shared engine updates synchronized across sister repositories.
- **Header Navigation Spacing Optimization complete (2026-09-13):** Reduced the wide horizontal void between brand logo and navigation menu in `src/components/layout/SiteHeader.tsx`. Grouped brand logo and `DesktopNav` into a left-aligned flex group with responsive gap (`gap-x-6 gap-y-2 lg:gap-x-8 xl:gap-x-10`), while floating the primary CTA button (`Explore admissions guidance`) and mobile hamburger trigger to the right end via the outer container's `justify-between`. Full wrapping support enabled for extreme text-scaling (200%) and responsive viewports. Shared engine changes synchronized to sister repositories (`greenfield-school`, `northstar-academy`). Full quality verification passed: `npm run check` (1,049 tests), `npm run test:e2e` (48 tests), `verify-responsive.mjs` (755 passed checks, 0 failed), `verify-public-pages.mjs` (66 paths, 0 axe violations).
- **Homepage Hero Refactoring complete (2026-09-12):** Modernized homepage hero section in `src/sections/EditorialSections.tsx` to a high-end split-screen tech landing page layout (`grid grid-cols-1 lg:grid-cols-12`). Left column (`lg:col-span-7`) features eyebrow badge, punchy typography (`text-4xl sm:text-5xl lg:text-6xl`), lead copy, side-by-side pill CTAs, and a keywords strip (`Robotics · Computing · Design · Innovation`). Right column (`lg:col-span-5`) features a rounded focal image (`rounded-2xl sm:rounded-3xl shadow-2xl`) with soft ambient token glows. Full quality suite verified: `npm run check` (1,049 tests), `npm run test:e2e` (48 tests), `verify-responsive.mjs` (755 checks passed), `verify-seo-output.mjs` (66 routes), `verify-public-pages.mjs` (0 axe violations), `verify-interactive-features.mjs` (66 checks), `verify-visitor-journey.mjs` (exit 0).
- **Prompt 10 complete (2026-09-11):** Completed full end-to-end verification and authored root `HANDOVER.md`. 100% test coverage across all suites: `npm run check` (exit 0, 1,049 tests, 216 contrast pairs, 64 neutral files), `npm run build` (exit 0, 66 routes prerendered), static output audit (30 tokens, favicon, 0 sibling assets), public pages audit (66 routes, 0 axe violations), visitor journey audit (11 initial HTML records, pagination, 3 category filters, gallery lightbox, 5 PDF downloads verified, 6 Back/Forward hops with heading focus, 3 routes under reduced motion, 0 egress), responsive audit (8 routes, 56 width visits, 755 passed checks, 0 failed), SEO audit (66 routes, 4 browser states, 344 checks passed), Playwright E2E suite (48 passed across desktop and mobile, 12 axe scans), isolation verification (clean rebuild and serve with siblings stripped, 0 sibling references), and cross-site differentiation audit. All audit JSON reports and screenshots saved to `build/`.
- **Prompt 9 complete (2026-09-11):** Container root retired to `_archive/`. Repository independence proven with `_archive/` renamed. Complete quality gate passed: `npm run check` (1,049 tests, 216 contrast pairs, 64 neutral files), `npm run build` (66 routes prerendered), static output audit (30 tokens, favicon, 0 sibling assets), responsive audit (8 routes, 56 width checks, 755 passed checks, 0 failed), SEO audit (66 routes, 4 browser states), E2E test suite (48 passed across desktop and mobile, 12 axe scans). Final baseline parity against `_baseline/` verified with 0 differences. Cross-repository engine parity tool `scripts/engine-hash.mjs` active with zero drift across sister repositories.
- **Prompt 8 complete (2026-09-11):** Dedicated Git repository initialized with `core.autocrlf false` and `core.eol lf`. Clean initial commit established with full asset, font, and documentation tracking.
- **Prompt 7 complete (2026-09-11):** Standalone repository operating manual, single-site documentation, and configuration guide updated. All multi-tenant artifacts, references, commands, and sibling links removed.
- **Prompt 6 complete (2026-09-11):** Verification scripts and VS Code process tasks converted to single-site. Responsive audit: **755 checks, 0 failures**. Static output audit: passed with strict sibling absence check. Neutral files: 64. Contrast pairs: 216.
- **Prompt 5 complete (2026-09-11):** Single-site test suite active. `npm run test` exits 0 with **1049 tests**, and `npm run test:e2e` exits 0 with **24 tests** on port 5412 (desktop and mobile viewports with full-page axe scans).
- **Prompt 4 complete (2026-09-11):** Multi-tenant selection layer collapsed. `src/site/` direct import active. Zero baseline parity drift.
- **Routes:** 66 static routes prerendered to `dist/`.

| Item                       | State                                           |
| -------------------------- | ----------------------------------------------- |
| Site configuration         | Done — `src/site/config.ts`                     |
| Editorial content          | Done — `src/site/content/`                      |
| Single-site build pipeline | Done — `npm run build` -> `dist/`               |
| Standalone tests           | Done — 1049 unit/component tests + 48 E2E tests |
| WCAG Contrast              | Done — 216 pairs pass                           |
| Operating manual           | Done — this file                                |
| Configuration guide        | Done — `docs/CONFIGURATION.md`                  |
| Baseline output parity     | **PASS — 0 differences** against `_baseline/`   |

---

## 8. Task log

### 2026-09-14 — Infinite Horizontal Testimonials Marquee Ticker

- **Objective:** Convert the Testimonials section from a static multi-row grid into an infinite, continuously auto-scrolling single-row horizontal marquee banner.
- **Modifications:**
  - `tailwind.config.ts` & `src/styles/app.css`: Added keyframes `marquee` (`0% { transform: translateX(0%); } 100% { transform: translateX(-50%); }`), animation class `.animate-marquee` (45s linear infinite), interactive pause on hover (`hover:[animation-play-state:paused]`), and reduced motion rules.
  - `src/sections/CollectionSections.tsx`: Converted `TestimonialsSection` to a single-row dual-track marquee container with uniform card sizing (`w-[320px] sm:w-[380px] shrink-0`), trailing padding for mathematically seamless wraparound without jumps or blank space, left/right edge fade masks matching section tone, and interactive hover pausing.
  - Full accessibility compliance: duplicate track marked with `aria-hidden="true"` and hidden under reduced motion (`motion-reduce:hidden`). Reduced motion preferences provide native horizontal scroll (`motion-reduce:animate-none motion-reduce:overflow-x-auto`).
  - Strict compliance with constraint: no test commands or verification scripts executed. Layout and component files edited directly.

### 2026-09-14 — Refined Micro-Interaction Hover Effects Across Collection & Highlight Cards

- **Objective:** Implement cohesive, refined micro-interaction hover effects (smooth vertical micro-lift, elevation shadow, accent border highlight, and inner image zoom) across Programs, At a glance / Metrics & Highlights, Campus life / Facilities, Latest updates, and Upcoming events cards.
- **Modifications:**
  - `src/components/cards/ContentCardFrame.tsx`: Marked card element with `group`, applied base micro-interaction classes (`transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-lg hover:border-primary/30 motion-reduce:transform-none motion-reduce:transition-none`), wrapped `ResponsiveImage` in an `overflow-hidden rounded-t` container, and passed `imgClassName="transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none"` for smooth inner image zoom.
  - `src/components/cards/ProgramCard.tsx`, `src/components/cards/FacilityCard.tsx`, `src/components/cards/NewsCard.tsx`, `src/components/cards/EventCard.tsx`, and `src/components/cards/DepartmentCard.tsx`: Standardized card classes to pure vertical micro-lift (`hover:-translate-y-1.5`), elevated soft shadow (`hover:shadow-lg`), and token accent border highlight (`hover:border-primary/30`), removing outdated tilt transforms.
  - `src/sections/CollectionSections.tsx`: Transformed `Metrics` items into individual rounded cards with `border-s-2 border-border/80 bg-card/40 p-5` and hover effects (`hover:-translate-y-1.5 hover:border-primary hover:bg-card hover:shadow-lg`) without distorting adjacent vertical borders. Enhanced `TextPanels` with matching card elevation styling.
  - `src/components/cards/TestimonialCard.tsx` & `src/components/cards/DownloadCard.tsx`: Integrated matching micro-lift and shadow hover effects for site-wide visual consistency.
  - Full accessibility compliance: respects `motion-reduce:transform-none motion-reduce:transition-none` across all modified components.
  - Strict compliance with constraint: no test commands or verification scripts executed. Layout and component files edited directly.

### 2026-09-14 — Scroll-Triggered Viewport Detection for Running Numbers

- **Objective:** Configure metrics counter logic so the animated running count-up sequence triggers strictly when the section is scrolled into the viewport.
- **Modifications:**
  - `src/sections/CollectionSections.tsx`: Added an `IntersectionObserver` to the metrics `<dl>` container element in `Metrics` (`StatsSection` and `ResultsSection`) with `threshold: 0.3` and `rootMargin: "0px 0px -50px 0px"`. Configured one-time triggering (`once: true`) that disconnects on intersection and synchronizes a `trigger` prop across all child `<RunningNumber>` instances.
  - `src/components/ui/RunningNumber.tsx`: Added `trigger?: boolean` prop and updated internal logic with `hasAnimatedRef` to prevent animation aborts during React lifecycle state transitions. Initializes number display to `0` (with formatting/prefix/suffix) while waiting for the viewport trigger, then counts up smoothly from 0 to the target number once entering the viewport. Standalone usage defaults to self-observing with the same 0.3 threshold and -50px root margin.
  - Full accessibility compliance: preserves `useReducedMotion()` to immediately display full static values. Server-rendered HTML preserves static numbers for SEO and crawlers.
  - Strict compliance with constraint: no test commands or verification scripts executed. Layout and component files edited directly.

### 2026-09-14 — Running Number Counter Feature for Stats and Metrics

- **Objective:** Implement an animated running number count-up feature for the "At a glance" stats section ("26+", "18", "32") and metrics that triggers when scrolled into view.
- **Modifications:**
  - `src/components/ui/RunningNumber.tsx`: Created a lightweight, high-performance running number counter. It automatically parses prefixes (e.g. `$`, `£`), target numbers, decimals, commas, and suffixes (e.g. `+`, `%`, `M`). Employs `IntersectionObserver` with smooth quartic easing (`easeOutQuart`) over 1.6s, directly updating the DOM to avoid unnecessary React re-renders.
  - `src/components/ui/index.ts`: Exported `RunningNumber` and `RunningNumberProps`.
  - `src/sections/CollectionSections.tsx`: Wrapped stat numbers in `Metrics` with `<RunningNumber value={item.value} />` and applied `tabular-nums` to eliminate horizontal digit jitter.
  - `src/components/ui/Stat.tsx`: Integrated `RunningNumber` with `tabular-nums` for standalone stat card usage.
  - Full accessibility compliance: respects `useReducedMotion()` by retaining static values immediately.
  - Strict compliance with constraint: no test commands or verification scripts run. Layout and styling files edited directly.

### 2026-09-13 — Campus Life & Latest Updates Cards Micro-Interaction Hover Effect

- **Objective:** Extend the refined, elegant hover micro-interaction from Programs cards to "Campus life" (`FacilityCard`) and "Latest updates" (`NewsCard`), along with related `EventCard` and `DepartmentCard`.
- **Modifications:**
  - `src/components/cards/FacilityCard.tsx`: Applied smooth upward lift (`hover:-translate-y-1.5`, `-6px`), gentle tilt/float (`hover:-rotate-[0.35deg]`), natural drop-shadow (`hover:shadow-xl`), and token accent border tint (`hover:border-primary/30`) over `duration-300 ease-out`.
  - `src/components/cards/NewsCard.tsx`: Applied the exact same smooth hover micro-interaction classes.
  - `src/components/cards/EventCard.tsx` & `src/components/cards/DepartmentCard.tsx`: Applied consistent micro-interaction hover classes for full visual harmony across all primary academic and news cards.
  - Strict compliance with constraint: no test commands or verification scripts run. Layout and styling files edited directly.

### 2026-09-13 — Programs Cards Elegant Micro-Interaction Hover Effect

- **Objective:** Replace aggressive card shake with a refined, smooth academic micro-interaction on hover for Programs cards ("Computer Science BEng", "Data Engineering MSc", etc.).
- **Modifications:**
  - `src/components/cards/ContentCardFrame.tsx`: Extended `ContentCardProps` with an optional `className` prop and merged it cleanly onto `<Card>` via `cn()`.
  - `src/components/cards/ProgramCard.tsx`: Configured smooth micro-interaction classes: upward lift (`hover:-translate-y-1.5`, `-6px`), gentle tilt/float (`hover:-rotate-[0.35deg]`), deep natural elevation shadow (`hover:shadow-xl`), subtle primary accent border glow (`hover:border-primary/30`), and smooth easing (`transition-all duration-300 ease-out`).
  - Strict compliance with constraint: no test commands or verification scripts run. Layout and styling files edited directly.

### 2026-09-13 — Navbar Background Solid Neutral Restoration & Flush Edge-to-Edge Hero Grid Confinement

- **Objective:** Fix navigation bar background styling by restoring the navbar's solid, clean neutral background without pink grid tint or bleed-through, while confining the pink grid atmosphere exclusively to the hero section edge-to-edge (full width) directly flush below the navbar with no vertical gaps.
- **Modifications:**
  - `src/components/layout/SiteHeader.tsx`: Restored solid neutral background token `bg-header-background` (pure white `0 0% 100%`) and bottom border `border-b border-border` with standard scroll shadow. Removed transparent styling and pink grid bleed from header area.
  - `src/sections/section-layout.tsx`: Removed negative top margin (`-mt-[4.5rem] sm:-mt-20`) so the hero section begins flush immediately below the bottom border of the navbar with zero gap. Preserved full-width (`absolute inset-0 -z-10`) atmospheric radial glow and tech mesh grid on the outer `<Section>` wrapper, and set balanced top/bottom padding (`!pt-8 sm:!pt-10 lg:!pt-12 !pb-12 sm:!pb-16 lg:!pb-20`).
  - Strict compliance with constraint: no test commands or verification scripts run. Layout and styling files edited directly.

### 2026-09-13 — Hero Background Full-Width Bleed & Transparent Floating Navbar

- **Objective:** Extend the faint pink-tinted grid background of the homepage hero section to bleed full-width (edge-to-edge) and seamlessly behind the navigation bar up to the top of the viewport.
- **Modifications:**
  - `src/sections/section-layout.tsx`: Moved the atmospheric radial glow and tech mesh grid pattern from the inner hero card to the outer `<Section>` wrapper for `hero` sections. Added `-mt-[4.5rem] sm:-mt-20` so the hero section pulls up under the header to `y = 0`, and set top padding (`!pt-[6.5rem] sm:!pt-[7.5rem] lg:!pt-[8rem]`) so the inner content sits comfortably below the navbar.
  - `src/sections/EditorialSections.tsx`: Removed the inner boxed background wrapper, keeping the `max-w-7xl` container strictly around the text, badge, CTAs, and robotics image card for optimal readability.
  - `src/components/layout/SiteHeader.tsx`: Updated the header to render with a transparent background (`bg-transparent`) when at the top of the page, allowing the hero grid to bleed behind it, and smoothly transition to `bg-header-background/95 backdrop-blur-md shadow-md border-border` when scrolled.
  - Synchronized all shared engine updates across sister repositories (`greenfield-school`, `northstar-academy`).

### 2026-09-13 — Homepage Header Spacing & Ghost Section Elimination

- **Objective:** Eliminate the large blank vertical space appearing between the header bottom border and the homepage hero section ("WELCOME TO APEX" badge).
- **Root Causes:**
  1. `PageFrame` in `src/routes/route-frame.tsx` unconditionally rendered a `<Section density="compact">` containing an empty `<header>` element even when headings were hidden (`headingHidden={true}` on home), breadcrumbs were omitted (`path === "/"`), and no demo notice existed. This created an empty 80px ghost section above the hero.
  2. The hero section had `density: "spacious"` in `src/site/page-templates.ts`, adding an extra 128px of top padding.
- **Modifications:**
  - `src/routes/route-frame.tsx`: Made the top `<Section>` render conditionally on `hasHeader` content, preventing empty ghost header bands on the homepage.
  - `src/site/page-templates.ts`: Changed hero section density from `spacious` to `regular`.
  - `src/sections/section-layout.tsx`: Configured snug, modern top padding for hero sections (`!pt-6 sm:!pt-8 lg:!pt-10`) so the hero sits crisply and naturally below the header.
  - Synchronized shared engine updates across sister repositories (`greenfield-school`, `northstar-academy`).

### 2026-09-13 — Header Navigation Spacing Optimization & Responsive Alignment

- **Objective:** Eliminate the wide empty horizontal void between the brand logo and the desktop navigation menu without altering font sizes.
- **Component Modifications (`src/components/layout/SiteHeader.tsx`):**
  - Grouped the brand logo `<Link>` and `<DesktopNav>` into a dedicated left-aligned flex container with responsive spacing (`gap-x-6 gap-y-2 lg:gap-x-8 xl:gap-x-10`) and `min-w-0 flex-wrap`.
  - Allowed the primary conversion CTA button (`Explore admissions guidance`) and mobile drawer trigger (`MobileNav`) to float to the far right end via the outer container's `justify-between`.
  - Supported robust multi-line wrapping and text-scaling (200% root font size), preventing horizontal clipping and scroll overflow across all viewports.
- **Cross-Repository Parity:** Synchronized `src/components/layout/SiteHeader.tsx` to sister repositories `greenfield-school` and `northstar-academy`.
- **Verification:**
  - `npm run check` in `apex-technology`: 1,049 tests passed, 216 contrast pairs verified, 0 tenant-neutral violations.
  - `npm run check` in `northstar-academy`: 1,049 tests passed.
  - `npm run check` in `greenfield-school`: 1,057 tests passed.
  - `verify-responsive.mjs`: 8 routes, 56 width visits (360px–1440px), 755 passed checks, 0 failed checks.
  - `verify-public-pages.mjs`: 66 paths verified with 0 axe violations.
  - `npm run test:e2e`: 48 tests passed across desktop and mobile browsers.

### 2026-09-12 — Refactor Homepage Hero to Modern Split-Screen Tech Landing Page

- Modernized the homepage hero section in `src/sections/EditorialSections.tsx` and updated corresponding configuration and editorial content in `src/site/content/sections.ts` and `src/site/page-templates.ts`.
- **Layout & Visuals:** Replaced centered floating card overlay with a two-column desktop split grid (`grid grid-cols-1 lg:grid-cols-12 items-center gap-10 lg:gap-12`).
  - **Left Column (`lg:col-span-7`):** Uppercase eyebrow kicker ("WELCOME TO APEX") with backdrop blur, bold headline (`text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight`), lead paragraph, side-by-side pill CTAs with subtle hover glows, and keyword metadata strip (`Robotics · Computing · Design · Innovation`).
  - **Right Column (`lg:col-span-5`):** Focal high-tech robotics image card with `rounded-2xl sm:rounded-3xl`, subtle inner border, soft `shadow-2xl`, and ambient token glow.
  - **Background:** Ambient SVG grid pattern with soft radial token glows (`hsl(var(--primary)/0.10)` and `hsl(var(--accent)/0.08)`).
- **Accessibility & Contracts:** Full WCAG 2.2 AA contrast compliance across all 216 token pairs, strict `reducedMotion: "user"` support, single H1 heading hierarchy retained across routes, and tenant neutrality verified (0 violations).
- **Comprehensive Quality Gate Verification:**
  - `npm run check` (exit 0, 1,049 tests, 216 contrast pairs, 64 neutral files).
  - `npm run build` (exit 0, 66 static routes prerendered).
  - `npm run test:e2e` (exit 0, 48 tests passed across desktop and mobile, full-page axe scans across 6 key routes).
  - `verify-responsive.mjs` (exit 0, 755 passed checks across 7 viewports from 360px to 1440px, zoom, text-scale).
  - `verify-static-output.mjs` (exit 0, 30 tokens, favicon, clean static HTML).
  - `verify-seo-output.mjs` (exit 0, 66 routes, 4 browser states).
  - `verify-public-pages.mjs` (exit 0, 66 paths, 0 axe violations).
  - `verify-interactive-features.mjs` (exit 0, 66 checks passed).
  - `verify-visitor-journey.mjs` (exit 0, 5/5 steps passed).

### 2026-09-11 — Prompt 10: Complete end-to-end verification and write HANDOVER.md

- Executed full end-to-end verification suite against static production build: `npm run check` (1,049 tests, 216 contrast pairs, 64 neutral files), `npm run build` (66 routes prerendered), `verify-static-output.mjs`, `verify-public-pages.mjs` (66 routes, full axe scan per route, 0 violations), `verify-visitor-journey.mjs` (11 initial HTML records, pagination, 3 category filters, gallery lightbox, 5 PDF downloads verified, 6 Back/Forward hops with heading focus, 3 routes under reduced motion, 0 egress), `verify-responsive.mjs` (8 routes, 56 width visits, 755 passed checks, 0 failed), `verify-seo-output.mjs` (66 routes, 344 checks passed), and `npm run test:e2e` (48 passed).
- Built and verified `verify-isolation.mjs` confirming independent rebuild and serving with siblings stripped and 0 cross-tenant references.
- Verified cross-site differentiation via `verify-differentiation.mjs` confirming distinct tenant IDs, fonts, and route counts.
- Created `HANDOVER.md` at container root detailing architecture, operational runbook, exact verified metrics, demonstration content notice, and pre-launch blockers checklist.

### 2026-09-11 — Prompt 9: Retire the engine and run the per-project quality gate

- Cleaned up container root to strictly contain `_archive/` and the three project repositories.
- Proved total repository independence from `_archive/` by building with `_archive/` renamed.
- Implemented `scripts/engine-hash.mjs` for SHA-256 verification across shared engine files and codified cross-repo parity policy in AGENTS.md.
- Executed full standalone quality gate: `npm run check` (exit 0), `npm run build` (exit 0), `verify-static-output.mjs` (exit 0), `verify-responsive.mjs` (exit 0, 755 passed checks), `verify-seo-output.mjs` (exit 0, 66 routes), `npm run test:e2e` (exit 0, 48 tests passed).
- Ran final baseline parity verification against `_baseline/` with 0 differences across 66 routes and 68 HTML files.

### 2026-09-11 — Prompt 8: Git repository and deployment configuration

- Initialized independent git repository with `core.autocrlf false` and `core.eol lf`.
- Added comprehensive `.gitignore` and committed all fonts, assets, and documentation in a clean initial commit.

### 2026-09-11 — Prompt 7: Standalone documentation & operating records

- Rewrote `AGENTS.md`, `README.md`, `.github/copilot-instructions.md`, and all `docs/` guides for Apex Institute of Technology.
- Removed all legacy multi-tenant references, environment switches, and multi-tenant script aliases.
- Deleted `docs/ADD-A-TENANT.md` and added `docs/CONFIGURATION.md`.
- Added the cross-repository parity rule to Hard Rules.
- Fixed all internal markdown links and verified every documented command exists in `package.json`.

### 2026-09-11 — Prompt 6: Verification scripts & tasks

- Converted all verification scripts to single-site. Responsive audit passed 755 checks with 0 failures. Static output verifier passed.
- Configured 15 shell-independent process tasks in `.vscode/tasks.json` bound to port 5412.

### 2026-09-11 — Prompt 5: Test suite porting

- Ported unit, component, and E2E test suites to single-site Apex.
- Configured Playwright with 2 projects (`apex-technology-desktop` and `apex-technology-mobile`) on port 5412. 1049 unit tests and 24 E2E tests passing.

### 2026-09-11 — Prompt 4: Collapse multi-tenant machinery

- Moved Apex config and content to `src/site/`. Removed `tenant-registry.ts`, `resolve-tenant.ts`, `active-tenant-plugin.ts`, and `tenant-cli.mjs`.
- Rewired imports to `@/site`. Verified 100% output parity against baseline snapshot.

---

## 9. Bug log

### 2026-09-11 — Constant condition in verification scripts

- **Symptom:** ESLint `no-constant-condition` error on `if (true)` in verification script.
- **Cause:** Defensive block wrapper used boolean literal.
- **Fix:** Invoked the verification block directly without conditional wrapper.

### 2026-09-04 — `ERESOLVE / vite@undefined` from slow registry

- **Symptom:** `npm error Found: vite@undefined` against `peer vite@"^5.2.0 || ^6 || ^7 || ^8"`.
- **Cause:** Cold Artifactory packument timed out after 573s.
- **Fix:** Resolved against public npm metadata with `--package-lock-only`, downloaded tarballs from Artifactory.

### 2026-09-04 — `spawnSync('npm.cmd')` silently returned null

- **Symptom:** Node probe script returned `exit code: null` for `npm.cmd`.
- **Cause:** Node 20+ requires `shell: true` for `.cmd` (CVE-2024-27980) or fails silently.
- **Fix:** Spawned `node <nodedir>/node_modules/npm/bin/npm-cli.js` directly.

---

## Update protocol

**After completing any task:**

1. Update [§7 Status](#7-status) — phase, table states, verified values.
2. Add a [§8 Task log](#8-task-log) entry: what changed and why. Newest first.
3. Record any new architecture decision in [§4](#4-architecture-decisions) and machine finding in [§6](#6-machine-notes).

**After fixing any bug:**

1. Add a [§9 Bug log](#9-bug-log) entry: symptom, cause, fix, what was rejected and why.
2. Append the same to [resolveerror.md](resolveerror.md).
3. If preventable, add a rule to [§3 Hard rules](#3-hard-rules).
