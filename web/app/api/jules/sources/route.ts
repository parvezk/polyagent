import { NextResponse } from "next/server";
import { realJulesPort, resolveKey } from "@/lib/core";

export const dynamic = "force-dynamic";

// GET /api/jules/sources — repos connected to Jules, for the dispatch picker.
export async function GET() {
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
