/** Production analytics only on polyagent.pro (not local dev or preview URLs). */
export function shouldTrackAnalytics(): boolean {
  if (process.env.NODE_ENV !== "production") return false;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return false;
  if (!process.env.NEXT_PUBLIC_POSTHOG_HOST) return false;
  if (typeof window !== "undefined" && window.location.hostname !== "polyagent.pro") {
    return false;
  }
  return true;
}
