
## 2025-05-18 - Skip database writes for terminal sessions
**Learning:** The 'summary' field is not persisted in the database, meaning endpoints must always poll external APIs to fetch it, even for terminal states. However, we can avoid redundant database writes for these unchanged terminal sessions, and for endpoints that don't display the summary (like the CLI), we can skip polling external APIs entirely.
**Action:** Apply conditional logic to skip external API calls or database writes for sessions that have reached a terminal state ('completed' or 'failed'), preventing N+1 API calls and unnecessary DB queries.
