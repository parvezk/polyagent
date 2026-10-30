"use client";

import { QueueCard } from "@/components/queue-card";
import { QUEUE_GROUPS, type QueueGroup, type QueueItem } from "@/lib/queue";

const COLUMN_TONE: Record<QueueGroup, { top: string; dot: string; title: string }> = {
  waiting: { top: "border-t-amber-400", dot: "bg-amber-400", title: "text-amber-300" },
  review: { top: "border-t-emerald-400", dot: "bg-emerald-400", title: "text-zinc-300" },
  running: { top: "border-t-blue-400", dot: "bg-blue-400 animate-pulse", title: "text-zinc-300" },
  failed: { top: "border-t-red-400", dot: "bg-red-400", title: "text-zinc-300" },
};

interface QueueBoardProps {
  grouped: Record<QueueGroup, QueueItem[]>;
  onDismiss: (id: string) => Promise<void> | void;
  onReplied: () => void;
}

// Board view: one column per group, left to right in queue order.
export function QueueBoard({ grouped, onDismiss, onReplied }: QueueBoardProps) {
  return (
    <div className="grid grid-cols-1 items-start gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
      {QUEUE_GROUPS.map((g) => {
        const list = grouped[g.key];
        const tone = COLUMN_TONE[g.key];
        const headingId = `queue-column-${g.key}`;
        return (
          <section
            key={g.key}
            aria-labelledby={headingId}
            data-testid={headingId}
            className={`flex min-w-0 flex-col gap-2 rounded-xl border border-t-2 border-zinc-800/80 bg-zinc-950/60 p-2.5 ${tone.top}`}
          >
            <h2
              id={headingId}
              className="flex items-center gap-2 px-1 pb-1 pt-0.5 text-xs font-semibold uppercase tracking-wider"
            >
              <span className={`size-2 rounded-full ${tone.dot}`} />
              <span className={tone.title}>{g.label}</span>
              <span className="font-mono font-normal text-zinc-500">{list.length}</span>
            </h2>
            {list.length === 0 ? (
              <p className="rounded-lg border border-dashed border-zinc-800 px-2 py-4 text-center text-xs text-zinc-600">
                {g.empty}
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {list.map((item) => (
                  <QueueCard
                    key={item.id}
                    item={item}
                    compact
                    onDismiss={onDismiss}
                    onReplied={onReplied}
                  />
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
