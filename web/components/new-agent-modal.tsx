"use client";

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
import { VendorIcon, VENDOR_META } from "@/components/vendor-icon";
import { useAgentForm, CLAUDE_MODELS, VENDORS, repoRequired } from "./use-agent-form";

export function NewAgentModal() {
  const form = useAgentForm();

  return (
    <Dialog open={form.open} onOpenChange={form.setOpen}>
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
            <label className="text-xs font-medium text-zinc-400">Vendor</label>
            <div className="grid grid-cols-4 gap-2">
              {VENDORS.map((v) => {
                const selected = v === form.vendor;
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => form.setVendor(v)}
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
            <p className="text-xs text-zinc-500">{VENDOR_META[form.vendor].hint}</p>
          </div>

          {/* Repo (+ branch) */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">
              Repo{" "}
              {repoRequired(form.vendor) ? "" : <span className="text-zinc-600">(optional)</span>}
            </label>
            {form.vendor === "jules" ? (
              <Select value={form.repo} onValueChange={(v) => v && form.setRepo(v)}>
                <SelectTrigger className="border-zinc-700 bg-zinc-950/50">
                  <SelectValue placeholder="Select a connected repo" />
                </SelectTrigger>
                <SelectContent className="border-zinc-700 bg-zinc-900 text-zinc-100">
                  {form.repos.map((r) => (
                    <SelectItem key={r.repo} value={r.repo}>
                      {r.repo} {r.defaultBranch ? `(${r.defaultBranch})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <Input
                  value={form.repo}
                  onChange={(e) => form.setRepo(e.target.value)}
                  placeholder="owner/repo"
                  className="col-span-2 border-zinc-700 bg-zinc-950/50"
                />
                <Input
                  value={form.branch}
                  onChange={(e) => form.setBranch(e.target.value)}
                  placeholder="branch (optional)"
                  className="border-zinc-700 bg-zinc-950/50"
                />
              </div>
            )}
          </div>

          {form.vendor === "claude" && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">Model</label>
              <Select value={form.model} onValueChange={(v) => v && form.setModel(v)}>
                <SelectTrigger className="border-zinc-700 bg-zinc-950/50">
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
            <label className="text-xs font-medium text-zinc-400">Task</label>
            <Textarea
              value={form.prompt}
              onChange={(e) => form.setPrompt(e.target.value)}
              placeholder="e.g. Identify any security/XSS flaws in the repo"
              className="min-h-24 border-zinc-700 bg-zinc-950/50"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={form.launch}
            disabled={
              form.submitting || !form.prompt.trim() || (repoRequired(form.vendor) && !form.repo)
            }
            className="bg-[#D97757] text-zinc-950 hover:bg-[#c8694a]"
          >
            {form.submitting ? "Launching…" : "Launch agent"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
