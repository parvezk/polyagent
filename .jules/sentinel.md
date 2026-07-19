## 2026-07-19 - Missing Authentication on API Endpoints
**Vulnerability:** The `/api/jules/sources` endpoint lacked an authentication check.
**Learning:** Next.js middleware in this project excludes `/api` paths from global authentication. Individual API routes must implement their own auth checks (e.g., using `currentUserId()`).
**Prevention:** Always verify that every new API route in `web/app/api` includes an explicit authentication check before processing the request.
