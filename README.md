# Student Hub Egypt

## Project documentation

Start with [Project-Documentation](Project-Documentation/README.md), the maintained English reference across the requested 12 folders. It separates current behavior, disabled integrations, owner decisions and unknowns. [Coverage](Project-Documentation/Coverage.md) lists deliberate omissions.

## Current development release (0.3.0)

The current development site is https://student-hub-egypt.vercel.app. It is a modular monolith with student, agent and platform-admin workspaces. Domain actions, queries and schema definitions are separated for future growth.

Arabic-only, responsive university community platform under active development, based on the supplied Student Hub Figma. This is a development/demo release, not a production launch or a claim that the entire Figma project is complete.

## Implemented scope

- Email/password signup, login and logout; server-side role, institution, faculty and section permissions.
- University/faculty membership, scoped review and activation, academic courses/resources and student profiles.
- Academic teams, volunteering, opportunity applications, polls, certificates and support workflows.
- Store, housing, restaurant menus and e-ticket request flows. Electronic payments and top-ups are disabled; this is not a live payment service.
- Institution administration, agent assignments, read-only institution cards and admin-managed restaurant data, including native time controls and logo/cover uploads.
- Scoped roster CSV exports, audit records, versioned SQL migrations, unit and browser regression tests.
- Authenticated database-backed image uploads. External object storage, hosted video infrastructure, email verification/recovery are implemented but disabled pending sender/provider setup and actual delivery tests.

Account creation is not university identity verification. Do not collect real student identity data with this release. National-ID fields and legacy storage have been removed; provider backups require their own retention review. See [security](docs/SECURITY.md) and [deployment](docs/DEPLOYMENT.md) for launch requirements. Older planning documents describe historical phases and are not a current feature inventory.

## Local setup

Node.js 22+ and npm are required.

```sh
npm ci
cp .env.example .env.local
```

Generate a unique `BETTER_AUTH_SECRET` into `.env.local` without committing it. A password manager or `openssl rand -hex 48` can generate one. Keep `DEMO_MODE=true` and set `BETTER_AUTH_URL=http://localhost:3000`.

```sh
npm run db:migrate
npm run db:seed
npm run dev
```

Open `http://localhost:3000`. Public pages work immediately. Choose university and faculty while registering through `/register`; a pending membership request is then submitted. If that second step fails, the join form remains available through `/account`.

Without `DATABASE_URL`, local development uses **PGlite**, a persistent embedded PostgreSQL engine in `.data/postgres`. It is local-only: one application process, one writer. Stop the app before running migration, seed or operator scripts against that local store. Do not run multiple containers/replicas against it, or put it on ephemeral/serverless storage. `.data` is excluded from Git and source delivery.

For deployment or multi-process use, set `DATABASE_URL` to a dedicated PostgreSQL database. The same schema and SQL migrations are used through the `pg` adapter. The repository includes an optional `compose.yaml` for a local PostgreSQL 17 database; set `POSTGRES_PASSWORD` to a unique value before `docker compose up -d`. Do not reuse example or development credentials.

## First administrator, no seeded password

The seed creates content only. There are **no default users or known admin passwords**.

1. Create the intended operator's account through the normal signup page.
2. Stop the local application if using PGlite.
3. Run an explicitly authorized operator command:

```sh
npm run admin:grant -- operator@example.test demo-university
```

4. Restart and log in as that account. `/admin` appears in the account navigation.

This command changes privileges. It is intended for a trusted deployment operator, never an HTTP endpoint. Do not grant an arbitrary requester administrative access. In this phase each user belongs to one university; change the schema and introduce explicit scope selection before supporting multiple memberships.

## Verification

```sh
npm run format:check
npm run typecheck
npm test
npm run build
```

Browser tests use the production Next.js server and exercise real persistence and authentication:

```sh
# Stop the app first. Use only a disposable local demo database.
npm run test:fixtures
npx playwright install chromium
npm run test:e2e
```

Fixtures are random, local test accounts, not end-user accounts. Credentials stay in the ignored `.data/e2e.json` and are never printed. Tests modify local content, approve a fixture student and create another account. Use a separate disposable environment and reseed/recreate it for a clean demonstration. Do not run them on a live database. Login tests intentionally respect the actual authentication rate-limit window. Screenshots go to `test-results/visual/` unless `VISUAL_OUTPUT_DIR` is explicitly supplied.

CI performs migration, seed, formatting, typing, tests, production build and browser checks. Dependency versions and the lockfile are committed for repeatable installs. `npm audit` is an automated dependency signal, not an independent security certification.

## Deployment and operating limits

See [deployment](docs/DEPLOYMENT.md), [architecture](docs/ARCHITECTURE.md), [security](docs/SECURITY.md), [acceptance](docs/ACCEPTANCE.md) and [reference decisions](docs/REFERENCE-DECISIONS.md).

A full-stack preview needs a Node.js application host and PostgreSQL, or a single local/demo process with persistent disk. A static website publisher cannot run authentication, mutations or database access. A source archive or screenshots are not a deployed preview.

The app refuses to start unless `DEMO_MODE=true`. This is intentional: enabling real users requires implementing and reviewing verification/recovery, legal/retention decisions, operations and privacy first. A successful optimized build does not mean the platform is ready for real students.

## University activation automation

The membership admin page also supports a strictly scoped CSV import. A documented authenticated endpoint supports university integrations for existing pending student requests. Manual approval stays available and remains the default. See [activation API](docs/ACTIVATION-API.md) for batch format, safe credential issuance/revocation and the demo-only email-ownership limitation.

Project planning documents: [PRD](PRD.md), [SRS](SRS.md), [project plan](PROJECT_PLAN.md), [roadmap](ROADMAP.md), [tasks](TASKS.md), [work log](WORK_LOG.md), [changelog](CHANGELOG.md). They distinguish completed local work from blocked deployment and future commitments.
