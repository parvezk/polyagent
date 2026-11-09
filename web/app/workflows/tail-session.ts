import { defineHook, sleep, getWritable } from "workflow";
import { getAnthropic } from "@/lib/anthropic";

//Hook and event types

export type SessionEvent = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  occurredAt: string;
};

export const messageHook = defineHook<{ text: string }>();

//Send a message
async function sendMessage(anthropicSessionId: string, text: string): Promise<void> {
  "use step";

  const client = getAnthropic();
  await client.beta.sessions.events.send(anthropicSessionId, {
    events: [{ type: "user.message", content: [{ type: "text", text }] }],
  });
}

// Poll and stream events
async function pollAndStream(input: {
  anthropicSessionId: string;
  lastEventId: string | null;
}): Promise<{ lastEventId: string | null; done: boolean }> {
  "use step";

  const client = getAnthropic();
  const writer = getWritable<SessionEvent>().getWriter();

  let done = false;
  let lastId = input.lastEventId;

  try {
    const page = await client.beta.sessions.events.list(input.anthropicSessionId, { limit: 100 });

    let seenLast = input.lastEventId === null;
    for (const event of page.data) {
      if (!seenLast) {
        if (event.id === input.lastEventId) seenLast = true;
        continue;
      }

      await writer.write({
        id: event.id,
        type: event.type,
        payload: event as unknown as Record<string, unknown>,
        occurredAt: new Date().toISOString(),
      });
      lastId = event.id;

      if (
        event.type === "session.status_idle" ||
        event.type === "session.status_terminated" ||
        event.type === "session.deleted"
      ) {
        done = true;
        break;
      }
    }
  } finally {
    writer.releaseLock();
  }

  return { lastEventId: lastId, done };
}
