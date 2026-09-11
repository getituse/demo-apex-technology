# Academics / Programs / Services — overrides

Only what differs from [MASTER](../MASTER.md).

**Job of this page:** let someone find the right programme fast, and understand it without leaving
the page. The label is tenant terminology — _Academics_, _Programs_, _Courses_ or _Services_ — so
nothing in the layout may assume the word.

## Layout rhythm

**Index page, not a story.** Density `regular`. Short intro (≤60 words), then straight into the
grid. No hero image — the cards are the content and should be visible immediately.

If the tenant has departments, they become grouping headings with their own card grids beneath.
Otherwise a single flat grid.

## Card grid

3 columns at 1024, 2 at 640, 1 below. Dense sets go to 4 at 1280. **Never below 280px per card.**

Card anatomy: image `3/2` → eyebrow (department or level) → title (`h3`, contains the link) →
2-line description clamp → meta row (duration, mode, intake) → chevron affordance.
Equal-height cards; the meta row pins to the bottom so rows align.

Filtering, when the tenant enables it, is a row of toggle chips above the grid — real buttons with
`aria-pressed`, keyboard operable, never a hover menu. Results count is announced politely.

## Detail page

Container `narrow` for prose, `default` for the surrounding chrome.

Order: breadcrumbs → title → key facts strip (duration, mode, start, fee if published) → overview
prose → outcomes list → structure/modules accordion → entry requirements → related programmes →
CTA to the conversion page.

The key facts strip is a definition list, not a table. On mobile it stacks; it never scrolls
horizontally.

**Modules accordion** — single-expand is wrong here; allow multiple open. Keyboard operable,
headings are real buttons, content is not hidden from search.

## Empty state

A tenant may legitimately have one programme. The grid must look deliberate at n=1 — a single card
centred at `narrow` width, not one card stranded in a 3-column grid.
