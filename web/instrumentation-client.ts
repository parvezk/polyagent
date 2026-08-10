import posthog from "posthog-js";
import { shouldTrackAnalytics } from "@/lib/posthog";

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

if (shouldTrackAnalytics() && posthogKey && posthogHost) {
  posthog.init(posthogKey, {
    api_host: posthogHost,
    person_profiles: "identified_only",
    capture_pageview: false,
    capture_pageleave: true,
    defaults: "2026-05-30",
  });
}
