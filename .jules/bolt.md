## 2025-02-25 - Prevent Prop-Driven State Cascades
**Learning:** In React components listening to prop changes (like `session.id` in `SessionDrawer`), using `useEffect` to reset derived state causes a double-render because the state is reset asynchronously after the initial render cycle completes.
**Action:** Always prefer conditional render-phase state updates (e.g. `if (prop !== prevProp) { setPrevProp(prop); setDerivedState(...) }`) over `useEffect` when keeping state synchronized with props. This bypasses the extra render entirely.
