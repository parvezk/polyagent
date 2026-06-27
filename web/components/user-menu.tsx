"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function UserMenu() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getClaims().then(({ data }) => {
      const claims = data?.claims as { email?: string } | undefined;
      setEmail(claims?.email ?? null);
    });
  }, []);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    location.href = "/login";
  }

  if (!email) return null;

  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-xs text-zinc-500">{email}</span>
      <Button
        onClick={signOut}
        variant="outline"
        size="sm"
        className="h-7 border-zinc-700 bg-transparent text-xs text-zinc-300 hover:bg-zinc-900"
      >
        Sign out
      </Button>
    </div>
  );
}
