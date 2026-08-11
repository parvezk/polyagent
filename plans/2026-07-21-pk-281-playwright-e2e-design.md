# PK-281 Playwright E2E design

## Goal

Add deterministic browser coverage for the web dashboard without Supabase, OAuth, or vendor credentials, and prevent missing authentication configuration from accidentally exposing protected routes.

## Design

- Add Playwright to `web/` with a `test:e2e` script and a configuration that starts the Next.js development server on a dedicated port.
- Enable dashboard access in that server only through `POLYAGENT_ALLOW_INSECURE_AUTH_BYPASS=1`. The bypass is accepted outside production and ignored in production.
- Rename the deprecated Next.js 16 `middleware.ts` convention to `proxy.ts` while retaining the existing matcher.
- When Supabase configuration is absent and the explicit development bypass is off, allow authentication routes but redirect protected pages to `/login`. Client-side authentication controls must handle the missing configuration without creating a Supabase client.
- Mock dashboard API routes with Playwright request interception. Cover dashboard rendering, opening the new-agent dialog, rendering sessions, opening a session drawer with mocked detail, and displaying a practical API error toast.
- Document local E2E setup, browser installation, and the security boundary of the development bypass.

## Verification

Run ESLint, the production build, and the Chromium Playwright project. Tests must run with no real service credentials in the environment.
