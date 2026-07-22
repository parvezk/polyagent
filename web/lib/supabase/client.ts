import { createBrowserClient } from "@supabase/ssr";

// Whether Supabase auth is configured. When it isn't (e.g. local dev with the middleware
// auth bypass), client components must guard on this — createClient() throws without it.
export function isSupabaseConfigured() {
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
