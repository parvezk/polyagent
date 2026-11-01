"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { toast } from "sonner";
import { ChevronRight, Columns3, LayoutList, RotateCw } from "lucide-react";
import { QueueBoard } from "@/components/queue-board";
import { QueueCard } from "@/components/queue-card";
import { SessionDrawer } from "@/components/session-drawer";
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
  type QueueItem,
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

// Per-group mark (design system: StatusMark): a glyph by the heading and the count's color.
const GROUP_TONE: Record<QueueGroup, { glyph: string; text: string }> = {
  waiting: { glyph: "!", text: "bg-highlight px-1 text-on-highlight" },
  review: { glyph: "✓", text: "text-tick" },
  running: { glyph: "○", text: "text-running" },
  failed: { glyph: "✕", text: "text-failed" },
};

export function QueueView() {
  const { data, error, isLoading, mutate } = useSWR<QueueResponse>(QUEUE_KEY, fetcher, {
    refreshInterval: REFRESH_MS,
  });
  const [refreshing, setRefreshing] = useState(false);

  const [prefs, setPrefs] = useQueuePrefs();
  const [selected, setSelected] = useState<QueueItem | null>(null);

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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-[32px] font-bold leading-9 tracking-[-0.01em]">Queue</h1>
          <p className="text-[15px] text-ink-muted">Every agent run, sorted by what needs you.</p>
          {data && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-0.5 font-mono text-sm">
              {QUEUE_GROUPS.map((g) => (
                <span
                  key={g.key}
                  className={counts[g.key] > 0 ? GROUP_TONE[g.key].text : "text-ink-muted"}
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
            className="border-rule-strong bg-transparent text-ink hover:bg-paper-sunk"
          >
            <RotateCw className={refreshing ? "animate-spin" : ""} aria-hidden />
            {refreshing ? "Refreshing" : "Refresh"}
          </Button>
        </div>
      </div>

      {!data && isLoading ? (
        <div className="py-16 text-sm text-ink-muted">Loading queue…</div>
      ) : !data && error ? (
        <div className="border-y border-rule py-16">
          <p className="text-sm font-semibold text-failed">✕ Could not load the queue.</p>
          <p className="mt-1 text-sm text-ink-muted">
            {error instanceof Error ? error.message : "Try again in a moment."}
          </p>
        </div>
      ) : items.length === 0 ? (
        <div className="border-y border-rule py-16">
          <p className="text-sm font-semibold text-ink">No agent runs yet.</p>
          <p className="mt-1 text-sm text-ink-muted">
            Start an agent from{" "}
            <Link
              href="/"
              className="text-tick underline underline-offset-4"
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
            <QueueBoard
              grouped={grouped}
              onDismiss={dismiss}
              onReplied={() => void mutate()}
              onSeeMore={setSelected}
            />
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
                      className="flex items-center gap-2 border-b border-ink pb-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-ink-muted"
                    >
                      {list.length > 0 && (
                        <button
                          type="button"
                          onClick={() => toggleGroup(g.key)}
                          aria-expanded={open}
                          aria-controls={listId}
                          aria-label={`${open ? "Collapse" : "Expand"} ${g.label}`}
                          className="-ml-1 rounded-[2px] p-0.5 text-ink-muted hover:text-ink"
                        >
                          <ChevronRight
                            aria-hidden
                            className={`size-3.5 transition-transform ${open ? "rotate-90" : ""}`}
                          />
                        </button>
                      )}
                      <span
                        className={`inline-flex items-center gap-1 ${
                          list.length > 0 ? GROUP_TONE[g.key].text : ""
                        }`}
                      >
                        <span aria-hidden className="font-mono">
                          {GROUP_TONE[g.key].glyph}
                        </span>
                        {g.label}
                      </span>
                      <span className="font-mono text-ink-muted">{counts[g.key]}</span>
                      {list.length === 0 && (
                        <span className="font-sans text-xs font-normal normal-case tracking-normal text-ink-muted">
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
      <SessionDrawer
        key={selected?.id ?? "closed"}
        session={selected}
        onClose={() => setSelected(null)}
      />
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
    <div role="group" aria-label="View" className="flex rounded-[2px] border border-rule-strong p-0.5">
      {options.map(({ key, label, Icon }) => (
        <button
          key={key}
          type="button"
          aria-pressed={value === key}
          onClick={() => onChange(key)}
          className={`inline-flex h-7 items-center gap-1.5 rounded-[2px] px-2.5 text-[0.8rem] font-semibold transition-colors ${
            value === key ? "bg-ink text-on-ink" : "text-ink-muted hover:text-ink"
          }`}
        >
          <Icon aria-hidden className="size-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}
