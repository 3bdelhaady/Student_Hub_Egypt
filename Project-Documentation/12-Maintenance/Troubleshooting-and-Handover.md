# Troubleshooting and handover

## Safe diagnosis

| Symptom                                  | Check first                                                               | Do not do                                                               |
| ---------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Startup refuses auth configuration       | DEMO_MODE, secret length, exact base URL                                  | Disable safeguards or commit a secret                                   |
| Deployment has no database               | DATABASE_URL present in intended environment                              | Allow ephemeral PGlite on Vercel                                        |
| Local PGlite locked                      | Stop other app/operator process                                           | Run concurrent writers or delete data blindly                           |
| New migration fails                      | Current schema_migrations, SQL compatibility, lock/error context          | Edit applied migration silently or retry destructive SQL without backup |
| Signup created account but no membership | Account page scope/retry, pending state                                   | Create another identity or grant role automatically                     |
| Staff cannot see a section               | Active actor/parent, faculty/organization scope, read/edit/publish rights | Expand permissions as a test                                            |
| Restaurant data seems duplicated         | Institution profile and legacy per-entry fallback                         | Delete legacy fields without migration/restore evidence                 |
| Search misses broad result               | 100 match limit, query/category/status filters                            | Claim pagination exists                                                 |
| Card payment/top-up unavailable          | Intended demo restriction                                                 | Fake credit, debit or payment success                                   |
| Recovery link unavailable                | Feature disabled/provider prerequisites                                   | Enable without domain/delivery test                                     |
| Email-enabled startup fails              | Fixed cutoff, sender and key                                              | Change cutoff backwards to force old users into new rule                |
| External alert absent                    | No configured drain/recipient/threshold                                   | Assume logs imply notification                                          |
| Actions deletion returns 500             | Fresh inventory and service response                                      | Claim deletion succeeded or loop indefinitely                           |

## Handover checklist

- Confirm repository and deployment access under named, approved accounts.
- Obtain secrets only through approved secret management; never copy them into docs or screenshots.
- Identify database project, backups, restore target and operational contact.
- Reproduce clean install, migrations, isolated tests and build.
- Understand account types, Coordinator mode, scope policies and denied cases.
- Verify deployment/CI for the current SHA and visually inspect changed screens.
- Review known gaps, disabled flags and business decisions before enabling features.
- Keep source backups separate from database/media backups; verify restoration, not file existence alone.
- Decide support/privacy/incident ownership and retention before real users.

## Routine maintenance

Review dependencies and security advisories, failed scoped diagnostics, actual delivery quotas once enabled, migration compatibility and backup drills. Cadence and owner are not yet decided. Do not run demo provisioning or test fixtures on real records as routine maintenance.

## Escalation evidence

Use a sanitized incident ID/scope/time, affected route, expected/actual behavior, source SHA and test reproduction. Do not include passwords, reset links, bearer tokens, raw database rows or student rosters in public issues. Support mailbox and formal response commitments are not yet decided.
