"use client";

import useSWR from "swr";
import { getSessionsRefreshInterval } from "@/lib/session-polling";
import type { SessionView } from "@/lib/view";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function TelemetryStrip() {
  // Same SWR key as the table → deduped, no extra requests. isValidating drives the live dot.
  const { data, isValidating } = useSWR<{ sessions: SessionView[] }>("/api/sessions", fetcher, {
    refreshInterval: getSessionsRefreshInterval,
  });
  const sessions = data?.sessions ?? [];
  const count = (s: string) => sessions.filter((x) => x.status === s).length;

  return (
    <div className="flex items-center gap-3 font-mono text-sm">
      <span className="text-ink-muted" aria-live="polite">
        {isValidating ? "updating…" : "live"}
      </span>
      <span className="text-rule-strong">·</span>
      <span className="text-running">
        <span className="font-semibold">{count("running")}</span> running
      </span>
      <span className={count("needs_review") > 0 ? "bg-highlight px-1 text-on-highlight" : "text-ink-muted"}>
        <span className="font-semibold">{count("needs_review")}</span> needs review
      </span>
      <span className="text-tick">
        <span className="font-semibold">{count("completed")}</span> completed
      </span>
    </div>
  );
}
