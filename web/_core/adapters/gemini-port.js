import { GEMINI_API_BASE, ANTIGRAVITY_AGENT } from "../constants/gemini.js";
// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------
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
      const resp = await geminiRequest(apiKey, "POST", "/interactions", {
        agent,
        input: [{ type: "text", text: prompt }],
        environment: "remote",
        background: true,
      });
      return {
        // CONFIRMED: response field is "id" (not "interactionId")
        interactionId: resp.id ?? "",
        status: resp.status ?? "in_progress",
        // output_text may be populated if background=false or task completes instantly
        firstReply: resp.output_text || undefined,
      };
    },
    async getStatus(interactionId) {
      // CONFIRMED: GET /interactions/{id} returns same shape as POST response
      const resp = await geminiRequest(apiKey, "GET", `/interactions/${interactionId}`);
      return {
        status: resp.status ?? "in_progress",
        summary: resp.output_text || undefined,
      };
    },
    async sendFollowup(interactionId, message) {
      // CONFIRMED: previous_interaction_id threads conversation context
      // ASSUMPTION: reuses the same default agent; for production you'd pass environment_id to
      // reuse the exact sandbox, but that requires storing it at dispatch time.
      await geminiRequest(apiKey, "POST", "/interactions", {
        agent: ANTIGRAVITY_AGENT,
        input: [{ type: "text", text: message }],
        environment: "remote",
        background: true,
        previous_interaction_id: interactionId,
      });
    },
  };
}
