import { createClient } from "@/lib/supabase/server";
import type { AgentSession } from "@/lib/core";

// Supabase-backed session store, scoped to the authenticated user via RLS.
// Replaces the CLI's file-based StateStore for the web app.

export interface DbSession {
  id: string;
  user_id: string;
  vendor: "claude" | "jules" | "cursor" | "gemini";
  label: string | null;
  status: string;
  output_url: string | null;
  first_message: string | null;
  dispatched_at: string;
  last_polled: string | null;
}

// Map a core AgentSession (from dispatch) to a DB row for the current user.
export function toDbRow(s: AgentSession, userId: string): Omit<DbSession, never> {
  return {
    id: s.id,
    user_id: userId,
    vendor: s.vendor,
    label: s.label ?? null,
    status: s.status,
    output_url: s.outputUrl ?? null,
    first_message: s.firstMessage ?? null,
    dispatched_at: s.dispatchedAt,
    last_polled: s.lastPolled ?? null,
  };
}

// Returns the current user's id (via getClaims — never getSession in server code), or null.
export async function currentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return (data?.claims?.sub as string | undefined) ?? null;
}

export async function listSessions(): Promise<DbSession[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .order("dispatched_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as DbSession[];
}

export async function getSession(id: string): Promise<DbSession | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("sessions").select("*").eq("id", id).maybeSingle();
  return (data as DbSession) ?? null;
}

export async function upsertSession(row: DbSession): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("sessions").upsert(row);
  if (error) throw new Error(error.message);
}

export async function patchSession(
  id: string,
  patch: Partial<Pick<DbSession, "status" | "last_polled">>,
): Promise<void> {
  const supabase = await createClient();
  await supabase.from("sessions").update(patch).eq("id", id);
}

export async function upsertSessions(rows: DbSession[]): Promise<void> {
  if (!rows || rows.length === 0) return;
  const supabase = await createClient();
  const { error } = await supabase.from("sessions").upsert(rows);
  if (error) throw new Error(error.message);
}
