# Template coverage and deliberate omissions

All 12 requested folders contain substantive material. Related documents are combined when splitting them would repeat the same information.

| Requested area | Included                                                                       | Omitted or combined and why                                                                                                   |
| -------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| Overview       | Charter/scope/business model, simple roadmap, glossary                         | Charter and scope combined to avoid duplication.                                                                              |
| Requirements   | PRD, SRS, user stories/use cases                                               | Stories and use cases share one working reference.                                                                            |
| System design  | Architecture, data/sequence flows, focused ERD, editable/rendered architecture | No separate decorative UML class catalog; code/schema already define classes/tables, sequence diagrams cover useful behavior. |
| Technical      | API, database/table inventory, stack/standards                                 | No invented public REST contract for internal server actions.                                                                 |
| UI/UX          | As-built design reference and user flows                                       | No speculative wireframes or claim of new Figma audit.                                                                        |
| Development    | Git/review workflow, usable change-description template                        | No enforced PR automation or invented reviewer roster.                                                                        |
| QA             | Test plan, representative cases, known gaps                                    | No fabricated bug reports, passed external tests or empty test sheets.                                                        |
| Security       | Threat model, permissions, privacy                                             | No compliance certificate or invented legal policy.                                                                           |
| DevOps         | CI/deployment/backup/monitoring/incident boundaries                            | No claimed provider backup or alert setup without evidence.                                                                   |
| Management     | Decision register, open work and proposed light process                        | No invented sprints, deadlines, meeting minutes, staff or assignments.                                                        |
| Releases       | Actual release notes/evidence and history policy                               | No reconstructed old-version history after requested squash.                                                                  |
| Maintenance    | Troubleshooting, handover, user manual                                         | No fake support address or SLA.                                                                                               |

Business decisions remain owner decisions. Unknowns are recorded as not yet decided; unverified external state is recorded as not verified. Application data, secrets and private account identifiers are excluded. This documentation changes no code, payment rate, permission or UI.
