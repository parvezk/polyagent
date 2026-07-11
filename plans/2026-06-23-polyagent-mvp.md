# PolyAgent MVP Implementation Plan (V1)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (for isolated tasks) or superpowers:executing-plans (for inline/connective tasks) per the **Execution mode** noted on each task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A TypeScript CLI (`polyagent`) that dispatches and tracks cloud coding agents across two vendors — **Claude Managed Agents** (official SDK) and **Google Jules** (raw REST) — from one unified interface.

**Architecture:** Vendor-adapter pattern. Each vendor implements a common `AgentAdapter`. Adapters depend on a small injectable **port** (not the SDK/HTTP directly), so normalization logic is unit-testable with fakes; the real port wraps the SDK (Claude) or `fetch` (Jules). A flat JSON file holds dispatched sessions. Keys load from `.env.local`.

**Deliberate split:** one **managed-agent SDK** integration (Claude) + one **raw-API** integration (Jules). This is a learning goal _and_ the normalization proof — a repo→PR agent (Jules) and a general-sandbox agent (Claude) normalized behind one interface.

**Tech Stack:** TypeScript (Node 20+, ESM), `commander`, `@anthropic-ai/sdk`, native `fetch` (Jules), `dotenv`, `vitest`, `tsx`.

## Global Constraints

- Node 20+, ESM (`"type": "module"`), `"module": "NodeNext"`, `strict: true`.
- Normalized status enum is exactly: `"running" | "needs_review" | "completed" | "failed" | "unknown"`. A vendor-native status string must never escape its adapter.
- Adapters depend on a **port interface**, never importing the SDK/`fetch` at the logic layer. Only the concrete port touches the SDK/network. This keeps every adapter unit-testable with a fake port (no keys, no cost, deterministic).
- Keys load from `.env.local` (or `.env`) via `dotenv` at CLI startup → `process.env`. No `polyagent auth` command in V1.
- Vendor identifiers are exactly `"claude"` and `"jules"`.
- Every network path tolerates beta/alpha drift: a thrown SDK/HTTP error normalizes to `failed`/`unknown`, never an uncaught crash.
- **Scope discipline:** V1 = dispatch + status only. Follow-up is V3. No dashboard, no broadcast, no lead agent.

## Environment & Keys

- `.env.local` (gitignored) holds: `ANTHROPIC_API_KEY`, `JULES_API_KEY`. Both already added.
- Claude key: platform.claude.com → Settings → API keys (Managed Agents access is automatic; SDK sets the beta header).
- Jules key: jules.google.com → Settings → API (free tier, max 3 keys).
- `.gitignore` already excludes `.env*`. `dotenv/config` is imported once at the top of `src/cli.ts`.

---

## File Structure

```
src/
├── cli.ts                  # commander entrypoint + `import "dotenv/config"`; wires dispatch + status
├── types.ts                # shared contracts (below)
├── state.ts                # JSON state store (load/save/upsert/get/list)
├── config.ts               # resolveKey(vendor) from process.env
├── registry.ts             # buildAdapter(vendor) → wires real port + key
├── format.ts               # status-table render + relative time
├── adapters/
│   ├── adapter.ts          # AgentAdapter interface
│   ├── claude.ts           # ClaudeAdapter (depends on ClaudePort)
│   ├── claude-port.ts      # ClaudePort + real @anthropic-ai/sdk impl
│   ├── jules.ts            # JulesAdapter (depends on JulesPort)
│   └── jules-port.ts       # JulesPort + real fetch impl (X-Goog-Api-Key)
└── commands/
    ├── dispatch.ts         # `polyagent dispatch`
    └── status.ts           # `polyagent status`
test/  → state.test.ts, format.test.ts, claude.test.ts, jules.test.ts
scripts/ → smoke-claude.ts, smoke-jules.ts   # live verify-gate runners
```

---

## Contracts

These are the stable interfaces the tasks implement. (Implementation bodies + test code are written during execution into the relevant files — not in this plan.)

**`src/types.ts`**

```typescript
export type Vendor = "claude" | "jules";
export type SessionStatus = "running" | "needs_review" | "completed" | "failed" | "unknown";

export interface AgentSession {
  id: string; // vendor-native session ID
  vendor: Vendor;
  label?: string; // first line of the prompt, truncated
  status: SessionStatus;
  dispatchedAt: string; // ISO
  lastPolled?: string; // ISO
  outputUrl?: string; // PR/branch (Jules) OR session URL (Claude) — generic, NOT assumed to be a PR
}

export interface AgentStatus {
  status: SessionStatus;
  lastUpdate: Date;
  summary?: string;
  needsInput: boolean;
}

export interface AgentOutput {
  sessionId: string;
  vendor: Vendor;
  messages: { role: "agent" | "human"; content: string; timestamp: Date }[];
}

export interface DispatchRequest {
  prompt: string;
  repo?: string; // "owner/repo" — used by Jules
  branch?: string;
  model?: string;
}
```

**`src/adapters/adapter.ts`**

```typescript
export interface AgentAdapter {
  readonly vendor: Vendor;
  dispatch(req: DispatchRequest): Promise<AgentSession>;
  getStatus(sessionId: string): Promise<AgentStatus>;
  getOutput(sessionId: string): Promise<AgentOutput>;
  sendFollowup(sessionId: string, message: string): Promise<void>; // present in the contract; wired to a command in V3, not V1
}
```

**Port interfaces** (the SDK/HTTP seam — the only place vendor specifics live):

```typescript
// claude-port.ts
type ClaudeSessionStatus = "idle" | "running" | "rescheduling" | "terminated";
interface ClaudePort {
  // Hides the agent → environment → session → user.message-event sequence behind one call.
  createSession(i: {
    prompt: string;
    modelId?: string;
  }): Promise<{ sessionId: string; firstReply: string; status: ClaudeSessionStatus }>;
  getStatus(sessionId: string): Promise<{ status: ClaudeSessionStatus; summary?: string }>;
  sendEvent(sessionId: string, message: string): Promise<void>; // V3
}

// jules-port.ts
type JulesState =
  | "QUEUED"
  | "PLANNING"
  | "AWAITING_PLAN_APPROVAL"
  | "AWAITING_USER_FEEDBACK"
  | "IN_PROGRESS"
  | "PAUSED"
  | "COMPLETED"
  | "FAILED";
interface JulesPort {
  // If repo is set, resolves the source name via GET /v1alpha/sources first, then POST /v1alpha/sessions.
  createSession(i: {
    prompt: string;
    repo?: string;
    branch?: string;
    title?: string;
  }): Promise<{ sessionId: string; state: JulesState }>;
  getSession(sessionId: string): Promise<{ state: JulesState; lastMessage?: string }>;
  listActivities(
    sessionId: string,
  ): Promise<{ messages: { role: "agent" | "human"; content: string; timestamp: string }[] }>;
  sendMessage(sessionId: string, message: string): Promise<void>; // V3 (POST :sendMessage)
}
```

**Status normalization** (the core of the abstraction — each adapter owns its map):

| Normalized     | Claude (`ClaudeSessionStatus`)     | Jules (`JulesState`)                               |
| -------------- | ---------------------------------- | -------------------------------------------------- |
| `running`      | `running`, `rescheduling`          | `QUEUED`, `PLANNING`, `IN_PROGRESS`, `PAUSED`      |
| `needs_review` | `idle` (turn done, awaiting human) | `AWAITING_PLAN_APPROVAL`, `AWAITING_USER_FEEDBACK` |
| `completed`    | `terminated`                       | `COMPLETED`                                        |
| `failed`       | —                                  | `FAILED`                                           |
| `unknown`      | error / unrecognized               | error / unrecognized                               |

> The `idle → needs_review` choice (Claude) is a product decision, refined after observing real behaviour at the live gate. Jules' explicit `AWAITING_*` states map cleanly — this asymmetry is itself good substack material.

---

## Design Decisions & Trade-offs

- **Port pattern over direct SDK use** — buys deterministic, key-free unit tests and isolates beta/alpha SDK drift to one file per vendor. Cost: a little boilerplate.
- **JSON state, not SQLite** — zero setup for the MVP. Upgrade path: `better-sqlite3` → Supabase Postgres when a dashboard/multi-device arrives. The `StateStore` API stays stable across the swap.
- **Jules = raw `fetch`, not an SDK** — Jules has no official JS SDK; the thin wrapper is intentional (raw-API learning) and marginal effort (one extra `GET /sources` call vs SDK). Behind the same port, so the adapter/tests don't know the difference.
- **`outputUrl` is generic** — PR/branch for Jules, session URL for Claude. The abstraction leaks here by design; surfacing _where_ it leaks is a deliverable insight, not a bug.
- **No `auth` command** — `.env.local` is the single key mechanism; fewer moving parts for a 3-day build.

## Testing Strategy

- **Pure logic** (state store, status normalization via each adapter, table formatting) → real `vitest` unit tests with **fake ports**. No keys, deterministic, fast. This is where correctness is proven.
- **Live vendor behaviour** → per-vendor **smoke scripts** (`scripts/smoke-*.ts`) run manually with real keys. These are the human verify gates between tasks — not CI tests (they cost tokens and need keys).
- Test files are created during execution; this plan defines _what_ each test asserts, not the literal test code.

---

## Tasks (5)

Each task ends in an independently testable deliverable. **Execution mode** follows the hybrid rule: isolated modules → subagent; connective/integration layers → inline.

### Task 1 — Scaffold + core types + state store · _inline_

- **Why inline:** foundational; defines the shared contracts every later task imports.
- **Files:** `package.json`, `tsconfig.json`, `vitest.config.ts`, `src/types.ts`, `src/state.ts`, `test/state.test.ts`; `git init`.
- **Produces:** all types in _Contracts_; `StateStore` with `load/save/upsert/get/list`.
- **Tests assert:** upsert-then-list ordering; upsert replaces by `id`; state persists across reload.
- **Verify gate:** `npx vitest run` green. No keys needed.

### Task 2 — Claude adapter (managed-agent SDK) · _subagent_

- **Why subagent:** isolated module behind `ClaudePort`; fixed contract; no cross-cutting concerns.
- **Files:** `src/adapters/adapter.ts`, `src/adapters/claude-port.ts`, `src/adapters/claude.ts`, `test/claude.test.ts`.
- **Consumes:** `types.ts`. **Produces:** `AgentAdapter`, `ClaudePort`, `realClaudePort(apiKey)`, `ClaudeAdapter`.
- **Port responsibility:** `createSession` runs `agents.create → environments.create → sessions.create`, opens the event stream, sends the first `user.message`, captures the first `agent.message` as the handshake reply. Ref: platform.claude.com/docs/en/managed-agents/quickstart.
- **Tests assert (fake port):** dispatch returns normalized session w/ vendor `claude`; `idle→needs_review`, `terminated→completed`; port error → `unknown` (no throw).
- **Verify gate:** `npx vitest run test/claude.test.ts` green.

### Task 3 — Jules adapter (raw REST) · _subagent_ (independent of Task 2 — can run in parallel)

- **Why subagent:** isolated module behind `JulesPort`; pure REST wrapper.
- **Files:** `src/adapters/jules-port.ts`, `src/adapters/jules.ts`, `test/jules.test.ts`.
- **Consumes:** `types.ts`, `AgentAdapter`. **Produces:** `JulesPort`, `realJulesPort(apiKey)`, `JulesAdapter`.
- **Port responsibility:** `X-Goog-Api-Key` auth against `https://jules.googleapis.com/v1alpha`; `createSession` resolves source via `GET /sources` when `repo` set, then `POST /sessions`; `getSession` reads state; `listActivities` maps to `AgentOutput.messages`. Ref: developers.google.com/jules/api.
- **Tests assert (fake port):** dispatch returns normalized session w/ vendor `jules`; `IN_PROGRESS→running`, `AWAITING_USER_FEEDBACK→needs_review`, `COMPLETED→completed`, `FAILED→failed`; port error → `unknown`.
- **Verify gate:** `npx vitest run test/jules.test.ts` green.

### Task 4 — Registry + CLI + `dispatch` command · _inline_

- **Why inline:** connective layer wiring config + registry + state + both adapters; first live integration.
- **Files:** `src/config.ts`, `src/registry.ts`, `src/commands/dispatch.ts`, `src/cli.ts`, `scripts/smoke-claude.ts`, `scripts/smoke-jules.ts`. `npm pkg` bin/scripts.
- **Consumes:** both adapters, `StateStore`. **Produces:** `resolveKey`, `buildAdapter`, `polyagent dispatch --vendor <v> [--repo] [--branch] [--model] "<prompt>"`.
- **Behaviour:** dispatch → adapter → store session → print id + status + first reply.
- **Verify gate (LIVE — needs keys):**
  - `npx tsx scripts/smoke-claude.ts` → Claude session id + first reply, then status polls.
  - `npx tsx scripts/smoke-jules.ts <owner/repo>` → Jules session id, then state polls.
  - **Human confirms both first-handshakes before Task 5.** Beta/alpha shape fixes go _only_ in the port files.

### Task 5 — Unified `status` command + formatting · _inline_

- **Why inline:** connective; reads state, polls every session's live adapter, renders one table.
- **Files:** `src/format.ts`, `src/commands/status.ts`, `test/format.test.ts`; register in `cli.ts`.
- **Consumes:** `StateStore`, `buildAdapter`. **Produces:** `relativeTime`, `renderTable`, `polyagent status [sessionId]`.
- **Behaviour:** for each stored session, poll live status, update `lastPolled`, render `VENDOR / SESSION / LABEL / STATUS / LAST UPDATE`. On poll error, show last-known status.
- **Tests assert:** `relativeTime` formats minutes/hours; `renderTable` includes headers + a row.
- **Verify gate (LIVE):** dispatch one Claude + one Jules, run `polyagent status`, see both with live statuses in one table. **Human confirms the unified cross-vendor view** — this is the V1 success criterion.

---

## Out of scope (queued)

- **V2:** Gemini/Antigravity adapter (Interactions API — opens AI Studio / Vertex / multimodal); ecosystem + long-running-workflow demos.
- **V3:** `followup` command across all 3 vendors (`sendFollowup` already in the interface + both ports); lead agent; web dashboard.
- **Next.js UI:** a simple web UI over the same adapters/state, after the 5 tasks are verified.

## Self-Review

- **Coverage:** dispatch → Tasks 2–4; status → Task 5; two vendors, official-SDK + raw-API split, JSON state, `.env.local` keys, no external-session tracking → all mapped. ✓
- **No placeholders:** contracts are concrete; impl/test code intentionally deferred to execution per the user's request for an outline.
- **Type consistency:** port method names + status unions match between Contracts and each task's "Produces"; `AgentSession`/`AgentStatus` fields consistent across commands.
- **Beta/alpha risks carried into execution:** Claude session `status` field name + `events.stream` signature (confirm at Task 4 gate); Jules `GET /sources` shape + `requirePlanApproval` default (confirm at gate); `idle→needs_review` mapping refined after real behaviour.
