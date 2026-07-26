import * as p from "@clack/prompts";
import pc from "picocolors";
import { buildAdapter } from "../registry.js";
import { StateStore } from "../state.js";
import { resolveKey, STATE_PATH } from "../config.js";
import { realJulesPort } from "../adapters/jules-port.js";
import { DEFAULT_CLAUDE_MODEL } from "../constants/claude.js";
import { reviewTask, type ReviewContext, type TaskReview } from "./task-review.js";
import type { Vendor } from "../types.js";

const CLAUDE_MODELS = [
  { value: DEFAULT_CLAUDE_MODEL, label: `${DEFAULT_CLAUDE_MODEL} (default)` },
  { value: "claude-sonnet-4-6", label: "claude-sonnet-4-6 (faster, cheaper)" },
];

function bail(): never {
  p.cancel("Dispatch cancelled.");
  process.exit(0);
}

/**
 * LLM-assisted pass between task entry and dispatch: surfaces clarifying
 * questions and flags shaky instructions, then lets the user refine the prompt
 * and re-review, or dispatch as-is. Returns the (possibly revised) task.
 *
 * This never blocks a dispatch on its own — if there's no Anthropic key or the
 * review call fails, it degrades to the original task with a warning.
 */
async function clarifyTask(task: string, ctx: ReviewContext): Promise<string> {
  let apiKey: string;
  try {
    apiKey = resolveKey("claude");
  } catch {
    p.log.warn("Skipping task review — set ANTHROPIC_API_KEY to enable it.");
    return task;
  }

  let current = task;
  // Loop so the user can refine → re-review as many rounds as they want.
  for (;;) {
    const s = p.spinner();
    s.start("Reviewing the task");
    let review: TaskReview;
    try {
      review = await reviewTask(current, ctx, apiKey);
      s.stop("Task reviewed");
    } catch {
      s.stop(pc.yellow("Couldn't review the task — continuing"));
      return current;
    }

    const flagged = review.questions.length > 0 || review.concerns.length > 0;
    if (!flagged) {
      p.log.success(review.summary || "Task looks clear.");
      return current;
    }

    const lines: string[] = [];
    if (review.summary) lines.push(review.summary, "");
    if (review.concerns.length) {
      lines.push(pc.yellow("Concerns"));
      for (const c of review.concerns) lines.push(`  ${pc.yellow("•")} ${c}`);
    }
    if (review.questions.length) {
      if (review.concerns.length) lines.push("");
      lines.push(pc.cyan("Clarifying questions"));
      for (const q of review.questions) lines.push(`  ${pc.cyan("•")} ${q}`);
    }
    p.note(
      lines.join("\n"),
      review.verdict === "flawed" ? "Push back before dispatch" : "Worth clarifying",
    );

    const choice = await p.select({
      message: "How do you want to proceed?",
      options: [
        { value: "refine", label: "Refine the task", hint: "edit it with these in mind" },
        { value: "proceed", label: "Dispatch as-is", hint: "ignore and continue" },
        { value: "cancel", label: "Cancel" },
      ],
    });
    if (p.isCancel(choice) || choice === "cancel") bail();
    if (choice === "proceed") return current;

    const revised = await p.text({
      message: "Revise the task",
      initialValue: current,
      validate: (v) => (!v || v.trim().length === 0 ? "Task can't be empty" : undefined),
    });
    if (p.isCancel(revised)) bail();
    current = (revised as string).trim();
  }
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

  // Vet the task (clarifying questions + pushback) before the confirm step.
  const task = await clarifyTask((prompt as string).trim(), { vendor, repo, model });

  const summary = [
    `${pc.dim("vendor")}  ${pc.bold(vendor)}`,
    repo ? `${pc.dim("repo")}    ${repo}` : "",
    model ? `${pc.dim("model")}   ${model}` : "",
    `${pc.dim("task")}    ${task}`,
  ]
    .filter(Boolean)
    .join("\n");
  p.note(summary, "Dispatch this?");

  const go = await p.confirm({ message: "Dispatch now?" });
  if (p.isCancel(go) || !go) bail();

  const s = p.spinner();
  s.start("Dispatching");
  try {
    const session = await buildAdapter(vendor).dispatch({ prompt: task, repo, model });
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
