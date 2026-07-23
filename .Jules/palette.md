## 2026-07-16 - [Keyboard Support for Interactive Non-Semantic Elements]
**Learning:** Adding `onClick` to non-interactive elements like `<tr>` or `<div>` creates an accessibility barrier for keyboard users. They need `tabIndex={0}`, `onKeyDown` handling for Enter/Space, and visible focus states (`focus-visible:ring-*`).
**Action:** Always ensure that custom interactive components include keyboard navigation matching their mouse interactions to support screen readers and keyboard users.
## 2024-07-23 - Add ARIA labels to placeholder-only inputs
**Learning:** In complex inline form layouts (like grid configurations where labels would visually clutter the design), developers often rely on placeholder text without accompanying `<label>` elements. Placeholders are insufficient for screen readers.
**Action:** When `htmlFor` pairings cannot be used due to visual layout constraints, enforce the use of explicit `aria-label` attributes on inputs like `<Input>`, `<SelectTrigger>`, and `<Textarea>` to ensure screen reader accessibility.
