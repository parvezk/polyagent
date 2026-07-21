## 2026-07-21 - Stop SWR polling when sessions are terminal
**Learning:** Client-side SWR polling for session status updates continues indefinitely even after all sessions have reached a terminal state ('completed' or 'failed'), causing unnecessary network requests and load on the Next.js server.
**Action:** Optimized `refreshInterval` in frontend SWR hooks to dynamically halt polling when the session data indicates that all active sessions have resolved to a terminal state.
