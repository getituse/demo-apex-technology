# News & Events — overrides

Only what differs from [MASTER](../MASTER.md).

**Job of this page:** prove the institution is alive and active. Recency is the message, so dates
are prominent and stale content is worse than no content.

## Layout rhythm

Density `regular`. Container `default`. No hero — the first item is the content.

Two streams on one page, clearly separated by an `h2` each: **Upcoming events** first (forward-
looking, higher intent), then **Latest news**. A tenant may enable only one.

## Events

Sorted soonest-first. Past events are **separated below** under their own heading, never mixed in,
and are visually de-emphasised (`muted` background, no CTA).

Event card: date block (day numeral in `h3`, month in `small`, `accent` background) → title →
time and venue meta row → short description → "Add to calendar" where enabled.

Date block is the anchor of the card — it should be scannable down the column at a glance.
An event card with no date is a content error; Zod rejects it at build.

## News

Sorted newest-first. First item may take a featured treatment at `default` width with a `16/9`
image; the rest run as a 3-column grid at `3/2`.

News card: image → date + category eyebrow → title (`h3`, links) → 2-line clamp → author where
present. Category is a badge, not a coloured border — colour alone must not encode category.

## Pagination

Real pagination with numbered links, not infinite scroll — infinite scroll breaks the footer,
breaks back-navigation, and is hostile to keyboard users. 12 items per page. Current page marked
with `aria-current="page"`.

## Detail page

Container `narrow`. Breadcrumbs → category badge → title → date and author → hero image `16/9`
with caption → prose at 68ch → share links → related items (3, same category where possible).

Prose gets real typographic treatment: `bodyLg` lead paragraph, generous paragraph spacing,
blockquote in `muted` with a `primary` left rule.

## Empty state

A new tenant has no news. The section must render an honest empty state — a short line and a link
onward — never a skeleton, never fabricated filler items.
