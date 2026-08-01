## 2024-08-01 - Batch DB inserts to avoid payload limits
**Learning:** Large arrays passed directly to database update/insert functions (like `upsertSessions`) can cause payload limits to be exceeded.
**Action:** Always batch array inserts/updates by chunking the array (e.g., using a `for` loop with array slicing and a constant `BATCH_SIZE`) to maintain reliability.
