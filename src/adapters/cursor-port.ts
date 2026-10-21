import { DEFAULT_CURSOR_MODEL } from "../constants/cursor.js";

export type CursorRunStatus = "running" | "finished" | "error" | "cancelled";

export interface CursorPort {
  createAgent(i: {
    prompt: string;
    repo: string;
    branch?: string;
    modelId?: string;
  }): Promise<{ agentId: string; status: CursorRunStatus; prUrl?: string }>;

  getLatestRunStatus(agentId: string): Promise<{
    status: CursorRunStatus;
    summary?: string;
    prUrl?: string;
  }>;

  sendFollowup(agentId: string, message: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// Real implementation — wraps @cursor/sdk Agent (cloud runtime)
//
// Uses dynamic import to avoid loading @cursor/sdk at module initialisation.
// This lets unit tests (which use a fake port) run without the SDK installed.
//
// DEVIATION from task's API facts:
//   Agent.create() does NOT accept a `prompt` parameter.
//   The prompt is submitted separately via agent.send(prompt) after creation.
//   task stated: Agent.create({ apiKey, prompt, model, cloud })
//   actual:      Agent.create({ apiKey, model, cloud }) then agent.send(prompt)
//
// sendFollowup must use Agent.resume(), which returns an SDKAgent with .send().
// Agent.get() only returns SDKAgentInfo metadata (no .send) — calling .send on
// it throws at runtime and the follow-up never reaches the agent.
// ---------------------------------------------------------------------------

export function realCursorPort(apiKey: string): CursorPort {
  return {
    async createAgent(i) {
      // Dynamic import — only executed at the live gate, not during tests.
      const { Agent } = (await import("@cursor/sdk")) as {
        Agent: {
          create(opts: {
            apiKey: string;
            model?: { id: string };
            cloud?: {
              repos?: { url: string; startingRef?: string }[];
              autoCreatePR?: boolean;
            };
          }): Promise<{
            agentId: string;
            send(msg: string): Promise<{ status: string; result?: string | null }>;
          }>;
        };
      };

      const agent = await Agent.create({
        apiKey,
        model: { id: i.modelId ?? DEFAULT_CURSOR_MODEL },
        cloud: {
          repos: [{ url: `https://github.com/${i.repo}`, startingRef: i.branch ?? "main" }],
          autoCreatePR: false,
        },
      });

      // Send initial prompt to start the run (Agent.create has no prompt param).
      const run = await agent.send(i.prompt);

      return {
        agentId: agent.agentId,
        status: run.status as CursorRunStatus,
      };
    },

    async getLatestRunStatus(agentId) {
      // Use Agent.get (durable metadata: status + summary) rather than the
      // streaming getRun — the latter emits an async TransformError that can
      // escape the caller's try/catch.
      const { Agent } = (await import("@cursor/sdk")) as unknown as {
        Agent: {
          get(
            agentId: string,
            opts?: { apiKey?: string },
          ): Promise<{ status?: string; summary?: string }>;
        };
      };

      const info = await Agent.get(agentId, { apiKey });
      return {
        status: (info.status as CursorRunStatus) ?? "running",
        summary: info.summary,
      };
    },

    async sendFollowup(agentId, message) {
      // Agent.resume returns a live SDKAgent handle; Agent.get is metadata-only.
      const { Agent } = (await import("@cursor/sdk")) as unknown as {
        Agent: {
          resume(
            agentId: string,
            opts?: { apiKey?: string },
          ): Promise<{ send(msg: string): Promise<unknown> }>;
        };
      };

      const agent = await Agent.resume(agentId, { apiKey });
      await agent.send(message);
    },
  };
}
