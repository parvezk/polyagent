// Client-safe view types + styling (no server/core imports — safe in client components).

// "sleep" is a long-running agent parked until its next wake (styled; vendors do not report it yet).
export type SessionStatus = "running" | "needs_review" | "sleep" | "completed" | "failed" | "unknown";

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

// Status marks (design system: StatusMark). Every status shows a glyph and a word.
// needs_review is a square highlighter band and running a filled pill; the rest are text.
export const STATUS_STYLE: Record<SessionStatus, { glyph: string; className: string; label: string }> = {
  needs_review: { glyph: "!", className: "bg-highlight px-1.5 py-0.5 text-on-highlight", label: "needs review" },
  running: { glyph: "○", className: "rounded-full bg-running-fill px-2 py-0.5 text-on-running", label: "running" },
  sleep: { glyph: "☾", className: "border border-dashed border-sleep px-1.5 py-px text-sleep", label: "sleep" },
  completed: { glyph: "✓", className: "text-tick", label: "completed" },
  failed: { glyph: "✕", className: "text-failed", label: "failed" },
  unknown: { glyph: "–", className: "text-ink-muted", label: "unknown" },
};

export function relativeTime(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
