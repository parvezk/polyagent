const PRODUCTION_HOSTS = new Set(["polyagent.pro", "www.polyagent.pro"]);

/** Production analytics only on polyagent.pro hosts (not local dev or preview URLs). */
export function shouldTrackAnalytics(): boolean {
  if (process.env.NODE_ENV !== "production") return false;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return false;
  if (!process.env.NEXT_PUBLIC_POSTHOG_HOST) return false;
  if (typeof window !== "undefined" && !PRODUCTION_HOSTS.has(window.location.hostname)) {
    return false;
  }
  return true;
}
