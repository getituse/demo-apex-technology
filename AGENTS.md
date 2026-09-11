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

**Cross-repository parity (from Prompt 9)**

- A repackaging must not change a rendered page. Any shared-component, design-token or core routing change in one repository must be evaluated for parity across all three sister repositories before committing.

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

## 7. Status

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
| Standalone tests           | Done — 1049 unit/component tests + 24 E2E tests |
| WCAG Contrast              | Done — 216 pairs pass                           |
| Operating manual           | Done — this file                                |
| Configuration guide        | Done — `docs/CONFIGURATION.md`                  |
| Baseline output parity     | **PASS — 0 differences** against `_baseline/`   |

---

## 8. Task log

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
