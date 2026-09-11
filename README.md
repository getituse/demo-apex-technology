# Apex Institute of Technology

Official website for **Apex Institute of Technology**, a modern, fully responsive, and accessible static website built with React Router v7 Framework Mode (static prerender), Tailwind CSS, Radix UI, and Motion.

There is **no backend, no runtime server, and no database**. Every page is prerendered to static HTML and assets at build time into `dist/`, deployable to any static host or CDN.

---

## Current State & Demonstration Material

- **Demonstration Content:** All faculty names, research metrics, degree programs, campus events, and course catalogs are sample demonstration materials created for presentation and layout verification. Legal and academic approval is required before production launch.
- **Local Media & Fonts:** All illustrations and icons are local SVG assets; fonts are self-hosted WOFF2 files with Open Font License (OFL) notices in `public/fonts/`. No third-party runtime font or image CDNs are used.
- **Demonstration Forms:** Contact and enrollment inquiry forms operate in an explicit demonstration mode with client-side Zod validation and transparent status messaging. No submission data is sent or stored without configured endpoints. See [docs/INTERACTIONS.md](docs/INTERACTIONS.md).

---

## Technologies

| Area                | Choice                                                                     |
| ------------------- | -------------------------------------------------------------------------- |
| Framework           | React 19                                                                   |
| Routing & Prerender | React Router v7 (Framework Mode, `ssr: false` with static prerendering)    |
| Bundler             | Vite 7                                                                     |
| Language            | TypeScript 5 (strict, `noUncheckedIndexedAccess`)                          |
| Styling             | Tailwind CSS v3 over semantic CSS-variable design tokens                   |
| Animation           | Motion (`motion/react`) with strict `reducedMotion: "user"` support        |
| Primitives          | Radix UI (Accordion, Dialog, Navigation Menu, Select, Tabs) & Lucide icons |
| Validation          | Zod schema validation for all site configuration and content               |
| Testing             | Vitest, React Testing Library, Playwright (Chromium) & axe-core            |
| Quality Gates       | ESLint, Prettier, tenant-neutrality gate, WCAG contrast gate               |

---

## Quick Start

### Prerequisites

- Node.js ≥ 22.18

### Development Server

Starts the local development server at `http://127.0.0.1:5412/`:

```bash
npm run dev
```

### Production Build

Prerenders all routes to static HTML and assets in `dist/`:

```bash
npm run build
```

### Preview Built Site

Serves the static production build from `dist/` locally on `http://127.0.0.1:5412/`:

```bash
npm run preview
```

---

## Validation & Testing

Every script listed below is executed and verified:

```bash
# Run full quality gate (format check, lint, neutrality gate, typecheck, contrast, tests)
npm run check

# Run unit and component test suites (Vitest)
npm run test

# Run end-to-end tests including automated axe accessibility scans (Playwright)
npm run test:e2e

# Check WCAG contrast compliance for theme presets
npm run check:contrast

# Format code with Prettier
npm run format
npm run format:check

# Typecheck TypeScript source
npm run typecheck

# Lint with ESLint and tenant-neutrality gate
npm run lint
```

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
```

---

## Project Structure

```
.
├── .vscode/tasks.json          Shell-independent VS Code process tasks
├── docs/                       Architecture, theming, configuration, and deployment guides
├── design-system/              Visual design system reference and guidelines
├── public/
│   ├── fonts/                  Self-hosted WOFF2 font files and OFL notices
│   └── tenants/apex-technology/    Brand logos, icons, and downloadable documents
├── scripts/                    Verification, diagnostic, and build maintenance scripts
├── src/
│   ├── site/                   Site configuration, editorial content, and page sections
│   ├── components/             Accessible, tenant-neutral UI components and primitives
│   ├── routes/                 React Router route modules and static layout frames
│   ├── sections/               Page section implementations and collection views
│   ├── themes/                 Semantic token definitions and presets
│   └── root.tsx                Root document frame with inline prerendered theme tokens
├── tests/
│   ├── unit/  component/       Vitest test suites
│   └── e2e/                    Playwright test suites
├── dist/                       Production output directory (generated)
└── package.json
```

---

## Documentation Index

- [docs/CONFIGURATION.md](docs/CONFIGURATION.md) — How to modify branding, terminology, theme, pages, and content.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — Architecture overview, prerendering pipeline, and design decisions.
- [docs/THEMING.md](docs/THEMING.md) — Design tokens, color system, and typography.
- [docs/CONTENT-GUIDE.md](docs/CONTENT-GUIDE.md) — Content schemas, sections, cards, and media authoring.
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — Static hosting instructions, domain configuration, and SEO.
- [docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md) — WCAG 2.2 AA accessibility contracts and keyboard navigation.
- [docs/TESTING.md](docs/TESTING.md) — Testing strategy, E2E fixtures, and verification scripts.
- [docs/INTERACTIONS.md](docs/INTERACTIONS.md) — Forms, collection filters, and gallery lightbox behavior.
- [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) — Machine capabilities and dependency acquisition.
- [docs/ISOLATION.md](docs/ISOLATION.md) — Standalone verification and repository independence.
- [AGENTS.md](AGENTS.md) — Repository operating manual, hard rules, and bug log.
