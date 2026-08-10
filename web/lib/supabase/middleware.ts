import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Refreshes the auth session on every request and gates app routes.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const isAuthRoute = request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/auth");
  const hasSupabaseConfig = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
  const allowInsecureLocalBypass =
    process.env.NODE_ENV !== "production" &&
    process.env.POLYAGENT_ALLOW_INSECURE_AUTH_BYPASS === "1";

  // Local E2E/development access is opt-in and can never bypass auth in production.
  if (allowInsecureLocalBypass) {
    return response;
  }

  // Missing auth configuration must never expose protected pages.
  if (!hasSupabaseConfig) {
    if (isAuthRoute) return response;

    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
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
  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return response;
}
