## 2024-05-01 - [Missing Authentication on API Endpoint]

**Vulnerability:** Missing authentication check on the `/api/jules/sources` Next.js route handler. Unauthenticated users could retrieve connected repositories.
**Learning:** Next.js middleware in this project (`web/middleware.ts`) explicitly excludes `/api` paths from global authentication checks. This architectural decision means every single `/api` route must perform its own authentication check (e.g. `const userId = await currentUserId(); if (!userId) return 401;`).
**Prevention:** Always verify that new `/api` routes include explicit authentication checks, as they bypass the application's global auth middleware.
