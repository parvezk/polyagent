## 2026-07-15 - Missing API Route Authentication Due to Middleware Bypass
**Vulnerability:** The GET endpoint `/api/jules/sources` exposed connected repositories (data leak) without requiring authentication.
**Learning:** Next.js middleware in this project excludes `/api` paths from global authentication (`matcher: ["/((?!...|api|...).*)"]`). This means every individual API route must explicitly perform its own auth check (e.g., via `currentUserId()`), and any omission results in a critical missing authentication vulnerability.
**Prevention:** Whenever adding or modifying an endpoint under `/api/`, verify that `currentUserId()` (or an equivalent manual auth check) is invoked at the start of the handler.

## 2024-11-20 - Information Leakage via Error Messages
**Vulnerability:** API routes were returning internal error messages (e.g., stack traces or internal `err.message` strings) directly to the client via `NextResponse.json()`.
**Learning:** Returning `err.message` to clients can expose internal paths, configuration details, or other sensitive information, providing attackers with insights into the system's architecture.
**Prevention:** Always log the actual error internally (e.g., `console.error`) and return a generic error message (like "An internal error occurred") to the client.
