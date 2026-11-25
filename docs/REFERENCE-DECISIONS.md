# Reference reconciliation

The current approved phase-one scope takes priority over older reference documents. Older documents are product input, not an authoritative production specification or evidence of existing integrations.

| Topic                    | Older reference / Figma                                                          | Current implementation                                                                                     |
| ------------------------ | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Scope called phase one   | Some older documents include commerce, tickets, housing and other services       | Smaller agreed academic/content MVP only                                                                   |
| Agent/admin registration | Role choices shown in authentication designs                                     | Public signup is student-only; staff provisioning is separate                                              |
| Verification             | Email OTP and manual activation are described                                    | No real email delivery; independent manual membership workflow demonstrated                                |
| National ID              | Present in old registration/activation requirements                              | Not collected or stored in this demo; needs a justified live-data decision                                 |
| Academic workspace       | Some references say assigned personal workspace; faculty/year fields also appear | University-scoped resource access only; fine-grained enrollment rules remain an explicit business decision |
| Opportunities            | Jobs, internships and other listing/application concepts                         | Editorial content only; no applicant submissions or employer accounts                                      |
| Files/video              | Files, lecture videos and teaching workflows shown                               | Protected text lectures/notes; no upload, streaming or external video provider                             |
| Fitness Club             | Separate app SRS and fitness database diagram                                    | Excluded, as confirmed                                                                                     |
| Separate Student Hub app | Additional app screen designs                                                    | Responsive web only, no native app                                                                         |
| Contact/claims           | Sample statistics, contact details, accreditation and university names           | No unsupported achievement, partnership or contact claims; explicit demo content                           |

## Decisions before live academic use

1. Should access depend on university alone, or also faculty, department, study level and course enrollment?
2. Who is authorized to approve students and publish each university's academic resources?
3. Is an identity number required at all, and what less-sensitive alternative can prove eligibility?
4. Who owns/licences course material and handles removal, moderation and corrections?
5. What entity runs the service, handles user requests and owns the deployment budget?

The implementation deliberately does not invent answers to those business questions.
