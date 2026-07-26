import * as p from "@clack/prompts";
import pc from "picocolors";
import { buildAdapter } from "../registry.js";
import { StateStore } from "../state.js";
import { resolveKey, STATE_PATH } from "../config.js";
import { realJulesPort } from "../adapters/jules-port.js";
import { DEFAULT_CLAUDE_MODEL } from "../constants/claude.js";
import {
  realClarifierPort,
  refinePrompt,
  clearAssessment,
  type ClarifierPort,
  type ClarificationAnswer,
  type TaskAssessment,
} from "../clarify.js";
import { capture, shutdownAnalytics } from "../analytics.js";
import type { Vendor } from "../types.js";

const CLAUDE_MODELS = [
  { value: DEFAULT_CLAUDE_MODEL, label: `${DEFAULT_CLAUDE_MODEL} (default)` },
  { value: "claude-sonnet-4-6", label: "claude-sonnet-4-6 (faster, cheaper)" },
];

async function bail(properties: Record<string, unknown> = {}): Promise<never> {
  capture("cli_wizard_cancelled", properties);
  await shutdownAnalytics();
  p.cancel("Dispatch cancelled.");
  process.exit(0);
}

/**
 * Build the clarifier if a Claude key is available. It's an optional quality
 * gate (the wizard can dispatch to Jules without an Anthropic key), so we never
 * hard-fail when it can't be constructed.
 */
function tryBuildClarifier(): ClarifierPort | undefined {
  try {
    return realClarifierPort(resolveKey("claude"));
  } catch {
    return undefined;
  }
}

/**
 * Interactive clarification step. Reviews the typed task with an LLM, and when
 * it's vague or risky, surfaces the concerns and offers to fold answers to a few
 * clarifying questions back into the prompt. Fail-open: any error or missing key
 * leaves the original prompt untouched so a dispatch is never blocked.
 */
async function clarify(
  clarifier: ClarifierPort | undefined,
  prompt: string,
  vendor: Vendor,
): Promise<string> {
  if (!clarifier) return prompt;

  const s = p.spinner();
  s.start("Reviewing your task for clarity");
  let assessment: TaskAssessment;
  try {
    assessment = await clarifier.assess(prompt);
    s.stop(assessment.clear ? pc.green("Looks clear") : pc.yellow("A few things to clarify"));
  } catch {
    s.stop(pc.dim("Clarity check skipped"));
    assessment = clearAssessment();
  }

  capture("cli_wizard_clarified", {
    vendor,
    clear: assessment.clear,
    concerns_count: assessment.concerns.length,
    questions_count: assessment.questions.length,
  });

  if (assessment.clear || assessment.questions.length === 0) return prompt;

  if (assessment.concerns.length > 0) {
    p.note(assessment.concerns.map((c) => `• ${c}`).join("\n"), "Before you dispatch");
  }

  const choice = await p.select({
    message: "This task looks underspecified. What would you like to do?",
    options: [
      { value: "answer", label: "Answer a few clarifying questions", hint: "recommended" },
      { value: "asis", label: "Dispatch as-is" },
      { value: "cancel", label: "Cancel" },
    ],
  });
  if (p.isCancel(choice) || choice === "cancel") await bail({ vendor, stage: "clarify" });

  if (choice === "asis") {
    capture("cli_wizard_clarification_dismissed", { vendor });
    return prompt;
  }

  const answers: ClarificationAnswer[] = [];
  for (const question of assessment.questions) {
    const answer = await p.text({ message: question, placeholder: "Leave blank to skip" });
    if (p.isCancel(answer)) await bail({ vendor, stage: "clarify_questions" });
    answers.push({ question, answer: (answer as string) ?? "" });
  }

  const refined = refinePrompt(prompt, answers);
  const answeredCount = answers.filter((a) => a.answer.trim().length > 0).length;
  capture("cli_wizard_clarification_answered", {
    vendor,
    questions_count: assessment.questions.length,
    answered_count: answeredCount,
    refined: refined !== prompt,
  });

  if (refined !== prompt) p.note(refined, "Refined task");
  return refined;
}

/** Interactive dispatch wizard — launched when `dispatch` is run without a prompt. */
export async function dispatchWizard(): Promise<void> {
  p.intro(pc.bgCyan(pc.black(" PolyAgent — dispatch ")));
  capture("cli_wizard_started", {});

  const vendor = (await p.select({
    message: "Which vendor?",
    options: [
      { value: "claude", label: "Claude", hint: "managed agent · general sandbox" },
      { value: "jules", label: "Jules", hint: "async · repo → PR" },
    ],
  })) as Vendor;
  if (p.isCancel(vendor)) await bail({ stage: "vendor" });

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
      if (p.isCancel(picked)) await bail({ vendor, stage: "repo" });
      repo = picked as string;
    } else {
      const typed = await p.text({ message: "Repo (owner/repo)?", placeholder: "owner/repo" });
      if (p.isCancel(typed)) await bail({ vendor, stage: "repo" });
      repo = typed as string;
    }
  }

  if (vendor === "claude") {
    const picked = await p.select({ message: "Model?", options: CLAUDE_MODELS });
    if (p.isCancel(picked)) await bail({ vendor, stage: "model" });
    model = picked as string;
  }

  const prompt = await p.text({
    message: "Task for the agent?",
    placeholder: "e.g. Fix the auth bug in /api/login",
    validate: (v) => (!v || v.trim().length === 0 ? "Task can't be empty" : undefined),
  });
  if (p.isCancel(prompt)) await bail({ vendor, stage: "task" });

  // Clarification step: push back on vague/risky instructions before spending a run.
  const task = await clarify(tryBuildClarifier(), prompt as string, vendor);

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
  if (p.isCancel(go) || !go) await bail({ vendor, stage: "confirm" });

  const s = p.spinner();
  s.start("Dispatching");
  try {
    const session = await buildAdapter(vendor).dispatch({ prompt: task, repo, model });
    new StateStore(STATE_PATH).upsert(session);
    s.stop(pc.green("Dispatched"));

    capture("cli_dispatch_succeeded", {
      vendor,
      status: session.status,
      task_length: task.length,
      refined: task !== (prompt as string),
    });

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
    capture("cli_dispatch_failed", {
      vendor,
      error: err instanceof Error ? err.message : String(err),
    });
    p.outro(pc.red(err instanceof Error ? err.message : String(err)));
    process.exitCode = 1;
  } finally {
    await shutdownAnalytics();
  }
}
