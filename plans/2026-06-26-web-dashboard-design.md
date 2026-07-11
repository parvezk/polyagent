# PolyAgent Web Dashboard — Design + Plan

**Date:** 2026-06-26 · **Target:** June 27 workshop demo

## Decisions (locked)

- **Runs:** local Next dev (`localhost`), reuses the existing JSON state file (`~/.polyagent/state.json`). Vercel + Supabase = fast-follow after the workshop.
- **Scope:** full loop — Dashboard + Dispatch + Follow-up.
- **UI:** Next.js (App Router) + Tailwind + shadcn/ui.
- **Core reuse:** the web app is a new _surface_ over the SAME adapters/registry/types. No vendor logic re-implemented.

## User flow

Dashboard (all sessions, live, color-coded; needs_review flagged)
→ "New Agent" modal (vendor → Jules repo / Claude model → task) → dispatch
→ click session → detail drawer (output + status) → follow-up box → steer.

## Architecture

```
Browser (React, SWR polls /api/sessions every ~3s)
   │  dashboard · new-agent modal · detail drawer
   ▼
Next.js Route Handlers (server, Node runtime)         ← keys stay here, never client
   GET  /api/sessions          list + live-poll each vendor
   POST /api/dispatch          { vendor, repo?, model?, prompt }
   GET  /api/sessions/:id      detail + output
   POST /api/sessions/:id/followup   { message }
   ▼
core: ClaudeAdapter / JulesAdapter via buildAdapter()  (imported from ../src)
   ▼
StateStore (JSON file)  +  vendor REST/SDK
```

- **Live updates:** client polling via SWR `refreshInterval` (simple, reliable). Supabase Realtime is V2.
- **Core import:** `web/` Next app imports core from `../src` via tsconfig path alias; if `.js`-extension resolution fights Next, fall back to importing built `../dist`.

## File structure (web/)

```
web/
├── app/
│   ├── layout.tsx                 # sticky PolyAgent header + theme
│   ├── page.tsx                   # Dashboard (server component shell)
│   └── api/
│       ├── sessions/route.ts            # GET list (+ live poll)
│       ├── sessions/[id]/route.ts       # GET detail
│       ├── sessions/[id]/followup/route.ts  # POST follow-up
│       └── dispatch/route.ts            # POST dispatch
├── components/
│   ├── session-table.tsx          # live grid, color/status, needs_review flag (client, SWR)
│   ├── new-agent-modal.tsx        # dispatch form (vendor→repo/model→task)
│   ├── session-drawer.tsx         # detail + output + follow-up box
│   └── status-badge.tsx           # normalized status → colored badge
├── lib/core.ts                    # re-export buildAdapter/StateStore/types from ../src
└── (tailwind/shadcn config)
```

## Build plan (checkpointed)

1. **Scaffold** — Next app in `web/`, Tailwind, shadcn init, sticky header layout + branding. _Checkpoint: page renders._
2. **API + core bridge** — `lib/core.ts` re-export; `/api/sessions` (list+poll), `/api/dispatch`, `/api/sessions/:id`, `/followup`. _Checkpoint: `/api/sessions` returns live JSON._
3. **Dashboard** — `session-table` + `status-badge`, SWR live polling, needs*review highlight. \_Checkpoint: live table in browser.*
4. **Dispatch modal** — form (vendor→repo from Jules sources/model→task) → POST → row appears. _Checkpoint: dispatch from browser._
5. **Detail drawer + follow-up** — output view + follow-up box → POST. _Checkpoint: full loop in browser._

## Out of scope (post-demo)

Supabase + Vercel deploy, Supabase Realtime, auth, cost tracking, benchmarking, Gemini/Cursor adapters, broadcast.

```

```
