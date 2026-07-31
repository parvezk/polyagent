## 2025-02-14 - Skip Redundant State Updates for Terminal Sessions
**Learning:** In PolyAgent, 'completed' and 'failed' are terminal states. Polling external APIs for the 'summary' field is required for web clients but creates redundant database writes if the state is already terminal. The CLI does not require the 'summary' field and can skip external polling entirely for terminal sessions.
**Action:** Always check if a session is in a terminal state before performing external API polling (if summary is unneeded) or database/file writes (to prevent redundant I/O).
