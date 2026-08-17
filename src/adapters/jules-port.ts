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

  /** List GitHub repos registered as Jules sources. Optional (used by the CLI wizard). */
  listSources?(): Promise<{ repo: string; defaultBranch?: string }[]>;
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

/**
 * Resolves the source for a GitHub repo by looking it up in the list of Jules sources.
 * A session can only target a repo that is registered as a Jules source (the Jules
 * GitHub App must be installed AND the repo selected in Jules).
 */
async function resolveGithubSource(
  apiKey: string,
  repoParam: string,
  providedBranch: string | undefined,
): Promise<{ sourceName: string; startingBranch: string | undefined }> {
  const sourcesResp = (await julesRequest(apiKey, "GET", "/sources")) as {
    sources?: {
      name: string;
      githubRepo?: {
        owner: string;
        repo: string;
        defaultBranch?: { displayName?: string };
      };
    }[];
  };
  const [owner, repo] = repoParam.toLowerCase().split("/");
  const sources = sourcesResp.sources ?? [];
  const found = sources.find(
    ({ githubRepo }) =>
      githubRepo?.owner.toLowerCase() === owner && githubRepo?.repo.toLowerCase() === repo,
  );
  if (!found) {
    const available = sources
      .map((s) => (s.githubRepo ? `${s.githubRepo.owner}/${s.githubRepo.repo}` : s.name))
      .join(", ");
    throw new Error(
      `Jules has no source for "${repoParam}". Install the Jules GitHub App and select the repo in Jules. Available: ${available || "(none)"}`,
    );
  }
  const sourceName = found.name;
  // Fall back to the repo's real default branch (varies: main vs master).
  const startingBranch = providedBranch ?? found.githubRepo?.defaultBranch?.displayName;

  return { sourceName, startingBranch };
}

/** Jules Activity resource (v1alpha) — union field names from the public API. */
interface JulesActivity {
  originator?: string;
  description?: string;
  createTime?: string;
  agentMessaged?: { agentMessage?: string };
  userMessaged?: { userMessage?: string };
  progressUpdated?: { title?: string; description?: string };
  planGenerated?: {
    plan?: { steps?: { title?: string; description?: string }[] };
  };
  sessionFailed?: { reason?: string };
  // Legacy / mistaken flat fields — keep mapping so older fixtures still work.
  role?: string;
  author?: string;
  content?: string;
  message?: string;
  timestamp?: string;
}

function mapJulesActivity(
  a: JulesActivity,
): { role: "agent" | "human"; content: string; timestamp: string } | null {
  const timestamp = a.createTime ?? a.timestamp ?? new Date().toISOString();

  if (a.userMessaged?.userMessage) {
    return { role: "human", content: a.userMessaged.userMessage, timestamp };
  }
  if (a.agentMessaged?.agentMessage) {
    return { role: "agent", content: a.agentMessaged.agentMessage, timestamp };
  }
  if (a.progressUpdated) {
    const content = [a.progressUpdated.title, a.progressUpdated.description]
      .filter(Boolean)
      .join(": ");
    if (content) return { role: "agent", content, timestamp };
  }
  if (a.planGenerated?.plan?.steps?.length) {
    const content = a.planGenerated.plan.steps
      .map((s, i) => {
        const body = [s.title, s.description].filter(Boolean).join(" — ");
        return body ? `${i + 1}. ${body}` : null;
      })
      .filter(Boolean)
      .join("\n");
    if (content) return { role: "agent", content: `Plan:\n${content}`, timestamp };
  }
  if (a.sessionFailed?.reason) {
    return { role: "agent", content: a.sessionFailed.reason, timestamp };
  }

  const legacyContent = a.content ?? a.message ?? "";
  if (legacyContent) {
    const origin = (a.role ?? a.author ?? a.originator ?? "agent").toLowerCase();
    const role =
      origin.startsWith("human") || origin.startsWith("user") ? "human" : "agent";
    return { role, content: legacyContent, timestamp };
  }

  return null;
}

class RealJulesPortImpl implements JulesPort {
  constructor(private apiKey: string) {}

  async createSession(i: {
    prompt: string;
    repo?: string;
    branch?: string;
    title?: string;
  }): Promise<{ sessionId: string; state: JulesState }> {
    let sourceName: string | undefined;
    let startingBranch: string | undefined = i.branch;

    if (i.repo) {
      const resolved = await resolveGithubSource(this.apiKey, i.repo, startingBranch);
      sourceName = resolved.sourceName;
      startingBranch = resolved.startingBranch;
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
        githubRepoContext: startingBranch ? { startingBranch } : {},
      };
    }

    const session = (await julesRequest(this.apiKey, "POST", "/sessions", requestBody)) as {
      name?: string;
      id?: string;
      state?: JulesState;
    };

    const sessionId = extractSessionId(session);
    return {
      sessionId,
      state: session.state ?? "QUEUED",
    };
  }

  async getSession(sessionId: string): Promise<{ state: JulesState; lastMessage?: string }> {
    const session = (await julesRequest(this.apiKey, "GET", `/sessions/${sessionId}`)) as {
      state?: JulesState;
      lastMessage?: string;
      messages?: { role: string; content: string }[];
    };

    let lastMessage: string | undefined = session.lastMessage;
    if (!lastMessage && session.messages?.length) {
      const agentMsgs = session.messages.filter((m) => m.role === "agent");
      lastMessage = agentMsgs[agentMsgs.length - 1]?.content;
    }

    return {
      state: session.state ?? "QUEUED",
      lastMessage,
    };
  }

  async listActivities(sessionId: string): Promise<{
    messages: { role: "agent" | "human"; content: string; timestamp: string }[];
  }> {
    // Jules Activity uses originator + a typed union (agentMessaged / userMessaged / …),
    // not flat role/content fields. Paginate — default pageSize is 50.
    const messages: { role: "agent" | "human"; content: string; timestamp: string }[] = [];
    let pageToken: string | undefined;

    do {
      const qs = new URLSearchParams({ pageSize: "100" });
      if (pageToken) qs.set("pageToken", pageToken);
      const resp = (await julesRequest(
        this.apiKey,
        "GET",
        `/sessions/${sessionId}/activities?${qs}`,
      )) as {
        activities?: JulesActivity[];
        nextPageToken?: string;
      };

      for (const activity of resp.activities ?? []) {
        const mapped = mapJulesActivity(activity);
        if (mapped) messages.push(mapped);
      }
      pageToken = resp.nextPageToken || undefined;
    } while (pageToken);

    return { messages };
  }

  async sendMessage(sessionId: string, message: string): Promise<void> {
    await julesRequest(this.apiKey, "POST", `/sessions/${sessionId}:sendMessage`, {
      prompt: message,
    });
  }

  async listSources(): Promise<{ repo: string; defaultBranch?: string }[]> {
    const resp = (await julesRequest(this.apiKey, "GET", "/sources")) as {
      sources?: {
        githubRepo?: { owner: string; repo: string; defaultBranch?: { displayName?: string } };
      }[];
    };
    return (resp.sources ?? [])
      .filter((s) => s.githubRepo)
      .map((s) => ({
        repo: `${s.githubRepo!.owner}/${s.githubRepo!.repo}`,
        defaultBranch: s.githubRepo!.defaultBranch?.displayName,
      }));
  }
}

export function realJulesPort(apiKey: string): JulesPort {
  return new RealJulesPortImpl(apiKey);
}
