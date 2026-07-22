## 2024-05-18 - Fix Session Drawer Linting & Accessibility
**Learning:** When migrating a setState from `useEffect` to the render phase for optimistic updates, it's easy to forget to add the `aria-label` to form fields if they just have placeholders. Placeholders are not a substitute for `aria-label` or `id`/`htmlFor` for screen readers.
**Action:** Always check form elements for `aria-label` or `id`/`htmlFor` when reviewing Next.js/React code.
