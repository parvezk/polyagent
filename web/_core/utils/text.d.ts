/**
 * Derive a short label from the first line of a prompt — used for session
 * titles/labels across adapters.
 */
export declare function labelFromPrompt(prompt: string, maxLength?: number): string;
/**
 * For sandbox agents (Claude, Gemini) that don't take a repo natively: prepend
 * a clone instruction so a repo/branch becomes a structured input, not prose.
 */
export declare function withRepoInstruction(req: {
  prompt: string;
  repo?: string;
  branch?: string;
}): string;
