import { JULES_API_BASE } from "../constants/jules.js";

export type JulesState =
  | "QUEUED"
  | "PLANNING"
  | "AWAITING_PLAN_APPROVAL"
  | "AWAITING_USER_FEEDBACK"
  | "IN_PROGRESS"
  | "PAUSED"
  | "COMPLETED"
  | "FAILED";

export interface JulesPort {
  createSession(i: {
    prompt: string;
    repo?: string;
    branch?: string;
    title?: string;
  }): Promise<{ sessionId: string; state: JulesState }>;

  getSession(sessionId: string): Promise<{ state: JulesState; lastMessage?: string }>;

  listActivities(sessionId: string): Promise<{
    messages: { role: "agent" | "human"; content: string; timestamp: string }[];
  }>;

  sendMessage(sessionId: string, message: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// Real implementation — uses native fetch against Jules v1alpha REST API
// ---------------------------------------------------------------------------
const BASE = JULES_API_BASE;

/**
 * Extract the session ID from the resource name or id field.
 * Jules returns a resource name like "sessions/abc123"; we want "abc123".
 * If the response has a top-level `id` field, use that directly.
 */
function extractSessionId(resource: { name?: string; id?: string }): string {
  if (resource.id) return resource.id;
  if (resource.name) {
    const parts = resource.name.split("/");
    return parts[parts.length - 1];
  }
  throw new Error("Jules createSession: cannot extract session id from response");
}

async function julesRequest(
  apiKey: string,
  method: string,
  path: string,
  body?: unknown,
): Promise<unknown> {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      "X-Goog-Api-Key": apiKey,
      "Content-Type": "application/json",
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "(no body)");
    throw new Error(`Jules API ${method} ${path} → ${res.status}: ${text}`);
  }

  return res.json();
}

export function realJulesPort(apiKey: string): JulesPort {
  return {
    async createSession(i) {
      let sourceName: string | undefined;

      if (i.repo) {
        // Find the source record for this GitHub repo.
        // Documented source name pattern: sources/github/<owner>/<repo>
        // GET /v1alpha/sources returns { sources: [{ name, ... }] }
        const sourcesResp = (await julesRequest(apiKey, "GET", "/sources")) as {
          sources?: { name: string }[];
        };
        const repoPath = i.repo; // "owner/repo"
        const found = sourcesResp.sources?.find((s) =>
          s.name.toLowerCase().includes(repoPath.toLowerCase()),
        );
        // Fallback: construct name from convention if lookup fails
        sourceName = found?.name ?? `sources/github/${repoPath}`;
      }

      const requestBody: Record<string, unknown> = {
        prompt: i.prompt,
        title: i.title ?? i.prompt.slice(0, 80),
        requirePlanApproval: false,
        automationMode: "AUTO_CREATE_PR",
      };

      if (sourceName) {
        requestBody.sourceContext = {
          source: sourceName,
          githubRepoContext: {
            startingBranch: i.branch ?? "main",
          },
        };
      }

      const session = (await julesRequest(apiKey, "POST", "/sessions", requestBody)) as {
        name?: string;
        id?: string;
        state?: JulesState;
      };

      const sessionId = extractSessionId(session);
      return {
        sessionId,
        state: session.state ?? "QUEUED",
      };
    },

    async getSession(sessionId) {
      const session = (await julesRequest(apiKey, "GET", `/sessions/${sessionId}`)) as {
        state?: JulesState;
        lastMessage?: string;
        // The Jules API may surface the last message differently; handle both
        messages?: { role: string; content: string }[];
      };

      // Derive a lastMessage: prefer explicit field, then last agent message
      let lastMessage: string | undefined = session.lastMessage;
      if (!lastMessage && session.messages?.length) {
        const agentMsgs = session.messages.filter((m) => m.role === "agent");
        lastMessage = agentMsgs[agentMsgs.length - 1]?.content;
      }

      return {
        state: session.state ?? "QUEUED",
        lastMessage,
      };
    },

    async listActivities(sessionId) {
      const resp = (await julesRequest(apiKey, "GET", `/sessions/${sessionId}/activities`)) as {
        activities?: {
          role?: string;
          author?: string;
          content?: string;
          message?: string;
          timestamp?: string;
          createTime?: string;
        }[];
      };

      const messages = (resp.activities ?? []).map((a) => ({
        // Role field may be "agent"/"human" or "AGENT"/"USER" or "author" — normalise
        role: ((a.role ?? a.author ?? "agent").toLowerCase().startsWith("human") ||
        (a.role ?? a.author ?? "").toLowerCase().startsWith("user")
          ? "human"
          : "agent") as "agent" | "human",
        content: a.content ?? a.message ?? "",
        timestamp: a.timestamp ?? a.createTime ?? new Date().toISOString(),
      }));

      return { messages };
    },

    async sendMessage(sessionId, message) {
      await julesRequest(apiKey, "POST", `/sessions/${sessionId}:sendMessage`, {
        prompt: message,
      });
    },
  };
}
