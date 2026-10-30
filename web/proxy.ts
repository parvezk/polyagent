import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Run on all routes except static assets, the API (API does its own auth check),
  // and Speed Insights intake so those requests are not redirected to /login.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|_vercel/speed-insights|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
