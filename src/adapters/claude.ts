import type { AgentAdapter } from "./adapter.js";
import type { AgentSession, AgentStatus, AgentOutput, DispatchRequest } from "../types.js";
import type { ClaudePort, ClaudeSessionStatus } from "./claude-port.js";
import { labelFromPrompt, withRepoInstruction } from "../utils/text.js";
import { normalizeSessionStatus } from "../utils/status.js";

// ---------------------------------------------------------------------------
// ClaudeAdapter
// ---------------------------------------------------------------------------

export class ClaudeAdapter implements AgentAdapter {
  readonly vendor = "claude" as const;

  constructor(private readonly port: ClaudePort) {}

  async dispatch(req: DispatchRequest): Promise<AgentSession> {
    // Claude is a general sandbox — give it a repo by instructing it to clone.
    const prompt = withRepoInstruction(req);
    const created = await this.port.createSession({
      prompt,
      modelId: req.model,
    });

    return {
      id: created.sessionId,
      vendor: this.vendor,
      label: labelFromPrompt(req.prompt),
      status: normalizeSessionStatus(created.status),
      dispatchedAt: new Date().toISOString(),
      outputUrl: req.repo ? `https://github.com/${req.repo}` : undefined,
      firstMessage: created.firstReply || undefined,
    };
  }

  async getStatus(sessionId: string): Promise<AgentStatus> {
    try {
      const result = await this.port.getStatus(sessionId);
      const normalized = normalizeSessionStatus(result.status);
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
    const { messages } = await this.port.listMessages(sessionId);
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

  async sendFollowup(sessionId: string, message: string): Promise<void> {
    await this.port.sendEvent(sessionId, message);
  }
}
