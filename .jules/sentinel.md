## 2026-07-15 - Missing API Route Authentication Due to Middleware Bypass
**Vulnerability:** The GET endpoint `/api/jules/sources` exposed connected repositories (data leak) without requiring authentication.
**Learning:** Next.js middleware in this project excludes `/api` paths from global authentication (`matcher: ["/((?!...|api|...).*)"]`). This means every individual API route must explicitly perform its own auth check (e.g., via `currentUserId()`), and any omission results in a critical missing authentication vulnerability.
**Prevention:** Whenever adding or modifying an endpoint under `/api/`, verify that `currentUserId()` (or an equivalent manual auth check) is invoked at the start of the handler.

## 2026-08-05 - Insecure File Permissions for Local State File
**Vulnerability:** The CLI local state file `~/.polyagent/state.json` (and its parent directory) were created without strict file permissions, potentially allowing other users on the system to read sensitive session details or API tokens (Local Information Disclosure).
**Learning:** Node's default file creation functions like `writeFileSync` and `mkdirSync` rely on the system umask and do not enforce strict permissions unless explicitly requested. Furthermore, `writeFileSync`'s `mode` option only applies when the file is newly created, meaning existing files need their permissions updated using `chmodSync`.
**Prevention:** Whenever creating files that store sensitive information locally, explicitly use `mode: 0o700` for directories and `mode: 0o600` for files. Always apply `chmodSync(path, 0o600)` after writing to ensure existing files also maintain correct permissions.
