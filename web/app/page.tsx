"use client";

import { useState } from "react";
import { mutate } from "swr";
import { toast } from "sonner";
import { SessionTable } from "@/components/session-table";
import { NewAgentModal } from "@/components/new-agent-modal";
import { SessionDrawer } from "@/components/session-drawer";
import { TelemetryStrip } from "@/components/telemetry-strip";
import { Button } from "@/components/ui/button";
import type { SessionView } from "@/lib/view";

export default function DashboardPage() {
  const [selected, setSelected] = useState<SessionView | null>(null);
  const [importing, setImporting] = useState(false);

  async function importCli() {
    setImporting(true);
    try {
      const res = await fetch("/api/import", { method: "POST" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Import failed");
      toast.success(`Imported ${d.imported} CLI session${d.imported === 1 ? "" : "s"}`);
      mutate("/api/sessions");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <h1 className="text-lg font-semibold">Agents</h1>
          <TelemetryStrip />
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={importCli}
            disabled={importing}
            variant="outline"
            size="sm"
            className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-900"
          >
            {importing ? "Importing…" : "Import CLI sessions"}
          </Button>
          <NewAgentModal />
        </div>
      </div>

      <SessionTable onSelect={setSelected} />
      <SessionDrawer session={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
