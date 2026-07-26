import Anthropic from "@anthropic-ai/sdk";
import { DEFAULT_CLAUDE_MODEL } from "../constants/claude.js";
import type { Vendor } from "../types.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Overall read on whether the task is safe to hand to an agent as written. */
export type TaskVerdict = "ready" | "needs_clarification" | "flawed";

export interface TaskReview {
  verdict: TaskVerdict;
  /** One-line read on the task — always present, even when `ready`. */
  summary: string;
  /** Follow-ups the user should answer before dispatching (may be empty). */
  questions: string[];
  /** Flawed, contradictory, or risky instructions to push back on (may be empty). */
  concerns: string[];
}

export interface ReviewContext {
  vendor: Vendor;
  repo?: string;
  model?: string;
}

// ---------------------------------------------------------------------------
// Prompt + schema
// ---------------------------------------------------------------------------

const REVIEW_SYSTEM = `You are the dispatch reviewer for PolyAgent, a CLI that fires tasks off to autonomous coding agents (Claude, Jules, and others). You run once, right before a task is handed to an agent that will act on it with little or no further human input.

Your job is to catch bad or underspecified work at the wizard step so the agent isn't sent off on a wasted run. Read the task the way the agent will and look for:
- Genuine ambiguity that changes what gets built (unstated target files/repos, undefined scope, "it"/"the thing" with no referent).
- Contradictory or self-defeating instructions.
- Missing constraints the agent can't safely guess (framework, language, destructive actions, where output should go).
- Instructions that are simply flawed and worth pushing back on before any work happens.

Be a skeptical reviewer, not a rubber stamp — but don't manufacture problems. A clear, well-scoped task should come back as "ready" with empty questions and concerns. Keep every question and concern to a single sharp sentence, and surface only the few that actually matter. Do not rewrite the task, do not restate it back, and do not add pleasantries.

Verdict guide: "ready" = safe to dispatch as-is; "needs_clarification" = answerable follow-ups would materially improve the run; "flawed" = the task is contradictory or misguided and should be reconsidered.`;

const REVIEW_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    verdict: { type: "string", enum: ["ready", "needs_clarification", "flawed"] },
    summary: { type: "string" },
    questions: { type: "array", items: { type: "string" } },
    concerns: { type: "array", items: { type: "string" } },
  },
  required: ["verdict", "summary", "questions", "concerns"],
} as const;

function buildUserPrompt(task: string, ctx: ReviewContext): string {
  const facts = [
    `vendor: ${ctx.vendor}${ctx.vendor === "jules" ? " (async · clones the repo and opens a PR)" : " (managed agent · general sandbox)"}`,
    ctx.repo
      ? `repo: ${ctx.repo}`
      : "repo: (none — sandbox has no repo unless the task provides one)",
    ctx.model ? `model: ${ctx.model}` : undefined,
  ]
    .filter(Boolean)
    .join("\n");

  return `Dispatch context:\n${facts}\n\nTask to review:\n"""\n${task}\n"""`;
}

// ---------------------------------------------------------------------------
// Review call
// ---------------------------------------------------------------------------

/**
 * Ask Claude to vet a task before dispatch — surfacing clarifying questions and
 * flagging shaky instructions. Throws on API/parse failure so the caller can
 * decide whether to degrade gracefully (the wizard continues without review).
 */
export async function reviewTask(
  task: string,
  ctx: ReviewContext,
  apiKey: string,
): Promise<TaskReview> {
  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: DEFAULT_CLAUDE_MODEL,
    max_tokens: 1024,
    system: REVIEW_SYSTEM,
    // Structured output keeps the reviewer machine-readable; low effort keeps
    // the pre-dispatch pause short.
    output_config: { format: { type: "json_schema", schema: REVIEW_SCHEMA }, effort: "low" },
    messages: [{ role: "user", content: buildUserPrompt(task, ctx) }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  return normalize(JSON.parse(text));
}

/** Defensively coerce the parsed JSON into a TaskReview (models can drift). */
export function normalize(raw: unknown): TaskReview {
  const obj = (raw ?? {}) as Record<string, unknown>;
  const verdict =
    obj.verdict === "ready" || obj.verdict === "needs_clarification" || obj.verdict === "flawed"
      ? obj.verdict
      : "needs_clarification";
  const toStrings = (v: unknown): string[] =>
    Array.isArray(v)
      ? v.filter((x): x is string => typeof x === "string" && x.trim().length > 0)
      : [];

  return {
    verdict,
    summary: typeof obj.summary === "string" ? obj.summary : "",
    questions: toStrings(obj.questions),
    concerns: toStrings(obj.concerns),
  };
}
