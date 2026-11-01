"use client";

import { useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { VendorMark } from "@/components/vendor-icon";
import type { QueueItem } from "@/lib/queue";
import { relativeTime } from "@/lib/view";

export function queueTaskLabel(item: Pick<QueueItem, "label" | "firstMessage">): string {
  const label = item.label?.trim();
  if (label) return label;
  const firstLine = item.firstMessage
    ?.split("\n")
    .map((l) => l.trim())
    .find(Boolean);
  return firstLine || "Untitled task";
}

interface QueueCardProps {
  item: QueueItem;
  onDismiss: (id: string) => Promise<void> | void;
  onReplied: () => void;
  // Board columns are narrow: stack the actions under the message.
  compact?: boolean;
  // Opens the full session panel (board cards).
  onSeeMore?: (item: QueueItem) => void;
}

export function QueueCard({
  item,
  onDismiss,
  onReplied,
  compact = false,
  onSeeMore,
}: QueueCardProps) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const replyId = useId();

  const waiting = item.group === "waiting";
  const task = queueTaskLabel(item);

  async function sendReply() {
    const message = draft.trim();
    if (!message || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/sessions/${encodeURIComponent(item.id)}/followup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error ?? "Reply failed");
      toast.success("Reply sent");
      setDraft("");
      setReplyOpen(false);
      onReplied();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reply failed");
    } finally {
      setSending(false);
    }
  }

  return (
    <li
      className={`rounded-[4px] border bg-paper-raised transition-colors ${
        waiting ? "border-ink" : "border-rule-strong"
      }`}
    >
      <div className={compact ? "flex flex-col gap-2.5 p-3" : "flex items-start gap-4 px-4 py-3"}>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2 text-xs text-ink-muted">
            <VendorMark vendor={item.vendor} />
            {waiting && (
              <span className="bg-highlight px-1.5 py-0.5 font-mono text-xs font-medium text-on-highlight">
                <span aria-hidden>! </span>needs you
              </span>
            )}
            {item.repo && !compact && (
              <span className="truncate font-mono text-ink-muted">{item.repo}</span>
            )}
            <span
              className={`ml-auto whitespace-nowrap font-mono text-ink-muted tabular-nums`}
            >
              {relativeTime(item.lastUpdate)}
            </span>
          </div>
          {item.repo && compact && (
            <div className="truncate font-mono text-xs text-ink-muted">{item.repo}</div>
          )}
          <p
            className={`${compact ? "line-clamp-2" : "truncate"} text-[15px] font-semibold leading-[21px] text-ink`}
            title={task}
          >
            {task}
          </p>
          {item.lastAgentMessage && (
            <p
              className={`${compact ? "line-clamp-1 text-xs" : "line-clamp-2 text-sm"} leading-relaxed ${
                waiting ? "text-ink" : "text-ink-muted"
              }`}
            >
              {item.lastAgentMessage}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5 pt-0.5">
          {(!compact || waiting) && (
            <Button
              size="sm"
              variant={waiting ? "default" : "outline"}
              aria-expanded={replyOpen}
              aria-controls={replyId}
              onClick={() => setReplyOpen((v) => !v)}
              className={
                waiting
                  ? "bg-ink text-on-ink hover:bg-ink/85"
                  : "border-rule-strong bg-transparent text-ink hover:bg-paper-sunk"
              }
            >
              Reply
            </Button>
          )}
          {compact && onSeeMore && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onSeeMore(item)}
              aria-label={`See more about ${task}`}
              className="border-rule-strong bg-transparent text-ink hover:bg-paper-sunk"
            >
              See more
            </Button>
          )}
          {item.outputUrl && !compact && (
            <a
              href={item.outputUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-7 items-center rounded-[2px] border border-rule-strong px-2.5 text-[0.8rem] font-semibold text-ink transition-colors hover:bg-paper-sunk"
            >
              Open
            </a>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDismiss(item.id)}
            className="text-ink-muted hover:bg-paper-sunk hover:text-ink"
          >
            Dismiss
          </Button>
        </div>
      </div>

      {replyOpen && (
        <div id={replyId} className="border-t border-rule px-4 py-3">
          <Textarea
            autoFocus
            value={draft}
            disabled={sending}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                void sendReply();
              } else if (e.key === "Escape") {
                setReplyOpen(false);
              }
            }}
            placeholder="Write a reply"
            aria-label={`Reply to ${task}`}
            className="min-h-14 border-rule-strong bg-paper-raised text-sm"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-ink-muted">
              Enter to send. Shift+Enter for a new line.
            </span>
            <div className="flex gap-1.5">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setReplyOpen(false)}
                className="text-ink-muted hover:bg-paper-sunk hover:text-ink"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => void sendReply()}
                disabled={sending || !draft.trim()}
                className="bg-ink text-on-ink hover:bg-ink/85"
              >
                {sending ? "Sending…" : "Send"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </li>
  );
}
