import posthog from "posthog-js";
import { shouldTrackAnalytics } from "@/lib/posthog";

if (shouldTrackAnalytics()) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    person_profiles: "identified_only",
    capture_pageview: false,
    capture_pageleave: true,
    defaults: "2026-05-30",
  });
}
