## 2026-07-15 - Missing API Route Authentication Due to Middleware Bypass
**Vulnerability:** The GET endpoint `/api/jules/sources` exposed connected repositories (data leak) without requiring authentication.
**Learning:** Next.js middleware in this project excludes `/api` paths from global authentication (`matcher: ["/((?!...|api|...).*)"]`). This means every individual API route must explicitly perform its own auth check (e.g., via `currentUserId()`), and any omission results in a critical missing authentication vulnerability.
**Prevention:** Whenever adding or modifying an endpoint under `/api/`, verify that `currentUserId()` (or an equivalent manual auth check) is invoked at the start of the handler.

## 2026-07-28 - Information Disclosure via Unhandled Promise Rejections in CLI
**Vulnerability:** Unhandled promise rejections in the Commander CLI (e.g., `program.parseAsync()`) leak full internal stack traces to the user's terminal upon failure.
**Learning:** Commander's asynchronous parsing does not swallow or format promise rejections by default. A raw crash leaks environment-specific details, such as local file paths (`/app/src/adapters/...`) and internal implementation details, presenting an information disclosure risk.
**Prevention:** Always append a `.catch()` block to the main CLI asynchronous entry point (e.g., `program.parseAsync().catch(...)`) to capture uncaught errors, log a sanitized generic message, and exit securely (e.g., `process.exit(1)`).
