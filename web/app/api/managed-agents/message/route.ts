import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { managedAgentSession } from "@/lib/schema";
import { requireUserId } from "@/lib/session";
import { messageHook } from "@/app/workflows/tail-session";

export async function POST(request: Request) {
  const authz = await requireUserId();
  if ("error" in authz) return authz.error;

  const { sessionId, text } = await request.json();

  const [row] = await db
    .select()
    .from(managedAgentSession)
    .where(and(eq(managedAgentSession.id, sessionId), eq(managedAgentSession.userId, authz.userId)))
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db
    .update(managedAgentSession)
    .set({ updatedAt: new Date() })
    .where(eq(managedAgentSession.id, sessionId));

  await messageHook.resume(`msg:${sessionId}`, { text });

  return NextResponse.json({ ok: true });
}
