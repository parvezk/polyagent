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
  }): Promise<{
    interactionId: string;
    firstReply?: string;
    status: GeminiInteractionStatus;
  }>;
  /**
   * Poll the current status of an interaction.
   * Maps to: GET /interactions/{interactionId}
   */
  getStatus(interactionId: string): Promise<{
    status: GeminiInteractionStatus;
    summary?: string;
  }>;
  /**
   * Send a follow-up message, continuing from a previous interaction.
   * Maps to: POST /interactions with previous_interaction_id.
   * ASSUMPTION: the environment_id from the original interaction is NOT threaded through here —
   * the API docs show previous_interaction_id alone is sufficient to continue context.
   */
  sendFollowup(interactionId: string, message: string): Promise<void>;
}
export declare function realGeminiPort(apiKey: string): GeminiPort;
