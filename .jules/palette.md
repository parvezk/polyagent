
## 2024-05-18 - Improve accessibility of New Agent form
**Learning:** Custom interactive UI components (e.g., div-based radio buttons) require explicit ARIA roles (like `role="radiogroup"` and `role="radio"`), states (`aria-checked`), and `aria-label`/`aria-labelledby` attributes to maintain proper screen reader accessibility. Next.js form elements (Inputs, Selects, Textareas) need explicit label associations via `id` and `htmlFor` attributes to be properly accessible.
**Action:** Always add ARIA roles/states and explicit ID-based label associations when building or auditing custom form controls and inputs in the app.
