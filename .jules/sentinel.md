## 2024-07-28 - Missing Authentication on API Route
**Vulnerability:** Found an exposed endpoint (`/api/jules/sources`) that calls an external service (`realJulesPort`) without an authentication check, bypassing RLS.
**Learning:** Next.js middleware in this project excludes `/api` paths from global authentication. Individual `/api` endpoints must explicitly perform their own authentication checks (e.g., via `currentUserId()`), which is especially critical for endpoints making external/third-party API calls using server-side keys since they do not benefit from Supabase Row Level Security (RLS).
**Prevention:** Always implement `const userId = await currentUserId(); if (!userId) return 401;` on any `/api` endpoint before performing business logic or calling external services.
