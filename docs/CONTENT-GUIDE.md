# Content guide

How site content is authored, validated and composed into pages for Apex Institute of Technology.

Content is authored in TypeScript, not JSON, so errors are caught at compile time. Every record is validated by Zod schemas at build time; invalid content fails the build rather than rendering a degraded page.

---

## Where content lives

All editorial and media content lives in [`src/site/content/`](../src/site/content/):

- [`src/site/content/index.ts`](../src/site/content/index.ts) — Assembles and exports the complete content object
- [`src/site/content/editorial.ts`](../src/site/content/editorial.ts) — The written collections (news, events, programs, people, testimonials, facilities, stats, policies, FAQs)
- [`src/site/content/media.ts`](../src/site/content/media.ts) — Gallery images and downloadable documents
- [`src/site/content/sections.ts`](../src/site/content/sections.ts) — Composed page section arrays for each enabled route
- [`src/site/config.ts`](../src/site/config.ts) — Institutional branding, navigation, terminology, features, and page enablements

The schema definitions live in [`src/config/content-schema.ts`](../src/config/content-schema.ts) and [`src/config/tenant-schema.ts`](../src/config/tenant-schema.ts).

Body copy is always an array of plain strings, one string per paragraph. No raw HTML injection is permitted.

Every image is an object with `src`, `alt`, `width`, and `height`. Intrinsic dimensions are required so the browser reserves layout space before media loads.

---

## The twelve collections

| Collection     | Key    | Required fields                                              | Optional fields                                                                                     | `isDemoContent` |
| -------------- | ------ | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- | --------------- |
| `news`         | `slug` | `title`, `excerpt` (≤320), `body`, `publishedAt`, `category` | `image`                                                                                             | required        |
| `events`       | `slug` | `title`, `summary` (≤320), `body`, `startsAt`, `location`    | `endsAt`, `category`, `registrationUrl` (https), `image`                                            | required        |
| `programs`     | `slug` | `name`, `summary` (≤320), `body`, `highlights` (≥1)          | `structuredDataKind` (`Course`/`Service`), `departmentSlug`, `levelLabel`, `durationLabel`, `image` | required        |
| `departments`  | `slug` | `name`, `summary` (≤320), `body`                             | `leadPersonSlug`, `image`                                                                           | required        |
| `people`       | `slug` | `name`, `role`, `credentials` (array), `bio`                 | `departmentSlug`, `email`, `image`                                                                  | required        |
| `testimonials` | `id`   | `quote` (≤600), `authorName`, `authorRole`                   | `image`                                                                                             | required        |
| `facilities`   | `slug` | `name`, `summary` (≤320), `body`                             | `image`                                                                                             | required        |
| `stats`        | `id`   | `label`, `value`                                             | `caption`                                                                                           | required        |
| `gallery`      | `id`   | `album`, `image`                                             | `caption`                                                                                           | absent          |
| `downloads`    | `id`   | `title`, `file`, `fileType`, `fileSizeKb`, `updatedAt`       | `category`, `description`                                                                           | absent          |
| `faqs`         | `id`   | `question`, `answer` (paragraph array)                       | `category`                                                                                          | absent          |
| `policies`     | `slug` | `title`, `body`, `updatedAt`                                 | —                                                                                                   | absent          |

### `isDemoContent` is required

Collections that carry statistics, credentials, or attributed claims require an explicit `isDemoContent: boolean` flag: `news`, `events`, `programs`, `departments`, `people`, `testimonials`, `facilities`, and `stats`. This flag renders a visible badge on cards and metrics, ensuring demonstration content is never mistaken for verified institutional facts.

Gallery items, downloads, FAQs, and policies do not carry the flag; policies carry their demonstration disclaimer inside their text, and the site footer displays `legal.demoContentNotice`.

---

## Composing pages with sections

The `pageSections` object in [`src/site/content/sections.ts`](../src/site/content/sections.ts) maps page identifiers to arrays of section definitions:

```ts
export const pageSections: Record<string, SectionConfig[]> = {
  home: [
    {
      id: "hero-home",
      type: "hero",
      variant: "split",
      heading: "Pioneering technological frontiers with rigorous research",
      // ...
    },
    // ...
  ],
};
```

Sections support live data binding:

- Setting `contentSource: "news"` or `"events"` dynamically binds the section to collection records.
- Bound sections use [`src/routes/page-sections.ts`](../src/routes/page-sections.ts) to filter and resolve card links against the route manifest.

---

## Verification

To verify content and editorial assets:

```bash
# Check formatting, TypeScript types, and Zod schema adherence
npm run check

# Verify editorial and collection authoring
node scripts/verify-editorial-dev.mjs
```

Related documents: [docs/CONFIGURATION.md](CONFIGURATION.md), [docs/ARCHITECTURE.md](ARCHITECTURE.md), [docs/INTERACTIONS.md](INTERACTIONS.md), [docs/ACCESSIBILITY.md](ACCESSIBILITY.md).
