# Threat model and permissions

## Assets and boundaries

Protect credentials/sessions, student profiles and codes, memberships, roster exports, private media, applications/requests, institutional rights, audit records and future financial data. Boundaries are browser/server, anonymous/authenticated, student/staff, institution/university/faculty/organization, app/database and external provider.

| Threat                                  | Existing control                                                       | Remaining risk/work                                      |
| --------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------- |
| Public signup privilege escalation      | Parsed account types, separate platform grants, pending staff requests | Operator grant/invitation lifecycle review               |
| Cross-scope direct request              | Session-derived scope and policy checks                                | Continue replay/negative tests for every new entry point |
| Inactive actor/parent access            | Active status and parent checks                                        | Audit new read paths and legacy fallback behavior        |
| Credential theft/brute force            | Hashed credentials, HttpOnly/SameSite cookies, database throttling     | MFA/reauthentication, operational abuse controls         |
| Unverified inbox/account recovery abuse | Disabled-by-default verified-email/recovery code with token bounds     | Real provider verification and monitoring                |
| Injection and unsafe rendering          | Parameterized queries, validation, escaped text, baseline CSP          | Nonce-based CSP and independent review                   |
| Private media disclosure                | Authenticated DB-media routes, MIME/signature/size checks              | Object storage, malware scanning and retention policy    |
| Sensitive logs/exports                  | Redacted fixed-scope failures, authorized CSV routes                   | Retention/audience controls and incident process         |
| Migration/data loss                     | Transactions and migration locking                                     | Verified backups/restoration; no code-only guarantee     |
| Future payment fraud/replay             | Payments/top-ups currently disabled                                    | Ledger, trusted webhooks, reconciliation/refund design   |

## Authority matrix

Guest reads public discovery only. A student requests membership but cannot approve themselves or choose staff rights. Active scoped membership allows eligible academic reads, not unrelated university data. Coordinator is a capability of an existing student, managed in faculty/organization scope. Mode switching changes view, not grants.

Platform admins are separate records and manage institutions/eligible agents. Affairs/authorized super-agent paths have explicit faculty/institution boundaries for eligible assignments. Private-sector agents cannot rewrite platform-owned restaurant profile merely by editing a menu. Section rights require read before edit and read+edit before publish; student activities are denied academic/team section rights by policy. Exact checks live in `institution/policy.ts`, `section-policy.ts`, domain actions and queries.

Legacy academic admin/editor membership functions exist beside the newer institutional system. Do not flatten them into one all-powerful staff role. Stored department identifiers are stable compatibility values, not new public signup choices.

## Security headers and secrets

Baseline CSP disallows eval but permits framework inline scripts/styles; frame denial, nosniff, referrer and permissions policies exist. This is not a penetration-test result. Store secrets in environment/secret management, never Git, issues, diagrams, logs or example credentials. Restore/incident tooling must not print private records or tokens.

No MFA, security certification, legal compliance or real-student-launch readiness is asserted.
