## 2026-07-16 - [Keyboard Support for Interactive Non-Semantic Elements]
**Learning:** Adding `onClick` to non-interactive elements like `<tr>` or `<div>` creates an accessibility barrier for keyboard users. They need `tabIndex={0}`, `onKeyDown` handling for Enter/Space, and visible focus states (`focus-visible:ring-*`).
**Action:** Always ensure that custom interactive components include keyboard navigation matching their mouse interactions to support screen readers and keyboard users.

## 2026-07-29 - [Keyboard Support for Interactive Non-Semantic Elements and Forms]
**Learning:** Custom interactive UI components like div-based radio groups need explicit ARIA states (`role="radiogroup"`, `role="radio"`, `aria-checked`) and relationships (`aria-labelledby`). Similarly, generic inputs relying only on placeholders or shared generic labels lack accessibility.
**Action:** Ensure custom interactive elements have correct ARIA roles and states mapped from React state, and ensure all inputs have an explicit `aria-label` or `id`/`htmlFor` pairing.
