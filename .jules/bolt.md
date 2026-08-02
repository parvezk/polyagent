## 2026-08-02 - Skipping redundant polling for terminal sessions
**Learning:** Terminal sessions ('completed' or 'failed') do not change state, making full lifecycle polling and state upserting redundant and a waste of DB/Network resources.
**Action:** Before dispatching an update or patching state, explicitly check if the current state is already terminal and bail out early, preventing useless database writes.
