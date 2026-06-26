/**
 * Derive a short label from the first line of a prompt — used for session
 * titles/labels across adapters.
 */
export function labelFromPrompt(prompt: string, maxLength = 80): string {
  return prompt.split("\n")[0].slice(0, maxLength);
}
