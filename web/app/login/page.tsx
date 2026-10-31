"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/wordmark";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const authConfigured = hasSupabaseConfig();

  async function signIn() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-start justify-center gap-6">
      <div className="space-y-3">
        <Wordmark size="xl" />
        <p className="max-w-md text-[15px] leading-[23px] text-ink-muted">
          Vendor-agnostic agent control plane. Sign in to dispatch and track cloud agents across
          vendors.
        </p>
      </div>
      <Button
        onClick={signIn}
        disabled={loading || !authConfigured}
        className="bg-ink text-on-ink hover:bg-ink/85"
      >
        {loading ? "Redirecting…" : "Sign in with GitHub"}
      </Button>
      {!authConfigured && (
        <p className="max-w-md bg-highlight px-2 py-1 text-xs text-on-highlight">
          Authentication is not configured. Add the Supabase environment variables to sign in.
        </p>
      )}
    </div>
  );
}
