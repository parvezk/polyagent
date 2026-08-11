import { createBrowserClient } from "@supabase/ssr";
import { hasSupabaseConfig } from "@/lib/supabase/config";

// Browser Supabase client (Client Components).
export function createClient() {
  if (!hasSupabaseConfig()) {
    throw new Error("Supabase authentication is not configured");
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
