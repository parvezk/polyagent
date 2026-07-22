# PolyAgent

> Assemble the best team for every job. Not just the most available one.

Polyagent is a vendor-agnostic CLI that **dispatches and tracks autonomous cloud-based coding agents across vendors** under one roof — no platform lock-in, no tab-switching. You start an agent on any supported vendor and track it from a single unified view.

## V1 features

A **CLI tool** that proves the cross-vendor abstraction on **two vendors**:

- **Claude** — Managed Agents, via the official `@anthropic-ai/sdk` (a _managed-agent SDK_ integration)
- **Jules** — via raw REST (`X-Goog-Api-Key`, no JS SDK) (a _raw-API_ integration)

One SDK + one raw-API integration, and one _general-sandbox_ agent (Claude) + one _repo→PR_ agent (Jules) — so the normalization is proven across genuinely different shapes.

### The loop

```
polyagent dispatch --vendor claude "Refactor the session store"
polyagent dispatch --vendor jules --repo me/app "Fix the auth bug"
polyagent status        # unified live view across both vendors
```

## Architecture

Vendor-adapter pattern. Each vendor implements a common `AgentAdapter` (`dispatch` / `getStatus` / `getOutput` / `sendFollowup`). Adapters depend on an injectable **port** (not the SDK/HTTP directly), so normalization logic is unit-tested with fakes — no keys, deterministic. The real port wraps the SDK (Claude) or `fetch` (Jules). Sessions persist to a flat JSON file.

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in your keys
npm test                     # unit + E2E smoke tests (no keys needed)
```

`npm test` also runs a deterministic **E2E smoke layer** (`test/cli.e2e.test.ts`,
or `npm run test:e2e` on its own) that spawns the real CLI entrypoint end-to-end
without vendor keys or network calls. It isolates state via `POLYAGENT_STATE_PATH`
(a temp file, so your real `~/.polyagent/state.json` is never touched) and swaps
in fake adapters via `POLYAGENT_FAKE_ADAPTERS=1`. CI runs the whole suite on every
push and PR — see `.github/workflows/ci.yml`.

The live scripts under `scripts/` (`smoke-claude.ts`, `smoke-jules.ts`) still
dispatch real vendor sessions and require the corresponding API keys.

Keys (`.env.local`, gitignored):

- `ANTHROPIC_API_KEY` — platform.claude.com → Settings → API keys
- `JULES_API_KEY` — jules.google.com → Settings → API

## Roadmap

- **V2** — Gemini/Antigravity adapter (Interactions API; AI Studio / Vertex / multimodal); `broadcast`; a simple **Next.js UI** over the same core.
- **V3** — `followup` across all 3 vendors; lead agent (Claude chief-of-staff); web dashboard.

## Tech stack

TypeScript (Node 20+, ESM) · `commander` · `@anthropic-ai/sdk` · native `fetch` (Jules) · `dotenv` · `vitest`. State: JSON → SQLite → Supabase Postgres.

## Feature pipeline

| #   | Task                                              | Mode     | Status              |
| --- | ------------------------------------------------- | -------- | ------------------- |
| 1   | Scaffold + core types + JSON state store          | inline   | ✅ done             |
| 2   | Claude adapter (managed-agent SDK, behind a port) | subagent | in progress         |
| 3   | Jules adapter (raw REST, behind a port)           | subagent | in progress         |
| 4   | Registry + CLI + `dispatch` command               | inline   | pending (live gate) |
| 5   | Unified `status` command + formatting             | inline   | pending (live gate) |

Full plan: `docs/plans/2026-06-23-polyagent-mvp.md`. Architecture & design: `technical-design.md`.
