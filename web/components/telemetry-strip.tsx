"use client";

import useSWR from "swr";
import type { SessionView } from "@/lib/view";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function TelemetryStrip() {
  // Same SWR key as the table → deduped, no extra requests. isValidating drives the live dot.
  const { data, isValidating } = useSWR<{ sessions: SessionView[] }>("/api/sessions", fetcher, {
    refreshInterval: 3000,
  });
  const sessions = data?.sessions ?? [];
  const count = (s: string) => sessions.filter((x) => x.status === s).length;

  return (
    <div className="flex items-center gap-4 font-mono text-xs text-zinc-500">
      <span className="flex items-center gap-1.5">
        <span
          className={`size-2 rounded-full bg-[#D97757] ${isValidating ? "animate-ping" : "animate-pulse"}`}
        />
        live
      </span>
      <span className="text-zinc-700">·</span>
      <span className="text-blue-300">{count("running")} running</span>
      <span className="text-amber-300">{count("needs_review")} needs review</span>
      <span className="text-emerald-300">{count("completed")} completed</span>
    </div>
  );
}
