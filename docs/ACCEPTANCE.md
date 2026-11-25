# Acceptance evidence

Initial checkpoint checked 21 November 2026 against the local development source. The dated additions below supersede this historical baseline where stated; local QA does not itself prove a hosted deployment or certification.

## Passed checks

- Strict TypeScript check and optimized Next.js production build.
- Eight unit tests: role/status/university policy and strict activation API/CSV input handling.
- Nine browser suites against the production application server with persistent local PGlite: public routes/filter/empty states; signup/join/logout; active resource access; pending lock; admin management and mutation-replay denial; editor scope restrictions; two automated accessibility suites; and university API/CSV activation integration.
- The original six browser journey suites also passed against a separate TCP PostgreSQL instance. After adding bulk activation, its dedicated API/CSV suite passed against a freshly migrated separate network PostgreSQL database too.
- Automation checks: missing bearer rejection, unexpected scope field rejection, exact university matching, staff/unknown/out-of-scope exclusion, duplicate removal, idempotent replay, per-token rate limit, invalid CSV rejection, successful scoped CSV activation and audit events.
- Automated axe checks found no tested WCAG A/AA violations on the selected public pages and authenticated account/course/admin/form routes, including narrow authenticated views. This is not complete accessibility certification or screen-reader testing.
- Responsive route captures at 320, 390 and 1280 pixels. Public pages, account/resources, management tables and editors were inspected. Table content remains horizontally scrollable on small screens instead of shrinking into unreadable columns.
- `npm audit` reported zero known vulnerabilities at the final local check. This is time-specific dependency evidence, not proof of security.

## Functional acceptance

A student account has no elevated role. A pending member cannot receive protected resource text. An active member can read only the correct university's resources. An editor can manage content but cannot moderate membership. Administrators manage only their own university. Scoped content writes and membership decisions create audit events atomically. Draft courses/posts are unavailable to public direct routes. CSV/API automation cannot override rejected/suspended membership, create an account or assign privileges.

## Not verified or not enabled

The source push to the owner-selected public repository was verified separately. No external application preview, cloud deployment, Slack connection, paid infrastructure, real email delivery, password-recovery delivery, live student eligibility verification, external file storage or video delivery is claimed. Container templates have not been built on a Docker host. No load/penetration test, independent legal/privacy review, real-university pilot, high-availability test or complete assistive-technology audit has occurred.

Integration tests create and alter disposable demo data. Fixture credentials are excluded from source delivery. All claims above concern the tested development configuration; repeat deployment smoke tests against the actual target before sharing it as a functional preview.

## 22 November 2026: private-learning local release checkpoint

- Four private-learning browser tests pass against disposable local data, including real-ID owner isolation, forged course/resource mutation rejection, student-mode enforcement, draft/active course lifecycle, link/note ordering, edits/deletion, completion/undo, invalid-input preservation and guest return paths.
- Automated accessibility/overflow covers 18 authenticated and six guest light/dark/responsive states. Actual desktop/mobile pixels, including mobile viewport header/navigation order, were inspected. Existing populated student-dark and privacy-print controls pass; both revised white A4 privacy pages were inspected.
- Forty unit tests, production build, typecheck and whole-repository formatting pass locally. Migration 0017 is additive. Full remote CI and deployment need their own post-push confirmation, and this is not full Figma parity or a working hosted-video/payment/booking integration.

## 22 November 2026: Student Voice local release checkpoint

- Four dedicated browser tests pass: real vote persistence, wrong-option/out-of-scope/draft/closed/future forgery rejection, stale duplicate denial, pending-member and agent-mode stale-form denial, private/draft visibility, direct poll details, search/picker/save/removal and filter clearing.
- Thirty-six guest/student light/dark/1280/390/320 states plus two expanded 320px states pass automated accessibility/overflow checks. Actual desktop, mobile viewport, results and expanded dark-description pixels were inspected. These checks are not full accessibility certification.
- The existing manual-commerce/scoped-management/support/private-thread/notification regression and ten-route populated student-dark test pass. Forty-two units, production build, typecheck and whole-repository formatting pass locally. Synthetic polls/votes are guarded disposable fixtures, not production data; no new migration is needed.
- Previous private-learning commit 6c22292 is deployed and its full remote CI passed: https://github.com/3bdelhaady/Student_Hub_Egypt/actions/runs/44985019107 . The Student Voice change still needs its own post-push remote result. Other services and bespoke commerce states remain separate work, not full Figma parity.

## 23 November 2026: consolidation and student entry checkpoint

Local checks cover preserved trip/request identity and money snapshots across migration; training archives cannot publish; legacy trip-only rights cannot access concert tickets; new ticket rights cover both subtypes. Student login/signup now lands on an open course and sidebar bundle selection works, while profile and explicit protected-return links remain. Store/services tracking is visually separate in desktop/mobile light/dark layouts. 57 unit tests, production build/typecheck and focused browser/accessibility checks pass. Hosted CI and production verification must be checked independently for the release commit.
