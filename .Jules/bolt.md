## 2025-07-18 - Avoid calling setState synchronously within useEffect

**Learning:** When resetting state based on a prop change (like session ID) in a React component, doing so within `useEffect` causes a cascading render (an extra render pass). In a performance-sensitive codebase, this can be flagged by linters as `react-hooks/set-state-in-effect`.

**Action:** Perform the state reset conditionally during the render phase. By storing the previous prop value in a state variable and comparing it to the current prop value during render, you can call the state updater directly. React will immediately pause the current render and re-render with the new state, avoiding the layout shift and extra render cycle that `useEffect` would cause.
