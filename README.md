# PolyAgent

> Assemble the best team for every job. Not just the most available one.

A vendor-agnostic CLI that **dispatches and tracks cloud coding agents across vendors** from one place — no platform lock-in, no tab-switching. You start an agent on any supported vendor and track it from a single unified view.

## V1 scope (this branch)

A **CLI tool** (TypeScript/Node) that proves the cross-vendor abstraction on **two vendors**:

- **Claude** — Managed Agents, via the official `@anthropic-ai/sdk` (a *managed-agent SDK* integration)
- **Jules** — via raw REST (`X-Goog-Api-Key`, no JS SDK) (a *raw-API* integration)

Deliberately one SDK + one raw-API integration, and one *general-sandbox* agent (Claude) + one *repo→PR* agent (Jules) — so the normalization is proven across genuinely different shapes.

### The loop

```
polyagent dispatch --vendor claude "Refactor the session store"
polyagent dispatch --vendor jules --repo me/app "Fix the auth bug"
polyagent status        # unified live view across both vendors
```

Follow-up (`polyagent followup`) is **V3**. Dispatch + status is V1.

## Implementation tasks

| # | Task | Mode | Status |
|---|---|---|---|
| 1 | Scaffold + core types + JSON state store | inline | ✅ done |
| 2 | Claude adapter (managed-agent SDK, behind a port) | subagent | in progress |
| 3 | Jules adapter (raw REST, behind a port) | subagent | in progress |
| 4 | Registry + CLI + `dispatch` command | inline | pending (live gate) |
| 5 | Unified `status` command + formatting | inline | pending (live gate) |

Full plan: `docs/plans/2026-06-23-polyagent-mvp.md`. Architecture & rationale: `technical-design.md`.

## Architecture

Vendor-adapter pattern. Each vendor implements a common `AgentAdapter` (`dispatch` / `getStatus` / `getOutput` / `sendFollowup`). Adapters depend on an injectable **port** (not the SDK/HTTP directly), so normalization logic is unit-tested with fakes — no keys, deterministic. The real port wraps the SDK (Claude) or `fetch` (Jules). Sessions persist to a flat JSON file.

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in your keys
npm test                     # unit tests (no keys needed)
```

Keys (`.env.local`, gitignored):
- `ANTHROPIC_API_KEY` — platform.claude.com → Settings → API keys
- `JULES_API_KEY` — jules.google.com → Settings → API

## Roadmap

- **V2** — Gemini/Antigravity adapter (Interactions API; AI Studio / Vertex / multimodal); `broadcast`; a simple **Next.js UI** over the same core.
- **V3** — `followup` across all 3 vendors; lead agent (Claude chief-of-staff); web dashboard.

## Tech stack

TypeScript (Node 20+, ESM) · `commander` · `@anthropic-ai/sdk` · native `fetch` (Jules) · `dotenv` · `vitest`. State: JSON → SQLite → Supabase Postgres.
