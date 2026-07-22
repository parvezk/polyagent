## 2024-05-18 - Missing Authentication on API Endpoints
**Vulnerability:** The `/api/jules/sources` endpoint was completely unprotected and returning data unconditionally using the server's backend API key.
**Learning:** Next.js middleware is often configured to ignore API routes (`/api/*`), which means the standard global authentication gate isn't applied to route handlers. They must explicitly implement access controls.
**Prevention:** For any route in `app/api/*`, explicitly authenticate the caller (e.g. using `currentUserId()`) at the very top of the route handler.
