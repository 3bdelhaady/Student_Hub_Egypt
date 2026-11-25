# Product requirements

## Product intent

Provide a student-first Arabic platform for academic work, community participation and campus services. Student Hub operates the platform; institutions and authorized agents manage only their assigned scope. See the [charter](../01-Project-Overview/Project-Charter-and-Scope.md) for the approved business model, not the older MVP-only scope.

## Product rules

| ID  | Rule                                                                                 | Status                                                        |
| --- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| P01 | Arabic-only student and agent interface, including saved English-preference cases    | Implemented                                                   |
| P02 | Student-first navigation, responsive desktop/mobile layouts                          | Implemented; full Figma equality not certified                |
| P03 | Signup selects controlled university/faculty or institution scope                    | Implemented                                                   |
| P04 | Activation is manual/scoped; signup cannot grant staff authority                     | Implemented                                                   |
| P05 | Coordinator is an existing student's extra capability with a profile mode switch     | Implemented                                                   |
| P06 | Each faculty has a default union; affairs adds named activities                      | Implemented                                                   |
| P07 | Four business request states are represented consistently by the applicable domain   | Implemented; domain-specific validation remains authoritative |
| P08 | Card balance zero, top-up disabled, no fake payment/renewal success                  | Implemented                                                   |
| P09 | 2% external top-up commission; 100 paid gives 98 balance                             | Planned, not payment code                                     |
| P10 | Codes and roster exports retain current code/name disclosure                         | Intended decision reaffirmed 25 November                      |
| P11 | Restaurant profile editable by platform admin, read-only for normal restaurant agent | Implemented                                                   |
| P12 | Whole-database admin text search in unchanged input                                  | Implemented, maximum 100 matching rows per query              |
| P13 | Email verification/recovery                                                          | Implemented, disabled pending delivery setup                  |
| P14 | Broader SaaS, private schools and Gumball AI helper                                  | Future direction only                                         |

## User outcomes

Students can find relevant material/services, request membership, understand pending/rejected/suspended states, manage personal learning and follow requests. Authorized staff can review within their faculty/institution, edit assigned sections and publish only with the right permission. Platform admins can manage institutions and review eligible agent accounts without giving public signup elevated access.

## Product constraints and unresolved decisions

Keep demo/live distinctions visible. Do not imply institutional endorsement, issuer authority, inventory availability or successful payment without evidence. No electronic debit is allowed merely because a checkout screen exists. Quotas, refunds, subscriptions, commercial contracts, legal/privacy terms and support ownership need decisions before real operation.

A real-student pilot was explicitly deferred. No user-research conclusions or analytics baselines are invented here.
