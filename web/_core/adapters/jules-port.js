import { JULES_API_BASE } from "../constants/jules.js";
// ---------------------------------------------------------------------------
// Real implementation — uses native fetch against Jules v1alpha REST API
// ---------------------------------------------------------------------------
const BASE = JULES_API_BASE;
/**
 * Extract the session ID from the resource name or id field.
 * Jules returns a resource name like "sessions/abc123"; we want "abc123".
 * If the response has a top-level `id` field, use that directly.
 */
function extractSessionId(resource) {
    if (resource.id)
        return resource.id;
    if (resource.name) {
        const parts = resource.name.split("/");
        return parts[parts.length - 1];
    }
    throw new Error("Jules createSession: cannot extract session id from response");
}
async function julesRequest(apiKey, method, path, body) {
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
async function resolveGithubSource(apiKey, repoParam, providedBranch) {
    const sourcesResp = (await julesRequest(apiKey, "GET", "/sources"));
    const [owner, repo] = repoParam.toLowerCase().split("/");
    const sources = sourcesResp.sources ?? [];
    const found = sources.find(({ githubRepo }) => githubRepo?.owner.toLowerCase() === owner && githubRepo?.repo.toLowerCase() === repo);
    if (!found) {
        const available = sources
            .map((s) => (s.githubRepo ? `${s.githubRepo.owner}/${s.githubRepo.repo}` : s.name))
            .join(", ");
        throw new Error(`Jules has no source for "${repoParam}". Install the Jules GitHub App and select the repo in Jules. Available: ${available || "(none)"}`);
    }
    const sourceName = found.name;
    // Fall back to the repo's real default branch (varies: main vs master).
    const startingBranch = providedBranch ?? found.githubRepo?.defaultBranch?.displayName;
    return { sourceName, startingBranch };
}
function mapJulesActivity(a) {
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
        if (content)
            return { role: "agent", content, timestamp };
    }
    if (a.planGenerated?.plan?.steps?.length) {
        const content = a.planGenerated.plan.steps
            .map((s, i) => {
            const body = [s.title, s.description].filter(Boolean).join(" — ");
            return body ? `${i + 1}. ${body}` : null;
        })
            .filter(Boolean)
            .join("\n");
        if (content)
            return { role: "agent", content: `Plan:\n${content}`, timestamp };
    }
    if (a.sessionFailed?.reason) {
        return { role: "agent", content: a.sessionFailed.reason, timestamp };
    }
    const legacyContent = a.content ?? a.message ?? "";
    if (legacyContent) {
        const origin = (a.role ?? a.author ?? a.originator ?? "agent").toLowerCase();
        const role = origin.startsWith("human") || origin.startsWith("user") ? "human" : "agent";
        return { role, content: legacyContent, timestamp };
    }
    return null;
}
class RealJulesPortImpl {
    apiKey;
    constructor(apiKey) {
        this.apiKey = apiKey;
    }
    async createSession(i) {
        let sourceName;
        let startingBranch = i.branch;
        if (i.repo) {
            const resolved = await resolveGithubSource(this.apiKey, i.repo, startingBranch);
            sourceName = resolved.sourceName;
            startingBranch = resolved.startingBranch;
        }
        const requestBody = {
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
        const session = (await julesRequest(this.apiKey, "POST", "/sessions", requestBody));
        const sessionId = extractSessionId(session);
        return {
            sessionId,
            state: session.state ?? "QUEUED",
        };
    }
    async getSession(sessionId) {
        const session = (await julesRequest(this.apiKey, "GET", `/sessions/${sessionId}`));
        let lastMessage = session.lastMessage;
        if (!lastMessage && session.messages?.length) {
            const agentMsgs = session.messages.filter((m) => m.role === "agent");
            lastMessage = agentMsgs[agentMsgs.length - 1]?.content;
        }
        return {
            state: session.state ?? "QUEUED",
            lastMessage,
        };
    }
    async listActivities(sessionId) {
        // Jules Activity uses originator + a typed union (agentMessaged / userMessaged / …),
        // not flat role/content fields. Paginate — default pageSize is 50.
        const messages = [];
        let pageToken;
        do {
            const qs = new URLSearchParams({ pageSize: "100" });
            if (pageToken)
                qs.set("pageToken", pageToken);
            const resp = (await julesRequest(this.apiKey, "GET", `/sessions/${sessionId}/activities?${qs}`));
            for (const activity of resp.activities ?? []) {
                const mapped = mapJulesActivity(activity);
                if (mapped)
                    messages.push(mapped);
            }
            pageToken = resp.nextPageToken || undefined;
        } while (pageToken);
        return { messages };
    }
    async sendMessage(sessionId, message) {
        await julesRequest(this.apiKey, "POST", `/sessions/${sessionId}:sendMessage`, {
            prompt: message,
        });
    }
    async listSources() {
        const resp = (await julesRequest(this.apiKey, "GET", "/sources"));
        return (resp.sources ?? [])
            .filter((s) => s.githubRepo)
            .map((s) => ({
            repo: `${s.githubRepo.owner}/${s.githubRepo.repo}`,
            defaultBranch: s.githubRepo.defaultBranch?.displayName,
        }));
    }
}
export function realJulesPort(apiKey) {
    return new RealJulesPortImpl(apiKey);
}
