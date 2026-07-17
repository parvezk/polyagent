## 2025-07-17 - Eliminate cascading render in React components
**Learning:** Setting state synchronously inside a `useEffect` when responding to prop changes (like resetting form state when a selected ID changes) triggers an extra render cycle, hurting performance and causing cascading renders.
**Action:** Perform these state updates conditionally during the render phase instead of in a `useEffect`. To do this safely and avoid infinite loops, use a state variable to track the previous value of the prop and compare it to the current value, as recommended by React hooks best practices.
