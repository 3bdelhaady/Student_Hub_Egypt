# Test plan

## Scope and environments

Test policies and validation with the Node test runner/tsx; isolated migration/auth integration with disposable PGlite; browser journeys with Playwright and selected Axe checks. Use generated disposable accounts, not real students. Fixture scripts reject a non-disposable network database. Local PGlite must have one writer.

## Required release checks

1. `npm ci`, migrations/seed and fresh fixtures in an isolated test environment.
2. `npm run format:check`, `npm run typecheck`, `npm test`.
3. `npm run build`, focused browser regressions and the full three-shard hosted browser suite.
4. Review failed screenshots/reports; inspect actual changed screen pixels at desktop/mobile sizes.
5. Confirm successful deployment of the exact source SHA, then inspect live output without mutating real account state.
6. Report limitations rather than translating green tests into launch/security certification.

## Baseline evidence

Application baseline c5291bc: 90 local unit/integration tests passed; focused signup, search, lifecycle, disabled-email page and auth/admin checks passed; all 3 hosted CI shards passed; same-SHA Vercel deployment passed; inspected production admin viewport matched the previous screenshot bytes. This is point-in-time evidence, not a permanent status badge for later commits.

Hosted baseline run: https://github.com/3bdelhaady/Student_Hub_Egypt/actions/runs/45649241651

## Negative/security cases

Cross-university/faculty/institution reads/writes; pending/suspended actors; missing section rights; forged IDs; unauthorized CSV downloads; origin checks; replayed Fitness nonce; invalid/oversized CSV; electronic payment blocked; secret-free diagnostics; email token expiry/reuse; old-session invalidation after reset; old-account verification cutoff.

## Email boundary

Integration tests intercept provider sends and use a disposable database. They prove application flow, not DNS, deliverability, spam placement, quota/bounce handling or production recipient access. Feature stays disabled until actual authorized delivery tests pass.

## Not yet completed

Independent penetration test, measured load/concurrency capacity, full deterministic visual baselines, exhaustive accessibility review, real-student pilot feedback, provider restore drill and real payment reconciliation. Do not create passing test records for these.
