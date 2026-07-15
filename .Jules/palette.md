## 2024-05-24 - Keyboard Accessibility for Custom Interactive Elements
**Learning:** Interactive elements not natively focusable (like `<tr>` with `onClick`) completely lock out keyboard users. A standard user interface component built out of primitives often lacks default accessibility.
**Action:** When making custom non-interactive tags (like `<tr>` or `<div>`) interactive via `onClick`, always include `tabIndex={0}`, an `onKeyDown` handler for 'Enter' and 'Space' (`e.key === "Enter" || e.key === " "`), and appropriate visual focus styles (`focus-visible:ring-2 focus-visible:outline-none`).
