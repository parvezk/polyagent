import { NextResponse } from "next/server";
import { buildAdapter, StateStore, STATE_PATH, type Vendor } from "@/lib/core";

export const dynamic = "force-dynamic";

// POST /api/dispatch — { vendor, prompt, repo?, model? }
export async function POST(req: Request) {
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

  try {
    const session = await buildAdapter(vendor).dispatch({ prompt, repo, model });
    new StateStore(STATE_PATH).upsert(session);
    return NextResponse.json({ session });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 502 },
    );
  }
}
