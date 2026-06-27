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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VendorIcon } from "@/components/vendor-icon";

type Vendor = "claude" | "jules";
const CLAUDE_MODELS = ["claude-opus-4-8", "claude-sonnet-4-6"];

export function NewAgentModal() {
  const [open, setOpen] = useState(false);
  const [vendor, setVendor] = useState<Vendor>("claude");
  const [model, setModel] = useState(CLAUDE_MODELS[0]);
  const [repo, setRepo] = useState("");
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

  async function dispatch() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendor, prompt, repo: vendor === "jules" ? repo : undefined, model: vendor === "claude" ? model : undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Dispatch failed");
      toast.success(`Dispatched ${vendor} · ${data.session.id}`);
      mutate("/api/sessions");
      setOpen(false);
      setPrompt("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Dispatch failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="bg-[#D97757] text-zinc-950 hover:bg-[#c8694a]" />}>
        + New Agent
      </DialogTrigger>
      <DialogContent className="border-zinc-800 bg-zinc-950 text-zinc-100 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Dispatch an agent</DialogTitle>
          <DialogDescription className="text-zinc-500">
            Start a cloud agent on any connected vendor.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">Vendor</label>
            <Select value={vendor} onValueChange={(v) => v && setVendor(v as Vendor)}>
              <SelectTrigger className="border-zinc-800 bg-zinc-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
                <SelectItem value="claude">
                  <span className="flex items-center gap-2 pr-4">
                    <VendorIcon vendor="claude" />
                    <span className="font-medium">Claude</span>
                    <span className="text-xs text-zinc-500">general sandbox</span>
                  </span>
                </SelectItem>
                <SelectItem value="jules">
                  <span className="flex items-center gap-2 pr-4">
                    <VendorIcon vendor="jules" />
                    <span className="font-medium">Jules</span>
                    <span className="text-xs text-zinc-500">repo → PR</span>
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {vendor === "jules" && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">Repo</label>
              <Select value={repo} onValueChange={(v) => v && setRepo(v)}>
                <SelectTrigger className="border-zinc-800 bg-zinc-900">
                  <SelectValue placeholder="Select a connected repo" />
                </SelectTrigger>
                <SelectContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
                  {repos.map((r) => (
                    <SelectItem key={r.repo} value={r.repo}>
                      {r.repo} {r.defaultBranch ? `(${r.defaultBranch})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {vendor === "claude" && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">Model</label>
              <Select value={model} onValueChange={(v) => v && setModel(v)}>
                <SelectTrigger className="border-zinc-800 bg-zinc-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
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
            <label className="text-xs font-medium text-zinc-400">Task</label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Identify any security/XSS flaws in the repo"
              className="min-h-24 border-zinc-800 bg-zinc-900"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={dispatch}
            disabled={submitting || !prompt.trim() || (vendor === "jules" && !repo)}
            className="bg-[#D97757] text-zinc-950 hover:bg-[#c8694a]"
          >
            {submitting ? "Dispatching…" : "Dispatch"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
