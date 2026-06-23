# PolyAgent — Technical Design

**Last updated:** 2026-06-22

---

## Core Idea

PolyAgent is a **vendor-agnostic dispatch and orchestration layer** for cloud coding agents. You start an agent on any supported vendor — and track and steer it — from one CLI, without switching tabs or learning each vendor's dashboard.

A vendor-adapter pattern normalizes every platform into a common interface. **PolyAgent owns dispatch**: it starts the agent, so the vendor hands back the session ID directly. That ID is how PolyAgent tracks and follows up. No copy-pasting IDs, no guessing whether a list endpoint surfaces dashboard-started sessions.

**Why dispatch-first (changed from the March 2026 draft):** the original plan was "track-first," built around registering or auto-discovering sessions a user started in a vendor dashboard. That premise no longer holds. As of April–May 2026, every viable vendor ships a clean **dispatch + poll-by-ID + follow-up** API. Meanwhile, discovering *externally-started* sessions is unconfirmed for every vendor and impossible for Claude (claude.ai sessions live behind subscription auth, unreachable by API key). Dispatch-first is both more reliable and removes the biggest risk in the old design.

**Out of scope:** tracking sessions a user started elsewhere (in a vendor dashboard). If PolyAgent can spin up and track the session itself, there's no reason to context-switch back to the vendor UI — which is the whole point. Revisit only if a concrete use case emerges.

---

## Vendor Capability Matrix (validated 2026-06-22)

| Vendor | Dispatch | Track by ID | Follow-up | Surface | Maturity | V1? |
|---|---|---|---|---|---|---|
| **Cursor** | ✅ `POST /v1/agents` | ✅ poll runs + SSE | ✅ `POST /agents/{id}/runs` | Official `@cursor/sdk` (TS) | Beta | **Yes** |
| **Claude** | ✅ Managed Agents `POST /v1/sessions` (cloud) | ✅ poll + SSE | ✅ `POST /sessions/{id}/events` | Official `anthropic` SDK (`beta.agents`) | Beta | **Yes** |
| **Jules** | ✅ `POST /v1alpha/sessions` | ✅ poll session + activities | ✅ `:sendMessage` | REST + Jules Tools CLI | v1alpha | V2 |
| **Gemini / Antigravity** | ✅ Interactions API (`background=true`) | ✅ poll by `interaction.id` | ✅ `previous_interaction_id` | REST | Preview | V2 |
| **Codex** | ⚠️ CLI only (`codex cloud exec`) | ⚠️ CLI only | ❌ none | CLI shelling + ChatGPT login | partial | **Omitted** |

**Codex is omitted.** It has no public REST/SDK — the only programmatic path is shelling out to the `codex` CLI, which authenticates via a logged-in ChatGPT browser session (cookies, not an API key) and has no programmatic follow-up. It can't run headless on a server and breaks the clean "API key per vendor" model. Revisit if/when OpenAI ships a public cloud-agent API.

**Note on "dispatch" shape:** Cursor and Jules are repo→PR coding agents (clone a repo, work in a sandbox, open a PR). Claude Managed Agents and Gemini Interactions API are general code-execution agents in an ephemeral sandbox that may not produce a PR. The common interface must flex for both — see `outputUrl` below.

---

## V1 Scope

**Two vendors, one loop, end-to-end.** Cursor + Claude. Proving the loop on *two* vendors (not one) is what validates the cross-vendor normalization — one vendor proves nothing about the abstraction.

Three steps, built and verified incrementally:

1. **Dispatch + first handshake** — `polyagent dispatch` starts a session and returns the session ID + first agent response.
2. **Live status** — `polyagent status` polls real status of the live session.
3. **Follow-up** — `polyagent followup <id> "…"` lands a mid-task message (lowest priority of the three; slips to V2 cleanly if the timeline squeezes, since it isn't needed to prove normalization).

**Target:** working loop on both vendors before *Built in NYC with Vercel* (2026-06-27).

---

## Architecture Overview

### V1 (Dispatch + Track + Follow-up, two vendors)

```
┌──────────────────────────────────────────────────────────┐
│                   Human Operator                          │
│                 (CLI — polyagent)                         │
│        auth / dispatch / status / followup / output       │
└───────────────────────────┬──────────────────────────────┘
                            │
           ┌────────────────▼────────────────┐
           │         Adapter Registry         │
           │     (in-process, no server)      │
           └──────┬───────────────────┬───────┘
                  │                   │
            ┌─────▼─────┐       ┌─────▼─────┐
            │  Cursor   │       │  Claude   │
            │  Adapter  │       │  Adapter  │
            └─────┬─────┘       └─────┬─────┘
                  │                   │
            @cursor/sdk        anthropic SDK
            (REST + SSE)       (Managed Agents,
                                REST + SSE)
```

Local state: a single JSON file (`~/.polyagent/state.json`). No server, no daemon.

### V2 (More vendors + orchestration)

- Add **Jules** and **Gemini/Antigravity** adapters.
- `polyagent broadcast` — message all running agents at once.
- Shared task context / knowledge base across agents.
- State upgrade path: SQLite, then Supabase Postgres when persistence / multi-device / dashboard arrives.

### V3 (Intelligence + visibility)

- Lead agent (Claude as chief of staff) — auto-routes tasks to the best-fit vendor.
- Web dashboard + mobile: 30,000-foot view, timeline, cost tracking. **This is where a real-time push layer (SSE or WebSocket) between the PolyAgent server and its own UI clients belongs** — vendor-facing we are constrained to vendors' REST + SSE today.
- Benchmarking: same task across vendors, compared.

---

## The Common Adapter Interface (V1)

V1 adapters implement **dispatch, status, output, and follow-up**. `listSessions()` stays in the interface but is **best-effort / optional** — it is no longer how sessions get into state (dispatch is), so an adapter may leave it unimplemented.

```typescript
interface AgentAdapter {
  readonly vendor: "cursor" | "claude" | "jules" | "gemini";

  // Start a new agent session. Returns the created session (with vendor-native ID).
  dispatch(req: DispatchRequest): Promise<AgentSession>;

  // Get current status of a single session
  getStatus(sessionId: string): Promise<AgentStatus>;

  // Get conversation / output history
  getOutput(sessionId: string): Promise<AgentOutput>;

  // Send a follow-up message to a running session
  sendFollowup(sessionId: string, message: string): Promise<void>;

  // Best-effort: list sessions for this vendor. Optional — not the path into state.
  listSessions?(): Promise<AgentSession[]>;
}

// --- Shared types ---

type SessionStatus = "running" | "needs_review" | "completed" | "failed" | "unknown";

interface DispatchRequest {
  prompt: string;
  repo?: string;            // owner/repo — for repo-based agents (Cursor, Jules)
  branch?: string;
  model?: string;
  // vendor-specific extras pass through a typed `options` bag per adapter
}

interface AgentSession {
  id: string;               // Vendor-native session/agent ID
  vendor: string;
  label?: string;           // Task title / description
  status: SessionStatus;
  startedAt?: Date;
  outputUrl?: string;       // Generic output reference — PR URL, branch link, OR sandbox/run URL.
                            // Not assumed to be a PR; repo→PR is one vendor shape, not the contract.
}

interface AgentStatus {
  status: SessionStatus;
  lastUpdate: Date;
  summary?: string;         // Last message or status text
  needsInput: boolean;      // True if the agent is waiting on a human
}

interface AgentOutput {
  sessionId: string;
  vendor: string;
  messages: { role: "agent" | "human"; content: string; timestamp: Date }[];
}
```

`terminate()` and `broadcast()` are V2 additions; the interface accepts them without breaking existing adapters.

---

## Shared State (V1)

A single flat JSON file at `~/.polyagent/state.json`. Zero infrastructure, zero setup.

```json
{
  "sessions": [
    {
      "id": "cursor-abc123",
      "vendor": "cursor",
      "label": "Fix auth bug in /api/login",
      "status": "needs_review",
      "dispatchedAt": "2026-06-22T10:00:00Z",
      "lastPolled": "2026-06-22T10:45:00Z",
      "outputUrl": "https://github.com/parvez/app/pull/42"
    },
    {
      "id": "claude-xyz789",
      "vendor": "claude",
      "label": "Refactor session store",
      "status": "running",
      "dispatchedAt": "2026-06-22T09:30:00Z",
      "lastPolled": "2026-06-22T10:44:00Z"
    }
  ]
}
```

**Sessions enter state by being dispatched.** `polyagent dispatch` calls the adapter, gets back the session, and writes it to state. No manual registration, no auto-discovery on the critical path.

**Upgrade path:** JSON (MVP) → `better-sqlite3` (when adding a dashboard / richer queries) → Supabase Postgres (when persistence is multi-device or multi-user).

---

## CLI Interface (V1)

```bash
# Setup — store an API key per vendor
polyagent auth --vendor cursor --key <api-key>
polyagent auth --vendor claude --key <api-key>

# Dispatch a new agent (the primary on-ramp)
polyagent dispatch --vendor cursor --repo parvez/app "Fix the auth bug in /api/login"
polyagent dispatch --vendor claude "Refactor the session store for clarity"

# Unified status view (the core experience)
polyagent status
# VENDOR   SESSION    LABEL                STATUS         LAST UPDATE
# cursor   abc123     Fix auth bug         needs_review   2 min ago
# claude   xyz789     Refactor sessions    running        5 min ago

polyagent status <session-id>            # Drill into one session

# Follow up without leaving the terminal
polyagent followup <session-id> "Approve this approach, continue"

# Read what the agent has been doing
polyagent output <session-id>
```

**The primary loop:** `polyagent dispatch` → `polyagent status` → see `needs_review` → `polyagent followup`. No tab-switching, no vendor dashboards.

---

## Tech Stack

- **Language:** TypeScript (Node.js) — official vendor SDKs are JS-first.
- **Vendor adapters:** wrap **official SDKs**, do not hand-roll HTTP.
  - Cursor → `@cursor/sdk`
  - Claude → `anthropic` (`beta.agents` / Managed Agents)
  - Jules (V2) → REST (no official JS SDK yet) — thin `ky`/`fetch` wrapper
  - Gemini/Antigravity (V2) → Interactions API REST
- **CLI framework:** `commander` (start simple) — `ink` later if an interactive TUI is wanted.
- **HTTP client:** native `fetch` / `ky` — only where no official SDK exists (Jules, Gemini).
- **State:** JSON file (MVP) → `better-sqlite3` → Supabase Postgres.
- **Testing:** `vitest`.
- **Deploy context:** demoing on Vercel; keep any future server pieces serverless-friendly (favor SSE/streaming over long-lived WebSockets until a dedicated push layer is justified).

---

## Phase 2: MCP-Native Architecture (vision)

The adapter interface maps cleanly to MCP tools:

```typescript
dispatch_task({ vendor: "cursor", task: "..." });
get_agent_status({ session_id: "..." });
send_followup({ session_id: "...", message: "..." });
broadcast_to_team({ message: "..." });
```

Each adapter can later be wrapped as an MCP server; a lead agent (or any MCP client) connects via MCP.

---

## Chief of Staff — Lead Agent (V3 only)

A Claude-powered "chief of staff" above the adapter layer: given a project goal, it breaks work into tasks, routes each to the best-fit vendor, monitors progress, and surfaces blockers.

**Caveat (stronger than ever):** Cursor, Claude, Jules, and Gemini all now ship their own orchestration / manager surfaces. Before building this layer, validate it isn't redundant with what vendors offer natively.

---

## Key Open Questions

1. **Auth heterogeneity** *(the real architectural risk now)* — all V1/V2 vendors use a headless API key (Cursor, Claude, Jules, Gemini), which is clean. But auth shapes differ (Cursor: Basic/Bearer, team-provisioned keys; Claude: `x-api-key` + beta header; Jules: `X-Goog-Api-Key`; Gemini: API key). Storage: start with `~/.polyagent/config.json` (chmod 600), document the tradeoff, consider OS keychain (`keytar`) later. Codex's ChatGPT-session auth is the reason it's excluded.

2. **Live handshake per vendor** — does the real `dispatch → first response → status` loop work end-to-end with real keys? **Validate via a thin spike on Cursor + Claude before the full build.** (Documentation confirms the surfaces exist; the spike confirms they behave.)

3. **Dispatch metadata** — what useful metadata does each vendor return on dispatch / status (cost, branch, PR, sandbox URL, token usage)? Capture per-adapter in the implementation spec; surface the useful subset in `status`/`output`.

4. **Beta/alpha stability** — Cursor (Beta), Claude Managed Agents (Beta), Jules (v1alpha), Gemini (Preview). Implement exponential backoff and tolerate schema drift from day one.

5. **Polling interval** — default 30s, configurable. SSE streams are available (Cursor, Claude) for richer live output where worth it; polling is the floor.

6. **Cursor team-key caveat** — Cloud Agents API keys appear to be admin/team-provisioned. Verify it works on a solo account during the spike.

---

## What Changed From the March 2026 Draft (changelog)

- **Inverted the core premise:** track-first → **dispatch-first**. PolyAgent owns dispatch across vendors; "doesn't own the agents" framing removed.
- **External-session tracking descoped** (was the central differentiator) — unconfirmed everywhere, impossible for Claude.
- **Dispatch moved from V2 into V1.** Manual `register` / auto-discovery `sync` removed from the critical path; `listSessions()` demoted to optional best-effort.
- **Claude Managed Agents** (new, Apr 2026) replaces the old "SDK-spawned only, can't track external" limitation for the dispatch model.
- **V1 vendor pair = Cursor + Claude.** Jules + Gemini/Antigravity → V2. **Codex omitted** (no public API).
- **Gemini = Antigravity Interactions API** (Gemini CLI is being sunset, June 18 2026).
- **Adapters wrap official SDKs** (`@cursor/sdk`, `anthropic`).
- **`outputUrl` generalized** — no longer assumed to be a PR URL.
- **State path:** JSON → SQLite → Supabase Postgres.
