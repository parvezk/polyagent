// components/chat/chat-panel.tsx (simplified)
"use client";

import { useEffect, useRef, useState } from "react";

type TranscriptEvent = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  occurredAt: string;
};

export function ChatPanel({ sessionId }: { sessionId: string }) {
  const [events, setEvents] = useState<TranscriptEvent[]>([]);
  const [tailing, setTailing] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const seenIdsRef = useRef(new Set<string>());
  const runIdRef = useRef<string | null>(null);

  function connectToStream(runId: string) {
    eventSourceRef.current?.close();
    runIdRef.current = runId;

    const es = new EventSource(`/api/readable/${runId}`);
    eventSourceRef.current = es;
    setTailing(true);

    es.onmessage = (msg) => {
      const ev = JSON.parse(msg.data);
      if (seenIdsRef.current.has(ev.id)) return;
      seenIdsRef.current.add(ev.id);

      setEvents((prev) => {
        if (prev.some((e) => e.id === ev.id)) return prev;
        return [...prev, ev];
      });
    };

    es.onerror = () => {
      es.close();
      eventSourceRef.current = null;
    };
  }

  // On mount, fetch the runId and connect
  useEffect(() => {
    let cancelled = false;

    async function init() {
      const res = await fetch(`/api/managed-agents/transcript?sessionId=${sessionId}`);
      const data = await res.json();
      if (cancelled) return;

      if (data.workflowRunId) {
        connectToStream(data.workflowRunId);
      }
    }

    void init();
    return () => {
      cancelled = true;
      eventSourceRef.current?.close();
    };
  }, [sessionId]);

  async function handleSend(text: string) {
    // Optimistic update
    setEvents((prev) => [
      ...prev,
      {
        id: `optimistic-${Date.now()}`,
        type: "user.message",
        payload: { content: [{ type: "text", text }] },
        occurredAt: new Date().toISOString(),
      },
    ]);

    await fetch("/api/managed-agents/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, text }),
    });

    // Reconnect: the stream closes between turns
    // when the workflow pauses at the hook
    if (runIdRef.current) {
      connectToStream(runIdRef.current);
    }
  }

  return (
    <div>
      {events.map((ev) => (
        <EventRenderer key={ev.id} event={ev} />
      ))}
      {tailing && <div>Thinking...</div>}
    </div>
  );
}
