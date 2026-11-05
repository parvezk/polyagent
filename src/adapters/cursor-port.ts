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
// LIVE-GATE UNCERTAINTY for sendFollowup:
//   Agent.get() returns SDKAgentInfo (metadata). Whether that object exposes
//   a .send() method at runtime is unverified — see cast below.
//   Alternative: re-create with Agent.create({ agentId, apiKey, model, cloud }).
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
      // Agent.get / getCloudAgent only returns agent lifecycle metadata
      // (ACTIVE|ARCHIVED → archived bool) and never a run execution status —
      // cloud mapper even sets summary to the agent name. Reading the latest
      // run via listRuns (limit 1) is durable and non-streaming (unlike getRun,
      // whose stream can emit an async TransformError outside try/catch).
      const { Agent } = (await import("@cursor/sdk")) as unknown as {
        Agent: {
          listRuns(
            agentId: string,
            opts?: { runtime?: "cloud"; apiKey?: string; limit?: number },
          ): Promise<{
            items: { status?: string; result?: string }[];
          }>;
        };
      };

      const { items } = await Agent.listRuns(agentId, {
        runtime: "cloud",
        apiKey,
        limit: 1,
      });
      const latest = items[0];
      return {
        status: (latest?.status as CursorRunStatus) ?? "running",
        summary: latest?.result,
      };
    },

    async sendFollowup(agentId, message) {
      // Per task: Agent.get(agentId, { apiKey }) then agent.send(message).
      // SDKAgentInfo returned by Agent.get may not type-expose .send() —
      // cast to handle this; confirm at the live gate.
      const { Agent } = (await import("@cursor/sdk")) as unknown as {
        Agent: {
          get(
            agentId: string,
            opts?: { apiKey?: string },
          ): Promise<{ send(msg: string): Promise<unknown> }>;
        };
      };

      const agent = await Agent.get(agentId, { apiKey });
      await agent.send(message);
    },
  };
}
