## 2024-07-14 - Polling optimization for completed sessions
**Learning:** The frontend makes a request to `/api/sessions` every 3 seconds to poll for status updates. In turn, `/api/sessions` would poll each vendor adapter's `getStatus(id)` live for *all* sessions unconditionally. As users accumulate more sessions (especially historical completed/failed ones), this O(N) external network polling per polling interval creates a severe backend performance bottleneck, wasting bandwidth and compute on terminal states that will never change.
**Action:** Always skip external API polling for sessions in terminal states (`completed`, `failed`). Also, when updating the database cache `last_polled`, check if the status *actually* changed or if the timestamp is missing to avoid redundant O(N) database update writes on every tick.

## 2024-08-01 - Batch DB inserts to avoid payload limits
**Learning:** Large arrays passed directly to database update/insert functions (like `upsertSessions`) can cause payload limits to be exceeded.
**Action:** Always batch array inserts/updates by chunking the array (e.g., using a `for` loop with array slicing and a constant `BATCH_SIZE`) to maintain reliability.
