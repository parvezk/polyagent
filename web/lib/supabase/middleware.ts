import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function isAuthRoute(request: NextRequest) {
  return (
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/auth")
  );
}

// Send everything except the auth routes themselves to /login (avoids a redirect loop).
function redirectToLogin(request: NextRequest, response: NextResponse) {
  if (isAuthRoute(request)) return response;
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  return NextResponse.redirect(url);
}

// Refreshes the auth session on every request and gates app routes.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const hasSupabaseConfig =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!hasSupabaseConfig) {
    // Explicit, opt-in bypass for local development ONLY. This must never fail open in
    // production: a prod deploy with missing Supabase env vars has to lock the dashboard
    // down, not silently expose it. Set AUTH_DEV_BYPASS=true in .env.local to skip the gate
    // while building UI without a Supabase project.
    const devBypass =
      process.env.NODE_ENV !== "production" && process.env.AUTH_DEV_BYPASS === "true";
    if (devBypass) return response;

    // Fail closed: no auth backend configured → nobody gets in.
    return redirectToLogin(request, response);
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
  if (!user) {
    return redirectToLogin(request, response);
  }

  return response;
}
