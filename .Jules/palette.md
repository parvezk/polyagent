## 2026-07-16 - [Keyboard Support for Interactive Non-Semantic Elements]
**Learning:** Adding `onClick` to non-interactive elements like `<tr>` or `<div>` creates an accessibility barrier for keyboard users. They need `tabIndex={0}`, `onKeyDown` handling for Enter/Space, and visible focus states (`focus-visible:ring-*`).
**Action:** Always ensure that custom interactive components include keyboard navigation matching their mouse interactions to support screen readers and keyboard users.
## 2026-07-24 - [Proper Form Field Accessibility]
**Learning:** Next.js form fields relying solely on placeholders without a label (or where the label lacks an htmlFor matching the input id) are inaccessible to screen readers. For inputs without a visible text label (like optional or secondary fields), explicitly add an aria-label.
**Action:** Always associate labels with inputs using id/htmlFor or provide an explicit aria-label when a visible label is missing.
