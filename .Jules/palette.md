## 2026-07-13 - Table Row Accessibility
**Learning:** Clickable table rows built with <tr> lack native keyboard support (focus and enter/space activation), which makes navigating session lists difficult for keyboard users.
**Action:** When adding onClick to a <tr>, always add tabIndex={0}, handle onKeyDown for Space/Enter to trigger the same action, and provide clear :focus-visible states.
