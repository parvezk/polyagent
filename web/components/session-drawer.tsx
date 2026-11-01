"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/status-badge";
import { VendorMark } from "@/components/vendor-icon";
import { getSessionDetailRefreshInterval } from "@/lib/session-polling";
import { type SessionView } from "@/lib/view";
import { getDraftAfterFailedFollowup } from "./session-drawer-followup";
import { shouldRenderFirstMessage } from "./session-drawer-messages";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface DetailResponse {
  session: SessionView;
  summary?: string;
  firstMessage?: string;
  messages: { role: string; content: string; timestamp: string }[];
}

export function SessionDrawer({
  session,
  onClose,
}: {
  session: SessionView | null;
  onClose: () => void;
}) {
  return (
    <Sheet open={!!session} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex w-full flex-col border-l border-l-ink bg-paper-raised text-ink sm:max-w-xl">
        {session && <SessionDrawerContent key={session.id} session={session} />}
      </SheetContent>
    </Sheet>
  );
}

function SessionDrawerContent({ session }: { session: SessionView }) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  // Optimistically-shown follow-ups (server output may not echo them back).
  const [sent, setSent] = useState<string[]>([]);
  const { data } = useSWR<DetailResponse>(
    `/api/sessions/${session.id}`,
    fetcher,
    {
      refreshInterval: (currentData) =>
        getSessionDetailRefreshInterval({
          initialStatus: session?.status,
          refreshedStatus: currentData?.session?.status,
        }),
    },
  );

  async function sendFollowup() {
    const submittedMessage = message;
    setMessage("");
    setSending(true);
    try {
      const res = await fetch(`/api/sessions/${session.id}/followup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: submittedMessage }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Follow-up failed");
      toast.success("Follow-up sent");
      setSent((prev) => [...prev, submittedMessage]);
      mutate(`/api/sessions/${session.id}`);
      mutate("/api/sessions");
    } catch (err) {
      setMessage((currentDraft) => getDraftAfterFailedFollowup(currentDraft, submittedMessage));
      toast.error(err instanceof Error ? err.message : "Follow-up failed");
    } finally {
      setSending(false);
    }
  }

  const currentSession = data?.session ?? session;
  const messages = data?.messages ?? [];
  const showFirstMessage = shouldRenderFirstMessage(data?.firstMessage, messages);

  return (
    <>
      <SheetHeader className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="text-sm">
            <VendorMark vendor={currentSession.vendor} label />
          </span>
          <StatusBadge status={currentSession.status} />
        </div>
        <SheetTitle className="text-left text-xl font-bold leading-[26px] text-ink">
          {currentSession.label}
        </SheetTitle>
        <div className="flex items-center gap-3">
          <p className="truncate font-mono text-xs text-ink-muted">{currentSession.id}</p>
          {currentSession.outputUrl && (
            <a
              href={currentSession.outputUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto shrink-0 text-xs font-semibold text-tick underline underline-offset-4"
            >
              Open link ↗
            </a>
          )}
        </div>
      </SheetHeader>

      <div className="flex-1 space-y-3 overflow-y-auto px-1 py-4">
        {showFirstMessage && data?.firstMessage && (
          <Message role="agent" content={data.firstMessage} />
        )}
        {messages.map((m, i) => (
          <Message key={i} role={m.role} content={m.content} />
        ))}
        {sent.map((m, i) => (
          <Message key={`sent-${i}`} role="human" content={m} />
        ))}
        {!showFirstMessage && messages.length === 0 && sent.length === 0 && (
          <p className="py-8 text-sm text-ink-muted">
            No output yet — the agent is working.
          </p>
        )}
      </div>

      <div className="space-y-2 border-t border-rule pt-4">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (!sending && message.trim()) {
                sendFollowup();
              }
            }
          }}
          placeholder="Send a follow-up to steer the agent… (Press Enter to send)"
          aria-label="Follow-up message"
          className="min-h-20 border-rule-strong bg-paper-raised"
        />
        <Button
          onClick={sendFollowup}
          disabled={sending || !message.trim()}
          className="w-full bg-ink text-on-ink hover:bg-ink/85"
        >
          {sending ? "Sending…" : "Send follow-up"}
        </Button>
      </div>
    </>
  );
}

function Message({ role, content }: { role: string; content: string }) {
  const isAgent = role === "agent";
  return (
    <div
      className={`border-l-2 py-1 pl-3 text-sm leading-[21px] ${
        isAgent ? "border-rule-strong text-ink" : "border-tick bg-paper-sunk text-ink"
      }`}
    >
      <div className="mb-1 text-xs font-semibold uppercase tracking-[0.06em] text-ink-muted">
        {isAgent ? "agent" : "you"}
      </div>
      <div className="whitespace-pre-wrap">{content}</div>
    </div>
  );
}
