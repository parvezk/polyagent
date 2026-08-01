## 2026-08-01 - Optimize Synchronous File I/O in Loop
**Learning:** Calling `writeFileSync` inside a loop leads to repeated blocking file I/O operations and performance degradation, particularly evident when updating many sessions sequentially.
**Action:** Implemented a bulk update method (`upsertMany`) to accumulate the changes in memory and execute a single file write operation outside the loop, resulting in significant performance improvement (e.g. from ~41ms to ~0.88ms for 100 items).
