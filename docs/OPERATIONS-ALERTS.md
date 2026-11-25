# Operations diagnostics and alerts

Caught write failures emit JSON with a fixed source scope, a random incident id and timestamp. They do not serialize caught errors, requests, URLs, email addresses, headers, passwords or form fields. This gives safe correlation without leaking student data. Existing user messages remain unchanged.

External alert delivery is not configured by repository code. In the hosting provider connect an approved log drain/monitoring service and recipient, select `event=operation_failed`, set an agreed threshold to avoid alerts for every validation failure, and run a deliberate disposable-environment failure test. Do not send account/request contents to external monitoring. Provider choice, recipient and any cost need owner approval.

Migrations take a shared PostgreSQL transaction advisory lock and recheck each migration inside that lock, preventing competing release jobs from applying it twice. Local PGlite still requires one writer. Separate migrations from preview builds only after the operator chooses a dedicated release job and the backup/restore gate is verified; removing deployment migration now without that job would break releases.
