// Gemini / Antigravity (Managed Agents) constants.
// Source: https://ai.google.dev/gemini-api/docs/managed-agents-quickstart
// Confirmed base URL via doc fetch 2026-06-27.
/** Base URL for the Gemini Interactions REST API (v1beta — experimental, may change). */
export const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
/**
 * Default Antigravity agent identifier.
 * CONFIRMED via docs: "antigravity-preview-09-2026" is the current default
 * (replaces shut-down "antigravity-preview-05-2026", earliest shutdown 2026-10-05).
 * Custom trained agent IDs (e.g. "fibonacci-analyst") may also be passed via modelId.
 */
export const ANTIGRAVITY_AGENT = "antigravity-preview-09-2026";
