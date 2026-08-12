import type { AgentAdapter } from "./adapter.js";
import type { AgentSession, AgentStatus, AgentOutput, DispatchRequest } from "../types.js";
import type { JulesPort, JulesState } from "./jules-port.js";
import { labelFromPrompt } from "../utils/text.js";
import { normalizeSessionStatus } from "../utils/status.js";

export class JulesAdapter implements AgentAdapter {
  readonly vendor = "jules" as const;

  constructor(private readonly port: JulesPort) {}

  async dispatch(req: DispatchRequest): Promise<AgentSession> {
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

  async getStatus(sessionId: string): Promise<AgentStatus> {
    try {
      const { state, lastMessage } = await this.port.getSession(sessionId);
      return {
        status: normalizeSessionStatus(state),
        lastUpdate: new Date(),
        summary: lastMessage,
        needsInput: state.startsWith("AWAITING"),
      };
    } catch {
      return {
        status: "unknown",
        lastUpdate: new Date(),
        needsInput: false,
      };
    }
  }

  async getOutput(sessionId: string): Promise<AgentOutput> {
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

  async sendFollowup(sessionId: string, message: string): Promise<{ sessionId?: string }> {
    await this.port.sendMessage(sessionId, message);
    return {};
  }
}
