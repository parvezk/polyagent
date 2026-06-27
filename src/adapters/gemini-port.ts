import { GEMINI_API_BASE, ANTIGRAVITY_AGENT } from "../constants/gemini.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Status values returned by the Gemini Interactions API.
 * CONFIRMED: in_progress, completed, failed, requires_action.
 * ASSUMED: "cancelled" included defensively — not seen in docs but mirrors Jules/logical API.
 */
export type GeminiInteractionStatus =
  | "in_progress"
  | "completed"
  | "failed"
  | "cancelled"
  | "requires_action";

export interface GeminiPort {
  /**
   * Dispatch a new interaction (async agent run).
   * Maps to: POST /interactions with background: true.
   */
  createInteraction(i: {
    prompt: string;
    /** Override default Antigravity agent. Accepts agent id like "antigravity-preview-05-2026". */
    modelId?: string;
  }): Promise<{ interactionId: string; firstReply?: string; status: GeminiInteractionStatus }>;

  /**
   * Poll the current status of an interaction.
   * Maps to: GET /interactions/{interactionId}
   */
  getStatus(interactionId: string): Promise<{ status: GeminiInteractionStatus; summary?: string }>;

  /**
   * Send a follow-up message, continuing from a previous interaction.
   * Maps to: POST /interactions with previous_interaction_id.
   * ASSUMPTION: the environment_id from the original interaction is NOT threaded through here —
   * the API docs show previous_interaction_id alone is sufficient to continue context.
   */
  sendFollowup(interactionId: string, message: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function geminiRequest(
  apiKey: string,
  method: string,
  path: string,
  body?: unknown,
): Promise<unknown> {
  const url = `${GEMINI_API_BASE}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      // CONFIRMED via docs: header name is "x-goog-api-key"
      "x-goog-api-key": apiKey,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "(no body)");
    throw new Error(`Gemini API ${method} ${path} → ${res.status}: ${text}`);
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// Real port implementation — uses native fetch (Node 23 global)
// ---------------------------------------------------------------------------

export function realGeminiPort(apiKey: string): GeminiPort {
  return {
    async createInteraction({ prompt, modelId }) {
      // CONFIRMED: agent field accepts the antigravity agent id or a custom saved agent id.
      // CONFIRMED: input is an array of {type, text} objects.
      // CONFIRMED: background:true triggers async execution (returns immediately with in_progress).
      // CONFIRMED: environment:"remote" spins up a fresh cloud sandbox.
      const agent = modelId ?? ANTIGRAVITY_AGENT;

      const resp = (await geminiRequest(apiKey, "POST", "/interactions", {
        agent,
        input: [{ type: "text", text: prompt }],
        environment: "remote",
        background: true,
      })) as {
        id?: string;
        status?: GeminiInteractionStatus;
        output_text?: string;
      };

      return {
        // CONFIRMED: response field is "id" (not "interactionId")
        interactionId: resp.id ?? "",
        status: resp.status ?? "in_progress",
        // output_text may be populated if background=false or task completes instantly
        firstReply: resp.output_text || undefined,
      };
    },

    async getStatus(interactionId) {
      // CONFIRMED: GET /interactions/{id} returns same shape as POST response
      const resp = (await geminiRequest(apiKey, "GET", `/interactions/${interactionId}`)) as {
        status?: GeminiInteractionStatus;
        output_text?: string;
      };

      return {
        status: resp.status ?? "in_progress",
        summary: resp.output_text || undefined,
      };
    },

    async sendFollowup(interactionId, message) {
      // CONFIRMED: previous_interaction_id threads conversation context
      // ASSUMPTION: reuses the same default agent; for production you'd pass environment_id to
      // reuse the exact sandbox, but that requires storing it at dispatch time.
      await geminiRequest(apiKey, "POST", "/interactions", {
        agent: ANTIGRAVITY_AGENT,
        input: [{ type: "text", text: message }],
        environment: "remote",
        background: true,
        previous_interaction_id: interactionId,
      });
    },
  };
}
