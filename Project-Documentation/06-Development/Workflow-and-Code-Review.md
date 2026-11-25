# Development workflow and code review

## Current repository policy

The owner requested main contain a single current-version commit rather than the old development history. The prior source history was backed up outside GitHub before reset. Never confuse source-history removal with guaranteed deletion from caches, forks or clones.

For a future release, work locally, back up existing refs, review the complete staged diff, verify source authority and current remote head, then preserve the approved one-root policy using an explicit force-with-lease against that observed head. Do not rewrite another contributor's work or publish a new audience without approval. If collaboration requires normal append-only commits/PRs, ask the owner to change the history policy first. A PR workflow is not currently asserted as an active team process.

## Local setup

Install Node 22+, run `npm ci`, copy `.env.example` to ignored `.env.local`, generate a unique authentication secret, and use local PGlite or an explicitly disposable PostgreSQL database. Run migrations and seed, then dev. Deployment requires network PostgreSQL. Fixtures generate random private test credentials only in ignored `.data`.

## Review checklist

- Does the change match an approved requirement without hidden UX/business changes?
- Are actor, parent scope, section right, status and publication rules checked server-side?
- Are validation, transaction/audit and concurrency behavior covered?
- Does it preserve existing data/IDs and have a tested migration/recovery plan if needed?
- Are secrets, real records, tokens and raw error payloads excluded from source/logs/tests?
- Do unavailable integrations remain honestly unavailable?
- Are formatting, typecheck, unit tests, build and targeted browser tests green?
- Were changed screens visually inspected desktop/mobile?
- Has current-SHA hosted CI passed and current-SHA deployment been verified?

## Suggested change/PR description

Use this as a review checklist, not a claim that a review team already exists:

```text
Purpose and approved requirement:
Changed paths / behavior:
Unchanged behavior / compatibility:
Data migration and rollback:
Permission / privacy impact:
Tests and screenshots:
Deployment evidence:
Known gaps / required decisions:
```

Review ownership, team members, branch protections, approval count and release approver are not yet decided. No people or roles have been invented for project management.
