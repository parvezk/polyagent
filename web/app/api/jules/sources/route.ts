import { NextResponse } from "next/server";
import { realJulesPort, resolveKey } from "@/lib/core";

export const dynamic = "force-dynamic";

// GET /api/jules/sources — repos connected to Jules, for the dispatch picker.
export async function GET() {
  try {
    const sources = (await realJulesPort(resolveKey("jules")).listSources?.()) ?? [];
    return NextResponse.json({ sources });
  } catch (err) {
    // SECURITY: Log error internally but return generic message to client to prevent info leakage
    console.error("Failed to fetch Jules sources:", err);
    return NextResponse.json(
      { sources: [], error: "Failed to fetch sources" },
      { status: 200 }, // soft-fail: modal falls back to manual entry
    );
  }
}
