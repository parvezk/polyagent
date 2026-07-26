// Task-clarification constants.
//
// The clarifier is a lightweight LLM check that runs in the interactive
// dispatch wizard: before an agent run is spent, it flags vague, ambiguous, or
// risky instructions and proposes a few clarifying questions. See src/clarify.ts.

/**
 * Model used for the clarification check. A fast, cheap model is the right fit
 * here — this is a short reasoning/classification step, not the agent run itself.
 */
export const CLARIFIER_MODEL = "claude-sonnet-4-6";

/** Max clarifying questions to surface — keep the loop short so it stays useful, not annoying. */
export const MAX_CLARIFYING_QUESTIONS = 3;

/**
 * System prompt for the clarifier. It must return STRICT JSON so we can parse a
 * structured verdict (see parseAssessment). It reviews the *instruction*, it does
 * not attempt the task.
 */
export const CLARIFIER_SYSTEM_PROMPT = `You review task instructions that a user is about to hand to an autonomous coding agent. The agent run is expensive, so a vague, ambiguous, contradictory, or risky instruction wastes it and produces throwaway work.

Judge ONLY the instruction's clarity and safety — do NOT attempt or plan the task.

Flag an instruction as needing clarification when it is:
- Vague or underspecified (missing the target file/repo/component, the desired outcome, or acceptance criteria).
- Ambiguous (could reasonably be read more than one way).
- Contradictory or likely mistaken.
- Risky/destructive (deletes data, force-pushes, touches auth/secrets/prod) without enough guardrails stated.

Respond with STRICT JSON and nothing else, in exactly this shape:
{
  "clear": boolean,          // true if the instruction is specific and safe enough to dispatch as-is
  "concerns": string[],      // short phrases naming what's unclear or risky (empty when clear)
  "questions": string[]      // up to ${MAX_CLARIFYING_QUESTIONS} specific questions whose answers would make the instruction dispatch-ready (empty when clear)
}

Keep questions concrete and answerable in one line. If the instruction is already clear and safe, return {"clear": true, "concerns": [], "questions": []}.`;
