## 2024-11-20 - Information Leakage via Error Messages
**Vulnerability:** API routes were returning internal error messages (e.g., stack traces or internal `err.message` strings) directly to the client via `NextResponse.json()`.
**Learning:** Returning `err.message` to clients can expose internal paths, configuration details, or other sensitive information, providing attackers with insights into the system's architecture.
**Prevention:** Always log the actual error internally (e.g., `console.error`) and return a generic error message (like "An internal error occurred") to the client.