"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { toast } from "sonner";
import { ChevronRight, Columns3, LayoutList, RotateCw } from "lucide-react";
import { QueueBoard } from "@/components/queue-board";
import { QueueCard } from "@/components/queue-card";
import { useQueuePrefs, type QueueLayout } from "@/components/queue-prefs";
import { QueueToolbar } from "@/components/queue-toolbar";
import { Button } from "@/components/ui/button";
import {
  QUEUE_GROUPS,
  countQueue,
  filterQueue,
  groupQueue,
  vendorCounts,
  type QueueGroup,
  type QueueResponse,
} from "@/lib/queue";

const QUEUE_KEY = "/api/queue";
const REFRESH_MS = 15000;

async function fetcher(url: string): Promise<QueueResponse> {
  const res = await fetch(url);
  const d = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(d.error ?? "Could not load the queue");
  return d as QueueResponse;
}

// Per-group color: the dot by the heading and the count in the summary line.
const GROUP_TONE: Record<QueueGroup, { dot: string; text: string }> = {
  waiting: { dot: "bg-amber-400", text: "text-amber-300" },
  review: { dot: "bg-emerald-400", text: "text-emerald-300" },
  running: { dot: "bg-blue-400 animate-pulse", text: "text-blue-300" },
  failed: { dot: "bg-red-400", text: "text-red-300" },
};

export function QueueView() {
  const { data, error, isLoading, mutate } = useSWR<QueueResponse>(QUEUE_KEY, fetcher, {
    refreshInterval: REFRESH_MS,
  });
  const [refreshing, setRefreshing] = useState(false);

  const [prefs, setPrefs] = useQueuePrefs();

  const items = data?.items ?? [];
  const vendors = vendorCounts(items);
  // Ignore a saved vendor that has no runs now, so the queue never looks empty by accident.
  const activeVendors = prefs.vendors.filter((v) => vendors.some((x) => x.vendor === v));
  const visible = filterQueue(items, activeVendors);
  const counts = countQueue(visible);
  const grouped = groupQueue(visible, prefs.sort);

  function toggleGroup(key: QueueGroup) {
    const collapsed = prefs.collapsed.includes(key)
      ? prefs.collapsed.filter((k) => k !== key)
      : [...prefs.collapsed, key];
    setPrefs({ collapsed });
  }

  async function refresh() {
    setRefreshing(true);
    try {
      await mutate();
    } finally {
      setRefreshing(false);
    }
  }

  async function dismiss(id: string) {
    const without = (current?: QueueResponse): QueueResponse => {
      const rest = (current?.items ?? []).filter((i) => i.id !== id);
      return { items: rest, counts: countQueue(rest) };
    };
    try {
      await mutate(
        async (current) => {
          const res = await fetch(`/api/queue/${encodeURIComponent(id)}/dismiss`, {
            method: "POST",
          });
          const d = await res.json().catch(() => ({}));
          if (!res.ok || d.error) throw new Error(d.error ?? "Dismiss failed");
          return without(current);
        },
        { optimisticData: without, rollbackOnError: true, populateCache: true, revalidate: true },
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Dismiss failed");
    }
  }

  const busy = refreshing || (isLoading && !data);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold">Queue</h1>
          <p className="text-sm text-zinc-400">Every agent run, sorted by what needs you.</p>
          {data && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-0.5 font-mono text-sm">
              {QUEUE_GROUPS.map((g) => (
                <span
                  key={g.key}
                  className={counts[g.key] > 0 ? GROUP_TONE[g.key].text : "text-zinc-600"}
                >
                  <span className="font-semibold">{counts[g.key]}</span> {g.label.toLowerCase()}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <LayoutSwitch value={prefs.layout} onChange={(layout) => setPrefs({ layout })} />
          <Button
            onClick={refresh}
            disabled={busy}
            variant="outline"
            size="sm"
            className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-900"
          >
            <RotateCw className={refreshing ? "animate-spin" : ""} aria-hidden />
            {refreshing ? "Refreshing" : "Refresh"}
          </Button>
        </div>
      </div>

      {!data && isLoading ? (
        <div className="py-16 text-center text-sm text-zinc-500">Loading queue…</div>
      ) : !data && error ? (
        <div className="rounded-lg border border-dashed border-zinc-800 py-16 text-center">
          <p className="text-sm text-zinc-400">Could not load the queue.</p>
          <p className="mt-1 text-xs text-zinc-600">
            {error instanceof Error ? error.message : "Try again in a moment."}
          </p>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-800 py-16 text-center">
          <p className="text-sm text-zinc-400">No agent runs yet.</p>
          <p className="mt-1 text-xs text-zinc-600">
            Start an agent from{" "}
            <Link
              href="/"
              className="text-zinc-400 underline underline-offset-4 hover:text-zinc-200"
            >
              Agents
            </Link>
            . It shows up here as it works.
          </p>
        </div>
      ) : (
        <>
          <QueueToolbar
            vendors={vendors}
            selected={activeVendors}
            onVendorsChange={(v) => setPrefs({ vendors: v })}
            sort={prefs.sort}
            onSortChange={(sort) => setPrefs({ sort })}
          />
          {prefs.layout === "board" ? (
            <QueueBoard grouped={grouped} onDismiss={dismiss} onReplied={() => void mutate()} />
          ) : (
            <div className="space-y-6">
              {QUEUE_GROUPS.map((g) => {
                const list = grouped[g.key];
                const headingId = `queue-group-${g.key}`;
                const listId = `${headingId}-list`;
                const open = !prefs.collapsed.includes(g.key);
                return (
                  <section key={g.key} aria-labelledby={headingId} data-testid={headingId}>
                    <h2
                      id={headingId}
                      className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-500"
                    >
                      {list.length > 0 && (
                        <button
                          type="button"
                          onClick={() => toggleGroup(g.key)}
                          aria-expanded={open}
                          aria-controls={listId}
                          aria-label={`${open ? "Collapse" : "Expand"} ${g.label}`}
                          className="-ml-1 rounded p-0.5 text-zinc-500 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
                        >
                          <ChevronRight
                            aria-hidden
                            className={`size-3.5 transition-transform ${open ? "rotate-90" : ""}`}
                          />
                        </button>
                      )}
                      <span
                        className={`size-2 rounded-full ${list.length > 0 ? GROUP_TONE[g.key].dot : "bg-zinc-700"}`}
                      />
                      <span
                        className={list.length > 0 && g.key === "waiting" ? "text-amber-300" : ""}
                      >
                        {g.label}
                      </span>
                      <span className="font-mono text-zinc-600">{counts[g.key]}</span>
                      {list.length === 0 && (
                        <span className="font-sans text-xs normal-case tracking-normal text-zinc-600">
                          · {g.empty}
                        </span>
                      )}
                    </h2>
                    {list.length > 0 && open && (
                      <ul id={listId} className="mt-2.5 space-y-2">
                        {list.map((item) => (
                          <QueueCard
                            key={item.id}
                            item={item}
                            onDismiss={dismiss}
                            onReplied={() => void mutate()}
                          />
                        ))}
                      </ul>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function LayoutSwitch({
  value,
  onChange,
}: {
  value: QueueLayout;
  onChange: (v: QueueLayout) => void;
}) {
  const options: { key: QueueLayout; label: string; Icon: typeof LayoutList }[] = [
    { key: "list", label: "List", Icon: LayoutList },
    { key: "board", label: "Board", Icon: Columns3 },
  ];
  return (
    <div role="group" aria-label="View" className="flex rounded-lg border border-zinc-700 p-0.5">
      {options.map(({ key, label, Icon }) => (
        <button
          key={key}
          type="button"
          aria-pressed={value === key}
          onClick={() => onChange(key)}
          className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[0.8rem] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 ${
            value === key ? "bg-zinc-800 text-zinc-50" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Icon aria-hidden className="size-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}
