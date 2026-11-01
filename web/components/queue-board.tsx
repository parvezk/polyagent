"use client";

import { QueueCard } from "@/components/queue-card";
import { QUEUE_GROUPS, type QueueGroup, type QueueItem } from "@/lib/queue";

// Column heads carry the StatusMark glyph; only "Waiting on you" gets the highlighter.
const COLUMN_TONE: Record<QueueGroup, { glyph: string; title: string }> = {
  waiting: { glyph: "!", title: "bg-highlight px-1 text-on-highlight" },
  review: { glyph: "✓", title: "text-tick" },
  running: { glyph: "○", title: "text-running" },
  failed: { glyph: "✕", title: "text-failed" },
};

interface QueueBoardProps {
  grouped: Record<QueueGroup, QueueItem[]>;
  onDismiss: (id: string) => Promise<void> | void;
  onReplied: () => void;
  onSeeMore: (item: QueueItem) => void;
}

// Board view: one column per group, left to right in queue order.
export function QueueBoard({ grouped, onDismiss, onReplied, onSeeMore }: QueueBoardProps) {
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
            className="flex min-w-0 flex-col gap-2 border-t border-ink pt-2"
          >
            <h2
              id={headingId}
              className="flex items-center gap-2 pb-1 text-xs font-semibold uppercase tracking-[0.06em]"
            >
              <span className={`inline-flex items-center gap-1 ${tone.title}`}>
                <span aria-hidden className="font-mono">{tone.glyph}</span>
                {g.label}
              </span>
              <span className="font-mono font-normal text-ink-muted">{list.length}</span>
            </h2>
            {list.length === 0 ? (
              <p className="border border-dashed border-rule px-2 py-4 text-xs text-ink-muted">
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
                    onSeeMore={onSeeMore}
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
