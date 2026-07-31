## 2026-07-31 - Handle optimistic UI correctly with try/catch

**Learning:** When using fetch, check `res.ok` before updating the UI, as fetch only throws on network errors. You also need to properly rollback optimistic state updates inside a `catch` block if the request fails (including putting the value back in the textarea and removing the optimistic message).
**Action:** Use `if (!res.ok) throw new Error(...)` alongside `try/catch` and rollback optimistic states when appropriate.
