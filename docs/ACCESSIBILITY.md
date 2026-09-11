# Accessibility

Target: **WCAG 2.2 AA**.

This document records what is implemented, where it lives, and how each item is checked for Apex Institute of Technology.

## How verification is layered

| Layer                 | What it covers                                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Component tests       | Focus behaviour, keyboard interaction, labelling and ARIA wiring in jsdom, under [`tests/component`](../tests/component) |
| Unit tests            | Theme contrast, section composition, heading assignment, date and route contracts under [`tests/unit`](../tests/unit)    |
| End-to-end axe        | [`tests/e2e/accessibility.spec.ts`](../tests/e2e/accessibility.spec.ts) against built output                             |
| Browser audit scripts | Real Chromium runs over dev and production pages, listed at the end of this document                                     |
| Manual review         | Everything a tool cannot judge — wording, reading order, screen-reader experience, zoom                                  |

The end-to-end spec visits six configured key routes — home, about, programs, one program detail, news and events, and contact — resolved from the route manifest rather than hard-coded paths. [`playwright.config.ts`](../playwright.config.ts) defines a desktop project at 1440×960 (`apex-technology-desktop`) and a mobile project at 360×800 (`apex-technology-mobile`), so the six routes run at both sizes. Axe runs on the whole page with no `include`, `exclude`, or rule disabling, so shared header, navigation, and footer are in scope. Serious and critical findings are treated as blocking; all severities and incomplete results are attached to the report.

Automated tooling detects a minority of accessibility defects. A passing axe run is a floor, not a certificate.

---

## The checklist, as implemented

### Semantic landmarks and one H1

[`src/components/layout/SiteLayout.tsx`](../src/components/layout/SiteLayout.tsx) renders the page frame: a banner header, a single `main` with `id="main"` and `tabIndex={-1}`, and a footer. Navigation regions carry their own labels.

Exactly one H1 exists per page. [`src/routes/route-frame.tsx`](../src/routes/route-frame.tsx) renders the page heading, except where the composed sections own it: on the home page the first section with a persistent heading takes the H1 and the frame heading is hidden.
[`src/sections/SectionRenderer.tsx`](../src/sections/SectionRenderer.tsx) assigns that first heading and gives every later section an H2. A dismissible announcement bar can never own the page H1.

_Verified by:_ section and page composition unit tests; the end-to-end spec asserts exactly one H1 in the document, that the H1 is inside `main`, and that its text matches the route title.

### Heading order

Section headings render at H2 (or H1 when the section owns the page heading). Cards inside a section default to H3. Nested structures derive their level from the section rather than picking a size — text panels compute their own child level, and grouped downloads render a category heading above the cards in that group.

_Verified by:_ component tests for sections and cards; axe's heading-order rule in the end-to-end and script audits.

### Skip link

[`src/components/navigation/SkipToContent.tsx`](../src/components/navigation/SkipToContent.tsx) renders a first-in-DOM link to `#main`, visually hidden until focused, then displayed with a visible focus ring. `main` carries `tabIndex={-1}` so the target is programmatically focusable; without it the skip link would silently do nothing.

_Verified by:_ Axe's bypass rule covers the presence of a bypass mechanism on the audited routes.

### Keyboard operability and visible focus

Interactive primitives in [`src/components/ui/`](../src/components/ui) use Radix for accordion, dialog, navigation menu, select, and tabs behaviour, and apply a consistent `focus-visible` ring using the theme's ring token. Nothing important is hover-only: the desktop dropdown toggles on click and closes on Escape or outside pointer-down.

Cards are never clickable `div`s. [`src/components/ui/Card.tsx`](../src/components/ui/Card.tsx) exposes a `CardLink` that stretches over its card, so a whole-card click target has exactly one tab stop and a real href.

_Verified by:_ [`tests/component/navigation.test.tsx`](../tests/component/navigation.test.tsx), [`tests/component/primitives.test.tsx`](../tests/component/primitives.test.tsx), and [`tests/component/focus-regressions.test.tsx`](../tests/component/focus-regressions.test.tsx), which cover full forward and reverse tab traversal, wrap boundaries, arrow/Home/End accordion navigation, and Enter versus Space semantics on link buttons.

### Route change focus and the announcer

[`src/hooks/use-route-announcement.tsx`](../src/hooks/use-route-announcement.tsx) moves focus after a client navigation to the new page's H1, falling back to `main`. It waits for the DOM to actually belong to the destination — it checks the rendered `data-route-path` against the new pathname, and skips while an open dialog or an `aria-hidden`/`inert` ancestor still covers the page. It then writes "<page title>. Page loaded." into a polite, atomic live region rendered once at the app root.

_Verified by:_ [`tests/component/route-transition.test.tsx`](../tests/component/route-transition.test.tsx), which asserts focus on the committed heading after a forward transition and after Back, and [`tests/component/focus-regressions.test.tsx`](../tests/component/focus-regressions.test.tsx).

### Dialogs: focus trap, Escape, focus return

[`src/components/ui/Modal.tsx`](../src/components/ui/Modal.tsx) and [`src/components/ui/Drawer.tsx`](../src/components/ui/Drawer.tsx) wrap Radix Dialog with `aria-modal`, a labelled title, focus trapping, Escape-to-close, and body scroll lock.

Because both use `forceMount` for their exit animation, [`src/hooks/use-dialog-return-focus.ts`](../src/hooks/use-dialog-return-focus.ts) captures the previously focused element on open and restores it after the exit animation completes, waiting for Radix to finish removing `aria-hidden`/`inert`.

Positioning and animation are deliberately split across two elements so the animation cannot overwrite the centring transform.

_Verified by:_ component tests for modal, drawer, mobile navigation, and gallery viewer; UI and interactive browser scripts.

### Labelled icon-only controls

[`src/components/ui/IconButton.tsx`](../src/components/ui/IconButton.tsx) requires a `label` prop, applied as `aria-label`, and marks the icon `aria-hidden`. Dialog and drawer close buttons take a configurable close label.

_Verified by:_ primitive component tests; axe's button-name and ARIA rules in audits.

### Descriptive link text and whole-card links

Card actions are labelled with the record's own name or title rather than "Read more". Where an action label differs from the card title, [`src/components/cards/ContentCardFrame.tsx`](../src/components/cards/ContentCardFrame.tsx) appends a visually hidden " — <title>" so the accessible name is unambiguous out of context. The card itself is an `article` labelled by its heading, and contains exactly one focusable link.

_Verified by:_ card and section component tests; axe link-name rules in audits.

### Forms

[`src/components/ui/FormField.tsx`](../src/components/ui/FormField.tsx) owns ID wiring centrally: a `label` bound with `htmlFor`, a description ID and an error ID joined into `aria-describedby`, `aria-invalid` when in error, and the required state. A required field shows a decorative asterisk marked `aria-hidden` plus a visually hidden "(required)".

[`src/components/forms/ConfiguredForm.tsx`](../src/components/forms/ConfiguredForm.tsx) adds an error summary with `role="alert"`, made focusable with `tabIndex={-1}` and focused on each invalid submit attempt. Each summary entry is a link that moves focus to the offending control. Submission state is announced through a polite status region, and the form is `aria-busy` while sending. Controls sit in a fieldset that is disabled in server HTML and before hydration, with a `noscript` explanation.

_Verified by:_ [`tests/component/configured-form.test.tsx`](../tests/component/configured-form.test.tsx).

### No meaning by colour alone

Every state shown with colour also carries text or a semantic attribute: demo content renders a labelled badge rather than a tint; active navigation is `aria-current="page"` from NavLink; the current page in [`src/components/ui/Pagination.tsx`](../src/components/ui/Pagination.tsx) is marked `aria-current="page"`; listing results are described in a live text status line.

_Verified by:_ navigation, pagination, and collection-control component tests; axe colour-contrast rules in audits.

### Images

[`src/components/media/Image.tsx`](../src/components/media/Image.tsx) requires `alt`, `width`, and `height`. Empty alt marks the image decorative and sets `role="presentation"`. Intrinsic dimensions reserve the layout box.

See [docs/CONTENT-GUIDE.md](CONTENT-GUIDE.md) for authoring guidelines.

_Verified by:_ media and section component tests; browser audits checking intrinsic dimensions, lazy loading, and decoding.

### Reduced motion

[`src/lib/motion/MotionProvider.tsx`](../src/lib/motion/MotionProvider.tsx) sets `MotionConfig reducedMotion="user"` at the root. [`src/lib/motion/RouteTransition.tsx`](../src/lib/motion/RouteTransition.tsx) reads `useReducedMotion` and skips entry animations entirely.

_Verified by:_ [`tests/component/route-transition.test.tsx`](../tests/component/route-transition.test.tsx).

### Contrast

Thresholds in [`scripts/lib/contrast.mjs`](../scripts/lib/contrast.mjs): **4.5:1** for body text, **3:1** for large text and UI boundaries.

[`scripts/check-contrast.mjs`](../scripts/check-contrast.mjs) runs in the quality gate and [`tests/unit/theme-contrast.test.ts`](../tests/unit/theme-contrast.test.ts) runs in the test suite.

---

## Browser audit scripts

Run via VS Code process tasks or command line:

- [`scripts/verify-public-pages.mjs`](../scripts/verify-public-pages.mjs) — Public page accessibility, layouts, and route transitions
- [`scripts/verify-interactive-features.mjs`](../scripts/verify-interactive-features.mjs) — Forms, collection filters, and lightbox focus trap
- [`scripts/verify-sections.mjs`](../scripts/verify-sections.mjs) — Section renderings across viewports
- [`scripts/verify-editorial-dev.mjs`](../scripts/verify-editorial-dev.mjs) — Editorial content and dev routes
- [`scripts/verify-ui.mjs`](../scripts/verify-ui.mjs) — Modal and drawer keyboard focus interactions

Related documents: [docs/TESTING.md](TESTING.md), [docs/CONFIGURATION.md](CONFIGURATION.md), [docs/ARCHITECTURE.md](ARCHITECTURE.md).
