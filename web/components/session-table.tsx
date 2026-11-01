"use client";

import useSWR from "swr";
import { StatusBadge } from "@/components/status-badge";
import { VendorMark } from "@/components/vendor-icon";
import { getSessionsRefreshInterval } from "@/lib/session-polling";
import { relativeTime, type SessionView } from "@/lib/view";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function SessionTable({ onSelect }: { onSelect: (s: SessionView) => void }) {
  const { data, isLoading } = useSWR<{ sessions: SessionView[] }>("/api/sessions", fetcher, {
    refreshInterval: getSessionsRefreshInterval,
  });

  const sessions = data?.sessions ?? [];

  if (isLoading && sessions.length === 0) {
    return <div className="py-16 text-sm text-ink-muted">Loading sessions…</div>;
  }

  if (sessions.length === 0) {
    return (
      <div className="border-y border-rule py-16">
        <p className="text-sm font-semibold text-ink">No agents dispatched yet.</p>
        <p className="mt-1 text-sm text-ink-muted">Choose “New agent” to dispatch your first one.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-ink text-left text-xs uppercase tracking-[0.06em] text-ink-muted">
            <th className="py-2 pr-3 font-semibold">#</th>
            <th className="py-2 pr-3 font-semibold">Vendor</th>
            <th className="py-2 pr-3 font-semibold">Task</th>
            <th className="py-2 pr-3 font-semibold">Status</th>
            <th className="py-2 font-semibold">Updated</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((s, i) => {
            const needsYou = s.status === "needs_review";
            return (
              <tr
                key={s.id}
                onClick={() => onSelect(s)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(s);
                  }
                }}
                tabIndex={0}
                className={`cursor-pointer border-b border-rule transition-colors hover:bg-paper-sunk focus-visible:bg-paper-sunk focus-visible:outline-2 focus-visible:-outline-offset-2 ${
                  needsYou ? "shadow-[inset_4px_0_0_0_var(--highlight)]" : ""
                }`}
              >
                <td className={`py-3 pr-3 font-mono text-xs text-ink-muted tabular-nums ${needsYou ? "pl-3" : ""}`}>{i + 1}</td>
                <td className="py-3 pr-3">
                  <VendorMark vendor={s.vendor} />
                </td>
                <td className="max-w-md py-3 pr-3">
                  <div className="truncate font-semibold text-ink">{s.label}</div>
                  <div className="truncate font-mono text-xs text-ink-muted">
                    {s.id.length > 32 ? s.id.slice(0, 32) + "…" : s.id}
                  </div>
                </td>
                <td className="py-3 pr-3">
                  <StatusBadge status={s.status} />
                </td>
                <td className="whitespace-nowrap py-3 font-mono text-xs text-ink-muted tabular-nums">
                  {relativeTime(s.lastUpdate)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
