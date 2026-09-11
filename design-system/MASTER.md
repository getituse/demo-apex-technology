# Design system — MASTER

Visual source of truth for the white-label engine. Every shared component follows this file.
Where this document and the original project specification disagree on a **technical or
accessibility** requirement, the brief wins. On **visual** matters, this file wins.

**Scope note.** This is a _tenant-neutral_ system. It defines structure, rhythm, type, motion and
component anatomy. It does **not** define brand colour — that arrives per tenant through the six
theme presets in Phase 6. Nothing here may assume a particular hue.

---

## 0. Provenance

Generated with the UI UX Pro Max `design-system` skill, then verified against the brief.

|                      |                                                                                                       |
| -------------------- | ----------------------------------------------------------------------------------------------------- |
| Pattern              | **Trust & Authority + Conversion**                                                                    |
| Style                | **Accessible & Ethical** — `risk:low`, requires contrast-4.5, keyboard, visible-focus, reduced-motion |
| Type pairing         | **Lexend / Source Sans 3**                                                                            |
| Skill's "avoid" list | Playful design · hidden credentials · **AI purple/pink gradients**                                    |

**First query was rejected.** Searching `"education institution school college"` returned
**Claymorphism** with _Baloo 2 / Comic Neue_ — a children's-app direction. That suits a primary
school and nothing else in the tenant set; it would have looked absurd on a university or a
corporate training academy. Re-queried on _premium institutional editorial trust_ and took the
second result, which is the one recorded above. The skill's own contract requires this: verify the
result fits, retry once, never persist unverified output.

---

## 1. Visual direction

**Editorial, institutional, calm.** The engine sells trust before it sells anything else. Parents
choosing a school, students choosing a degree and companies buying training all make a
_considered_ decision — the interface should read as competent and permanent, not as a campaign.

Five principles, in priority order:

1. **Legibility is the brand.** Type is the primary design element. Generous measure, real
   hierarchy, no decorative text.
2. **Whitespace signals confidence.** Crowding reads as desperation. Sections breathe.
3. **Photography carries warmth; the interface stays quiet.** Colour and energy come from real
   imagery of real people, not from UI chrome.
4. **One decision per screenful.** Every section has a single obvious next action.
5. **Restraint over novelty.** No effect exists unless it aids comprehension.

**Deliberately not doing:** hero carousels, parallax stacks, animated counters as the main proof,
gradient meshes, glassmorphism, dark-mode-by-default, illustration-led branding.

---

## 2. Token architecture — three layers

From the skill's token model. The middle layer is exactly the list in section 8 of the brief.

```
PRIMITIVE      raw values, per theme preset          --navy-800: #1E3A5F
    │          never referenced by a component
    ▼
SEMANTIC       purpose aliases, the contract          --primary: var(--navy-800)
    │          THIS is what components consume
    ▼
COMPONENT      component-scoped derivations           --button-bg: var(--primary)
               optional; only where a component needs its own knob
```

**The rule that makes the engine work:** a component may reference **semantic** names only.
It must never see a primitive. That is why adding tenant #4 requires zero component edits, and
why `scripts/check-tenant-neutral.mjs` fails a build on a raw hex or a `blue-600`.

### Semantic tokens

Full set, with intent. Presets must define every one — the type is exhaustive, so a missing token
is a compile error.

| Token                                   | Intent                                                           |
| --------------------------------------- | ---------------------------------------------------------------- |
| `background` / `foreground`             | Page canvas and its default text                                 |
| `surface` / `surfaceElevated`           | Panels sitting on the canvas; elevated = overlays, sticky bars   |
| `card` / `cardForeground`               | Content card body and its text                                   |
| `primary` / `primaryForeground`         | Principal brand action. The apply/enquire button                 |
| `secondary` / `secondaryForeground`     | Supporting action; never competes with primary                   |
| `accent` / `accentForeground`           | Sparingly — highlights, active states, small emphasis            |
| `muted` / `mutedForeground`             | De-emphasised backgrounds and secondary text                     |
| `border` / `input` / `ring`             | Hairlines, field borders, focus ring                             |
| `success` / `warning` / `destructive`   | Status only. Never decoration                                    |
| `headerBackground`                      | Header may differ from page canvas (inverted, tinted)            |
| `footerBackground` / `footerForeground` | Footer is usually the one inverted zone                          |
| `sectionTint`                           | The alternating band colour that gives pages rhythm              |
| `radius`                                | Single corner radius scalar; presets vary it to change character |
| `shadowSm/Md/Lg`                        | Elevation ramp; presets vary weight                              |
| `fontHeading` / `fontBody`              | Preset-level typeface switch                                     |

### The six presets

The illustrative neutral baseline this section used to carry is gone — it was scaffolding for
Phase 5 and a second copy of the tokens would let a broken theme still look plausible. The real
palettes live in [`src/themes/theme-presets.ts`](../src/themes/theme-presets.ts), and the token
vocabulary they fill is owned by [`src/themes/theme-types.ts`](../src/themes/theme-types.ts).

They differ in more than hue — a tenant should be recognisable with the logo cropped out:

| Preset               | Palette                                  | Headings | Radius     | Elevation       |
| -------------------- | ---------------------------------------- | -------- | ---------- | --------------- |
| `classic-academic`   | Navy, restrained gold, ivory             | Serif    | `0.125rem` | Tight, dry      |
| `modern-campus`      | Cobalt, deep cyan, clean neutrals        | Sans     | `0.625rem` | Cooler, visible |
| `primary-school`     | Teal, warm orange, cream                 | Rounded  | `1rem`     | Soft, wide      |
| `premium-university` | Burgundy, champagne, charcoal            | Serif    | `0.375rem` | Softest, widest |
| `green-campus`       | Forest green, leaf green, warm off-white | Sans     | `0.75rem`  | Green-tinted    |
| `corporate-academy`  | Indigo, slate, white                     | Sans     | `0.25rem`  | Crisp, neutral  |

**Targets, enforced by `scripts/check-contrast.mjs` inside `npm run check`:** body text
**4.5:1**; large text (≥24px, or ≥19px bold) and UI boundaries **3:1**. 216 pairs across the six
presets. Fix the preset, never the threshold.

Two deliberate choices the script encodes:

- `border` is checked at 3:1 against every surface it is drawn on. That is **stricter than WCAG
  1.4.11**, which exempts purely decorative separators — but this system prefers a visible hairline
  to a shadow, so the hairline has to be visible.
- Section 8 defines no `destructiveForeground`, so a filled destructive control reuses
  `primaryForeground`. That pair is checked, so the convention is enforced rather than assumed.

---

## 3. Typography

**Self-hosted original fonts (2026-09-07).** The temporary system-only substitution is retired.
Original WOFF2 files and unmodified OFL notices ship under `public/fonts/`; runtime requests stay
on the site's own origin. No Google Fonts, GitHub or Artifactory access is needed by a visitor or
by a normal build. The acquisition script is explicit maintenance, never a build step.

| Preset               | Heading        | Body          |
| -------------------- | -------------- | ------------- |
| `classic-academic`   | Source Serif 4 | Source Sans 3 |
| `modern-campus`      | Lexend         | Source Sans 3 |
| `primary-school`     | Nunito         | Source Sans 3 |
| `premium-university` | Lora           | Source Sans 3 |
| `green-campus`       | Lexend         | Source Sans 3 |
| `corporate-academy`  | Inter          | Inter         |

These explicit choices apply the recorded Lexend/Source Sans 3 pairing to editorial sans presets,
preserve serif/rounded intent and give the corporate preset one restrained family. An undocumented
exact historical per-preset mapping is not claimed. Components still use semantic font tokens only.

**Weights 400 / 500 / 600 / 700.** Normal variable faces expose 400–700, with Latin and
Latin-extended Unicode ranges. Twelve unmodified WOFF2 files total **521,764 bytes** on disk;
browsers fetch only used families/subsets (at most two families per current preset). Italic-specific
faces and non-Latin subsets are not supplied; browser/system fallbacks cover those cases.

Each face uses `font-display: swap` and explicit system/generic fallbacks. Text remains available
during loading/failure; swaps can still change text metrics. No blanket font preloads fetch unused
families. `font-assets.json` records sources, byte counts, SHA-512 and license provenance; tests
match those records and CSS descriptors against the actual files.

### Fluid scale

`clamp()` throughout, so nothing needs a breakpoint to stay readable.

| Step      | Size                                        | Use                         |
| --------- | ------------------------------------------- | --------------------------- |
| `display` | `clamp(2.5rem, 1.8rem + 3.5vw, 4.5rem)`     | Hero headline. One per page |
| `h1`      | `clamp(2rem, 1.5rem + 2.5vw, 3.25rem)`      | Page title                  |
| `h2`      | `clamp(1.625rem, 1.35rem + 1.4vw, 2.25rem)` | Section heading             |
| `h3`      | `clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem)`   | Card / subsection           |
| `h4`      | `1.125rem`                                  | Minor heading               |
| `body`    | `1rem` (16px floor, never smaller)          | Prose                       |
| `bodyLg`  | `1.125rem`                                  | Lead paragraph              |
| `small`   | `0.875rem`                                  | Meta, captions, labels      |

**Never below 16px for body copy**, and never shrink text to force a single line — wrap instead.

**Line height:** display/h1 `1.1` · h2/h3 `1.2` · body `1.6` · small `1.5`.
**Measure:** 60–75 characters for prose (`max-w-[68ch]`). Long institution names must wrap
gracefully — test "Apex Institute of Technology" at 360px.
**Tracking:** `-0.02em` on display and h1; `0` elsewhere.

---

## 4. Spacing, containers, grid

**4px base.** Scale: `0.5 1 2 3 4 6 8 12 16 20 24 32` → 2px…128px.

**Section vertical rhythm** — the single biggest lever on perceived quality:

| Density    | Mobile | Desktop |
| ---------- | ------ | ------- |
| `compact`  | 40px   | 64px    |
| `regular`  | 64px   | 96px    |
| `spacious` | 80px   | 128px   |

Density is a per-section config prop. `premium-university` and `green-campus` default to
`spacious`; `primary-school` to `regular`.

**Containers:** `narrow` 720px (prose, forms) · `default` 1200px (most sections) ·
`wide` 1440px (galleries, full-bleed media) · gutters 16px mobile / 24px tablet / 32px desktop.

**Grid:** 12 columns desktop, 8 tablet, 4 mobile. Card grids: 1 col <640px, 2 at 640, 3 at 1024,
4 at 1280 for dense sets. **A card never goes below 280px wide** — drop a column instead.

---

## 5. Radius, elevation, borders

**Radius** driven by one preset scalar `--radius`, defaulting to 8px.
Derived: `sm = radius/2` · `md = radius` · `lg = radius*1.5` · `full = 9999px` (pills, avatars).
`corporate-academy` uses 4px (sharper, more formal); `primary-school` 16px (friendlier).
**Never above 24px on a card** — the brief bans "excessively rounded".

**Elevation — four levels only.** Shadows are for _separation_, never decoration.

| Level  | Use                                            |
| ------ | ---------------------------------------------- |
| `none` | Default. Most cards use a border, not a shadow |
| `sm`   | Hover lift on interactive cards                |
| `md`   | Sticky header once scrolled; dropdowns         |
| `lg`   | Modals and drawers only                        |

**Prefer a 1px `border` hairline over a shadow.** It is calmer, faster, and survives dark mode.

---

## 6. Component specs

Using the skill's state-table pattern. Full anatomy lands in Phase 7; this is the contract.

### Button

| Property   | Default             | Hover           | Active          | Focus                      | Disabled          |
| ---------- | ------------------- | --------------- | --------------- | -------------------------- | ----------------- |
| Background | `primary`           | `primary` @ 92% | `primary` @ 88% | unchanged                  | `muted`           |
| Text       | `primaryForeground` | same            | same            | same                       | `mutedForeground` |
| Shadow     | none                | `sm`            | none            | none                       | none              |
| Ring       | none                | none            | none            | **3px `ring`, 2px offset** | none              |
| Cursor     | `pointer`           | `pointer`       | `pointer`       | —                          | `not-allowed`     |

Variants: `primary` · `secondary` · `outline` · `ghost` · `link` · `destructive`.
Sizes: `sm` 36px · `md` 44px · `lg` 52px. **44×44px minimum touch target** on mobile for every
variant. Transition `180ms ease-out` on background/shadow only.

### Card

Border `1px border` · radius `md` · background `card` · padding 24px (20px mobile).
Interactive cards lift to shadow `sm` and shift the border toward `primary` on hover.
**A card is never a clickable `div`.** The heading contains the link; the whole card is a hover
target via `::after` overlay. No nested interactive controls inside a linked card.

### Navigation

Header 72px desktop / 60px mobile. Sticky, with shadow `md` appearing only after ~80px of scroll —
no shrink animation, no hide-on-scroll. Active item marked with `aria-current="page"` **and** a
2px underline in `primary` (never colour alone). Dropdowns open on click _and_ keyboard, never
hover-only. Mobile drawer: right slide-in, focus trapped, Escape closes, focus returns to trigger,
body scroll locked.

### Form

Label always visible above the field — **never placeholder-as-label**. Field height 44px, radius
`sm`, border `input`. Focus: 3px `ring` + border shift. Error: 2px `destructive` border, message
below in `destructive` tied by `aria-describedby`, plus an **icon or text prefix** so the error is
not signalled by colour alone. Required marked with a visible `*` and `aria-required`.

### Image

Every image declares `width`/`height` or an `aspect-ratio` — **no layout shift, ever**.
Ratios: hero `16/9` desktop, `4/3` mobile · card `3/2` · portrait `4/5` · gallery `1/1`.
`object-fit: cover` with configurable focal position. Lazy + `decoding="async"` below the fold;
`fetchpriority="high"` on the hero only. Overlay for text-on-image is a **linear gradient scrim**,
not a flat wash, and the text must still hit 4.5:1 against the darkest scrim point.
**No text baked into image files.**

---

## 7. Motion

Centralised in `src/lib/motion/`. Components import variants; they never define their own.
Package `motion`, imports from `motion/react`.

**Duration bands** (from the brief):

| Band    | Duration  | Applies to                         |
| ------- | --------- | ---------------------------------- |
| Micro   | 150–220ms | Hover, focus, button press, toggle |
| Overlay | 180–300ms | Dropdown, drawer, modal, tooltip   |
| Reveal  | 350–550ms | Section entrance, staggered lists  |

**Easing:** entrances `cubic-bezier(0.16, 1, 0.3, 1)` (decelerate) · exits `ease-in` and ~30%
faster than the entrance · never `linear` except opacity crossfades.

**Rules**

- **Opacity and transform only.** Never animate layout properties.
- Entrance offset is small — 8–16px of travel, no more.
- **Above-the-fold content never waits on animation.** The hero headline is readable at 0ms.
- Stagger children at 40–60ms, capped at ~6 items; beyond that reveal the group as one.
- No per-card independent animation on a grid. The grid animates, not 12 separate cards.
- Parallax: desktop only, ≤20px of travel, **disabled entirely** under reduced motion.
- Interrupted animations must settle in a correct semantic state, never mid-transform.
- Route navigation uses a 180ms entry-only opacity fade; the old page unmounts immediately.
  Initial HTML is fully visible and reduced-motion navigation skips the entrance. This avoids
  stale focus targets and duplicate interactive pages during exit animations.
- `MotionConfig reducedMotion="user"` at the root; `LazyMotion` + `domAnimation` to keep the
  bundle down.

**Under `prefers-reduced-motion`:** transforms drop to opacity-only at 120ms, parallax and
autoplay are off, and every piece of content remains reachable and readable.

---

## 8. Accessibility

WCAG 2.2 AA is a floor, not a target. The skill's style profile requires
`contrast-text-4.5, keyboard, visible-focus, reduced-motion` — all four are non-negotiable.

- **Focus ring 3px** in `ring` with 2px offset, on every interactive element. Never `outline: none`
  without an equally visible replacement. Focus must not be obscured by sticky headers.
- One logical `h1` per page; heading levels never skip.
- Landmarks: `header` / `nav` / `main` / `footer`, plus a skip-to-content link as the first
  focusable element.
- **44×44px minimum** touch targets.
- Colour alone never carries meaning — pair with icon, text or underline.
- Icon-only controls carry an accessible name; decorative icons get `aria-hidden="true"`.
- Descriptive link text. Never "click here" or a bare "read more" without context.
- Alt text from content data; **empty `alt=""` for decorative images**.
- Text remains usable at **200% zoom** and under browser text scaling — no clipped headings,
  buttons, badges or nav labels.
- Correct `lang` attribute from tenant `defaultLocale`.
- Route change moves focus to the page heading and announces it.

**Carousels** — the brief prefers none. If a tenant genuinely needs one: no autoplay by default;
previous/next controls that are real keyboard equivalents; visible pause/stop; pauses on hover and
on focus; renders as a **static set** under reduced motion; understandable with animation off.

---

## 9. Responsive behaviour

Mobile-first. Verify at **360 · 375 · 390 · 768 · 1024 · 1280 · 1440**.

| Width     | What must hold                                                                          |
| --------- | --------------------------------------------------------------------------------------- |
| 360       | No horizontal scroll anywhere. Drawer nav. Single column. Buttons full-width or stacked |
| 375 / 390 | Hero headline ≤4 lines. Long institution names wrap, never truncate                     |
| 768       | 2-column card grids. Nav still drawer-based                                             |
| 1024      | Desktop nav appears. 3-column grids. Split hero becomes side-by-side                    |
| 1280      | 4-column dense grids. Container caps at 1200px                                          |
| 1440      | Container stays capped; gutters grow. No full-bleed text                                |

Tables get a responsive treatment — horizontal scroll within a labelled region, or a stacked
definition-list layout. Never a squashed table.

---

## 10. Anti-patterns

Hard bans. `scripts/check-tenant-neutral.mjs` catches the token violations; the rest are review items.

**Visual** — purple/pink "AI" gradients (the skill bans these explicitly) · glassmorphism ·
floating blobs · neon · gradient mesh backgrounds · excessive shadows · cards rounded past 24px ·
emoji as UI icons (use Lucide) · full-viewport empty heroes.

**Content** — Lorem Ipsum · fake accreditations, rankings, awards, recruiter logos · invented
placement percentages or student counts · unlabelled demo statistics · stock imagery implied to
be the real campus.

**Interaction** — autoplaying carousels · hover-only navigation · clickable `div`s · nested
interactive controls · placeholder-as-label · motion on every element · content that waits on an
animation · parallax on mobile · autoplaying video with sound.

**Technical** — raw hex or Tailwind palette classes in shared components · tenant names or the
words _school / student / admission / faculty / campus_ hardcoded in shared components ·
`dangerouslySetInnerHTML` · text baked into images · images without dimensions.

---

## 11. Pre-delivery checklist

From the skill, extended for this project.

- [ ] No emoji as icons — Lucide SVG only
- [ ] `cursor-pointer` on every clickable element
- [ ] Hover transitions 150–300ms
- [ ] Body text contrast ≥4.5:1; large text and UI boundaries ≥3:1
- [ ] Focus visible on every interactive element, not obscured by sticky UI
- [ ] `prefers-reduced-motion` respected end to end
- [ ] Verified at 360 / 375 / 390 / 768 / 1024 / 1280 / 1440
- [ ] Readable and operable at 200% zoom
- [ ] One `h1` per page, no skipped heading levels
- [ ] Every image has dimensions or an aspect ratio
- [ ] No tenant-specific string in any shared component
- [ ] Every colour comes from a semantic token
