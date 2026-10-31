"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { Button } from "@/components/ui/button";

export function UserMenu() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!hasSupabaseConfig()) return;

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
      <span className="font-mono text-xs text-ink-muted">{email}</span>
      <Button
        onClick={signOut}
        variant="outline"
        size="sm"
        className="h-7 border-rule-strong bg-transparent text-xs text-ink hover:bg-paper-sunk"
      >
        Sign out
      </Button>
    </div>
  );
}
