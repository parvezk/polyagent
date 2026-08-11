import { labelFromPrompt } from "../utils/text.js";
// ---------------------------------------------------------------------------
// Status mapping: Cursor run status → normalized SessionStatus
// ---------------------------------------------------------------------------
function mapStatus(status) {
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
export class CursorAdapter {
  port;
  vendor = "cursor";
  constructor(port) {
    this.port = port;
  }
  async dispatch(req) {
    const created = await this.port.createAgent({
      prompt: req.prompt,
      repo: req.repo ?? "",
      branch: req.branch,
      modelId: req.model,
    });
    return {
      id: created.agentId,
      vendor: this.vendor,
      label: labelFromPrompt(req.prompt),
      status: mapStatus(created.status),
      dispatchedAt: new Date().toISOString(),
      outputUrl: created.prUrl || undefined,
    };
  }
  async getStatus(sessionId) {
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
  async getOutput(sessionId) {
    const result = await this.port.getLatestRunStatus(sessionId);
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
