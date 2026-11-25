# Tech stack and coding standards

Exact dependency versions are generated in [Dependency-Versions.md](Dependency-Versions.md); `package-lock.json` is the reproducible install record.

## Runtime and structure

Node.js 22 or later, Next.js App Router, React, TypeScript, Better Auth, Drizzle ORM, PostgreSQL and local PGlite. Zod validates forms; Lucide provides interface icons. Playwright/Axe cover browser/accessibility checks, Node's test runner with tsx covers unit/integration tests, and Prettier sets formatting.

| Path             | Responsibility                                                         |
| ---------------- | ---------------------------------------------------------------------- |
| `src/app`        | Routes, pages, layout, server route handlers                           |
| `src/components` | Shared/page UI and forms                                               |
| `src/modules`    | Domain actions, queries, policies and internal services                |
| `src/db/schema`  | Domain table definitions                                               |
| `migrations`     | Ordered SQL changes, authoritative history of schema operations        |
| `scripts`        | Migration, seed, provisioning, isolated fixture and operator utilities |
| `tests`          | Unit, integration and browser checks                                   |
| `public`         | Only distributable public assets, never protected uploads              |

## Standards

- Import domain entry points directly. Avoid a new catch-all actions/queries file.
- Keep database drivers and secrets server-side. Never trust submitted IDs as authority.
- Validate input length/type/enums, then check current actor and full scope.
- Use parameterized queries; escape literal wildcard text in ILIKE search.
- Use transactions for dependent state/audit changes; guard concurrency-sensitive state.
- Preserve existing data, identifiers, role semantics and legacy fallbacks unless an approved migration covers them.
- No raw error/request/form serialization to logs. Use fixed diagnostic scopes.
- Keep Arabic copy honest about unavailable integrations; documentation can be English.
- Run format, type, tests, build and focused browser checks before release.

## Commands

```sh
npm ci
npm run db:migrate
npm run db:seed
npm run dev
npm run format:check
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Use a fresh disposable local database for `npm run test:fixtures`; it generates ignored test accounts. Never run fixture/provisioning tests against real data. Stop a PGlite application before operator scripts, because it is single-writer.
