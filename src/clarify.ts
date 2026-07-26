import Anthropic from "@anthropic-ai/sdk";
import {
  CLARIFIER_MODEL,
  CLARIFIER_SYSTEM_PROMPT,
  MAX_CLARIFYING_QUESTIONS,
} from "./constants/clarify.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Structured verdict on a task instruction. */
export interface TaskAssessment {
  /** True when the instruction is specific and safe enough to dispatch as-is. */
  clear: boolean;
  /** Short phrases naming what's unclear or risky. Empty when clear. */
  concerns: string[];
  /** Specific clarifying questions to ask the user. Empty when clear. */
  questions: string[];
}

/** A clarifying question paired with the user's answer. */
export interface ClarificationAnswer {
  question: string;
  answer: string;
}

/**
 * Port for the clarification check. Kept behind an interface (like ClaudePort /
 * JulesPort) so the wizard logic is unit-testable with a fake — no API key,
 * deterministic. The real port wraps the Anthropic SDK.
 */
export interface ClarifierPort {
  assess(prompt: string): Promise<TaskAssessment>;
}

// ---------------------------------------------------------------------------
// Pure helpers (unit-tested without a key)
// ---------------------------------------------------------------------------

/**
 * A fail-open "looks clear" verdict. Used whenever we can't get a real answer
 * (unparseable model output, API error): we must never block a dispatch just
 * because the optional clarification check couldn't run.
 */
export function clearAssessment(): TaskAssessment {
  return { clear: true, concerns: [], questions: [] };
}

/**
 * Parse the model's raw text into a TaskAssessment. Tolerant by design:
 * strips ```json fences, ignores prose around the JSON object, coerces field
 * shapes, and falls back to a fail-open "clear" verdict on anything malformed.
 */
export function parseAssessment(raw: string): TaskAssessment {
  const jsonText = extractJsonObject(raw);
  if (!jsonText) return clearAssessment();

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return clearAssessment();
  }
  if (typeof parsed !== "object" || parsed === null) return clearAssessment();

  const obj = parsed as Record<string, unknown>;
  const concerns = toStringArray(obj.concerns);
  const questions = toStringArray(obj.questions).slice(0, MAX_CLARIFYING_QUESTIONS);
  // Treat as clear unless the model explicitly said otherwise or gave us questions.
  const clear = obj.clear === false ? false : questions.length === 0;

  return { clear, concerns, questions };
}

/**
 * Compose a refined prompt from the original instruction plus the answered
 * clarifying questions. Unanswered (blank) questions are dropped. When nothing
 * was answered the original prompt is returned unchanged.
 */
export function refinePrompt(original: string, answers: ClarificationAnswer[]): string {
  const answered = answers.filter((a) => a.answer.trim().length > 0);
  if (answered.length === 0) return original;

  const clarifications = answered
    .map((a) => `- ${a.question.trim()}\n  ${a.answer.trim()}`)
    .join("\n");

  return `${original.trim()}\n\nAdditional clarifications:\n${clarifications}`;
}

function extractJsonObject(raw: string): string | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  return raw.slice(start, end + 1);
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}

// ---------------------------------------------------------------------------
// Real port — wraps the Anthropic Messages API
// ---------------------------------------------------------------------------

export function realClarifierPort(apiKey: string, model: string = CLARIFIER_MODEL): ClarifierPort {
  const client = new Anthropic({ apiKey });

  return {
    async assess(prompt) {
      const res = await client.messages.create({
        model,
        max_tokens: 1024,
        system: CLARIFIER_SYSTEM_PROMPT,
        messages: [{ role: "user", content: `Instruction to review:\n\n${prompt}` }],
      });

      const text = res.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("");

      return parseAssessment(text);
    },
  };
}
