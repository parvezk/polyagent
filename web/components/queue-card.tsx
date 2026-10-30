"use client";

import { useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { VendorIcon, VENDOR_META } from "@/components/vendor-icon";
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
  const vendorLabel = VENDOR_META[item.vendor]?.label ?? item.vendor;
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
      className={`rounded-lg border transition-colors ${
        waiting
          ? "border-amber-400/25 bg-amber-400/[0.06] shadow-[inset_3px_0_0_0_rgb(251,191,36)]"
          : "border-zinc-800 bg-zinc-900/30 hover:border-zinc-700"
      }`}
    >
      <div className={compact ? "flex flex-col gap-2.5 p-3" : "flex items-start gap-4 px-4 py-3"}>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <VendorIcon vendor={item.vendor} className="size-3.5 shrink-0" />
            <span className="font-medium text-zinc-300">{vendorLabel}</span>
            {item.repo && !compact && (
              <>
                <span className="text-zinc-700">·</span>
                <span className="truncate font-mono text-zinc-500">{item.repo}</span>
              </>
            )}
            {!compact && <span className="text-zinc-700">·</span>}
            <span
              className={`whitespace-nowrap font-mono text-zinc-500 ${compact ? "ml-auto" : ""}`}
            >
              {relativeTime(item.lastUpdate)}
            </span>
          </div>
          {item.repo && compact && (
            <div className="truncate font-mono text-[11px] text-zinc-500">{item.repo}</div>
          )}
          <p
            className={`${compact ? "line-clamp-2" : "truncate"} text-sm font-medium text-zinc-100`}
            title={task}
          >
            {task}
          </p>
          {item.lastAgentMessage && (
            <p
              className={`${compact ? "line-clamp-1 text-xs" : "line-clamp-2 text-sm"} leading-relaxed ${
                waiting ? "text-zinc-300" : "text-zinc-500"
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
                  ? "bg-[#D97757] text-zinc-950 hover:bg-[#D97757]/85"
                  : "border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800"
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
              className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800"
            >
              See more
            </Button>
          )}
          {item.outputUrl && !compact && (
            <a
              href={item.outputUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-7 items-center rounded-[min(var(--radius-md),12px)] border border-zinc-700 px-2.5 text-[0.8rem] font-medium text-zinc-300 outline-none transition-colors hover:bg-zinc-800 focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              Open
            </a>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDismiss(item.id)}
            className="text-zinc-500 hover:text-zinc-200"
          >
            Dismiss
          </Button>
        </div>
      </div>

      {replyOpen && (
        <div id={replyId} className="border-t border-zinc-800/80 px-4 py-3">
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
            className="min-h-14 border-zinc-800 bg-zinc-950 text-sm"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-zinc-600">
              Enter to send. Shift+Enter for a new line.
            </span>
            <div className="flex gap-1.5">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setReplyOpen(false)}
                className="text-zinc-500 hover:text-zinc-200"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => void sendReply()}
                disabled={sending || !draft.trim()}
                className="bg-[#D97757] text-zinc-950 hover:bg-[#D97757]/85"
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
