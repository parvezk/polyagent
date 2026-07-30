## 2026-07-30 - Optimize terminal state polling
**Learning:** Operations should avoid redundant database writes for unchanged terminal sessions and skip external API polling entirely when the 'summary' field is not required.
**Action:** Always check if a session is in a terminal state ('completed', 'failed') before polling external APIs or performing DB writes.
