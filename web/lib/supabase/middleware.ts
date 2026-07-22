import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Whether the auth gate may be bypassed when Supabase is not configured.
// Allowed only for local dev convenience — either a non-production build, or an
// explicit opt-in flag. In production the bypass is refused so a deploy that is
// missing its Supabase env vars fails closed instead of silently exposing the app.
function bypassAllowed(): boolean {
  if (process.env.SUPABASE_AUTH_BYPASS === "true") return true;
  return process.env.NODE_ENV !== "production";
}

function isAuthRoute(request: NextRequest): boolean {
  return (
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/auth")
  );
}

function redirectToLogin(request: NextRequest): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  return NextResponse.redirect(url);
}

// Refreshes the auth session on every request and gates app routes.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    // Supabase isn't configured. In dev (or with an explicit opt-in) pass through
    // so the app still runs without an auth gate.
    if (bypassAllowed()) {
      return response;
    }
    // Otherwise fail closed: with no Supabase we can't authenticate anyone, so gate
    // every non-auth route rather than leaving the dashboard wide open.
    console.error(
      "[auth] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are missing — " +
        "failing closed and gating all routes. Set them, or set SUPABASE_AUTH_BYPASS=true to opt out.",
    );
    return isAuthRoute(request) ? response : redirectToLogin(request);
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: use getClaims() — never trust getSession() in server code.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  // Unauthenticated → bounce to /login (except auth routes themselves).
  if (!user && !isAuthRoute(request)) {
    return redirectToLogin(request);
  }

  return response;
}
