## 2026-07-31 - Handle optimistic UI correctly with try/catch

**Learning:** When using fetch, check `res.ok` before updating the UI, as fetch only throws on network errors. You also need to properly rollback optimistic state updates inside a `catch` block if the request fails (including putting the value back in the textarea and removing the optimistic message).
**Action:** Use `if (!res.ok) throw new Error(...)` alongside `try/catch` and rollback optimistic states when appropriate.

## 2024-08-01 - Missing ARIA bindings on custom controls
**Learning:** Custom non-semantic dropdowns, radio groups, and textareas can lose context without explicit ARIA relationships. `Select` and `Textarea` components required manual `aria-labelledby` linking to their custom UI labels, and `Input` fields acting solely via placeholder needed specific `aria-label`s. The custom grid of vendor buttons was entirely unreadable to screen readers until `role="radiogroup"` and `role="radio"` were implemented.
**Action:** Always verify that interactive custom components explicitly map back to a label ID using `aria-labelledby` and wrap custom radio selections in a `radiogroup` role with accurate `aria-checked` states.

## 2024-05-18 - Fix Session Drawer Linting & Accessibility
**Learning:** When migrating a setState from `useEffect` to the render phase for optimistic updates, it's easy to forget to add the `aria-label` to form fields if they just have placeholders. Placeholders are not a substitute for `aria-label` or `id`/`htmlFor` for screen readers.
**Action:** Always check form elements for `aria-label` or `id`/`htmlFor` when reviewing Next.js/React code.

## 2024-05-18 - Improve accessibility of New Agent form
**Learning:** Custom radio groups need ARIA roles (`radiogroup`, `radio`), states (`aria-checked`), roving `tabIndex`, and arrow key navigation.
**Action:** Always add proper ARIA states, label associations, and keyboard focus management when building custom form controls.
