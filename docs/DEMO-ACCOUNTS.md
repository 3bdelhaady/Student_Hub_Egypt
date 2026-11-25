# Safe demo account setup (v2)

The old one-password setup is withdrawn. Each role must have an independent, fresh password generated in a password vault. The platform-admin credential is private to the project owner. Never derive it from or reuse a student or agent credential. Keep all demo content synthetic.

Normal migrations and seed do not create accounts. The deploy-time provisioner is disabled by default. No public status, role-grant or password-reset endpoint is added.

## 1. Inspect before changing any account

Use the latest corrected commit, not an old deployment. In Vercel, remove these withdrawn variables if present:

- `DEMO_PROVISION_ENABLED`
- `DEMO_PROVISION_PASSWORD`

Set `DEMO_PROVISION_STATUS_ONLY=true` for **Production**, keep `DEMO_MODE=true`, and redeploy the latest code. This mode only reads the database. It does not create accounts, try passwords, rotate credentials or revoke sessions. Look in the build logs for `demoProvisionStatus` and share only that summary, not environment-variable values.

The equivalent operator command, with the production database configured privately, is `npm run demo:status`.

| Status                                       | Meaning and next step                                                                                                                                                                              |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `not_provisioned`                            | No reserved demo accounts or bootstrap record were found. Continue with new-account setup.                                                                                                         |
| `legacy_v1_requires_owner_approved_rotation` | The old bootstrap record and three reserved accounts exist. Do not distribute any old credentials. Ask the owner to approve rotation and sign-out of all three demo accounts before changing them. |
| `separate_credentials_v2`                    | The v2 bootstrap was recorded and three reserved accounts exist. This is provenance, not a fresh authentication test. Verify with the matching vault logins; routine redeploys do not reset them.  |
| `reserved_email_collision` or `inconsistent` | Stop for account/role inspection. Do not delete records or elevate an unrelated account to get past this check.                                                                                    |

These states are database metadata. They do not prove whether someone independently changed a password later. A public login page cannot establish this status. Do not probe it by signing up reserved emails or trying a password from chat.

## 2. New-account setup, only after `not_provisioned`

Generate three separate 32-character passwords in the vault, under three distinct login entries for the identities below. The owner copies each through its private secure link into the matching **Production** Vercel variable. Never send the password in chat, commit it, put it in a screenshot, or paste it into logs. Never send the admin credential to student or agent users.

Remove `DEMO_PROVISION_STATUS_ONLY`, then set:

| Variable                          | Value                                                            |
| --------------------------------- | ---------------------------------------------------------------- |
| `DEMO_MODE`                       | `true` (existing demo setting)                                   |
| `DEMO_PROVISION_V2_ENABLED`       | `true`                                                           |
| `DEMO_PROVISION_STUDENT_PASSWORD` | Fresh student credential from its vault entry                    |
| `DEMO_PROVISION_AGENT_PASSWORD`   | Different fresh agent credential from its vault entry            |
| `DEMO_PROVISION_ADMIN_PASSWORD`   | Different fresh owner-only admin credential from its vault entry |

Do not set `DEMO_PROVISION_ROTATE_LEGACY` for new accounts. Redeploy the latest production code. Preview deployments cannot provision. The script requires all three values, 24-128 characters each, and rejects equality between any pair. Old shared-password variables are refused. A reserved email already in use without the matching bootstrap record is never automatically elevated.

| Identity       | Login                          | Scope                                                                                     |
| -------------- | ------------------------------ | ----------------------------------------------------------------------------------------- |
| Student        | `demo.student@studenthub.test` | Active demo-computing membership                                                          |
| Agent          | `demo.agent@studenthub.test`   | University super agent for the demo-computing faculty, never private sector               |
| Platform admin | `demo.admin@studenthub.test`   | Platform institution/agent/content controls and demo academic admin workspace, owner only |

Use `/login`. `/account` routes to the correct dashboard; `/student` explicitly opens the student view. These `.test` identities cannot receive real email. No recovery or email delivery is promised.

Verify fresh login for each role using only that role's vault credential, verify scopes, and confirm the student and agent credentials cannot authenticate the admin identity. Do not announce that accounts work before those checks finish.

## 3. Existing legacy accounts, only with the owner's explicit approval

The old instructions must not be followed. A shared credential across roles can grant admin access to anyone who receives a lower-role login. Deleting deployment variables does **not** revoke already-created accounts, passwords or sessions.

Prepare three fresh, independent vault credentials as above. Explain to the owner that rotating all three invalidates their old passwords and signs all three out. After approval, use the v2 variables above plus `DEMO_PROVISION_ROTATE_LEGACY=true`, remove status-only mode, and redeploy the latest production code.

The script requires the old bootstrap record and the exact expected demo identities, credential links, roles and synthetic-data provenance. It refuses unmatched or partially changed accounts. It rejects reuse of any existing demo password. Rotation updates all three credential hashes, deletes all three accounts' stored sessions and writes the v2 record in one transaction. It does not change roles or affect other users. This flag is an operator mechanism, not proof of owner consent; the operator must obtain that consent first.

A repeated v2 run makes no password or role changes. If a new password is needed after v2, use a deliberate, owner-approved credential-management process rather than deleting the ledger or changing bootstrap history.

## 4. Cleanup and delivery

After verification, remove **all** `DEMO_PROVISION_*` variables from Vercel, including any legacy or rotation flag. Keep `DEMO_MODE=true`. Redeploy the latest production commit again, so the current deployment no longer carries the setup credentials. Historical deployment environments are not erased by this step; do not roll back to a withdrawn build. Use sensitive environment-variable storage where Vercel offers it.

The provisioner uses Better Auth's password hashing. Password values and hashes are never printed. It creates all users, roles, sample notices and the v2 record in one transaction, or rolls back. Cleanup does not delete accounts or replace password/session revocation.

Deliver each verified login through the corresponding private vault link. The admin link is for the owner only. If a link expires before setup, it cannot reveal the saved password again; arrange a new generated credential before setup, or an owner-approved password change after setup.

Local fixtures use three independent ephemeral test credentials on disposable data. `DEMO_PROVISION_ALLOW_LOCAL=true` is required for local writes. Never run fixtures against live Neon.
