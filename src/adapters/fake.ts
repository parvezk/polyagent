import type { AgentAdapter } from "./adapter.js";
import type { AgentSession, AgentStatus, AgentOutput, DispatchRequest, Vendor } from "../types.js";
import { labelFromPrompt } from "../utils/text.js";

/**
 * Deterministic, in-memory adapter with no network calls or API keys. It exists
 * so the smoke/E2E layer can drive the real CLI entrypoint end-to-end (dispatch
 * → persist → status → followup) in CI. Enabled only when POLYAGENT_FAKE_ADAPTERS
 * is set — see `buildAdapter` in registry.ts.
 */
export function fakeAdapter(vendor: Vendor): AgentAdapter {
  return {
    vendor,

    async dispatch(req: DispatchRequest): Promise<AgentSession> {
      return {
        id: `fake_${vendor}_1`,
        vendor,
        label: labelFromPrompt(req.prompt),
        status: "running",
        dispatchedAt: new Date().toISOString(),
        outputUrl: req.repo ? `https://github.com/${req.repo}` : undefined,
        firstMessage: vendor === "claude" ? "On it." : undefined,
      };
    },

    async getStatus(): Promise<AgentStatus> {
      return { status: "completed", lastUpdate: new Date(), summary: "done", needsInput: false };
    },

    async getOutput(sessionId: string): Promise<AgentOutput> {
      return { sessionId, vendor, messages: [] };
    },

    async sendFollowup(): Promise<void> {
      // no-op: nothing to send in the fake
    },
  };
}
