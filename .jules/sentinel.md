## 2024-07-18 - [Missing Auth on Jules Sources Endpoint]
**Vulnerability:** [The `/api/jules/sources` endpoint allowed unauthenticated access to query connected GitHub repositories.]
**Learning:** [Next.js middleware in this project excludes `/api` paths from global authentication. Individual `/api` endpoints must explicitly perform their own authentication checks.]
**Prevention:** [Always add explicit authentication checks using `currentUserId()` at the beginning of any new `/api` route handlers.]
