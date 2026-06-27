import type { AgentAdapter } from "./adapter.js";
import type { AgentSession, AgentStatus, AgentOutput, DispatchRequest } from "../types.js";
import type { GeminiPort, GeminiInteractionStatus } from "./gemini-port.js";
import { labelFromPrompt, withRepoInstruction } from "../utils/text.js";

// ---------------------------------------------------------------------------
// Status mapping: Gemini Interactions API → normalized SessionStatus
// ---------------------------------------------------------------------------

function mapStatus(s: GeminiInteractionStatus | string): AgentSession["status"] {
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

export class GeminiAdapter implements AgentAdapter {
  // ASSUMPTION: "gemini" is not yet in the Vendor union (types.ts is "claude"|"jules").
  // Cast is required until src/types.ts is updated to include "gemini".
  readonly vendor = "gemini" as AgentSession["vendor"];

  constructor(private readonly port: GeminiPort) {}

  async dispatch(req: DispatchRequest): Promise<AgentSession> {
    const created = await this.port.createInteraction({
      prompt: withRepoInstruction(req),
      modelId: req.model,
    });

    return {
      id: created.interactionId,
      vendor: this.vendor,
      label: labelFromPrompt(req.prompt),
      status: mapStatus(created.status),
      dispatchedAt: new Date().toISOString(),
      outputUrl: req.repo ? `https://github.com/${req.repo}` : undefined,
      firstMessage: created.firstReply,
    };
  }

  async getStatus(sessionId: string): Promise<AgentStatus> {
    // Contract: MUST NOT throw — return "unknown" on any error.
    try {
      const result = await this.port.getStatus(sessionId);
      return {
        status: mapStatus(result.status),
        lastUpdate: new Date(),
        summary: result.summary,
        needsInput: result.status === "requires_action",
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
    await this.port.sendFollowup(sessionId, message);
  }
}
