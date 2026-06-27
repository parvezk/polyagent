import { DEFAULT_CURSOR_MODEL } from "../constants/cursor.js";
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
export function realCursorPort(apiKey) {
    return {
        async createAgent(i) {
            // Dynamic import — only executed at the live gate, not during tests.
            const { Agent } = (await import("@cursor/sdk"));
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
                status: run.status,
            };
        },
        async getLatestRunStatus(agentId) {
            const { Agent } = (await import("@cursor/sdk"));
            const runs = await Agent.listRuns(agentId, { runtime: "cloud", apiKey, limit: 1 });
            const latest = runs.items?.[0];
            if (!latest) {
                return { status: "running" };
            }
            const run = await Agent.getRun(latest.id, { runtime: "cloud", agentId, apiKey });
            return {
                status: run.status,
                summary: run.result ?? undefined,
            };
        },
        async sendFollowup(agentId, message) {
            // Per task: Agent.get(agentId, { apiKey }) then agent.send(message).
            // SDKAgentInfo returned by Agent.get may not type-expose .send() —
            // cast to handle this; confirm at the live gate.
            const { Agent } = (await import("@cursor/sdk"));
            const agent = await Agent.get(agentId, { apiKey });
            await agent.send(message);
        },
    };
}
