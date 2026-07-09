/**
 * Derive a short label from the first line of a prompt — used for session
 * titles/labels across adapters.
 */
export function labelFromPrompt(prompt, maxLength = 80) {
  return prompt.split("\n")[0].slice(0, maxLength);
}
/**
 * For sandbox agents (Claude, Gemini) that don't take a repo natively: prepend
 * a clone instruction so a repo/branch becomes a structured input, not prose.
 */
export function withRepoInstruction(req) {
  if (!req.repo) return req.prompt;
  const branch = req.branch ? ` on branch ${req.branch}` : "";
  return `Work in the GitHub repository https://github.com/${req.repo}${branch} — clone it first, then complete this task:\n\n${req.prompt}`;
}
