## 2026-07-16 - [Keyboard Support for Interactive Non-Semantic Elements]

**Learning:** Adding `onClick` to non-interactive elements like `<tr>` or `<div>` creates an accessibility barrier for keyboard users. They need `tabIndex={0}`, `onKeyDown` handling for Enter/Space, and visible focus states (`focus-visible:ring-*`).
**Action:** Always ensure that custom interactive components include keyboard navigation matching their mouse interactions to support screen readers and keyboard users.

## 2024-07-17 - Enter-to-send in Chat UI

**Learning:** Users naturally expect chat-like textareas (like follow-ups to agents) to submit when pressing `Enter`. Without this, users are forced into inefficient keyboard-to-mouse context switching. Furthermore, bare textareas often lack accessible labels when their primary description is solely in the placeholder attribute.
**Action:** Always implement Enter-to-send (preventing default to avoid newlines, checking for `!e.shiftKey`) in chat interfaces, update placeholders to discoverably explain the shortcut, and ensure explicit `aria-label`s are added for screen readers when visible labels are omitted.
