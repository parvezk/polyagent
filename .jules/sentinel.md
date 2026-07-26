## 2024-07-26 - Missing Authentication on External API Endpoint
**Vulnerability:** The `/api/jules/sources` endpoint lacked explicit authentication checks, allowing unauthenticated users to trigger external API calls using server-side keys.
**Learning:** Next.js `/api` endpoints that use server-side keys for third-party API calls do not benefit from Supabase Row Level Security (RLS) and require explicit authentication checks (e.g., via `currentUserId()`), as they bypass global middleware authentication.
**Prevention:** Always implement explicit authentication checks in `/api` route handlers that do not rely on RLS-secured Supabase queries.
