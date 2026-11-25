# Known gaps and representative cases

## Open gaps, not fabricated bug reports

| Gap                                         | Impact                                | Required next evidence                         |
| ------------------------------------------- | ------------------------------------- | ---------------------------------------------- |
| Email delivery disabled                     | No live verification/recovery message | Owned domain, provider setup and delivery test |
| Admin MFA absent                            | Password-only privileged login        | Approved enrollment/recovery design and tests  |
| Backup/restore not verified                 | Recovery confidence missing           | Provider evidence plus disposable restore      |
| External alerting absent                    | Logs alone do not notify operator     | Approved provider/recipient/threshold and test |
| Restaurant duplicate fallback/media JSON    | Data/performance maintenance debt     | Backup-gated compatible migration              |
| Admin broad search limited to 100 matches   | Cannot browse all broad matches       | UX-approved pagination decision                |
| Full visual/security/load checks incomplete | Unknown nonfunctional limits          | Planned independent verification               |
| Latest old Actions deletions returned 500   | Three runs remained at last check     | Successful deletion and fresh inventory        |

## Representative test matrix

| Case                                                  | Expected outcome                                   | Existing evidence                         |
| ----------------------------------------------------- | -------------------------------------------------- | ----------------------------------------- |
| Old institution outside latest100, exact text search  | Found and details accessible                       | `directory-search.spec.ts`                |
| Replay admin search without session                   | No private row returned                            | `directory-search.spec.ts`                |
| Institution deactivate/delete                         | Scoped state and agent effects, no deleted detail  | `institution-lifecycle.spec.ts`           |
| Agent overwrites restaurant profile through menu save | Profile preserved                                  | `restaurant-admin.spec.ts`                |
| New account, email feature active in isolated test    | No unverified login session; confirmation succeeds | `email-security.test.ts`                  |
| Expired/reused reset token                            | Rejected                                           | Same disposable integration               |
| Successful reset                                      | Old password/session invalid, new password valid   | Same disposable integration               |
| Existing pre-cutoff unverified account                | Can still log in                                   | Same disposable integration               |
| Email feature disabled                                | Existing login unchanged, new pages unavailable    | `email-security-ui.spec.ts`, Figma review |
| Cross-scope and permission replay                     | Denied                                             | Domain browser/policy suites              |

Use actual reproduction steps, expected/actual result, environment, severity, sanitized screenshot and failing test when a concrete defect is found. No empty bug-report archive is included. Test filenames index executable cases; they do not substitute for evidence on an untested external service.
