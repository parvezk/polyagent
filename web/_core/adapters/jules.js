import { labelFromPrompt } from "../utils/text.js";
import { normalizeSessionStatus } from "../utils/status.js";
export class JulesAdapter {
    port;
    vendor = "jules";
    constructor(port) {
        this.port = port;
    }
    async dispatch(req) {
        const { sessionId, state } = await this.port.createSession({
            prompt: req.prompt,
            repo: req.repo,
            branch: req.branch,
        });
        return {
            id: sessionId,
            vendor: this.vendor,
            label: labelFromPrompt(req.prompt),
            status: normalizeSessionStatus(state),
            dispatchedAt: new Date().toISOString(),
        };
    }
    async getStatus(sessionId) {
        try {
            const { state, lastMessage } = await this.port.getSession(sessionId);
            return {
                status: normalizeSessionStatus(state),
                lastUpdate: new Date(),
                summary: lastMessage,
                needsInput: state.startsWith("AWAITING"),
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
        const { messages } = await this.port.listActivities(sessionId);
        return {
            sessionId,
            vendor: this.vendor,
            messages: messages.map((m) => ({
                role: m.role,
                content: m.content,
                timestamp: new Date(m.timestamp),
            })),
        };
    }
    async sendFollowup(sessionId, message) {
        await this.port.sendMessage(sessionId, message);
    }
}
