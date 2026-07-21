## 2026-07-16 - [Keyboard Support for Interactive Non-Semantic Elements]
**Learning:** Adding `onClick` to non-interactive elements like `<tr>` or `<div>` creates an accessibility barrier for keyboard users. They need `tabIndex={0}`, `onKeyDown` handling for Enter/Space, and visible focus states (`focus-visible:ring-*`).
**Action:** Always ensure that custom interactive components include keyboard navigation matching their mouse interactions to support screen readers and keyboard users.
## 2024-05-15 - Roving tabindex needed for full radiogroup a11y
**Learning:** While `role="radiogroup"` and `role="radio"` provide essential context, true ARIA compliance for radio groups requires implementing a roving `tabIndex` and arrow-key navigation. Without it, users must tab through every single radio option rather than the group functioning as a single tab stop.
**Action:** When adding `role="radiogroup"`, try to implement roving `tabIndex` (with arrow key listeners) to keep the group as a single tab stop, or document it as a known technical debt if doing so exceeds line boundaries for a micro-UX PR.
