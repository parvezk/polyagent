# PolyAgent — web dashboard

The Next.js control plane for PolyAgent: dispatch and track cloud coding agents
(Claude, Jules, Cursor, Gemini) across vendors from one interface.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in the values below
npm run dev                  # http://localhost:3000
```

## Environment variables

Copy `.env.example` to `.env.local` (gitignored). Production values live in Vercel.

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | prod | Supabase project URL — backs auth + the session store. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | prod | Supabase publishable (anon) key. |
| `NEXT_PUBLIC_POSTHOG_KEY` | optional | PostHog project key. Analytics only run on `polyagent.pro` hosts in production. |
| `NEXT_PUBLIC_POSTHOG_HOST` | optional | PostHog ingestion host. |
| `SUPABASE_AUTH_BYPASS` | dev only | Set to `true` to opt into the no-auth bypass even outside a dev build (see below). |

## Auth gate & the dev bypass

`lib/supabase/middleware.ts` refreshes the Supabase session on every request and
gates app routes — unauthenticated visitors are redirected to `/login`.

When the Supabase env vars are **not** set, the auth gate behavior depends on the
environment:

- **Local dev** (`NODE_ENV !== "production"`), or any environment with
  `SUPABASE_AUTH_BYPASS=true`: the middleware **passes through** with no auth gate,
  so you can run the app without a Supabase project configured.
- **Production** with the vars missing and no explicit opt-in: the middleware
  **fails closed** — every non-auth route is redirected to `/login` and a warning
  is logged. This prevents a misconfigured deploy (missing env vars) from silently
  exposing the whole dashboard.

In short: production always requires the Supabase env vars unless you deliberately
opt into the bypass with `SUPABASE_AUTH_BYPASS=true`.

## End-to-end tests

Playwright drives the core dashboard flows (render, New Agent modal, session table,
session drawer, import toast). The tests mock `/api/sessions` and `/api/import` at
the network layer, so they never touch real Supabase, OAuth, or vendor APIs. The
Playwright config boots its own dev server on port `3100`.

```bash
npx playwright install --with-deps chromium   # first run only
npm run test:e2e                               # headless
npm run test:e2e:ui                            # interactive UI mode
```
