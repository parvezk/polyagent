## 2026-07-15 - Missing API Route Authentication Due to Middleware Bypass
**Vulnerability:** The GET endpoint `/api/jules/sources` exposed connected repositories (data leak) without requiring authentication.
**Learning:** Next.js middleware in this project excludes `/api` paths from global authentication (`matcher: ["/((?!...|api|...).*)"]`). This means every individual API route must explicitly perform its own auth check (e.g., via `currentUserId()`), and any omission results in a critical missing authentication vulnerability.
**Prevention:** Whenever adding or modifying an endpoint under `/api/`, verify that `currentUserId()` (or an equivalent manual auth check) is invoked at the start of the handler.

## 2026-08-03 - Local Information Disclosure via Insecure File Permissions
**Vulnerability:** The local `~/.polyagent/state.json` file was created with default OS permissions, allowing any other user on the same machine to read sensitive session details and tokens.
**Learning:** Node's `writeFileSync` `mode` option only applies when a file is newly created. If the file already exists (e.g. created earlier without strict permissions), `writeFileSync` does not change its permissions. Also, blindly applying `chmodSync` to parent directories (like `dirname`) is dangerous if the path resolves to shared system directories like `.` or `/tmp`.
**Prevention:** Explicitly apply `chmodSync(path, 0o600)` on state files after writing to guarantee strict permissions. When creating configuration directories, use `mode: 0o700` in `mkdirSync` but do not retrospectively `chmodSync` parent directories unless they are uniquely owned by the application.
