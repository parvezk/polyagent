# PolyAgent

> Assemble the best team for every job. Not just the most available one.

PolyAgent is a vendor-agnostic **CLI + web dashboard** for dispatching and tracking autonomous cloud coding agents across vendors — one control plane, no tab-switching.

## What ships today

| Surface | Role |
| --- | --- |
| **CLI** (`polyagent`) | Dispatch, live status, follow-up; sessions in `~/.polyagent/state.json` |
| **Web** (`web/`) | Next.js dashboard over the same adapters; Supabase auth + RLS-scoped sessions |

### Vendors

Adapters are wired for four vendors behind a shared `AgentAdapter` (`dispatch` / `getStatus` / `getOutput` / `sendFollowup`):

| Vendor | Integration | Shape | Notes |
| --- | --- | --- | --- |
| **Claude** | `@anthropic-ai/sdk` Managed Agents | General sandbox | Primary CLI wizard option |
| **Jules** | Raw REST (`X-Goog-Api-Key`) | Repo → PR | Requires a Jules-connected GitHub source |
| **Cursor** | `@cursor/sdk` | Repo → PR | Available in web dispatch UI; needs Cursor API key / Pro |
| **Gemini** | Interactions / Antigravity REST | General sandbox | Available in web dispatch UI |

The interactive CLI wizard currently offers **Claude** and **Jules**. Flag-driven CLI dispatch and the web UI can target any registered vendor.

### The loop

```bash
# CLI
npm run dev -- dispatch --vendor claude "Refactor the session store"
npm run dev -- dispatch --vendor jules --repo me/app "Fix the auth bug"
npm run dev -- status --watch
npm run dev -- followup <sessionId> "Approve the plan and continue"

# Or omit the prompt for the interactive wizard:
npm run dev -- dispatch
```

Web: see [`web/README.md`](web/README.md).

## Architecture

Vendor-adapter pattern. Each vendor implements `AgentAdapter`. Adapters depend on an injectable **port** (not the SDK/HTTP directly), so normalization is unit-tested with fakes — no keys, deterministic. Real ports wrap the SDK (Claude, Cursor) or `fetch` (Jules, Gemini).

```
CLI / Next route handlers
        │
        ▼
  buildAdapter(vendor)     ← src/registry.ts (vendored into web/_core for deploy)
        │
   ┌────┼────┬────────┐
   ▼    ▼    ▼        ▼
 Claude Jules Cursor Gemini
   │    │    │        │
  port  port port    port
```

- **CLI state:** `~/.polyagent/state.json` (flat JSON via `StateStore`)
- **Web state:** Supabase `sessions` table, RLS by `auth.uid()`
- **Bridge:** after editing `src/`, run `npm run sync-core` from `web/` so Vercel gets an updated `web/_core`

Design background: [`technical-design.md`](technical-design.md). Historical plans live under [`plans/`](plans/).

## Setup (CLI)

Node.js 20.19+, 22.13+, or 24+ is required for the web test environment.

```bash
npm install
npm --prefix web install
cp .env.example .env.local   # then fill in your keys
npm test                     # core and web tests (no keys needed)
npm run build                # tsc → dist/ (also used by web sync-core)
```

Keys (`.env.local`, gitignored):

| Variable | Vendor |
| --- | --- |
| `ANTHROPIC_API_KEY` | Claude — platform.claude.com → Settings → API keys |
| `JULES_API_KEY` | Jules — jules.google.com → Settings → API |
| `CURSOR_API_KEY` | Cursor cloud agents |
| `GEMINI_API_KEY` | Gemini / Antigravity Interactions API |

## Setup (web)

```bash
cd web
npm install
cp .env.example .env.local   # Supabase + vendor keys + optional PostHog
npm run sync-core            # after building repo root, or when src/ changes
npm run dev
```

Details, auth model, API surface, and Playwright: [`web/README.md`](web/README.md).

## Common pitfalls

- **Jules repo must be a Jules source.** Dispatch looks up `owner/repo` via Jules `GET /sources`. Install the Jules GitHub App and select the repo in Jules, or dispatch fails with an “Available: …” error.
- **Jules needs `--repo`.** Claude/Gemini do not require a repo; Cursor and Jules do (web UI enforces the same for Jules/Cursor).
- **Web API routes authenticate themselves.** Page middleware skips `/api/*`; each mutating/sensitive route checks Supabase claims (e.g. `/api/jules/sources` returns `401` when unauthenticated).
- **Missing Supabase config fails closed.** Without `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, protected pages redirect to `/login`. Local UI-only work needs `POLYAGENT_ALLOW_INSECURE_AUTH_BYPASS=1` (non-production only).
- **Core drift.** The web app imports compiled `web/_core`, not live `src/`. Forget `sync-core` after core changes and the dashboard runs stale adapters.

## Tech stack

TypeScript (Node 20+, ESM) · `commander` · `@anthropic-ai/sdk` · `@cursor/sdk` · native `fetch` · `dotenv` · `vitest` · Next.js (App Router) · Supabase Auth/Postgres · Playwright (web e2e).

## Docs map

| Doc | Purpose |
| --- | --- |
| [`README.md`](README.md) | This file — current product surface |
| [`web/README.md`](web/README.md) | Dashboard setup, auth, APIs, e2e, troubleshooting |
| [`technical-design.md`](technical-design.md) | Original architecture / capability matrix (see status note at top) |
| [`plans/`](plans/) | Dated design/implementation plans |
