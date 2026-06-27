"use client";

import { useState } from "react";
import { SessionTable } from "@/components/session-table";
import { NewAgentModal } from "@/components/new-agent-modal";
import { SessionDrawer } from "@/components/session-drawer";
import { TelemetryStrip } from "@/components/telemetry-strip";
import type { SessionView } from "@/lib/view";

export default function DashboardPage() {
  const [selected, setSelected] = useState<SessionView | null>(null);

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <h1 className="text-lg font-semibold">Agents</h1>
          <TelemetryStrip />
        </div>
        <NewAgentModal />
      </div>

      <SessionTable onSelect={setSelected} />
      <SessionDrawer session={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
