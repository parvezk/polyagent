"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  async function signIn() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 text-center">
      <div className="space-y-2">
        <div className="text-2xl font-semibold">
          <span className="text-[#D97757]">◆</span> PolyAgent
        </div>
        <p className="max-w-sm text-sm text-zinc-500">
          Vendor-agnostic agent control plane. Sign in to dispatch and track cloud agents across
          vendors.
        </p>
      </div>
      <Button
        onClick={signIn}
        disabled={loading}
        className="bg-[#D97757] text-zinc-950 hover:bg-[#c8694a]"
      >
        {loading ? "Redirecting…" : "Sign in with GitHub"}
      </Button>
    </div>
  );
}
