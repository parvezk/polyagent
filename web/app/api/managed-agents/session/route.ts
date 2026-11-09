import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { start } from "workflow/api";
import { db } from "@/lib/db";
import { managedAgentSession } from "@/lib/schema";
import { createSession } from "@/lib/managed-agents";
import { requireUserId } from "@/lib/session";
import { getOrCreateVaultForUser, syncMCPCredential } from "@/lib/vault";
import { getUserToken, MCP_SERVERS } from "@/lib/mcp-oauth";
import { sessionWorkflow } from "@/app/workflows/tail-session";

export async function POST(request: NextRequest) {
  const authz = await requireUserId();
  if ("error" in authz) return authz.error;

  const { text } = await request.json();
  if (!text?.trim()) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const title = text.length > 60 ? `${text.slice(0, 57)}...` : text;

  const vaultId = await getOrCreateVaultForUser(authz.userId);

  // Sync MCP tokens into the vault
  await Promise.all(
    Object.entries(MCP_SERVERS).map(async ([name, info]) => {
      const token = await getUserToken(authz.userId, name);
      if (token) await syncMCPCredential(vaultId, name, info.url, token);
    }),
  );

  const anthropic = await createSession([vaultId]);

  const run = await start(sessionWorkflow, [
    {
      internalSessionId: id,
      anthropicSessionId: anthropic.anthropicSessionId,
      initialMessage: text.trim(),
    },
  ]);

  await db.insert(managedAgentSession).values({
    id,
    userId: authz.userId,
    anthropicSessionId: anthropic.anthropicSessionId,
    title,
    agentId: anthropic.agentId,
    environmentId: anthropic.environmentId,
    workflowRunId: run.runId,
  });

  return NextResponse.json({ id, runId: run.runId });
}
