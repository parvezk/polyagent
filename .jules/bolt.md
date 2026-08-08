## 2026-08-08 - Prevent Redundant Writes & Network Calls When Polling
**Learning:** In polling loops, writing the entire polled state blindly to a database or file system on every tick causes unnecessary I/O thrashing and degrades performance, especially when states are terminal (e.g., 'completed', 'failed') or unchanged.
**Action:** Always diff the live state against the stored state before initiating a write operation, and skip remote API calls entirely for terminal states when the payload delta (like a status summary) isn't strictly required.
