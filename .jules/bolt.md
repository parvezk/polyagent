## 2025-02-27 - Skip DB writes for terminal sessions
**Learning:** PolyAgent sessions have terminal states (`completed`, `failed`). While web endpoints must still poll to retrieve unpersisted fields like 'summary', we can skip DB writes if the DB state is already terminal to avoid unnecessary operations.
**Action:** Always check if a session is in a terminal state before making external network calls or database writes, while keeping in mind missing fields in the DB schema.
