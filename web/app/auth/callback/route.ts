import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Only allow same-origin relative paths after OAuth — never trust `next` blindly. */
export function safePostAuthRedirect(origin: string, next: string | null): string {
  const fallback = `${origin}/`;
  if (!next) return fallback;

  // Absolute / protocol-relative / userinfo (@host) must not be string-concatenated.
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return fallback;
  }

  try {
    const resolved = new URL(next, origin);
    if (resolved.origin !== new URL(origin).origin) {
      return fallback;
    }
    return resolved.href;
  } catch {
    return fallback;
  }
}

// OAuth callback — exchanges the code for a session, then returns to the dashboard.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(safePostAuthRedirect(origin, next));
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
