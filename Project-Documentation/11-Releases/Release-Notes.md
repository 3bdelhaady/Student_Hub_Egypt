# Release notes and version policy

## Application baseline: 25 November 2026

The documentation was checked against application c5291bc. A later documentation-only root amendment changes the commit identifier, not the site code. `package.json` still says 0.3.0; that value is not a complete release-history record.

### Implemented maintenance

- Removed unused imports and unused homepage data fetches without changing markup.
- Added fixed-scope, redacted failure diagnostics.
- Serialized PostgreSQL migration execution and rechecked application inside transactions.
- Extended admin text search across the database using existing controls;100 matching rows maximum.
- Added detail fallback for rows outside the initial 100.
- Implemented email verification/recovery with disabled-by-default flag and fixed cutoff preserving existing accounts.
- Added disposable security and browser regression tests.

### Not enabled or completed

Actual email delivery, admin MFA, electronic payment/top-up integration, external alerting, verified database backup/restore and restaurant media/model migration. No real production credentials, roles, verification flags or statuses were changed for tests.

### Evidence

All 3 hosted shards succeeded for c5291bc:
https://github.com/3bdelhaady/Student_Hub_Egypt/actions/runs/45649241651

Successful deployment:
https://vercel.com/mahmoud-abdelhadys-projects/student-hub-egypt/C4qY4CGkWsufoi21oLZ1mePMkyt1

Production admin screenshot was visually inspected and matched the previous viewport bytes.90 local unit/integration tests passed. This does not establish full-site Figma equality or independent security/load certification.

## History policy and caveats

Owner requested one current-version root commit. Before reset, 161 commits were backed up in a verified external bundle. Main history replacement does not erase caches, clones or external copies. Old GitHub Actions cleanup initially deleted 144 of 145 runs. Two subsequent releases created superseded runs; their final deletion returned server errors, leaving 3 successful runs at the last verified inventory. Recheck current state before asserting a final count.

No old-version narrative is reconstructed from guesses. Existing historical notes may be superseded by this documentation; current code and release evidence take priority for implemented state.
