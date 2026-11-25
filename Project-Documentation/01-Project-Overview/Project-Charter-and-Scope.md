# Project charter and scope

## Purpose and operator

Student Hub Egypt is a startup responsible for operating the platform. Its student-facing purpose is to bring academic resources, community activities and student services into one place. "Startup" is the owner's selected description; legal registration, registered entity name, jurisdiction and contractual status are not established by this document.

The intended first university scope is Qena and Luxor, beginning academic year 2027/28. This is launch intent, not a claim that either university has signed a partnership or that real operation has started.

## Business model, owner decisions

| Revenue channel                | Intended model                                                                         | Present implementation                                                  |
| ------------------------------ | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Student Center balance top-ups | 2% commission: paying 100 credits 98 to the balance                                    | Planned; top-ups and electronic purchases are disabled.                 |
| Social-channel advertising     | Ordinary advertising on YouTube, Facebook and LinkedIn channels managed by Student Hub | Business model; no automated advertising-provider integration claimed.  |
| Private-university support     | Annual subscription                                                                    | Commercial model; pricing, billing terms and contracts not yet decided. |

The in-platform payment method is the electronic Student Center card balance. To top up, a student uses an external payment gateway. Fawry was an example, not an exclusive or selected provider. Specific gateway, settlement, tax, refund, reconciliation, chargeback and fee-rounding rules are not yet decided. Do not implement them from this description alone.

Intended balance use includes Fitness Club and services for tickets, store, housing and restaurants. Planned availability is distinct from the current demo's cash/request flows. No real funds, stored-value liability or financial compliance readiness is asserted.

## Implemented website scope

- Public landing, university/course discovery and informational pages.
- Student, student-affairs and private-sector account requests, scoped activation and profile management.
- Academic courses/resources, personal learning workspace, student links and learning progress.
- Institution/department management, faculty unions/activities, Coordinator capabilities and section permissions.
- Academic teams, volunteering, certificates, voting/polls, social content and support/request tracking.
- Store, housing, restaurant and ticket presentation with supported request/checkout flows, without electronic payment collection.
- Student Center card display/history/subscriptions shown honestly with zero balance and no automatic renewal.
- Fitness account-bridge code, subject to separate app configuration and round-trip verification.

Feature-specific checks still apply. A module being present does not prove all future business operations are implemented.

## Outside current completion claims

Live payment/top-up integration; enabled email delivery; admin MFA; external object storage; verified database backup/restore; external alerting; independent penetration/load tests; real-student pilot feedback; guaranteed Figma equality; future SaaS/private-school operations; Gumball AI assistant.

## Change boundary

The current maintenance request preserves the visible experience. Authentication changes remain disabled until delivery setup and activation review. Payments, account authority, data retention and external commitments require separate decisions. The owner requested a single current-version Git history; source backups are retained separately and are not database backups.

## Success measures

No numeric adoption, conversion, performance or revenue targets are agreed. A later real-operation review should select measures and collection rules. This document invents no targets, customers, staff, budgets or delivery dates.
