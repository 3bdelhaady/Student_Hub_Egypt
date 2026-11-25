# University activation integration

**Demo only.** Live email ownership verification is not connected. This workflow demonstrates roster activation; it does not verify identity or establish that a caller is a real university. Before real use, agree how the roster is authorized and require appropriate verified identifiers.

## Matching and effects

Manual approval is the default. An existing university administrator can open the CSV importer in the membership page. The file must contain exactly one `email` column, 1-100 valid rows, and no more than 32 KiB. Extra columns, malformed rows or an oversized batch are rejected. Emails are trimmed, lowercased and deduplicated.

Only existing **pending student memberships in the authorized university** are activated. Already-active, rejected, suspended, staff, unknown and other-university memberships remain unchanged. No accounts are created and no roles change. Results expose only aggregate counts. Eligible updates and audit events commit atomically. Repeating a successful batch produces no additional activation.

## Credential lifecycle

A trusted operator, not an anonymous HTTP caller, authorizes a university integration. Stop the application before operator scripts when using local PGlite.

```sh
npm run integration:create -- demo-university /absolute/private/integration-token
```

The script writes a fresh credential to that new private file with mode 0600, never stdout. It stores only a SHA-256 digest in the database and reports the integration ID and seven-day expiry. Deliver the credential to the authorized university over an approved secret-management route, never a public issue, repository or chat. Delete the temporary plaintext file after secure transfer. Do not issue a real credential before confirming university authority and scope.

```sh
npm run integration:revoke -- integration-id
```

Expired/revoked credentials are rejected. Issue a replacement to rotate. There is no credential recovery or public token-generation endpoint.

## Endpoint

`POST /api/university/activate`

Headers: `Authorization: Bearer <integration credential>`, `Content-Type: application/json`.

Body:

```json
{ "emails": ["student@example.test", "another@example.test"] }
```

The API does not accept university IDs, role/status overrides, national IDs or account passwords. It derives scope from the token. A body is bounded to 32 KiB and 100 entries; duplicate emails are counted once. Per-token requests are bounded to ten per 60 seconds using an atomic database counter.

Successful response:

```json
{ "received": 2, "activated": 1, "unchangedOrNotEligible": 1, "demo": true }
```

`401`: missing/invalid/expired/revoked token. `400`: invalid input or unavailable processing. `413`: body too large. `415`: unsupported content type. `429`: rate limit, with Retry-After. No cross-origin browser API access is enabled. Use TLS on any external host; never put the bearer value in a URL.

Audit records contain scope, actor/system origin, action and record IDs, not a plaintext token or uploaded CSV. This version does not retain the uploaded file. Edge abuse controls, integration alerts and token-rotation operations are still needed for real deployment.
