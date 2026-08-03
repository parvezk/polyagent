
## 2024-08-03 - Form and Custom Radio Group Accessibility
**Learning:** Custom interactive elements (e.g., div-based radio buttons) must have explicit ARIA roles (e.g., `role="radiogroup"` and `role="radio"`), appropriate states (`aria-checked`), and associated labels (`aria-labelledby` or `aria-label`). Form elements also require a pairing between an `id` on the input element and the `htmlFor` attribute on its corresponding `<label>` for proper screen reader support.
**Action:** Always add ARIA roles/states for custom UI widgets and ensure explicit `htmlFor`/`id` bindings are established between labels and inputs in all form definitions.
