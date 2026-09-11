# Static deployment

Deployment guide for **Apex Institute of Technology**.

The website is a static prerendered application with **no runtime server, no database, and no serverless backend**. Every page is prerendered to static HTML, CSS, JavaScript, and asset files in `dist/`.

---

## 1. Build and preview

Use Node.js **22.18 or later**. Run all commands from the repository root:

```bash
# Production static build
npm run build

# Preview the production build locally at http://127.0.0.1:5412/
npm run preview
```

The output is written directly to `dist/`. Publish the contents of `dist/` to any static host or CDN.

---

## 2. Setting the public URL

Before building for production, set `siteUrl` in [`src/site/config.ts`](../src/site/config.ts):

```ts
export const rawConfig: TenantConfigInput = {
  id: "apex-technology",
  displayName: "Apex Institute of Technology",
  siteUrl: "https://apex-technology.example.com",
  // ...
};
```

`siteUrl` drives:

- Canonical link tags (`<link rel="canonical">`)
- Open Graph URLs (`og:url`)
- JSON-LD structured data IDs and URLs
- `sitemap.xml` absolute route URLs
- Asset base paths for subpath deployments (e.g. `https://example.com/apex`)

Format requirements: HTTPS origin, lowercase kebab-case path segments if using a subpath, and **no trailing slash**.

---

## 3. Host configuration

### Build settings

| Setting          | Value                                   |
| ---------------- | --------------------------------------- |
| Build command    | `npm ci --include=dev && npm run build` |
| Output directory | `dist`                                  |
| Node.js version  | `22.18.0` or later                      |

### Dependency acquisition

- **Cloud hosts (Cloudflare Pages, Vercel, Netlify, GitHub Actions):** Use `npm ci --include=dev` against public npm (`registry.npmjs.org`). Do not use `deps:install` on cloud hosts; `deps:install` is the local development workflow for machines behind an internal mirror.
- **Offline build:** Once dependencies are installed, `npm run build` is completely offline. It uses committed fonts and artwork, generating SEO artifacts locally.

### Static routing & 404 handling

The build generates `dist/404.html`, which includes full navigation, an accessible recovery message, and a `noindex,nofollow` robots tag:

- **Cloudflare Pages:** Automatically serves `404.html` on missing routes.
- **Netlify:** Automatically serves `404.html` on missing routes.
- **AWS S3 / CloudFront:** Configure the CloudFront distribution error page: HTTP 404 response page path `/404.html` with HTTP 404 status.
- **GitHub Pages:** Automatically serves `404.html`.

### The origin-root robots caveat

When deploying to a **subpath** (e.g. `https://example.com/apex`):
Web crawlers look for `robots.txt` **only at the origin root** (`https://example.com/robots.txt`). A `robots.txt` placed at `/apex/robots.txt` will be ignored by search engine spiders. If sharing an origin with other applications, ensure the origin root `robots.txt` references `/apex/sitemap.xml`.

Deploying to a dedicated domain or subdomain (e.g. `https://apex.example.com`) avoids this issue completely.

---

## 4. Generated static artifacts

The build generates the following artifacts in `dist/`:

- `sitemap.xml` — Canonical indexable routes with absolute URLs
- `robots.txt` — Search engine crawler directives and sitemap location
- `manifest.webmanifest` — Web application manifest
- `404.html` — Static HTTP 404 recovery document
- `favicon.svg` & derived PNG icons (`favicon-32.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`)
- `_redirects` & `.nojekyll` — Platform configuration files

---

## 5. Verification audits

Before deployment, run the verification audits:

```bash
# Verify static HTML generation, theme tokens, and asset isolation
node scripts/verify-static-output.mjs

# Audit static SEO metadata, canonical links, JSON-LD, and sitemap
node scripts/verify-seo-output.mjs

# Audit subpath base path deployment
node scripts/verify-base-path.mjs
```

Related documents: [docs/CONFIGURATION.md](CONFIGURATION.md), [docs/ARCHITECTURE.md](ARCHITECTURE.md), [docs/ENVIRONMENT.md](ENVIRONMENT.md).
