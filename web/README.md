## PolyAgent web

The Next.js dashboard for PolyAgent — dispatch and track cloud coding agents across vendors
(Claude, Jules, Cursor, Gemini) from one interface.

### Getting started

```bash
npm install
cp .env.example .env.local   # fill in the values you need (see below)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

Copy `.env.example` to `.env.local` (gitignored). Production values live in Vercel.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL — required for auth. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable (anon) key — required for auth. |
| `NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST` | PostHog analytics (only tracks on the production hosts). |
| `AUTH_DEV_BYPASS` | Local-dev only escape hatch — see below. |

### Auth gating (fails closed)

`middleware.ts` runs `updateSession` on every non-API, non-asset route. Behavior:

- **Supabase configured:** the request is authenticated with `getClaims()`. Unauthenticated
  users are redirected to `/login` (auth routes are exempt to avoid a redirect loop).
- **Supabase _not_ configured:** the middleware **fails closed** — every non-auth route is
  redirected to `/login`, so a production deploy with missing env vars locks the dashboard
  down instead of quietly exposing it.
- **Local-dev bypass:** set `AUTH_DEV_BYPASS=true` in `.env.local` to skip the gate while
  building UI without a Supabase project. This is opt-in and only honored when
  `NODE_ENV !== "production"`, so it can never re-open the gate in a real deploy.

### End-to-end tests (Playwright)

```bash
npm install
npx playwright install chromium   # one-time browser download
npm run test:e2e                  # or: npm run test:e2e:ui
```

`playwright.config.ts` boots `next dev` on port 3100 with `AUTH_DEV_BYPASS=true`, so the
tests run without any Supabase, OAuth, or vendor credentials. Every `/api/*` route is mocked
from the specs in `e2e/` (see `e2e/helpers.ts`) — nothing touches real Supabase or the
Claude/Jules/Cursor/Gemini vendor APIs. The first-phase suite covers the core dashboard flows:
shell + empty state, mocked sessions rendering, row-click opening the drawer, the new-agent
modal, and the import success/error toasts.
