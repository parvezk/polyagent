import * as p from "@clack/prompts";
import pc from "picocolors";
import { buildAdapter } from "../registry.js";
import { StateStore } from "../state.js";
import { resolveKey, STATE_PATH } from "../config.js";
import { realJulesPort } from "../adapters/jules-port.js";
import { DEFAULT_CLAUDE_MODEL } from "../constants/claude.js";
import type { Vendor } from "../types.js";

const CLAUDE_MODELS = [
  { value: DEFAULT_CLAUDE_MODEL, label: `${DEFAULT_CLAUDE_MODEL} (default)` },
  { value: "claude-sonnet-4-6", label: "claude-sonnet-4-6 (faster, cheaper)" },
];

function bail(): never {
  p.cancel("Dispatch cancelled.");
  process.exit(0);
}

/** Interactive dispatch wizard — launched when `dispatch` is run without a prompt. */
export async function dispatchWizard(): Promise<void> {
  p.intro(pc.bgCyan(pc.black(" PolyAgent — dispatch ")));

  const vendor = (await p.select({
    message: "Which vendor?",
    options: [
      { value: "claude", label: "Claude", hint: "managed agent · general sandbox" },
      { value: "jules", label: "Jules", hint: "async · repo → PR" },
    ],
  })) as Vendor;
  if (p.isCancel(vendor)) bail();

  let repo: string | undefined;
  let model: string | undefined;

  if (vendor === "jules") {
    const s = p.spinner();
    s.start("Loading your Jules repos");
    let sources: { repo: string; defaultBranch?: string }[] = [];
    try {
      sources = (await realJulesPort(resolveKey("jules")).listSources?.()) ?? [];
      s.stop(`Found ${sources.length} connected repo${sources.length === 1 ? "" : "s"}`);
    } catch {
      s.stop(pc.yellow("Couldn't load repos — enter one manually"));
    }

    if (sources.length > 0) {
      const picked = await p.select({
        message: "Repo?",
        options: sources.map((s) => ({
          value: s.repo,
          label: s.repo,
          hint: s.defaultBranch ? `default: ${s.defaultBranch}` : undefined,
        })),
      });
      if (p.isCancel(picked)) bail();
      repo = picked as string;
    } else {
      const typed = await p.text({ message: "Repo (owner/repo)?", placeholder: "owner/repo" });
      if (p.isCancel(typed)) bail();
      repo = typed as string;
    }
  }

  if (vendor === "claude") {
    const picked = await p.select({ message: "Model?", options: CLAUDE_MODELS });
    if (p.isCancel(picked)) bail();
    model = picked as string;
  }

  const prompt = await p.text({
    message: "Task for the agent?",
    placeholder: "e.g. Fix the auth bug in /api/login",
    validate: (v) => (!v || v.trim().length === 0 ? "Task can't be empty" : undefined),
  });
  if (p.isCancel(prompt)) bail();

  const summary = [
    `${pc.dim("vendor")}  ${pc.bold(vendor)}`,
    repo ? `${pc.dim("repo")}    ${repo}` : "",
    model ? `${pc.dim("model")}   ${model}` : "",
    `${pc.dim("task")}    ${prompt as string}`,
  ]
    .filter(Boolean)
    .join("\n");
  p.note(summary, "Dispatch this?");

  const go = await p.confirm({ message: "Dispatch now?" });
  if (p.isCancel(go) || !go) bail();

  const s = p.spinner();
  s.start("Dispatching");
  try {
    const session = await buildAdapter(vendor).dispatch({ prompt: prompt as string, repo, model });
    new StateStore(STATE_PATH).upsert(session);
    s.stop(pc.green("Dispatched"));

    const lines = [
      `${pc.dim("session")}  ${session.id}`,
      `${pc.dim("status")}   ${session.status}`,
      session.firstMessage ? `${pc.dim("reply")}    ${session.firstMessage}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    p.note(lines, `${vendor} session`);
    p.outro(`Track it with ${pc.cyan("polyagent status --watch")}`);
  } catch (err) {
    s.stop(pc.red("Dispatch failed"));
    p.outro(pc.red(err instanceof Error ? err.message : String(err)));
    process.exitCode = 1;
  }
}
