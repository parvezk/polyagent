// Client-safe view types + styling (no server/core imports — safe in client components).

export type SessionStatus = "running" | "needs_review" | "completed" | "failed" | "unknown";

export interface SessionView {
  id: string;
  vendor: "claude" | "jules" | "cursor" | "gemini";
  label: string;
  status: SessionStatus;
  dispatchedAt: string;
  lastUpdate: string;
  summary?: string;
  outputUrl?: string;
  firstMessage?: string;
}

// Status → Tailwind classes. needs_review is intentionally the loudest (gold + glow);
// it's the actionable state. running pulses; the rest are calm.
export const STATUS_STYLE: Record<SessionStatus, { dot: string; text: string; label: string }> = {
  running: { dot: "bg-blue-400 animate-pulse", text: "text-blue-300", label: "running" },
  needs_review: { dot: "bg-amber-400", text: "text-amber-300", label: "needs review" },
  completed: { dot: "bg-emerald-400", text: "text-emerald-300", label: "completed" },
  failed: { dot: "bg-red-400", text: "text-red-300", label: "failed" },
  unknown: { dot: "bg-zinc-500", text: "text-zinc-400", label: "unknown" },
};

export function relativeTime(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
