# HTTP API and server-action reference

The application primarily uses Next.js server actions. They are internal UI contracts, not a promised public API: generated action IDs may change on build. Callers must not treat them as stable integration endpoints. Actions still require session, validation, origin checks and scoped authorization.

## Route surface

| Method    | Route                                         | Purpose / authorization                                                                        |
| --------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| GET, POST | `/api/auth/[...all]`                          | Better Auth handler: credentials, sessions and configured email endpoints; database throttling |
| POST      | `/api/university/activate`                    | Scoped, expiring bearer integration token; eligible pending students only                      |
| GET       | `/api/manage/team-roster?course=...&team=...` | Authorized course/team roster CSV; optional team filter                                        |
| GET       | `/api/manage/applicants?entry=...`            | Scoped applicant export; query contract in route source                                        |
| GET       | `/api/manage/registrations?entry=...`         | Scoped registration export; query contract in route source                                     |
| GET       | `/api/manage/volunteers?entry=...`            | Scoped volunteer export; query contract in route source                                        |
| GET       | `/api/social/media/[id]`                      | Authorized social media bytes                                                                  |
| GET       | `/api/store/images/[id]`                      | Authorized store image bytes                                                                   |
| GET       | `/api/fitness/connect-target`                 | Returns configured connection destination without accepting an arbitrary target                |
| POST      | `/api/fitness/grant`                          | Same-origin authenticated consent grant, bounded state and nonce                               |
| POST      | `/api/fitness/consume`                        | Validates signed bridge payload and atomically consumes one-use nonce                          |

No restaurant-media endpoint has been deployed in this baseline. No live payment/top-up HTTP API is promised.

## University activation contract

`POST /api/university/activate`, JSON content type, bearer credential, body `{ "emails": ["student@example.test"] }`. At most 100 valid addresses and 32 KiB. University derives from the credential; caller cannot assign roles/university/status. Existing pending students only, preserving negative decisions. Aggregate success fields: `received`, `activated`, `unchangedOrNotEligible`, `demo`. Expected errors include 400 invalid/unavailable processing, 401 credential failure, 413 oversized input, 415 content type, 429 rate limit. See the existing [operational contract](../../docs/ACTIVATION-API.md) and source route for full details.

## Fitness bridge

Configured exact destination plus shared HMAC secret, five-minute grant, issuer/audience/state validation and one-use nonce. The browser consent route does not accept an arbitrary redirect target. A successful local policy test does not prove a configured live round trip. See [bridge details](../../docs/FITNESS-LINK.md).

## Email endpoints, implemented but disabled

Better Auth owns verification and recovery token behavior. UI routes are `/verify-email`, `/forgot-password`, `/reset-password`; disabled pages show not-found. Recovery uses generic acknowledgement, 30-minute single-use reset token and session revocation. Verification expires after one hour. See [activation runbook](../../docs/SECURITY-ACTIVATION.md). Do not copy live tokens into logs, URLs in issue reports or analytics.

## Error and compatibility rules

Unauthorized/hidden objects may return 404 to avoid disclosure. Check each route's current source before integrating; do not infer all exports share one query schema. Authenticated downloads use private/no-store where defined. Endpoint presence is not permission, and UI availability is not evidence of payment, activation or identity verification.

Ticket registration exports differ from name/code rosters: the current route selects reference, name, email, phone, university, faculty, status and quantity, capped at 10,000 rows. Treat that export as contact-data disclosure; do not generalize the minimal team-roster columns to every CSV route.
