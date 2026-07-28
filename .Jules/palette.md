## 2026-07-16 - [Keyboard Support for Interactive Non-Semantic Elements]
**Learning:** Adding `onClick` to non-interactive elements like `<tr>` or `<div>` creates an accessibility barrier for keyboard users. They need `tabIndex={0}`, `onKeyDown` handling for Enter/Space, and visible focus states (`focus-visible:ring-*`).
**Action:** Always ensure that custom interactive components include keyboard navigation matching their mouse interactions to support screen readers and keyboard users.

## 2026-06-23 - Interactive UI accessibility for custom elements & placeholders
**Learning:** Custom interactive UI components like div-based radio buttons require explicit ARIA roles (e.g., `role="radiogroup"` and `role="radio"`) and states (like `aria-checked`), alongside strict `id`/`aria-labelledby` linkages. Additionally, inputs relying solely on placeholders lack sufficient context for screen readers.
**Action:** When creating form interactions without native `<input type="radio">` or explicit visible labels for textual inputs, I must manually associate labels with IDs, apply ARIA attributes for non-native interactive elements, and use keyboard-friendly classes (like `focus-visible`).
