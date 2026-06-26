import type { AgentAdapter } from "./adapter.js";
import type { AgentSession, AgentStatus, AgentOutput, DispatchRequest } from "../types.js";
import type { ClaudePort, ClaudeSessionStatus } from "./claude-port.js";
import { labelFromPrompt } from "../utils/text.js";

// ---------------------------------------------------------------------------
// Status mapping: Claude → normalized SessionStatus
// ---------------------------------------------------------------------------

function mapStatus(claudeStatus: ClaudeSessionStatus | string): AgentSession["status"] {
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

export class ClaudeAdapter implements AgentAdapter {
  readonly vendor = "claude" as const;

  constructor(private readonly port: ClaudePort) {}

  async dispatch(req: DispatchRequest): Promise<AgentSession> {
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
    };
  }

  async getStatus(sessionId: string): Promise<AgentStatus> {
    try {
      const result = await this.port.getStatus(sessionId);
      const normalized = mapStatus(result.status);
      return {
        status: normalized,
        lastUpdate: new Date(),
        summary: result.summary,
        needsInput: result.status === "idle",
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
    const result = await this.port.getStatus(sessionId);
    return {
      sessionId,
      vendor: this.vendor,
      messages: result.summary
        ? [{ role: "agent", content: result.summary, timestamp: new Date() }]
        : [],
    };
  }

  async sendFollowup(sessionId: string, message: string): Promise<void> {
    await this.port.sendEvent(sessionId, message);
  }
}
