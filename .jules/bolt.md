## 2024-05-24 - [Avoid redundant API polling for terminal sessions]
**Learning:** Polling the vendor API and writing to the database for terminal states (completed/failed) when summary is not needed causes unnecessary load.
**Action:** Filter out terminal sessions unless summary is explicitly requested before external API calls, and skip redundant database writes.
