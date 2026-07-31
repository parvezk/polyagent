## 2026-07-16 - [Keyboard Support for Interactive Non-Semantic Elements]
**Learning:** Adding `onClick` to non-interactive elements like `<tr>` or `<div>` creates an accessibility barrier for keyboard users. They need `tabIndex={0}`, `onKeyDown` handling for Enter/Space, and visible focus states (`focus-visible:ring-*`).
**Action:** Always ensure that custom interactive components include keyboard navigation matching their mouse interactions to support screen readers and keyboard users.

## 2024-07-12 - Form and Custom Component Accessibility Patterns
**Learning:** Found that custom UI components (like grid-based vendor selectors in `new-agent-modal.tsx`) and standard form fields (`Select`, `Textarea`, `Input`) were missing essential ARIA linkages and roles. Specifically, screen readers wouldn't know the vendor buttons acted as a radio group, and labels weren't explicitly tied to their inputs via `id`/`htmlFor`.
**Action:** When building or modifying forms in this application, ALWAYS explicitly use `id` and `htmlFor` to tie labels to standard form fields. For custom selection components that act like a group of radios, implement `role="radiogroup"` on the container, add an `aria-labelledby` linking it to the group label, and use `role="radio"` and `aria-checked` on the individual interactive elements. Also ensure textareas without visible labels get an `aria-label`.
