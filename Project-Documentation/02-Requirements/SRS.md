# Software requirements specification

The tables below describe code requirements and acceptance boundaries, not a contractual service-level agreement.

| ID  | Requirement                                                                             | Evidence location                                         |
| --- | --------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| S01 | Global credentials/session handling with hashed passwords and bounded sessions          | `src/lib/auth.ts`, identity schema                        |
| S02 | Resolve actor from session; validate scope on server for each protected operation       | `src/lib/session.ts`, domain policies/actions             |
| S03 | Enforce one membership per user and valid university/faculty relationships              | Membership/catalog schemas, SQL migrations                |
| S04 | Pending/rejected/suspended users cannot read protected academic bodies                  | `src/lib/policy.ts`, academic queries                     |
| S05 | Domain writes validate input and use transactions for related state/audit changes       | Domain action/service files                               |
| S06 | Distinct institution, faculty, organization and section rights                          | Institution policy and section-policy modules             |
| S07 | Controlled file types, signatures, sizes and authenticated access for current DB media  | Social/store media modules and routes                     |
| S08 | Do not debit electronic balance or accept top-ups in current release                    | `src/modules/portal/store-actions.ts`, checkout UI        |
| S09 | Fixed email-activation cutoff preserves old accounts; verification grants no membership | Email security module, session gate                       |
| S10 | Password reset token expiry, single use and prior-session revocation                    | Better Auth configuration and disposable integration test |
| S11 | Whole-database admin search is admin-only, parameterized and bounded                    | `directory-search.ts`, browser regression                 |
| S12 | Serialize network-PostgreSQL migrations and recheck applied state in transaction        | `scripts/migrate.ts`                                      |
| S13 | Failure diagnostics exclude error objects, URLs, identities and form payloads           | `src/lib/diagnostics.ts`                                  |
| S14 | Use network PostgreSQL in deployment; never ephemeral PGlite fallback on Vercel         | `src/db/index.ts`                                         |

## Nonfunctional constraints

Strict TypeScript, lockfile-backed installs, Prettier, production compilation, scoped policies, database-backed authentication throttling, RTL/narrow layouts and keyboard-accessible controls. Hosted CI runs unit/type/format/build/browser checks in three shards. These are not load, independent security or complete accessibility certification.

No throughput, latency, storage, retention or uptime SLA is agreed. Admin default lists remain bounded; whole-database search returns at most 100 matching rows, without pagination controls. Large unfiltered administrative browsing remains limited.

## Identity and activation distinctions

Email verification, university membership approval, agent activation and Coordinator assignment are separate. An existing verified email does not prove enrollment. The activation CSV/API accepts eligible pending student accounts only, not role changes or overrides of rejections/suspensions. New email enforcement uses a fixed configured activation timestamp; old accounts are not marked verified or locked out by the rollout.

## Integration constraints

Secrets stay out of source and client code. Email feature remains disabled without verified sender/provider and actual delivery test. Fitness requires matching approved configuration on both apps and a verified round trip. Payment gateway remains not yet decided. No external alert service or database restore is asserted without provider evidence.
