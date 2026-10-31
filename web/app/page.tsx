"use client";

import { useState } from "react";
import { mutate } from "swr";
import { toast } from "sonner";
import { SessionTable } from "@/components/session-table";
import { NewAgentModal } from "@/components/new-agent-modal";
import { SessionDrawer } from "@/components/session-drawer";
import { TelemetryStrip } from "@/components/telemetry-strip";
import { VendorHero } from "@/components/vendor-hero";
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
    <div className="space-y-8">
      <VendorHero />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2.5">
          <h1 className="text-[32px] font-bold leading-9 tracking-[-0.01em]">Coding agents</h1>
          <TelemetryStrip />
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={importCli}
            disabled={importing}
            variant="outline"
            size="sm"
            className="border-rule-strong bg-transparent text-ink hover:bg-paper-sunk"
          >
            {importing ? "Importing…" : "Import CLI sessions"}
          </Button>
          <NewAgentModal />
        </div>
      </div>

      <SessionTable onSelect={setSelected} />
      <SessionDrawer
        key={selected?.id ?? "closed"}
        session={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
