"use client";

import { useState } from "react";
import { SessionTable } from "@/components/session-table";
import { NewAgentModal } from "@/components/new-agent-modal";
import { SessionDrawer } from "@/components/session-drawer";
import type { SessionView } from "@/lib/view";

export default function DashboardPage() {
  const [selected, setSelected] = useState<SessionView | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-lg font-semibold">Agents</h1>
          <p className="text-sm text-zinc-500">
            Every cloud agent across vendors, one view. Click a row to inspect or steer it.
          </p>
        </div>
        <NewAgentModal />
      </div>

      <SessionTable onSelect={setSelected} />
      <SessionDrawer session={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
