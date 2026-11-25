# Email security activation, disabled by default

Email verification and password recovery are implemented but not activated. Admin MFA remains a recommendation, not an implemented feature. No existing verification flags, passwords, roles or statuses are changed.

## Activation prerequisites

1. Choose a transactional provider and an owned sender domain/address. Current adapter uses Resend. Verify the provider's DNS records and disable open/click tracking for authentication links.
2. Store a domain-restricted Sending-access key in hosting secrets as RESEND_API_KEY and set AUTH_EMAIL_FROM. Never commit the key.
3. Choose a fixed UTC AUTH_EMAIL_REQUIRED_FROM timestamp for the first activation. Existing accounts created before it remain eligible to log in without verification. Never move this timestamp backwards or silently reset it on deployment. Existing accounts are not marked verified.
4. In a disposable environment test actual delivery, expired and reused links, sign-in, resend, password reset and revocation of prior sessions. Mocked integration tests do not prove provider delivery.
5. Set AUTH_EMAIL_ENABLED=true only when setup is ready. Missing key, sender or timestamp fails startup rather than enabling broken delivery. Keep disabled until the owner approves activation readiness.

## Visible changes

- Signup sends a verification link and shows a verification screen with resend. New unverified accounts cannot enter application areas or start a new sign-in session. After verification, the person completes their student membership or agent request; existing university/faculty choices may need to be selected again. Verification does not activate an institutional membership or grant permissions.
- Login adds a Forgot password link. Recovery uses a generic acknowledgement, an expiring reset link, and password confirmation. Successful reset revokes earlier sessions. Reset does not verify the email or bypass membership review.
- Verification links expire after one hour; reset links after 30 minutes and are single-use. Authentication endpoints retain the database-backed rate limit. Messages are plain text and never log their token or recipient.

## Deployment and test boundaries

AUTH_EMAIL_ENABLED defaults to false. Disabled pages show the not-found screen and the existing login/signup appearance remains unchanged. A fixed activation timestamp preserves old accounts, including demo/admin accounts, without a production data migration. No external email has been sent by the development tests: the integration test intercepts the provider call in a disposable database. Provider delivery, DNS, quota monitoring and bounce handling still need operational verification.

Admin MFA needs a separate approved enrollment, recovery and lost-device plan. Database backup/PITR coverage and a successful restore must be verified at the database provider; a Git bundle is not a database backup.
