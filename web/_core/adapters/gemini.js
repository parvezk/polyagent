import { labelFromPrompt } from "../utils/text.js";
// ---------------------------------------------------------------------------
// Status mapping: Gemini Interactions API → normalized SessionStatus
// ---------------------------------------------------------------------------
function mapStatus(s) {
    switch (s) {
        case "in_progress":
            return "running";
        case "completed":
            return "completed";
        case "failed":
        case "cancelled":
            return "failed";
        case "requires_action":
            return "needs_review"; // agent is waiting on the human (parallel to Jules AWAITING_*)
        default:
            return "unknown";
    }
}
// ---------------------------------------------------------------------------
// GeminiAdapter
// ---------------------------------------------------------------------------
export class GeminiAdapter {
    port;
    // ASSUMPTION: "gemini" is not yet in the Vendor union (types.ts is "claude"|"jules").
    // Cast is required until src/types.ts is updated to include "gemini".
    vendor = "gemini";
    constructor(port) {
        this.port = port;
    }
    async dispatch(req) {
        const created = await this.port.createInteraction({
            prompt: req.prompt,
            modelId: req.model,
        });
        return {
            id: created.interactionId,
            vendor: this.vendor,
            label: labelFromPrompt(req.prompt),
            status: mapStatus(created.status),
            dispatchedAt: new Date().toISOString(),
            firstMessage: created.firstReply,
        };
    }
    async getStatus(sessionId) {
        // Contract: MUST NOT throw — return "unknown" on any error.
        try {
            const result = await this.port.getStatus(sessionId);
            return {
                status: mapStatus(result.status),
                lastUpdate: new Date(),
                summary: result.summary,
                needsInput: result.status === "requires_action",
            };
        }
        catch {
            return {
                status: "unknown",
                lastUpdate: new Date(),
                needsInput: false,
            };
        }
    }
    async getOutput(sessionId) {
        const result = await this.port.getStatus(sessionId);
        return {
            sessionId,
            vendor: this.vendor,
            messages: result.summary
                ? [{ role: "agent", content: result.summary, timestamp: new Date() }]
                : [],
        };
    }
    async sendFollowup(sessionId, message) {
        await this.port.sendFollowup(sessionId, message);
    }
}
