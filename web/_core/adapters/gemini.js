import { labelFromPrompt, withRepoInstruction } from "../utils/text.js";
import { normalizeSessionStatus } from "../utils/status.js";
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
            prompt: withRepoInstruction(req),
            modelId: req.model,
        });
        return {
            id: created.interactionId,
            vendor: this.vendor,
            label: labelFromPrompt(req.prompt),
            status: normalizeSessionStatus(created.status),
            dispatchedAt: new Date().toISOString(),
            outputUrl: req.repo ? `https://github.com/${req.repo}` : undefined,
            firstMessage: created.firstReply,
        };
    }
    async getStatus(sessionId) {
        // Contract: MUST NOT throw — return "unknown" on any error.
        try {
            const result = await this.port.getStatus(sessionId);
            return {
                status: normalizeSessionStatus(result.status),
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
        const result = await this.port.sendFollowup(sessionId, message);
        // Gemini mints a new interaction id per follow-up; callers must re-key state.
        return { sessionId: result.interactionId };
    }
}
