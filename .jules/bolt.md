## 2026-08-01 - Optimize Synchronous File I/O in Loop

**Learning:** Calling `writeFileSync` inside a loop leads to repeated blocking file I/O operations and performance degradation, particularly evident when updating many sessions sequentially.
**Action:** Implemented a bulk update method (`upsertMany`) to accumulate the changes in memory and execute a single file write operation outside the loop, resulting in significant performance improvement (e.g. from ~41ms to ~0.88ms for 100 items).

## 2026-07-21 - Stop SWR polling when sessions are terminal

**Learning:** Client-side SWR polling for session status updates continues indefinitely even after all sessions have reached a terminal state ('completed' or 'failed'), causing unnecessary network requests and load on the Next.js server.
**Action:** Optimized `refreshInterval` in frontend SWR hooks to dynamically halt polling when the session data indicates that all active sessions have resolved to a terminal state.

## 2024-07-14 - Polling optimization for completed sessions

**Learning:** The frontend makes a request to `/api/sessions` every 3 seconds to poll for status updates. In turn, `/api/sessions` would poll each vendor adapter's `getStatus(id)` live for _all_ sessions unconditionally. As users accumulate more sessions (especially historical completed/failed ones), this O(N) external network polling per polling interval creates a severe backend performance bottleneck, wasting bandwidth and compute on terminal states that will never change.
**Action:** Always skip external API polling for sessions in terminal states (`completed`, `failed`). Also, when updating the database cache `last_polled`, check if the status _actually_ changed or if the timestamp is missing to avoid redundant O(N) database update writes on every tick.

## 2024-08-10 - Targeted Updates vs Bulk Upserts
**Learning:** Using full object `upsertSessions` for partial state updates (like polling) causes race conditions and unnecessary DB load.
**Action:** Use targeted `patchSession` with concurrent `Promise.all` for partial updates to avoid overwriting fields modified asynchronously and to improve polling performance.
