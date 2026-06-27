import { labelFromPrompt } from "../utils/text.js";
// ---------------------------------------------------------------------------
// Status mapping: Claude → normalized SessionStatus
// ---------------------------------------------------------------------------
function mapStatus(claudeStatus) {
    switch (claudeStatus) {
        case "running":
        case "rescheduling":
            return "running";
        case "idle":
            return "needs_review";
        case "terminated":
            return "completed";
        default:
            return "unknown";
    }
}
// ---------------------------------------------------------------------------
// ClaudeAdapter
// ---------------------------------------------------------------------------
export class ClaudeAdapter {
    port;
    vendor = "claude";
    constructor(port) {
        this.port = port;
    }
    async dispatch(req) {
        const created = await this.port.createSession({
            prompt: req.prompt,
            modelId: req.model,
        });
        return {
            id: created.sessionId,
            vendor: this.vendor,
            label: labelFromPrompt(req.prompt),
            status: mapStatus(created.status),
            dispatchedAt: new Date().toISOString(),
            firstMessage: created.firstReply || undefined,
        };
    }
    async getStatus(sessionId) {
        try {
            const result = await this.port.getStatus(sessionId);
            const normalized = mapStatus(result.status);
            return {
                status: normalized,
                lastUpdate: new Date(),
                summary: result.summary,
                needsInput: result.status === "idle",
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
        await this.port.sendEvent(sessionId, message);
    }
}
