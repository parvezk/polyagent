## 2024-06-25 - Explicit ARIA roles and Labels in Next.js Custom UI
**Learning:** Custom interactive UI components (e.g., div-based radio buttons) and Shadcn UI components require explicit ARIA roles (like `role="radiogroup"` and `role="radio"`), states (`aria-checked`), and `aria-label`/`aria-labelledby` attributes to maintain proper screen reader accessibility. Placeholders do not provide adequate accessibility.
**Action:** Always ensure that custom form elements and UI components explicitly associate labels with their inputs via `htmlFor` and `id`, or `aria-labelledby`/`aria-label`.
