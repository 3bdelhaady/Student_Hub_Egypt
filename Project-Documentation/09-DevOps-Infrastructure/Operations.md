# CI/CD, deployment, backups and monitoring

## Current host and release

Repository: https://github.com/3bdelhaady/Student_Hub_Egypt

Development site: https://student-hub-egypt.vercel.app

Source-to-host deploy uses Vercel. `vercel.json` currently runs build, migrations, seed and configured demo provisioning. Keep this documented as it is, not as an already separated release pipeline. A dedicated migration job/preview isolation remains work. Database-provider backup settings are not verified.

## CI

GitHub Actions matrix has 3 shards. Each installs dependencies, creates an ephemeral test secret, migrates/seeds a disposable database, creates fixtures, checks format/type/unit/build, installs Chromium, runs its browser shard and audits high-severity dependencies. Failure reports are uploaded for 7 days. Job timeout is 30 minutes; browser step timeout 24 minutes. No new cancellation or history-retention automation is assumed.

Release gates: local checks, all 3 hosted shards green, successful same-SHA deployment and inspected production screenshots. A push alone is not completion. Dependency audit results are not a security certificate.

## Configuration

Required: DATABASE_URL for deployment, a unique BETTER_AUTH_SECRET of at least 32 characters, exact HTTPS BETTER_AUTH_URL and DEMO_MODE=true. Never commit values. Optional email settings are disabled in `.env.example`; see [activation runbook](../../docs/SECURITY-ACTIVATION.md). Fitness requires its dedicated shared secret and exact approved origin on both apps. No provider choice creates an approved spending commitment.

## Backup/restore gate

Before data migration, obtain an authorized provider snapshot/export of current schema/data/media, record timestamp/source and encrypt/restrict it, then restore to a separate disposable target. Verify row counts, representative relationships and image bytes without publishing private records. Test application compatibility there, identify who can restore and how long it takes, then approve the production operation. Never test restore by overwriting production. Define retention, frequency, region, encryption, cost and recovery objectives with the owner; they are not yet decided.

A source Git bundle is verified source-history preservation only. It is not a backup of accounts, records or media. Restaurant-media migration remains held until this gate has evidence. No confirmed database-provider access/restore route is presently recorded.

## Monitoring

Caught write failures emit event=operation_failed, fixed source scope, random incidentId and timestamp. No raw exception, request, email, URL, headers or form body is emitted by that helper. Validation failures can produce the same event, so every event is not necessarily an outage. External log drain, recipient, thresholds, retention and alert test remain unconfigured. Select them with owner approval and avoid forwarding private records.

## Incident and rollback

Stop the affected new change, preserve sanitized evidence and identify scope. Do not rotate credentials, delete data or notify external parties without the applicable authority. Restore service with a schema-compatible application release; database rollback needs its own verified plan. Report impact and remaining uncertainty. Incident owner/contact and response SLA are not yet decided.
