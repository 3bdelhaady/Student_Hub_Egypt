# Focused entity relationship view

This view explains core scope. It does not enumerate every portal table or composite constraint. Use the [table inventory](../04-Technical-Docs/Database-Tables.md), Drizzle definitions and migrations for the full model.

```mermaid
erDiagram
 USER ||--o| MEMBERSHIP : has
 USER ||--o| PLATFORM_ADMIN : has
 USER ||--o| INSTITUTION_AGENT : has
 USER ||--o{ SESSION : opens
 UNIVERSITY ||--o{ FACULTY : owns
 UNIVERSITY ||--o{ MEMBERSHIP : scopes
 FACULTY ||--o{ MEMBERSHIP : scopes
 INSTITUTION ||--o{ INSTITUTION_AGENT : assigns
 INSTITUTION ||--o{ STUDENT_ORGANIZATION : contains
 FACULTY ||--o{ STUDENT_ORGANIZATION : scopes
 STUDENT_ORGANIZATION ||--o{ INSTITUTION_AGENT : scopes
 INSTITUTION ||--o{ PORTAL_ENTRY : owns
 USER ||--o{ SAVED_COURSE : saves
 COURSE ||--o{ SAVED_COURSE : referenced
 COURSE ||--o{ RESOURCE : contains
 USER ||--o{ RESOURCE_PROGRESS : records
 RESOURCE ||--o{ RESOURCE_PROGRESS : referenced
```

Membership and agent status are separate. Platform rights do not derive from an ordinary membership role string. Coordinator is represented through existing agent/organization capabilities, not a new identity table. Section permissions are stored with agent assignment. Restaurant profile JSON and legacy entry fields coexist intentionally until a reviewed migration is released.
