/**
 * Status values returned by the Gemini Interactions API.
 * CONFIRMED: in_progress, completed, failed, requires_action.
 * ASSUMED: "cancelled" included defensively — not seen in docs but mirrors Jules/logical API.
 */
export type GeminiInteractionStatus = "in_progress" | "completed" | "failed" | "cancelled" | "requires_action";
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
     * Maps to: POST /interactions with previous_interaction_id and the prior environment_id
     * (passed as `environment`) so the remote sandbox is reused.
     */
    sendFollowup(interactionId: string, message: string): Promise<void>;
}
type GeminiContentPart = {
    type?: string;
    text?: string;
};
type GeminiStep = {
    type?: string;
    content?: GeminiContentPart[];
};
/**
 * Mirror the GenAI SDK's `output_text` sugar: scan backwards across steps for
 * the latest contiguous `model_output` text blocks (stopping at `user_input`).
 * Raw REST responses only expose `steps`, not `output_text`.
 */
export declare function extractGeminiOutputText(resp: {
    output_text?: string;
    steps?: GeminiStep[];
}): string | undefined;
export declare function realGeminiPort(apiKey: string): GeminiPort;
export {};
