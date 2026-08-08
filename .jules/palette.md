## 2024-05-13 - [New Agent Modal Vendor Radios]
**Learning:** Custom interactive UI components like a grid of buttons functioning as radio buttons need explicit ARIA roles (e.g. `role="radiogroup"`, `role="radio"`) and aria properties (e.g. `aria-checked`) to maintain accessibility.
**Action:** When implementing custom radio elements instead of standard input[type=radio], either use simple buttons with `aria-pressed`, or if using full `role="radio"`, you must correctly implement a roving `tabindex` pattern that actually manages focus using refs.
