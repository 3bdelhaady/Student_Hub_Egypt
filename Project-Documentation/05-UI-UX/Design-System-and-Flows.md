# Design system and user flows

## Interface direction

The website is Arabic-only with RTL layout. The English documentation language does not reopen language switching. Saved English preferences must not bypass the Arabic-only rule. The visual system uses the existing Cairo font assets, teal/mint authentication/student surfaces, dark administrative headers, cards, controlled forms and responsive layouts. Exact tokens and breakpoints live in `src/app/globals.css`; components, not this prose, determine rendered spacing.

No fresh wireframe is invented for an already implemented screen. Current components and inspected screenshots are the as-built reference; the Figma reference has not been independently re-audited in full for this documentation. Do not claim pixel equality from automated accessibility checks.

## Key screens and flows

| Area           | Main flow                                                                        | Guardrail                                                            |
| -------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Home/discovery | Universities, academic and service discovery -> relevant detail/signup           | Public content must not expose protected bodies.                     |
| Signup         | Type -> controlled scope -> credentials -> pending review                        | No public admin/Coordinator signup.                                  |
| Account        | Status, university/faculty, profile and correction/retry                         | Identity can exist without successful membership request.            |
| Student space  | Courses, personal learning, services, requests, notifications                    | Scope and publication checks remain server-side.                     |
| Coordinator    | Profile mode switch -> assigned management workspace                             | Existing student identity, no new authority from switch.             |
| Agent          | Assigned sections -> draft/edit/publish -> requests                              | Section rights plus active parent scope.                             |
| Admin          | Institutions, agents, students, organizations and inbox                          | Search whole DB, bounded 100 matching results; no new pagination UI. |
| Card/checkout  | Zero balance, unavailable top-up/electronic payment, supported cash/request path | No success wording for a failed debit.                               |
| Email security | Verification/resend and recovery/reset pages                                     | Implemented, hidden until explicitly configured.                     |

## Form behavior

Use native controls where already selected, including restaurant opening/closing time pickers. Restaurant profile belongs only to restaurant-category institutions; normal agents see it read-only. Preserve status placement and row actions. Server messages should be safe and tell the person what they can do next, without exposing account existence or unrelated data.

## Accessibility and responsiveness

Use semantic labels, focusable controls, keyboard flows, error/status roles and no horizontal page overflow at tested widths. Existing tests include Axe tags for WCAG2A/AA and WCAG2.1AA on selected pages. These checks do not certify full compliance, screen-reader experience or every device. Desktop/mobile screenshot review is required for visible changes; no visual changes were made by this documentation.

## Mascot assets

Download the supplied PNG, flat-layer PSD and approximate vector AI from [Gumball Mascot](Gumball%20Mascot/README.md). Fidelity and transparency limits are documented alongside the files. These documentation assets do not change the live site.
