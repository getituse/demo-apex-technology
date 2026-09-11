# Contact — overrides

Only what differs from [MASTER](../MASTER.md).

**Job of this page:** get someone to the right person in the fewest possible actions. Most
visitors arrive here wanting a phone number, not a form.

## Layout rhythm

Density `regular`. Two-column at 1024: contact details left, form right. Stacks **details-first**
on mobile — the phone number must not sit below a long form.

No hero. Page title, one line, straight into content.

## Contact details

Details come before the form in the DOM as well as visually. Each channel is a real link:

| Channel  | Behaviour                                                    |
| -------- | ------------------------------------------------------------ |
| Phone    | `tel:` link, tappable, formatted for reading not for storage |
| Email    | `mailto:` link, address visible as text                      |
| WhatsApp | `https://wa.me/…` where the tenant enables it                |
| Address  | Plain text plus a "Directions" link opening the map provider |
| Hours    | Definition list, today's hours emphasised where feasible     |

External links carry `rel="noopener noreferrer"`. Icon-only channel buttons are forbidden here —
every channel has a visible text label.

Multiple locations render as a stacked set of labelled blocks, each with its own directions link.
Never a tabbed interface for locations — it hides addresses from search and from print.

## Departmental routing

Where the tenant defines departments (admissions, accounts, general), list them as a simple
definition list with a name, role and channel. This single element removes the most common reason
people call the wrong number.

## Form

Same rules as the Admissions form — single column, labels above, error summary focused on failed
submit, honest demonstration mode when no endpoint is configured.

Shorter than the admissions form: name, email, subject, message, consent. Nothing else.
A contact form asking for a date of birth is a dark pattern.

## Map

Lazy-loaded, **never an autoplaying embed above the fold**. Fixed `16/9` with declared dimensions
so it cannot shift layout. Must have a text address adjacent — the map is an enhancement, and the
address must be readable and copyable without it.

If the tenant provides no map, the section is disabled. No grey placeholder rectangle.

## Portals

External student / parent / application portal links, where configured, sit in a distinct block
with a clear "opens an external site" affordance. These are high-traffic for returning visitors
and should not be buried under the form.
