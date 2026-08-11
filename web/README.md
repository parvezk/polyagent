# PolyAgent web dashboard

Next.js App Router UI over the same vendor adapters as the CLI. Sessions are stored in Supabase (RLS-scoped per user). Vendor API keys stay on the server.

## Local development

From the **repo root**, build core once, then set up `web/`:

```bash
# repo root
npm install && npm run build

cd web
npm install
cp .env.example .env.local
npm run sync-core          # copies ../dist → ./_core (required for Vercel self-containment)
npm run dev
```

### Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | yes (prod/local auth) | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | yes (prod/local auth) | Supabase publishable key |
| `ANTHROPIC_API_KEY` | for Claude dispatch | Server-only vendor key |
| `JULES_API_KEY` | for Jules dispatch / sources | Server-only vendor key |
| `CURSOR_API_KEY` | for Cursor dispatch | Server-only vendor key |
| `GEMINI_API_KEY` | for Gemini dispatch | Server-only vendor key |
| `NEXT_PUBLIC_POSTHOG_KEY` / `HOST` | optional | Analytics on `polyagent.pro` / `www.polyagent.pro` only |
| `POLYAGENT_ALLOW_INSECURE_AUTH_BYPASS` | local only | `1` skips auth gate when `NODE_ENV !== "production"` |

Apply the SQL in `supabase/schema.sql` (and migrations under `supabase/migrations/`) in the Supabase SQL editor before expecting persistence.

### Auth model

- Page middleware (`proxy.ts` → `lib/supabase/middleware.ts`) refreshes the session and redirects unauthenticated users to `/login`.
- **`/api/*` is excluded from that middleware** — each route performs its own check.
- Missing Supabase URL/key **fails closed**: protected pages redirect to `/login`; they never open the dashboard implicitly.
- For deliberate local UI work without Supabase, set in `.env.local`:

```bash
POLYAGENT_ALLOW_INSECURE_AUTH_BYPASS=1
```

Never enable the bypass in deployed environments (ignored / rejected when `NODE_ENV=production`).

Server auth uses `supabase.auth.getClaims()` — do not trust `getSession()` in server code.

## API surface

All handlers are `force-dynamic`. Sensitive routes require an authenticated Supabase user (`currentUserId()` → `401` / empty as noted).

| Method | Path | Auth | Body / notes |
| --- | --- | --- | --- |
| `GET` | `/api/sessions` | soft | Lists RLS-scoped sessions; live-polls each vendor; unauthenticated → `{ sessions: [] }` |
| `GET` | `/api/sessions/:id` | RLS | Detail + live status + conversation; `404` if not found / not owned |
| `POST` | `/api/sessions/:id/followup` | RLS | `{ message }` — `400` if empty; vendor errors → `502` |
| `POST` | `/api/dispatch` | required | `{ vendor, prompt, repo?, model? }` — Jules requires `repo`; vendor errors → `502` |
| `POST` | `/api/import` | required | One-shot import of CLI `~/.polyagent/state.json` into the user’s Supabase rows (local convenience; no-op on Vercel) |
| `GET` | `/api/jules/sources` | **required** | Jules-connected GitHub repos for the dispatch picker; soft-fails to `{ sources: [] }` on vendor errors |

### Jules sources constraint

Jules can only target repos registered as Jules sources (GitHub App installed **and** repo selected in Jules). Resolution happens in the Jules port (`resolveGithubSource`): unmatched `owner/repo` throws with the list of available sources. The web picker loads `/api/jules/sources` so users select a valid repo; unauthenticated callers get `401`.

### Import path

`POST /api/import` reads the CLI state file via `StateStore(STATE_PATH)`, maps rows with `toDbRow`, and **bulk upserts** (`upsertSessions`) to avoid N+1 inserts. Large state files may still hit payload limits (see TODO in route).

### Core bridge (`lib/core.ts`)

Server-only re-exports from vendored `web/_core` (compiled CLI core). After changing `src/`:

```bash
# repo root
npm run build
cd web && npm run sync-core
```

Never import `@/lib/core` from client components — it pulls vendor SDKs and reads API keys.

## End-to-end tests

Install Chromium once, then run the dashboard suite:

```bash
npx playwright install chromium
npm run test:e2e
```

Playwright starts Next on `127.0.0.1:3100` with the explicit local auth bypass. The suite clears public Supabase settings and mocks dashboard API responses, so it does not use Supabase, OAuth, or vendor credentials.

Useful variants:

```bash
npm run test:e2e -- --headed
npm run test:e2e -- --ui
```

Other checks:

```bash
npm run lint
npm run build
```

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| Redirect loop / always on `/login` | Missing Supabase env, or no session cookie |
| Dashboard empty after CLI dispatch | Web uses Supabase, not the JSON file — run **Import** (or `POST /api/import`) while logged in locally |
| Jules dispatch: “no source for …” | Repo not connected in Jules; check `/api/jules/sources` |
| `/api/jules/sources` → `401` | Expected when logged out (auth was added deliberately) |
| Web behaves unlike latest `src/` | Forgot `npm run build` + `npm run sync-core` |
| Analytics silent locally | Expected — PostHog only tracks production hosts `polyagent.pro` / `www.polyagent.pro` |
