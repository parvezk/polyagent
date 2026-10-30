// Queue: one list of every agent run, grouped by what needs the human.
// Client-safe (no server/core imports). Shared by /api/queue and the /queue page.

import type { SessionStatus, SessionView } from "@/lib/view";

export type QueueGroup = "waiting" | "review" | "running" | "failed";

// Display order and labels for the groups.
export const QUEUE_GROUPS: { key: QueueGroup; label: string; empty: string }[] = [
  { key: "waiting", label: "Waiting on you", empty: "Nothing is waiting on you." },
  { key: "review", label: "Ready to review", empty: "No finished work to review." },
  { key: "running", label: "Running", empty: "No agents are running." },
  { key: "failed", label: "Failed", empty: "No failed runs." },
];

export interface QueueItem extends SessionView {
  group: QueueGroup;
  needsInput: boolean;
  repo?: string; // owner/repo, when known
  lastAgentMessage?: string; // latest agent message or question
}

export interface QueueResponse {
  items: QueueItem[];
  counts: Record<QueueGroup, number>;
}

export function groupFor(s: { status: SessionStatus; needsInput?: boolean }): QueueGroup {
  if (s.needsInput || s.status === "needs_review") return "waiting";
  if (s.status === "completed") return "review";
  if (s.status === "failed") return "failed";
  return "running"; // running + unknown
}

export function emptyCounts(): Record<QueueGroup, number> {
  return { waiting: 0, review: 0, running: 0, failed: 0 };
}

// Group items in QUEUE_GROUPS order. Within a group, most recently updated first.
export function groupQueue(items: QueueItem[]): Record<QueueGroup, QueueItem[]> {
  const out: Record<QueueGroup, QueueItem[]> = { waiting: [], review: [], running: [], failed: [] };
  for (const item of items) out[item.group].push(item);
  for (const key of Object.keys(out) as QueueGroup[]) {
    out[key].sort((a, b) => Date.parse(b.lastUpdate) - Date.parse(a.lastUpdate));
  }
  return out;
}

export function countQueue(items: QueueItem[]): Record<QueueGroup, number> {
  const counts = emptyCounts();
  for (const item of items) counts[item.group]++;
  return counts;
}

// "https://github.com/owner/repo/pull/12" -> "owner/repo"
export function repoFromUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined;
  const m = url.match(/^https?:\/\/github\.com\/([^/\s]+)\/([^/\s#?]+)/i);
  return m ? `${m[1]}/${m[2].replace(/\.git$/, "")}` : undefined;
}

export function lastAgentMessage(
  messages: { role: string; content: string }[] | undefined,
): string | undefined {
  if (!messages) return undefined;
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role === "agent" && m.content.trim()) return m.content.trim();
  }
  return undefined;
}
