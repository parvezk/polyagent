"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/status-badge";
import { VendorIcon, VENDOR_META } from "@/components/vendor-icon";
import { type SessionView } from "@/lib/view";

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
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  // Optimistically-shown follow-ups (server output may not echo them back).
  const [sent, setSent] = useState<string[]>([]);
  const [prevSessionId, setPrevSessionId] = useState<string | undefined>(undefined);

  // Reset optimistic messages when switching sessions (during render phase to prevent cascading renders).
  if (session?.id !== prevSessionId) {
    setPrevSessionId(session?.id);
    setSent([]);
    setMessage("");
  }

  const { data } = useSWR<DetailResponse>(
    session ? `/api/sessions/${session.id}` : null,
    fetcher,
    { refreshInterval: 4000 },
  );

  async function sendFollowup() {
    if (!session) return;
    setSending(true);
    try {
      const res = await fetch(`/api/sessions/${session.id}/followup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Follow-up failed");
      toast.success("Follow-up sent");
      setSent((prev) => [...prev, message]); // optimistic — show it immediately
      setMessage("");
      mutate(`/api/sessions/${session.id}`);
      mutate("/api/sessions");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Follow-up failed");
    } finally {
      setSending(false);
    }
  }

  const messages = data?.messages ?? [];

  return (
    <Sheet open={!!session} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex w-full flex-col border-l-2 border-l-[#D97757]/40 bg-zinc-950 text-zinc-100 sm:max-w-xl">
        {session && (
          <>
            <SheetHeader className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
                  <VendorIcon vendor={session.vendor} className="size-4" />
                  {VENDOR_META[session.vendor]?.label ?? session.vendor}
                </span>
                <StatusBadge status={session.status} />
              </div>
              <SheetTitle className="text-left text-base font-normal text-zinc-200">
                {session.label}
              </SheetTitle>
              <p className="font-mono text-[11px] text-zinc-600">{session.id}</p>
            </SheetHeader>

            <div className="flex-1 space-y-3 overflow-y-auto px-1 py-4">
              {data?.firstMessage && (
                <Message role="agent" content={data.firstMessage} />
              )}
              {messages.map((m, i) => (
                <Message key={i} role={m.role} content={m.content} />
              ))}
              {sent.map((m, i) => (
                <Message key={`sent-${i}`} role="human" content={m} />
              ))}
              {!data?.firstMessage && messages.length === 0 && sent.length === 0 && (
                <p className="py-8 text-center text-xs text-zinc-600">
                  No output yet — the agent is working.
                </p>
              )}
            </div>

            <div className="space-y-2 border-t border-zinc-800 pt-4">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Send a follow-up to steer the agent…"
                className="min-h-20 border-zinc-800 bg-zinc-900"
              />
              <Button
                onClick={sendFollowup}
                disabled={sending || !message.trim()}
                className="w-full bg-[#D97757] text-zinc-950 hover:bg-[#c8694a]"
              >
                {sending ? "Sending…" : "Send follow-up"}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Message({ role, content }: { role: string; content: string }) {
  const isAgent = role === "agent";
  return (
    <div
      className={`rounded-lg border px-3 py-2 text-sm ${
        isAgent
          ? "border-zinc-800 bg-zinc-900/50 text-zinc-200"
          : "border-[#D97757]/40 bg-[#D97757]/10 text-orange-100"
      }`}
    >
      <div className="mb-1 text-[10px] uppercase tracking-wider text-zinc-500">
        {isAgent ? "agent" : "you"}
      </div>
      <div className="whitespace-pre-wrap">{content}</div>
    </div>
  );
}
