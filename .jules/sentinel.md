## 2026-07-15 - Missing API Route Authentication Due to Middleware Bypass
**Vulnerability:** The GET endpoint `/api/jules/sources` exposed connected repositories (data leak) without requiring authentication.
**Learning:** Next.js middleware in this project excludes `/api` paths from global authentication (`matcher: ["/((?!...|api|...).*)"]`). This means every individual API route must explicitly perform its own auth check (e.g., via `currentUserId()`), and any omission results in a critical missing authentication vulnerability.
**Prevention:** Whenever adding or modifying an endpoint under `/api/`, verify that `currentUserId()` (or an equivalent manual auth check) is invoked at the start of the handler.

## 2025-02-28 - [Local Information Disclosure in State Storage]
**Vulnerability:** Local state storage (`~/.polyagent/state.json`) was being created with default insecure permissions, allowing potential local information disclosure of sensitive vendor API sessions.
**Learning:** Node's `fs.writeFileSync` `mode` option only applies upon *creation*. For pre-existing files, this mode flag is ignored, leaving existing permissions unmodified. Also, carelessly applying `chmodSync(dirname, ...)` can maliciously or accidentally alter permissions on critical shared parent directories (like `.` or `/tmp`).
**Prevention:** 1) Always enforce `mode: 0o700` for directory creation in local storage. 2) Explicitly execute `chmodSync(file, 0o600)` wrapped in a try/catch *after* writing the file to enforce permissions even on previously created files. 3) Avoid blindly modifying parent directory permissions without bounds checking.
