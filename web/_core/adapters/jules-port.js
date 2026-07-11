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
export function realJulesPort(apiKey) {
    return {
        async createSession(i) {
            let sourceName;
            let startingBranch = i.branch;
            if (i.repo) {
                // Resolve the source for this GitHub repo. A session can only target a
                // repo that is registered as a Jules source (the Jules GitHub App must
                // be installed AND the repo selected in Jules). GET /v1alpha/sources
                // returns { sources: [{ name, githubRepo: { owner, repo, defaultBranch:{displayName} } }] }.
                const sourcesResp = (await julesRequest(apiKey, "GET", "/sources"));
                const [owner, repo] = i.repo.split("/");
                const sources = sourcesResp.sources ?? [];
                const found = sources.find((s) => s.githubRepo?.owner.toLowerCase() === owner?.toLowerCase() &&
                    s.githubRepo?.repo.toLowerCase() === repo?.toLowerCase());
                if (!found) {
                    const available = sources
                        .map((s) => (s.githubRepo ? `${s.githubRepo.owner}/${s.githubRepo.repo}` : s.name))
                        .join(", ");
                    throw new Error(`Jules has no source for "${i.repo}". Install the Jules GitHub App and select the repo in Jules. Available: ${available || "(none)"}`);
                }
                sourceName = found.name;
                // Fall back to the repo's real default branch (varies: main vs master).
                startingBranch = startingBranch ?? found.githubRepo?.defaultBranch?.displayName;
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
            const session = (await julesRequest(apiKey, "POST", "/sessions", requestBody));
            const sessionId = extractSessionId(session);
            return {
                sessionId,
                state: session.state ?? "QUEUED",
            };
        },
        async getSession(sessionId) {
            const session = (await julesRequest(apiKey, "GET", `/sessions/${sessionId}`));
            // Derive a lastMessage: prefer explicit field, then last agent message
            let lastMessage = session.lastMessage;
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
            const resp = (await julesRequest(apiKey, "GET", `/sessions/${sessionId}/activities`));
            const messages = (resp.activities ?? []).map((a) => ({
                // Role field may be "agent"/"human" or "AGENT"/"USER" or "author" — normalise
                role: ((a.role ?? a.author ?? "agent").toLowerCase().startsWith("human") ||
                    (a.role ?? a.author ?? "").toLowerCase().startsWith("user")
                    ? "human"
                    : "agent"),
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
        async listSources() {
            const resp = (await julesRequest(apiKey, "GET", "/sources"));
            return (resp.sources ?? [])
                .filter((s) => s.githubRepo)
                .map((s) => ({
                repo: `${s.githubRepo.owner}/${s.githubRepo.repo}`,
                defaultBranch: s.githubRepo.defaultBranch?.displayName,
            }));
        },
    };
}
