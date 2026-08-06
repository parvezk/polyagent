## 2026-07-15 - Missing API Route Authentication Due to Middleware Bypass
**Vulnerability:** The GET endpoint `/api/jules/sources` exposed connected repositories (data leak) without requiring authentication.
**Learning:** Next.js middleware in this project excludes `/api` paths from global authentication (`matcher: ["/((?!...|api|...).*)"]`). This means every individual API route must explicitly perform its own auth check (e.g., via `currentUserId()`), and any omission results in a critical missing authentication vulnerability.
**Prevention:** Whenever adding or modifying an endpoint under `/api/`, verify that `currentUserId()` (or an equivalent manual auth check) is invoked at the start of the handler.

## 2024-08-06 - Insecure Local File Permissions
**Vulnerability:** Local state storage files (`~/.polyagent/state.json`) and its parent directory were created using default permissions (dependent on `umask`), leading to potential local information disclosure of session states/secrets to other users.
**Learning:** Node.js file operations like `writeFileSync` and `mkdirSync` rely on the system's `umask` by default. When storing sensitive data, strict permissions (`0o600` for files, `0o700` for directories) must be explicitly requested. However, since the `mode` parameter in `writeFileSync` only applies during file creation, `chmodSync` must be used afterward to enforce permissions on pre-existing files.
**Prevention:** Always use `{ mode: 0o600 }` in `writeFileSync` and append a `chmodSync` for existing files. Set `{ mode: 0o700 }` when creating user-specific config directories, but never blindly `chmod` parent directories via `dirname` (as it might inadvertently change permissions of shared parent directories like `/tmp`).
