/**
 * Derive a short label from the first line of a prompt — used for session
 * titles/labels across adapters.
 */
export function labelFromPrompt(prompt, maxLength = 80) {
    return prompt.split("\n")[0].slice(0, maxLength);
}
