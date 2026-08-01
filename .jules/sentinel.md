## 2026-07-15 - Missing API Route Authentication Due to Middleware Bypass
**Vulnerability:** The GET endpoint `/api/jules/sources` exposed connected repositories (data leak) without requiring authentication.
**Learning:** Next.js middleware in this project excludes `/api` paths from global authentication (`matcher: ["/((?!...|api|...).*)"]`). This means every individual API route must explicitly perform its own auth check (e.g., via `currentUserId()`), and any omission results in a critical missing authentication vulnerability.
**Prevention:** Whenever adding or modifying an endpoint under `/api/`, verify that `currentUserId()` (or an equivalent manual auth check) is invoked at the start of the handler.

## 2026-07-15 - Insecure File Permissions in State Storage
**Vulnerability:** Local state file (`~/.polyagent/state.json`) was created with default permissions, potentially exposing sensitive session data to other users on the system.
**Learning:** When creating local files and directories that contain user data or secrets, default OS permissions are often too permissive.
**Prevention:** Always explicitly set `mode: 0o700` for directories and `mode: 0o600` for files when storing sensitive local state.
