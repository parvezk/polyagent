## 2026-07-29 - Avoid redundant external API and DB writes for terminal sessions
**Learning:** PolyAgent sessions have terminal states ('completed' or 'failed'). External polling can be skipped entirely for these terminal states in the CLI since it doesn't need the 'summary' field. If the summary is required (e.g., web API), we must poll the external API but can skip redundant database writes for unchanged terminal sessions, saving DB load.
**Action:** Always short-circuit expensive operations like API polling and DB writes when an entity reaches an immutable terminal state.
