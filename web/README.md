# PolyAgent web dashboard

## Local development

Install dependencies, copy `.env.example` to `.env.local`, configure Supabase, and start Next.js:

```bash
npm install
npm run dev
```

The dashboard requires an authenticated Supabase session by default. If the Supabase URL or publishable key is absent, protected pages redirect to `/login`; missing configuration never opens the dashboard implicitly.

For deliberate local UI work without authentication, set this server-only development flag in `.env.local`:

```bash
POLYAGENT_ALLOW_INSECURE_AUTH_BYPASS=1
```

The bypass is accepted only outside `NODE_ENV=production`. Do not set it in deployed environments.

## End-to-end tests

Install Chromium once, then run the dashboard suite:

```bash
npx playwright install chromium
npm run test:e2e
```

Playwright starts the Next.js development server on `127.0.0.1:3100` with the explicit local auth bypass. The suite clears the public Supabase settings and mocks dashboard API responses, so it does not use Supabase, OAuth, or Claude/Jules/Cursor/Gemini credentials.

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
