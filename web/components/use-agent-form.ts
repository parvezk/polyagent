import { useEffect, useState } from "react";
import { mutate } from "swr";
import { toast } from "sonner";
import { VENDOR_META, type VendorKey } from "@/components/vendor-icon";
import {
  CLAUDE_MODELS,
  DEFAULT_VENDOR,
  MODEL_SELECTION_VENDOR,
  REPO_REQUIRED_VENDORS,
  SOURCE_REPOSITORY_CONFIG,
} from "@/utils/constants";

export const repoRequired = (v: VendorKey) => REPO_REQUIRED_VENDORS.includes(v);

export function useAgentForm() {
  const [open, setOpen] = useState(false);
  const [vendor, setVendor] = useState<VendorKey>(DEFAULT_VENDOR);
  const [model, setModel] = useState(CLAUDE_MODELS[0]);
  const [repo, setRepo] = useState("");
  const [branch, setBranch] = useState("");
  const [repos, setRepos] = useState<{ repo: string; defaultBranch?: string }[]>([]);
  const [prompt, setPrompt] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && vendor === SOURCE_REPOSITORY_CONFIG.vendor && repos.length === 0) {
      fetch(SOURCE_REPOSITORY_CONFIG.endpoint)
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
          model: vendor === MODEL_SELECTION_VENDOR ? model : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Persistence can fail after the vendor already created a billed session.
        // Prefer surfacing that id over a bare error so the user can recover.
        const orphanId = data.session?.id as string | undefined;
        const base = data.error ?? "Launch failed";
        throw new Error(
          orphanId
            ? `${base} — vendor session ${orphanId} was created; check the vendor dashboard`
            : base,
        );
      }
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
