"use client";

import { useEffect, useState } from "react";
import { mutate } from "swr";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VendorIcon, VENDOR_META, type VendorKey } from "@/components/vendor-icon";

const CLAUDE_MODELS = ["claude-opus-4-8", "claude-sonnet-4-6"];
const VENDORS: VendorKey[] = ["claude", "jules", "cursor", "gemini"];
const repoRequired = (v: VendorKey) => v === "jules" || v === "cursor";

export function NewAgentModal() {
  const [open, setOpen] = useState(false);
  const [vendor, setVendor] = useState<VendorKey>("claude");
  const [model, setModel] = useState(CLAUDE_MODELS[0]);
  const [repo, setRepo] = useState("");
  const [branch, setBranch] = useState("");
  const [repos, setRepos] = useState<{ repo: string; defaultBranch?: string }[]>([]);
  const [prompt, setPrompt] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && vendor === "jules" && repos.length === 0) {
      fetch("/api/jules/sources")
        .then((r) => r.json())
        .then((d) => {
          setRepos(d.sources ?? []);
          if (d.sources?.[0]) setRepo(d.sources[0].repo);
        })
        .catch(() => {});
    }
  }, [open, vendor, repos.length]);

  async function launch() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor,
          prompt,
          repo: repo || undefined,
          branch: branch || undefined,
          model: vendor === "claude" ? model : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Launch failed");
      toast.success(`Launched ${VENDOR_META[vendor].label} · ${data.session.id}`);
      mutate("/api/sessions");
      setOpen(false);
      setPrompt("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Launch failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="bg-[#D97757] text-zinc-950 hover:bg-[#c8694a]" />}>
        + New Agent
      </DialogTrigger>
      {/* Lighter panel than the table — visual separation */}
      <DialogContent className="border-zinc-700/60 bg-zinc-900 text-zinc-100 sm:max-w-[40rem]">
        <DialogHeader>
          <DialogTitle>New agent</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Launch a cloud agent on any connected vendor.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Vendor — icon radio tiles */}
          <div className="space-y-1.5">
            <span id="vendor-label" className="text-xs font-medium text-zinc-400">
              Vendor
            </span>
            <div
              role="radiogroup"
              aria-labelledby="vendor-label"
              className="grid grid-cols-4 gap-2"
            >
              {VENDORS.map((v) => {
                const selected = v === vendor;
                return (
                  <button
                    key={v}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setVendor(v)}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 transition-all ${
                      selected
                        ? "border-[#D97757] bg-[#D97757]/10 ring-1 ring-[#D97757]/40"
                        : "border-zinc-700/60 bg-zinc-950/40 hover:border-zinc-600"
                    }`}
                  >
                    <VendorIcon vendor={v} className="size-6" />
                    <span
                      className={`text-xs font-medium ${selected ? "text-zinc-100" : "text-zinc-400"}`}
                    >
                      {VENDOR_META[v].label}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-zinc-500">{VENDOR_META[vendor].hint}</p>
          </div>

          {/* Repo (+ branch) */}
          <div className="space-y-1.5">
            <label htmlFor="repo-input" className="text-xs font-medium text-zinc-400">
              Repo {repoRequired(vendor) ? "" : <span className="text-zinc-600">(optional)</span>}
            </label>
            {vendor === "jules" ? (
              <Select value={repo} onValueChange={(v) => v && setRepo(v)}>
                <SelectTrigger id="repo-input" className="border-zinc-700 bg-zinc-950/50">
                  <SelectValue placeholder="Select a connected repo" />
                </SelectTrigger>
                <SelectContent className="border-zinc-700 bg-zinc-900 text-zinc-100">
                  {repos.map((r) => (
                    <SelectItem key={r.repo} value={r.repo}>
                      {r.repo} {r.defaultBranch ? `(${r.defaultBranch})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <Input
                  id="repo-input"
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                  placeholder="owner/repo"
                  className="col-span-2 border-zinc-700 bg-zinc-950/50"
                />
                <Input
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="branch (optional)"
                  className="border-zinc-700 bg-zinc-950/50"
                />
              </div>
            )}
          </div>

          {vendor === "claude" && (
            <div className="space-y-1.5">
              <label htmlFor="model-select" className="text-xs font-medium text-zinc-400">
                Model
              </label>
              <Select value={model} onValueChange={(v) => v && setModel(v)}>
                <SelectTrigger id="model-select" className="border-zinc-700 bg-zinc-950/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-zinc-700 bg-zinc-900 text-zinc-100">
                  {CLAUDE_MODELS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="task-textarea" className="text-xs font-medium text-zinc-400">
              Task
            </label>
            <Textarea
              id="task-textarea"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Identify any security/XSS flaws in the repo"
              className="min-h-24 border-zinc-700 bg-zinc-950/50"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={launch}
            disabled={submitting || !prompt.trim() || (repoRequired(vendor) && !repo)}
            className="bg-[#D97757] text-zinc-950 hover:bg-[#c8694a]"
          >
            {submitting ? "Launching…" : "Launch agent"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
