# Interactive features and forms

Behavior and contracts for forms, paginated listings, and media viewers for Apex Institute of Technology.

---

## 1. Forms

Five form types are configured in [`src/site/config.ts`](../src/site/config.ts):

- `contact` — General inquiries on the contact page
- `visit` — Campus visit requests on the visit page
- `feedback` — Community feedback on the feedback page
- `enquiry` — Program and admissions inquiries on conversion routes
- `newsletter` — Email newsletter subscriptions

Forms operate in an explicit **demonstration mode** when no submission endpoint is configured. Client-side Zod validation runs on submit; invalid fields focus the error summary; valid demonstration submissions display a transparent status notice explaining that no network call was made.

### Required settings for every form

| Setting          | Contract                                                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `enabled`        | Boolean; controls whether the form is rendered.                                                                          |
| `method`         | Exactly `GET` or `POST`.                                                                                                 |
| `successMessage` | Text displayed upon successful submission acknowledgement.                                                               |
| `errorMessage`   | Text displayed when a submission fails.                                                                                  |
| `requiredFields` | Array of required field IDs (`name`, `email`, `phone`, `subject`, `message`, `programSlug`, `preferredDate`, `consent`). |

Implementation: [`src/components/forms/ConfiguredForm.tsx`](../src/components/forms/ConfiguredForm.tsx).

---

## 2. News and event listings

The site configuration in [`src/site/config.ts`](../src/site/config.ts) sets:

- News listings: `pageSize: 3`, `categoryFiltering: true`
- Event listings: `pageSize: 2`, `categoryFiltering: true`

### Local pagination and filtering

[`src/components/collections/PaginatedCollection.tsx`](../src/components/collections/PaginatedCollection.tsx) prerenders **every record** in the initial static HTML, ensuring no-JavaScript readers and search crawlers retain full access to all articles and events.

After client hydration:

- A labelled category `<select>` filters records without route transitions or network fetches.
- Page controls use `<button>` elements (not links) with announced result counts.
- Category changes return to page 1; page changes move focus to the top of the results list.
- Filtered states do not change the canonical URL or create redundant sitemap entries.

### Date sorting and reference time

- News sorts newest first by `publishedAt`.
- Events sort upcoming/ongoing first (soonest first) and past events (newest first).
- Prerendered HTML serializes a route-time snapshot (`referenceTime`) so initial hydration matches static HTML exactly. Client navigation refreshes this snapshot locally. See [`src/routes/collection-dates.ts`](../src/routes/collection-dates.ts).

---

## 3. Image gallery and lightbox

The image gallery section ([`src/sections/ImageGallerySection.tsx`](../src/sections/ImageGallerySection.tsx)) supports responsive grid and masonry layouts:

- All images and captions are rendered in the initial HTML with intrinsic dimensions and lazy loading.
- Activating a thumbnail opens the accessible lightbox dialog ([`src/sections/GalleryViewer.tsx`](../src/sections/GalleryViewer.tsx)).
- Lightbox traps focus, closes on Escape or backdrop click, returns focus to the triggering thumbnail, and supports Left/Right keyboard navigation.
- Animations respect `prefers-reduced-motion`.

Related documents: [docs/CONFIGURATION.md](CONFIGURATION.md), [docs/ACCESSIBILITY.md](ACCESSIBILITY.md), [docs/TESTING.md](TESTING.md).
