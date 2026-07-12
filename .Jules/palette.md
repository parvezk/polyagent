## 2024-03-24 - Accessibility improvements on NewAgentModal
**Learning:** The forms were missing basic `htmlFor` and `id` bindings, which makes it harder for screen readers and keyboard users to navigate inputs (they can't click the label to focus). We added these to Repo, Task, and Model.
**Action:** Always ensure that when a custom component has an inner native input, or a label is used alongside an input/select/textarea, the label has an `htmlFor` that matches the `id` of the input.
