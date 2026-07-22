## 2024-07-22 - Skipping external polling for terminal sessions

**Learning:** When retrieving the status of external entities (like sessions), always check if they are in a terminal state (e.g., 'completed' or 'failed') before making network requests to external APIs. In PolyAgent, failing to do so created an O(N) bottleneck as every session required an external fetch during list views.
**Action:** Implemented a bypass for external polling in `web/app/api/sessions/route.ts` and `web/app/api/sessions/[id]/route.ts`. Crucially, to make this work without losing data, the `summary` field (which used to be fetched live) must be persisted to the database and retrieved when the external fetch is bypassed.

## 2024-07-22 - Optimizing React rendering with render-phase state updates

**Learning:** When needing to reset local component state based on a prop change (like a selected `session.id` in `session-drawer.tsx`), using `useEffect` triggers an unnecessary commit and cascading re-render, hurting performance.
**Action:** Replaced `useEffect` with a conditional state update directly inside the render phase. This synchronizes state without the overhead of an extra render cycle. To avoid infinite loops, ensure strict type matching when checking previous values (e.g., using `undefined`).
