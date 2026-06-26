import Anthropic from "@anthropic-ai/sdk";
import {
  DEFAULT_CLAUDE_MODEL,
  CLAUDE_AGENT_TOOLSET,
  DEFAULT_AGENT_SYSTEM_PROMPT,
} from "../constants/claude.js";
import { labelFromPrompt } from "../utils/text.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ClaudeSessionStatus = "idle" | "running" | "rescheduling" | "terminated";

export interface ClaudePort {
  createSession(i: {
    prompt: string;
    modelId?: string;
  }): Promise<{ sessionId: string; firstReply: string; status: ClaudeSessionStatus }>;

  getStatus(sessionId: string): Promise<{ status: ClaudeSessionStatus; summary?: string }>;

  /** V3: send a follow-up message to a running session. Implemented but not exercised by unit tests. */
  sendEvent(sessionId: string, message: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// Real port implementation
// Wraps the Anthropic Managed Agents SDK (@anthropic-ai/sdk >=0.105.0).
//
// The beta.agents / beta.environments / beta.sessions surfaces are present in
// @anthropic-ai/sdk@0.105.0 — confirmed by inspecting the package's .d.ts
// files under node_modules/@anthropic-ai/sdk/resources/beta/.
// ---------------------------------------------------------------------------

export function realClaudePort(apiKey: string): ClaudePort {
  const client = new Anthropic({ apiKey });

  return {
    async createSession({ prompt, modelId }) {
      const model = (modelId ?? DEFAULT_CLAUDE_MODEL) as string;
      const sessionName = `polyagent-${Date.now()}`;

      // 1. Create an agent
      const agent = await client.beta.agents.create({
        name: sessionName,
        model,
        system: DEFAULT_AGENT_SYSTEM_PROMPT,
        tools: [{ type: CLAUDE_AGENT_TOOLSET }],
      });

      // 2. Create a cloud environment with unrestricted networking
      const env = await client.beta.environments.create({
        name: sessionName,
        config: {
          type: "cloud",
          networking: { type: "unrestricted" },
        },
      });

      // 3. Create a session binding the agent and environment
      const session = await client.beta.sessions.create({
        agent: agent.id,
        environment_id: env.id,
        title: labelFromPrompt(prompt),
      });

      // 4. Open the event stream for this session
      const streamResponse = await client.beta.sessions.events.stream(session.id);
      const stream = await streamResponse;

      // 5. Send the user prompt
      await client.beta.sessions.events.send(session.id, {
        events: [
          {
            type: "user.message",
            content: [{ type: "text", text: prompt }],
          },
        ],
      });

      // 6. Iterate stream, capture first agent.message, stop on idle
      let firstReply = "";
      for await (const event of stream) {
        if ((event as { type: string }).type === "agent.message") {
          const msgEvent = event as {
            type: "agent.message";
            content: Array<{ type: string; text?: string }>;
          };
          firstReply = msgEvent.content
            .filter((b) => b.type === "text")
            .map((b) => b.text ?? "")
            .join("");
          break;
        }
        if ((event as { type: string }).type === "session.status_idle") {
          break;
        }
      }

      return { sessionId: session.id, firstReply, status: "running" };
    },

    async getStatus(sessionId) {
      const s = await client.beta.sessions.retrieve(sessionId);
      return { status: (s.status as ClaudeSessionStatus) ?? "running" };
    },

    async sendEvent(sessionId, message) {
      await client.beta.sessions.events.send(sessionId, {
        events: [
          {
            type: "user.message",
            content: [{ type: "text", text: message }],
          },
        ],
      });
    },
  };
}
