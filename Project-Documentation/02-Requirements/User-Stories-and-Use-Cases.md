# User stories and use cases

These stories describe present journeys unless marked planned. They are not invented customer research.

| Actor                | Story                                                      | Acceptance boundary                                               |
| -------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------- |
| Guest                | Find universities, courses and student services            | Public metadata never grants protected resource access.           |
| Student              | Select university/faculty and submit membership request    | Valid scope; pending until authorized review.                     |
| Student              | See activation status and follow requests                  | No false success or access to someone else's requests.            |
| Active student       | Save courses and mark personal learning progress           | Scope checked, no grade/certificate claim.                        |
| Student              | Apply to a team or volunteer opportunity                   | Eligibility/capacity rules enforced server-side.                  |
| Coordinator          | Switch between student and assigned management view        | Mode switch grants no new permissions.                            |
| Affairs agent        | Review students and assign authorized faculty capabilities | Same faculty/institution, eligible existing student.              |
| Private-sector agent | Manage permitted listing sections                          | Read/edit/publish rights and own institution enforced.            |
| Platform admin       | Activate institutions and review eligible agents           | No role from public signup; audit sensitive writes.               |
| Student              | Request cash purchase or housing inspection                | Electronic balance not charged; inspection is not a paid booking. |
| Account holder       | Verify email or recover password                           | Implemented but disabled; actual delivery prerequisite.           |

## UC01: Student signup and activation

Precondition: available university/faculty. Student enters account data, selects scope, and creates identity. With current disabled email mode, the form submits the pending membership request. If that second step fails, the existing account remains and the account page can resubmit scope; never ask for a duplicate account. Authorized affairs/admin review does not verify email ownership.

When email is later enabled, signup first sends verification and shows a resend screen without an unverified application session. After confirmation, the student selects scope to complete membership. This additional flow is accepted in principle but disabled pending provider setup.

## UC02: Scoped publishing

An active authorized agent opens an assigned section, saves a valid draft, then publishes only if read/edit/publish rights all allow it. Another institution/faculty, inactive parent or missing right must fail on direct server replay too. Student visibility additionally follows the entry's publication and academic/organization rules.

## UC03: Checkout/request

Student opens an available service, supplies required request data, and uses the currently supported cash/request path. Electronic card payment returns an honest unavailable result with no debit. Agent updates the request in allowed states. Refund/settlement behavior for future electronic payments is not yet decided.

## UC04: Account recovery, disabled

User enters email, receives a generic acknowledgement, follows a bounded reset link, enters matching valid passwords, and logs in again. Successful reset invalidates prior sessions; expired/reused tokens fail. Unknown addresses do not get an existence-revealing response. Provider delivery is still unverified.
