# Fitness Club account bridge

Status: integrated code, disabled until deployment configuration exists. This is not proof of a working live cross-app sign-in.

Required Hub environment:

- `FITNESS_LINK_SECRET`: shared signing secret of at least 32 characters, entered from the dedicated vault item, never in chat or source control.
- `FITNESS_APP_ORIGIN`: the exact approved HTTPS deployment origin, without paths, query, credentials or fragment.

Migration 0015 stores short-lived one-use nonces tied to Hub user IDs. The grant POST requires an existing Hub session, same-origin request and valid random browser state. The consent page sends the code only to the configured Fitness callback, never to a caller-provided destination.

Grant payload: `iss=student-hub-egypt`, `aud=fitness-club`, random UUID `nonce`, caller browser `state`, `hub_user_id`, `name`, `email`, and five-minute numeric `exp`. The signature is HMAC-SHA256 over base64url JSON. The Fitness receiver must check its signed state cookie before exchanging the code at `/api/fitness/consume` and creating any session. Consumption verifies every field and atomically consumes an unexpired nonce belonging to the same user. Replays fail. The response includes identity and state, with no-store caching.

No live user account is linked without the user's consent click. No live cross-app login or deployment configuration has been performed during integration. The app-to-app boundary still needs a configured round-trip smoke test.
