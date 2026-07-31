## 2025-07-31 - Explicit ARIA Labels vs Fallback Accessibility
**Learning:** For interactive fields in the form (like "Repository" and "Branch"), placeholder texts do not act as robust labels for screen readers. In cases where multiple inputs are clustered and cannot be strictly tied via `htmlFor` (such as the split Repos/Branch inputs), explicit `aria-label` attributes provide unambiguous accessibility support.
**Action:** Always provide explicit `aria-label` when standard visible labels (using `id` + `htmlFor`) are absent or inadequate, rather than assuming placeholders are sufficient.
