# Database reference

[Generated table/column inventory](Database-Tables.md) comes from the current Drizzle definitions. Source types and migrations remain authoritative for defaults, indexes, composite keys, cascades and constraints.

## Core relationships

User -> zero/one university membership, zero/one platform-admin grant and zero/one institution-agent assignment. University -> faculties, academic content and university-linked institutions. Faculty -> default union and optional named activities. Agent assignment includes institution/university/faculty/organization/department scope and section rights. Portal entries connect domain content to those scopes. Requests, registrations, team membership, polls, certificates and media have their own domain tables.

See [Core-ERD.md](../03-System-Design/Core-ERD.md) for the focused relationship diagram. This is not a replacement for every composite foreign key in SQL.

## Migrations

Files in `migrations/` are applied in name order and tracked in `schema_migrations`. Each migration executes transactionally. Network PostgreSQL uses advisory transaction lock `75423019`, rechecking applied state inside the lock. The parser splits on semicolons; avoid procedural SQL/embedded semicolons unless the parser is redesigned and tested.

Schema changes need compatible application rollout, pre-change backup and verified restore path. An application rollback is not a database rollback. Never claim a Git bundle restores student records or uploaded media.

## Data policy and limitations

Membership uniqueness prevents multiple simultaneous university memberships in the current model. Existing legacy labels may remain beside nullable faculty IDs. Restaurant information has institution JSON plus legacy per-entry fallback, deliberately retained. Social/store media are database-backed; restaurant logos/covers remain data URLs. Soft-deleted institution handling must be checked in every relevant read.

No retention schedule or provider backup policy has been verified. Hard deletion, expiry cleanup, object retention, export/removal requests and restoration ownership require explicit operational decisions. Never include real records or database connection strings in documentation.
