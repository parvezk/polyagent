import { NextResponse } from "next/server";
import { realJulesPort, resolveKey } from "@/lib/core";
import { currentUserId } from "@/lib/sessions-store";

export const dynamic = "force-dynamic";

// GET /api/jules/sources — repos connected to Jules, for the dispatch picker.
export async function GET() {
  const userId = await currentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const sources = (await realJulesPort(resolveKey("jules")).listSources?.()) ?? [];
    return NextResponse.json({ sources });
  } catch (err) {
    return NextResponse.json(
      { sources: [], error: err instanceof Error ? err.message : String(err) },
      { status: 200 }, // soft-fail: modal falls back to manual entry
    );
  }
}
