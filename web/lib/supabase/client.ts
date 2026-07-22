import { createBrowserClient } from "@supabase/ssr";

// Whether the public Supabase env vars are present. When they're absent (local dev
// without Supabase configured), the app runs without auth — see lib/supabase/middleware.ts.
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

// Browser Supabase client (Client Components).
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
