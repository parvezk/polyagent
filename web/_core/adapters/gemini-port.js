import { GEMINI_API_BASE, ANTIGRAVITY_AGENT } from "../constants/gemini.js";
/**
 * Mirror the GenAI SDK's `output_text` sugar: scan backwards across steps for
 * the latest contiguous `model_output` text blocks (stopping at `user_input`).
 * Raw REST responses only expose `steps`, not `output_text`.
 */
export function extractGeminiOutputText(resp) {
    if (resp.output_text)
        return resp.output_text;
    const steps = resp.steps ?? [];
    const textParts = [];
    let collecting = false;
    outer: for (let i = steps.length - 1; i >= 0; i--) {
        const step = steps[i];
        if (step.type === "user_input")
            break;
        if (step.type !== "model_output" || !step.content) {
            if (collecting)
                break outer;
            continue;
        }
        for (let j = step.content.length - 1; j >= 0; j--) {
            const item = step.content[j];
            if (item.type === "text") {
                collecting = true;
                textParts.push(item.text ?? "");
            }
            else if (collecting) {
                break outer;
            }
        }
    }
    const text = textParts.reverse().join("");
    return text || undefined;
}
async function geminiRequest(apiKey, method, path, body) {
    const url = `${GEMINI_API_BASE}${path}`;
    const res = await fetch(url, {
        method,
        headers: {
            "Content-Type": "application/json",
            // CONFIRMED via docs: header name is "x-goog-api-key"
            "x-goog-api-key": apiKey,
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    if (!res.ok) {
        const text = await res.text().catch(() => "(no body)");
        throw new Error(`Gemini API ${method} ${path} → ${res.status}: ${text}`);
    }
    return res.json();
}
// ---------------------------------------------------------------------------
// Real port implementation — uses native fetch (Node 23 global)
// ---------------------------------------------------------------------------
export function realGeminiPort(apiKey) {
    return {
        async createInteraction({ prompt, modelId }) {
            // CONFIRMED: agent field accepts the antigravity agent id or a custom saved agent id.
            // CONFIRMED: input is an array of {type, text} objects.
            // CONFIRMED: background:true triggers async execution (returns immediately with in_progress).
            // CONFIRMED: environment:"remote" spins up a fresh cloud sandbox.
            const agent = modelId ?? ANTIGRAVITY_AGENT;
            const resp = (await geminiRequest(apiKey, "POST", "/interactions", {
                agent,
                input: [{ type: "text", text: prompt }],
                environment: "remote",
                background: true,
            }));
            return {
                // CONFIRMED: response field is "id" (not "interactionId")
                interactionId: resp.id ?? "",
                status: resp.status ?? "in_progress",
                // REST returns text under steps[]; output_text is SDK sugar only
                firstReply: extractGeminiOutputText(resp),
            };
        },
        async getStatus(interactionId) {
            // CONFIRMED: GET /interactions/{id} returns same shape as POST response
            const resp = (await geminiRequest(apiKey, "GET", `/interactions/${interactionId}`));
            return {
                status: resp.status ?? "in_progress",
                summary: extractGeminiOutputText(resp),
            };
        },
        async sendFollowup(interactionId, message) {
            // CONFIRMED (managed-agents quickstart): conversation and environment are
            // independent. previous_interaction_id alone keeps chat history but
            // environment:"remote" provisions a *new* workspace. Reuse the prior
            // environment_id by passing it as `environment`.
            const prior = (await geminiRequest(apiKey, "GET", `/interactions/${interactionId}`));
            if (!prior.environment_id) {
                throw new Error(`Gemini interaction ${interactionId} has no environment_id; cannot reuse sandbox for follow-up`);
            }
            await geminiRequest(apiKey, "POST", "/interactions", {
                agent: ANTIGRAVITY_AGENT,
                input: [{ type: "text", text: message }],
                environment: prior.environment_id,
                background: true,
                previous_interaction_id: interactionId,
            });
        },
    };
}
