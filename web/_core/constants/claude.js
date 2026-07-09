// Claude (Anthropic Managed Agents) constants.
/** Default model when the dispatch request doesn't specify one. Overridable per-dispatch (see DispatchRequest.model / the CLI `--model` option). */
export const DEFAULT_CLAUDE_MODEL = "claude-opus-4-8";
/**
 * The Anthropic-defined tool bundle for Managed Agents. This is part of the
 * beta API contract (versioned by date), NOT an arbitrary value — it enables
 * the built-in agent tools (bash, file ops, web). Bump it when the Managed
 * Agents beta version changes.
 */
export const CLAUDE_AGENT_TOOLSET = "agent_toolset_20260401";
/**
 * Neutral default system prompt. PolyAgent dispatches arbitrary tasks (not
 * only coding), so this stays vendor/task-agnostic. Override later via config
 * or a per-dispatch system prompt if needed.
 */
export const DEFAULT_AGENT_SYSTEM_PROMPT =
  "You are an autonomous agent operating within PolyAgent. Complete the task you are given and report the outcome clearly.";
