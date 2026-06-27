import type { AgentAdapter } from "./adapter.js";
import type { AgentSession, AgentStatus, AgentOutput, DispatchRequest } from "../types.js";
import type { CursorPort, CursorRunStatus } from "./cursor-port.js";
import { labelFromPrompt } from "../utils/text.js";

// ---------------------------------------------------------------------------
// Status mapping: Cursor run status → normalized SessionStatus
// ---------------------------------------------------------------------------

function mapStatus(status: CursorRunStatus | string): AgentSession["status"] {
  switch (status) {
    case "running":
      return "running";
    case "finished":
      return "completed";
    case "error":
    case "cancelled":
      return "failed";
    default:
      return "unknown";
  }
}

// ---------------------------------------------------------------------------
// CursorAdapter
// ---------------------------------------------------------------------------

export class CursorAdapter implements AgentAdapter {
  readonly vendor = "cursor" as const;

  constructor(private readonly port: CursorPort) {}

  async dispatch(req: DispatchRequest): Promise<AgentSession> {
    const created = await this.port.createAgent({
      prompt: req.prompt,
      repo: req.repo ?? "",
      branch: req.branch,
      modelId: req.model,
    });

    return {
      id: created.agentId,
      vendor: this.vendor as AgentSession["vendor"],
      label: labelFromPrompt(req.prompt),
      status: mapStatus(created.status),
      dispatchedAt: new Date().toISOString(),
      outputUrl: created.prUrl || undefined,
    };
  }

  async getStatus(sessionId: string): Promise<AgentStatus> {
    try {
      const result = await this.port.getLatestRunStatus(sessionId);
      return {
        status: mapStatus(result.status),
        lastUpdate: new Date(),
        summary: result.summary,
        needsInput: false,
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
    const result = await this.port.getLatestRunStatus(sessionId);
    return {
      sessionId,
      vendor: this.vendor as AgentOutput["vendor"],
      messages: result.summary
        ? [{ role: "agent", content: result.summary, timestamp: new Date() }]
        : [],
    };
  }

  async sendFollowup(sessionId: string, message: string): Promise<void> {
    await this.port.sendFollowup(sessionId, message);
  }
}
