import { useEffect, useState } from "react";
import { mutate } from "swr";
import { toast } from "sonner";
import { VENDOR_META, type VendorKey } from "@/components/vendor-icon";
import { CLAUDE_MODELS } from "@/utils/constants";

export const repoRequired = (v: VendorKey) => v === "jules" || v === "cursor";

export function useAgentForm() {
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

  return {
    open,
    setOpen,
    vendor,
    setVendor,
    model,
    setModel,
    repo,
    setRepo,
    branch,
    setBranch,
    repos,
    prompt,
    setPrompt,
    submitting,
    launch,
  };
}
