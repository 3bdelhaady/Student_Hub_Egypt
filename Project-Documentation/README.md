# Student Hub Egypt project documentation

Maintained English reference for the team. Reviewed 25 November 2026 against application baseline `c5291bc` and the owner's decisions on that date. This documentation update does not enable integrations or alter application behavior.

## Read first

Student Hub Egypt is a startup operating a student-services platform. The current website is a development deployment, not evidence of a real-student launch, signed university partnerships or legal registration. The owner identified Qena and Luxor universities as the intended starting scope for academic year 2027/28. Dates in the roadmap are not invented delivery commitments.

| Label                 | Meaning                                                           |
| --------------------- | ----------------------------------------------------------------- |
| Implemented           | Code exists; environment-specific checks may still apply.         |
| Implemented, disabled | Code exists but the live feature is not enabled.                  |
| Planned               | Owner-approved direction, not a working capability.               |
| Not yet decided       | Requires an owner or operational decision.                        |
| Not verified          | Evidence is missing; never read this as either working or absent. |

## Navigation

1. [Overview, scope, business model and roadmap](01-Project-Overview/Project-Charter-and-Scope.md)
2. [Product and software requirements](02-Requirements/PRD.md)
3. [System design and diagrams](03-System-Design/Architecture.md)
4. [Technical reference](04-Technical-Docs/Tech-Stack-and-Standards.md)
5. [Design system and user flows](05-UI-UX/Design-System-and-Flows.md)
   - [UI screens by role and design system sheet](05-UI-UX/UI-Screens/README.md)
6. [Development workflow and reviews](06-Development/Workflow-and-Code-Review.md)
7. [Testing and known gaps](07-Testing-QA/Test-Plan.md)
8. [Security, permissions and privacy](08-Security/Threat-Model-and-Permissions.md)
9. [Deployment, backup and monitoring](09-DevOps-Infrastructure/Operations.md)
10. [Project management and decisions](10-Project-Management/Decisions-and-Open-Work.md)
11. [Release notes and version policy](11-Releases/Release-Notes.md)
12. [Troubleshooting, handover and user guide](12-Maintenance/Troubleshooting-and-Handover.md)

[Coverage and deliberately omitted artifacts](Coverage.md) explains how the supplied template is used without filler. Source code, schemas and migrations determine implemented behavior. Owner decisions determine business intent. Where these differ, the difference is recorded instead of rewriting a plan as a completed feature.

## Current operating boundary

- Arabic-only website, responsive RTL student and agent experiences. English documentation does not change the site's language.
- Electronic purchases and top-ups are disabled; card balance is zero. Planned 2% top-up commission is not implemented by this documentation.
- Email verification/recovery code is implemented but disabled, pending owned sender domain/provider and actual delivery tests. MFA is not implemented.
- Redacted diagnostics exist; external alerts and a verified database restore do not yet have evidence.
- Restaurant media/model migration is held outside the release pending backup/restore verification. Existing fallback data is preserved.
- No capacity, security-certification, full-Figma-equality or uptime guarantee is claimed.
