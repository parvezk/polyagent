"use client";

import useSWR from "swr";
import { StatusBadge } from "@/components/status-badge";
import { VendorIcon, VENDOR_META } from "@/components/vendor-icon";
import { relativeTime, type SessionView } from "@/lib/view";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function SessionTable({ onSelect }: { onSelect: (s: SessionView) => void }) {
  const { data, isLoading } = useSWR<{ sessions: SessionView[] }>("/api/sessions", fetcher, {
    refreshInterval: 3000,
  });

  const sessions = data?.sessions ?? [];

  if (isLoading && sessions.length === 0) {
    return <div className="py-16 text-center text-sm text-zinc-500">Loading sessions…</div>;
  }

  if (sessions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-800 py-16 text-center">
        <p className="text-sm text-zinc-400">No agents dispatched yet.</p>
        <p className="mt-1 text-xs text-zinc-600">Hit “New Agent” to dispatch your first one.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/50">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-left text-xs uppercase tracking-wider text-zinc-500">
            <th className="px-4 py-3 font-medium">#</th>
            <th className="px-4 py-3 font-medium">Vendor</th>
            <th className="px-4 py-3 font-medium">Task</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Updated</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((s, i) => {
            const label = VENDOR_META[s.vendor]?.label ?? s.vendor;
            const needsYou = s.status === "needs_review";
            return (
              <tr
                key={s.id}
                onClick={() => onSelect(s)}
                className={`cursor-pointer border-b border-zinc-900 transition-colors hover:bg-zinc-900/60 ${
                  needsYou ? "bg-amber-400/[0.07] shadow-[inset_3px_0_0_0_rgb(251,191,36)]" : ""
                }`}
              >
                <td className="px-4 py-2.5 font-mono text-xs text-zinc-600">{i + 1}</td>
                <td className="px-4 py-2.5">
                  <span className="flex items-center gap-2 font-medium text-zinc-200">
                    <VendorIcon vendor={s.vendor} className="size-4 shrink-0" />
                    {label}
                  </span>
                </td>
                <td className="max-w-md px-4 py-2.5">
                  <div className="truncate text-zinc-200">{s.label}</div>
                  <div className="truncate font-mono text-[11px] text-zinc-600">
                    {s.id.length > 32 ? s.id.slice(0, 32) + "…" : s.id}
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <StatusBadge status={s.status} />
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-zinc-500">
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
