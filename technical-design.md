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
| **Claude** | ✅ Managed Agents `POST /v1/sessions` (cloud) | ✅ poll + SSE | ✅ `POST /sessions/{id}/events` | Official `anthropic` SDK (`beta.agents`) | Beta | **Yes (V1)** |
| **Jules** | ✅ `POST /v1alpha/sessions` | ✅ poll session + activities | ✅ `:sendMessage` | Raw REST (`X-Goog-Api-Key`) + CLI | v1alpha | **Yes (V1)** |
| **Gemini / Antigravity** | ✅ Interactions API (`background=true`) | ✅ poll by `interaction.id` | ✅ `previous_interaction_id` | REST + `@google/genai` SDK | Preview | V2 |
| **Cursor** | ✅ `POST /v1/agents` | ✅ poll runs + SSE | ✅ `POST /agents/{id}/runs` | Official `@cursor/sdk` (TS) | Beta | Deferred |
| **Codex** | ⚠️ CLI only (`codex cloud exec`) | ⚠️ CLI only | ❌ none | CLI shelling + ChatGPT login | partial | **Omitted** |

**V1 pair = Claude + Jules** — a deliberate *managed-agent SDK* (Claude) + *raw-API* (Jules) split, and a *general-sandbox* + *repo→PR* shape contrast that stress-tests the abstraction.

**Cursor is deferred** (not omitted): its Cloud Agents API requires a **paid Pro account** ($20/mo) — confirmed in-dashboard ("Cloud Agents requires a Pro Account"). It slots into the same adapter shape as Jules whenever a subscription is in place.

**Codex is omitted.** It has no public REST/SDK — the only programmatic path is shelling out to the `codex` CLI, which authenticates via a logged-in ChatGPT browser session (cookies, not an API key) and has no programmatic follow-up. It can't run headless and breaks the clean "API key per vendor" model. Revisit if/when OpenAI ships a public cloud-agent API.

**Note on "dispatch" shape:** Cursor and Jules are repo→PR coding agents (clone a repo, work in a sandbox, open a PR). Claude Managed Agents and Gemini Interactions API are general code-execution agents in an ephemeral sandbox that may not produce a PR. The common interface must flex for both — see `outputUrl` below.

---

## V1 Scope

**Two vendors, one loop, end-to-end.** Claude + Jules. Proving the loop on *two* vendors (not one) is what validates the cross-vendor normalization — one vendor proves nothing about the abstraction.

Two steps, built and verified incrementally (follow-up is V3):

1. **Dispatch + first handshake** — `polyagent dispatch` starts a session and returns the session ID + first agent response.
2. **Live status** — `polyagent status` polls real status of the live session, unified across both vendors.

Keys load from `.env.local` (`ANTHROPIC_API_KEY`, `JULES_API_KEY`). See the full task breakdown in `docs/plans/2026-06-23-polyagent-mvp.md`.

**Target:** working loop on both vendors before *Built in NYC with Vercel* (2026-06-27).

---

## Architecture Overview

### V1 (Dispatch + Track, two vendors)

```
┌──────────────────────────────────────────────────────────┐
│                   Human Operator                          │
│                 (CLI — polyagent)                         │
│              dispatch / status / output                   │
└───────────────────────────┬──────────────────────────────┘
                            │
           ┌────────────────▼────────────────┐
           │         Adapter Registry         │
           │     (in-process, no server)      │
           └──────┬───────────────────┬───────┘
                  │                   │
            ┌─────▼─────┐       ┌─────▼─────┐
            │  Claude   │       │   Jules   │
            │  Adapter  │       │  Adapter  │
            └─────┬─────┘       └─────┬─────┘
                  │                   │
            anthropic SDK       raw REST fetch
            (Managed Agents,    (v1alpha,
             SDK + SSE)          X-Goog-Api-Key)
```

Local state: a single JSON file. No server, no daemon. Keys from `.env.local`.

### V2 (More vendors + orchestration)

- Add **Gemini/Antigravity** adapter (Interactions API — opens AI Studio / Vertex / multimodal + long-running workflows).
- `polyagent broadcast` — message all running agents at once.
- Shared task context / knowledge base across agents.
- A simple **Next.js web UI** over the same adapters/state.
- State upgrade path: SQLite, then Supabase Postgres when persistence / multi-device / dashboard arrives.

### V3 (Follow-up + intelligence + visibility)

- **Follow-up across all 3 vendors** — `polyagent followup <id> "…"` (`sendFollowup` is already in the adapter contract; both Claude and Jules ports support it).
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
# Setup — keys live in .env.local (ANTHROPIC_API_KEY, JULES_API_KEY); no auth command

# Dispatch a new agent (the primary on-ramp)
polyagent dispatch --vendor jules  --repo parvez/app "Fix the auth bug in /api/login"
polyagent dispatch --vendor claude "Refactor the session store for clarity"

# Unified status view (the core experience)
polyagent status
# VENDOR   SESSION    LABEL                STATUS         LAST UPDATE
# jules    abc123     Fix auth bug         needs_review   2 min ago
# claude   xyz789     Refactor sessions    running        5 min ago

polyagent status <session-id>            # Drill into one session

# Read what the agent has been doing
polyagent output <session-id>

# V3: follow up without leaving the terminal
# polyagent followup <session-id> "Approve this approach, continue"
```

**The primary loop (V1):** `polyagent dispatch` → `polyagent status` → see live status across both vendors. Follow-up closes the loop in V3.

---

## Tech Stack

- **Language:** TypeScript (Node 20+, ESM).
- **Vendor adapters:** wrap the official SDK where one exists, else a thin `fetch` wrapper — both behind a per-vendor *port* so the adapter/tests don't know the difference.
  - Claude (V1) → `@anthropic-ai/sdk` (`beta.agents` / Managed Agents) — *managed-agent SDK*
  - Jules (V1) → raw `fetch` (`X-Goog-Api-Key`, no official JS SDK) — *raw-API integration*
  - Gemini/Antigravity (V2) → `@google/genai` (Interactions API)
  - Cursor (deferred) → `@cursor/sdk` (requires paid Pro)
- **Keys:** `dotenv` → `.env.local` (`ANTHROPIC_API_KEY`, `JULES_API_KEY`).
- **CLI framework:** `commander` (start simple) — `ink` later if an interactive TUI is wanted.
- **State:** JSON file (MVP) → `better-sqlite3` → Supabase Postgres.
- **Testing:** `vitest` (pure logic + adapters via fake ports); live smoke scripts per vendor.
- **Deploy context:** demoing on Vercel; a simple **Next.js UI** is the planned V2 front-end. Keep server pieces serverless-friendly (favor SSE/streaming over long-lived WebSockets until a dedicated push layer is justified).

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

1. **Auth heterogeneity** — V1 vendors both use a headless API key, but shapes differ (Claude: `x-api-key` + beta header via SDK; Jules: `X-Goog-Api-Key` header). Storage: `.env.local` (gitignored) for now; consider OS keychain (`keytar`) later. Codex's ChatGPT-session auth is the reason it's excluded; Cursor's Pro requirement is why it's deferred.

2. **Live handshake per vendor** — does the real `dispatch → first response → status` loop work end-to-end with real keys? **Validate at the Task 4/5 live gates (Claude + Jules).** (Documentation confirms the surfaces exist; the gate confirms they behave.)

3. **Dispatch metadata** — what useful metadata does each vendor return on dispatch / status (cost, branch, PR, sandbox URL, token usage)? Capture per-adapter in the implementation spec; surface the useful subset in `status`/`output`.

4. **Beta/alpha stability** — Cursor (Beta), Claude Managed Agents (Beta), Jules (v1alpha), Gemini (Preview). Implement exponential backoff and tolerate schema drift from day one.

5. **Polling interval** — default 30s, configurable. SSE streams are available (Claude) for richer live output where worth it; polling is the floor.

6. **Jules alpha drift** — `GET /sources` shape and `requirePlanApproval` default are v1alpha and may shift. Confirm at the live gate; keep error handling tolerant.

---

## What Changed From the March 2026 Draft (changelog)

- **Inverted the core premise:** track-first → **dispatch-first**. PolyAgent owns dispatch across vendors; "doesn't own the agents" framing removed.
- **External-session tracking descoped** (was the central differentiator) — unconfirmed everywhere, impossible for Claude.
- **Dispatch moved from V2 into V1.** Manual `register` / auto-discovery `sync` removed from the critical path; `listSessions()` demoted to optional best-effort.
- **Claude Managed Agents** (new, Apr 2026) replaces the old "SDK-spawned only, can't track external" limitation for the dispatch model.
- **V1 vendor pair = Claude + Jules** (managed-agent SDK + raw-API). **Gemini/Antigravity → V2**; **follow-up → V3** (across all 3 vendors). **Cursor deferred** (paid Pro required); **Codex omitted** (no public API).
- **Gemini = Antigravity Interactions API** (Gemini CLI is being sunset, June 18 2026).
- **Adapters wrap an official SDK where one exists (Claude), else a thin `fetch` wrapper (Jules)** — both behind a per-vendor port.
- **Keys via `.env.local`** (`dotenv`); `polyagent auth` command dropped.
- **`outputUrl` generalized** — no longer assumed to be a PR URL.
- **State path:** JSON → SQLite → Supabase Postgres.
