import { useState, useRef, useEffect, useCallback } from "react";
import useSWR from "swr";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "./status-badge";
import { TelemetryStrip } from "./telemetry-strip";
import type { AgentOutput, SessionStatus } from "@/lib/core";
import {
  SendIcon,
  ExternalLinkIcon,
  CodeIcon,
  BotIcon,
  UserIcon,
  ArrowRightIcon,
} from "lucide-react";

interface DrawerProps {
  session: {
    id: string;
    vendor: string;
    label: string;
    status: SessionStatus;
    summary?: string;
    outputUrl?: string;
  } | null;
  onClose: () => void;
  onFollowupSent: () => void;
}

export function SessionDrawer({ session, onClose, onFollowupSent }: DrawerProps) {
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState<{ role: "human"; content: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Track previous session ID to handle resetting state when it changes
  const prevSessionIdRef = useRef<string | undefined>(undefined);

  // We need to fetch the detailed interaction history (messages).
  const { data, mutate } = useSWR<AgentOutput>(
    session ? `/api/sessions/${session.id}` : null,
    (url) => fetch(url).then((r) => r.json()),
    { refreshInterval: session?.status === "running" ? 3000 : 0 },
  );

  // Instead of an effect, handle the reset during render if the session changed
  // This is the React 18+ recommended way to reset state on prop change
  if (session?.id !== prevSessionIdRef.current) {
    prevSessionIdRef.current = session?.id;
    if (sent.length > 0) {
      setSent([]);
    }
    if (message !== "") {
      setMessage("");
    }
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [data?.messages, sent]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!session || !message.trim()) return;

      const txt = message;
      setMessage("");
      setSent((prev) => [...prev, { role: "human", content: txt }]);

      await fetch(`/api/sessions/${session.id}/followup`, {
        method: "POST",
        body: JSON.stringify({ message: txt }),
      });

      mutate();
      onFollowupSent();
    },
    [session, message, mutate, onFollowupSent],
  );

  if (!session) return null;

  return (
    <Sheet open={!!session} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        className="flex w-full flex-col p-0 sm:max-w-2xl bg-zinc-950 border-l border-zinc-800"
        hideClose
      >
        <div className="flex flex-col border-b border-zinc-800 p-6 pt-10 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-zinc-300 rounded-md hover:bg-zinc-900 transition-colors"
          >
            <ArrowRightIcon className="h-5 w-5" />
            <span className="sr-only">Close panel</span>
          </button>

          <div className="flex items-center gap-3 mb-2 pr-8">
            <StatusBadge status={session.status} />
            <Badge variant="outline" className="text-xs uppercase bg-zinc-900 border-zinc-800">
              {session.vendor}
            </Badge>
            {session.outputUrl && (
              <a
                href={session.outputUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 transition-colors"
              >
                View Output <ExternalLinkIcon className="h-3 w-3" />
              </a>
            )}
          </div>

          <SheetHeader className="text-left space-y-1 pr-8">
            <SheetTitle className="text-xl font-medium tracking-tight truncate leading-tight">
              {session.label || "Untitled Task"}
            </SheetTitle>
            {session.summary && (
              <SheetDescription className="text-sm text-zinc-400 line-clamp-2 leading-relaxed">
                {session.summary}
              </SheetDescription>
            )}
          </SheetHeader>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto bg-zinc-950 p-6 space-y-6">
          {data?.messages?.length === 0 && sent.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-4">
              <div className="h-12 w-12 rounded-full bg-zinc-900 flex items-center justify-center">
                <CodeIcon className="h-6 w-6 opacity-50" />
              </div>
              <p className="text-sm text-center max-w-xs">
                Waiting for the agent to report progress...
              </p>
            </div>
          ) : (
            <>
              {data?.messages?.map((msg, idx) => (
                <div key={idx} className="flex gap-4 group">
                  <div className="flex-shrink-0 mt-1">
                    {msg.role === "agent" ? (
                      <div className="h-8 w-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <BotIcon className="h-4 w-4 text-blue-400" />
                      </div>
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                        <UserIcon className="h-4 w-4 text-zinc-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-zinc-300">
                        {msg.role === "agent" ? "Agent" : "You"}
                      </span>
                      <span className="text-xs text-zinc-600 font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="text-sm text-zinc-400 whitespace-pre-wrap leading-relaxed prose prose-invert max-w-none">
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
              {sent.map((msg, idx) => (
                <div key={`sent-${idx}`} className="flex gap-4 group opacity-70">
                  <div className="flex-shrink-0 mt-1">
                    <div className="h-8 w-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                      <UserIcon className="h-4 w-4 text-zinc-300" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-zinc-300">You</span>
                      <span className="text-xs text-zinc-500">Sending...</span>
                    </div>
                    <div className="text-sm text-zinc-400 whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {session.status === "needs_review" && (
          <div className="border-t border-zinc-800 bg-zinc-950 p-4">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <Textarea
                placeholder="Provide feedback or instructions..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (message.trim()) {
                      const event = new Event("submit", { cancelable: true });
                      e.currentTarget.form?.dispatchEvent(event);
                    }
                  }
                }}
                className="flex-1 min-h-[44px] max-h-[200px] resize-none py-3 bg-zinc-900 border-zinc-800 focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 text-sm"
                rows={1}
              />
              <Button
                type="submit"
                disabled={!message.trim()}
                size="icon"
                className="flex-shrink-0 h-[44px] w-[44px] bg-white text-black hover:bg-zinc-200 transition-colors"
              >
                <SendIcon className="h-4 w-4" />
                <span className="sr-only">Send</span>
              </Button>
            </form>
          </div>
        )}

        <TelemetryStrip id={session.id} vendor={session.vendor} status={session.status} />
      </SheetContent>
    </Sheet>
  );
}
