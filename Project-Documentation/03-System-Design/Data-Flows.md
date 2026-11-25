# Data flows and sequence views

## Signup and membership, current mode

```mermaid
sequenceDiagram
 participant S as Student browser
 participant A as Better Auth
 participant M as Membership action
 participant D as PostgreSQL
 S->>A: Signup data (no authority fields)
 A->>D: Identity and hashed credential
 A-->>S: Session (email mode currently disabled)
 S->>M: Selected university/faculty
 M->>D: Validate catalog, insert pending request + audit
 M-->>S: Pending status or safe retry message
```

Identity creation and the subsequent membership request are separate. A failed membership action must not imply the identity was rolled back.

## Scoped read/write

Browser -> server entry point -> session resolution -> active membership/agent and parent scope -> validated query/transaction -> safe result. Protected file download routes repeat authorization and use private/no-store where specified. CSV export is an authorized disclosure, not a public static file.

## Future-enabled email flow

```mermaid
sequenceDiagram
 participant U as Account holder
 participant A as Auth service
 participant E as Email provider (not connected)
 participant D as PostgreSQL
 U->>A: Signup / resend / reset request
 A->>D: Create bounded verification/reset state
 A-->>E: Plain-text link to intended inbox
 E-->>U: Email, subject to delivery verification
 U->>A: Open link and complete action
 A->>D: Verify email or replace password
 Note over A,D: Password reset revokes prior sessions
```

Only accounts created on/after a fixed activation timestamp require verification. Neither verification nor password reset approves university/agent access. The feature remains disabled.

## Intended balance flow, not implemented

Student -> external gateway top-up -> validated provider confirmation/reconciliation -> Student Center balance -> eligible in-platform service payment. Owner business rule: 100 paid credits 98. Provider selection, webhook contract, ledger/refunds and rounding remain undecided. No arrow in this planned flow indicates an existing live integration.
