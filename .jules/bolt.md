## 2024-08-03 - Avoid Redundant Polling and Writes for Terminal Sessions
**Learning:** In Polyagent, terminal session states (`completed`, `failed`) don't change. Polling external APIs for these states is unnecessary when the summary isn't needed (e.g., in the CLI). In the web API where summary is needed, writing the unchanged state back to the database is a redundant operation that slows down the polling cycle.
**Action:** Skip API polling for terminal states in the CLI, and skip database writes (updates) when the session status hasn't changed.
