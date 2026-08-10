"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { createClient } from "@/lib/supabase/client";
import { shouldTrackAnalytics } from "@/lib/posthog";

export function PostHogIdentify() {
  useEffect(() => {
    if (!shouldTrackAnalytics()) return;

    const supabase = createClient();
    supabase.auth.getClaims().then(({ data }) => {
      const claims = data?.claims as { sub?: string; email?: string } | undefined;
      if (!claims?.sub) return;

      posthog.identify(claims.sub, {
        email: claims.email,
      });
    });
  }, []);

  return null;
}
