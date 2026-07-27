## 2024-07-27 - React Render Phase State Updates & Dynamic SWR Polling
**Learning:** `useEffect` should not be used for synchronizing state with props, as it causes a double render (React docs recommend deriving state during render). Additionally, SWR's `refreshInterval` can be set dynamically (or to 0 to disable) based on external data states like a completed session.
**Action:** When a prop changes and derived state needs updating, update it directly in the render function conditionally. For data fetching, disable polling dynamically when terminal states are reached.
