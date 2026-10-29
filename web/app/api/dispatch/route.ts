import { NextResponse } from "next/server";
import { buildAdapter, type Vendor } from "@/lib/core";
import { currentUserId, toDbRow, upsertSession } from "@/lib/sessions-store";

export const dynamic = "force-dynamic";

// POST /api/dispatch — { vendor, prompt, repo?, model? }
export async function POST(req: Request) {
  const userId = await currentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: { vendor?: Vendor; prompt?: string; repo?: string; model?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { vendor, prompt, repo, model } = body;
  if (!vendor || !prompt) {
    return NextResponse.json({ error: "vendor and prompt are required" }, { status: 400 });
  }
  if (vendor === "jules" && !repo) {
    return NextResponse.json({ error: "Jules requires a repo (owner/repo)" }, { status: 400 });
  }

  let session;
  try {
    session = await buildAdapter(vendor).dispatch({ prompt, repo, model });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 502 },
    );
  }

  // Vendor session already exists (and may be billed). If persistence fails, still
  // return the session id so the client can surface it — dropping the id orphans
  // a live cloud agent with no recovery path from the UI.
  try {
    await upsertSession(toDbRow(session, userId));
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : String(err),
        session,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ session });
}
