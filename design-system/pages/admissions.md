# Admissions / Get Started — overrides

Only what differs from [MASTER](../MASTER.md).

**Job of this page:** remove friction. This is the conversion page and the only page where the
form outranks the prose. Label is tenant terminology — _Admissions_ for a school, _Get Started_
for a business.

## Layout rhythm

Density `regular`, tightening to `compact` around the steps so the process reads as short. The
page must feel **shorter than it is** — a long admissions page loses applicants.

No decorative hero. Page title, one-sentence reassurance, then immediately the process.

## Steps

Numbered, horizontal on desktop (3–5 steps), vertical on mobile. Each step: number in a `full`
radius chip using `accent`, short title, one line of detail. Connector line between steps in
`border`, hidden under reduced motion if animated.

**Five steps maximum.** More than five reads as bureaucracy; group them.

## Form

Container `narrow`. Single column — **never two columns for form fields**, it doubles error rate
on mobile and breaks tab order expectations.

- Labels above fields, always visible. No placeholder-as-label.
- Group into ≤3 fieldsets with legends. Progressive disclosure only if genuinely conditional.
- Required marked with visible `*` plus `aria-required`.
- Errors: inline below the field, `destructive` border **plus an icon** so colour is not the only
  signal, tied by `aria-describedby`.
- On failed submit, an **error summary at the top receives focus** and links to each bad field.
- Submit is full-width on mobile, `lg` size, and disables itself while in flight with a visible
  busy state.
- Consent checkbox is never pre-ticked.
- Honeypot field is visually hidden **and** `aria-hidden` and `tabindex="-1"`.

**Demonstration mode.** When the tenant has configured no endpoint, the form states plainly that
nothing was submitted and surfaces the real contact routes instead. It never shows a fake success
message. This is a content requirement, not a styling one.

## Supporting content

Fee tables get the responsive table treatment — scrollable labelled region or stacked definition
list, never squashed.

Key dates as a compact date-led list, same visual language as the notice board.

FAQ accordion sits **below** the form, not above it. Someone ready to apply should not have to
scroll past questions.

Downloads (prospectus, forms) state file type and size in the link text.

## Conversion path

One primary action on this page. Alternative contact routes — phone, email, WhatsApp — are
secondary and sit beside the form, not competing with it.
