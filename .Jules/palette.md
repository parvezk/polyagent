## 2026-07-16 - [Keyboard Support for Interactive Non-Semantic Elements]
**Learning:** Adding `onClick` to non-interactive elements like `<tr>` or `<div>` creates an accessibility barrier for keyboard users. They need `tabIndex={0}`, `onKeyDown` handling for Enter/Space, and visible focus states (`focus-visible:ring-*`).
**Action:** Always ensure that custom interactive components include keyboard navigation matching their mouse interactions to support screen readers and keyboard users.
