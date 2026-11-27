# PolyAgent: fresh positioning angles (Thu Oct 29, 2026, ~12:30 AM ET)

This replaces the v4 positioning that Parvez rejected ("review layer for devs running multiple agents"). It drops the line "code is cheap, human is the bottleneck", the audit/observability/tracing framing, designers/PMs as the wedge, and any traction from interviews.
Competitor searches were run Oct 29. "Funded" claims come from the vendors' own pages; verify them before the interview.

## A fact from the repo that nobody has used yet (checked via the GitHub API, Oct 29)
github.com/parvezk/polyagent has **~148 branches and 100+ PRs**. Most of them were opened by *standing* (scheduled, unattended) agent personas, not by Parvez:
- `sentinel/*`: about 22 security branches. One was pushed Oct 28, 11:04 UTC (7:04 AM ET), for example `sentinel/claude-dispatch-stream-orphan-5419`.
- `palette/*`: about 19 UX branches.
- `bolt*`: about 30 perf branches. **At least 15 of them are near-duplicates of the same idea**, for example `bolt-optimize-polling-…` repeated with different IDs.
- `cursor/critical-bug-management-*`: 8+ branches. Plus `posthog/*` and `codex/*`.
The pushes land about every 24h at ~11:04 UTC (7:04 AM ET), which looks like a schedule.
This is a documented artifact of a real problem, in Parvez's own public repo, produced by agents from several vendors working the same codebase while he wasn't watching. It is the best evidence he has, and it is not customer traction. Phrase it as "my own repo".

## 10 angles generated → verdict
| # | Angle | Verdict |
|---|---|---|
| 1 | Dedupe and converge overlapping agent PRs | **Killed**: Pull Guard, MergeGuard, Switchman, Kodify all exist |
| 2 | Cross-vendor ensemble "disagreement = uncertainty" review | **Killed**: Code Council, MultiCode, kaijutsu, agent-council, Cursor's own interrogate skill |
| 3 | Quota/subscription router across Claude Max, Cursor, Codex | **Killed**: agent-router, agent-quota-router, CC-Router, Claudexor. Also a ToS-risk story |
| 4 | Local ↔ cloud session handoff | **Killed**: Omnara (20k+ builders, funded), Warp handoff, Claude /teleport |
| 5 | Local multi-CLI control surface or kanban | **Killed**: Conductor (Melty), Conductor OSS, Vibe Kanban, Microsoft Conductor |
| 6 | Browser agent QAs every coding agent's preview deploy | **Killed**: QA Wolf, Momentic, Vercel Agent |
| 7 | **Managing standing agents as a workforce: scheduled/triggered agents across vendors** | **Finalist 1 (top pick)** |
| 8 | **World-state provenance: every agent saw a different version of the software** | **Finalist 2** |
| 9 | **Visual interpretability for agent work: a codebase "attention atlas", not a trace** | **Finalist 3 (risky)** |
| 10 | **Vertical: multi-agent studio for data stories / visual analysis** | **Finalist 4 (wildcard)** |

---

## Finalist 1 (TOP PICK): "Standing agents" — the manager for agents that work while you sleep
**One-liner (95):** `PolyAgent manages the AI agents that work on your codebase while you sleep, across every vendor`
**Insight:** The next wave of coding agents isn't sessions you start. It's standing agents that run on schedules and triggers (Jules scheduled tasks and Fleet, Cursor background/bug agents, Claude and Codex in GitHub Actions). They behave like a workforce, but nobody manages them like one. Which standing agent's work actually gets merged? Which one keeps re-proposing the same fix? Whose standing instructions need rewriting, and which should be retired? Every vendor shows only its own agents. The first time you can see the whole roster is when they collide in your repo.
**Heterogeneous angle:** standing agents come from different runtimes: cloud (Jules, Cursor background), CI (GitHub Actions running Claude or Codex), local cron'd CLIs. Only a cross-vendor layer sees the whole roster.
**Why Parvez:** his own repo *is* the case study: ~150 branches from Sentinel/Palette/Bolt/Cursor/PostHog agents, with 15+ duplicate perf attempts. He also built the adapter layer that already talks to four of these vendors. He found the problem by living in it, not by reading about it.
**Closest competitors:** Google's **Jules Fleet** (Jules-only goal files and a merge loop). Vendor-native dashboards (Cursor, GitHub Copilot agent HQ). PR-dedupe tools (Pull Guard, MergeGuard) look at PRs, not at the agents and standing instructions that keep producing them. **Distinct because** the unit is the *agent* and its standing mandate: performance over time, redundancy, instruction tuning, hire/retire, across vendors. A queue of PRs is a different unit. I found no funded cross-vendor player. Verify Cursor's and GitHub's latest automation features before the interview.
**How the build supports it (no fake traction):** AgentAdapter `dispatch/getStatus/getOutput/sendFollowup` already normalizes Claude, Jules, Cursor and Gemini runs into one session store (Supabase) plus a CLI and dashboard. The new piece is a roster view keyed by standing agent (branch prefix / persona → merged vs abandoned vs duplicate). It can be demoed on his own repo's real history. Say "building", not "shipped".
**a16z fit:** Big Ideas 2026 says "the bottleneck becomes coordination: routing, locking, state management, and policy enforcement across massive parallel execution", plus the enterprise orchestration layer that coordinates agents and humans.

## Finalist 2: World-state provenance — "every agent saw a different version of your software"
**One-liner (85):** `PolyAgent shows what each AI agent believed your software was when it made its change`
**Insight:** When agents mix, they don't just disagree about code. They worked from different realities. A local CLI sees your dirty tree and `.env`. A cloud agent sees last night's commit in a clean VM. A desktop-app agent sees its own worktree. A browser agent sees the deployed preview. So "correct" changes are built on premises that are already false. Handoff tools move state between places. Nobody records and compares the premises each agent acted on.
**Why Parvez:** this is the interpretability question from his thesis ("what input did the model actually condition on?") applied to agents. His four adapters span local, cloud and IDE runtimes, which is exactly the mix that creates the skew.
**Closest:** Omnara and Warp handoff (they sync state, they don't audit divergence). Cursor cloud-agent docs that just tell you to commit first. Switchman flags "stale dependencies" across local worktrees only. **Distinct, but** a reviewer may hear it as a feature, not a company. It has to be paired with a sharp pain moment.
**Build support:** each dispatch already records repo/branch/vendor per session. Extending that with a premise snapshot (commit SHA, dirty files, env hash, deploy URL) is a small schema change on the existing store.

## Finalist 3 (risky): Interpretability, not observability — an "attention atlas" of agent work
**One-liner (93):** `PolyAgent draws a living map of your codebase showing where every AI agent looked and touched`
**Insight:** Tracing tools show agent work as timelines of tokens and tool calls. That's how an engineer debugs a run, not how a human builds a mental model of a codebase that five agents are changing. Saliency-style visual maps (where the agent read, relied on, and edited, over the architecture) are how interpretability research made deep nets legible. That method hasn't been applied to agent fleets.
**Why Parvez:** this is his literal thesis (visual interpretability of deep learning), plus DeepViz and a frontend/data-viz/design career. He's the only founder in the pile with that exact edge.
**Closest:** LangSmith, Langfuse, Braintrust, AgentOps (trace-centric, for LLM app builders). CodeSee (codebase maps, acquired by GitKraken, not agent-aware). **Risk:** Parvez flagged observability as crowded. This survives only if it's pitched as *visual* and *spatial* (a map, not a trace). Use it as the founder-fit color inside Finalist 1 rather than as the company.
**Build support:** the dashboard already pulls agent outputs. Files read and edited are available from vendor outputs and diffs. A visualization is a frontend project, which is his strength.

## Finalist 4 (wildcard, vertical): multi-agent studio for data stories
**One-liner (91):** `PolyAgent runs research, analysis and visualization agents as one team to ship data stories`
**Insight:** In his NYC mobility project (July 2026 Substack), the research agents were rigorous but chose the wrong narrative, and he had to redirect the Data Story agent at a checkpoint. In analytical storytelling, correctness is narrative, not just compile-and-test, and coding-agent tools have no idea about it.
**Why Parvez:** data viz, design, explainability, and a published case.
**Closest:** Hex and Julius agents (single-agent notebooks), Observable. **Weak spots:** the furthest from the existing coding-agent build, a smaller market story, and SR007 vertical wins (Colmez) were in big, regulated industries. Keep it as a fallback only.

---

## Recommendation
**Finalist 1, with Finalist 3's interpretability as the founder-fit narrative.** It's the only angle backed by an artifact anyone can verify (his public repo's branch history). It names a shift that's happening now (agents moving from sessions to standing workforces). It sits on the existing adapter + session-store build. And it has no funded cross-vendor incumbent. Weakest point: vendors may build roster views for their own agents. The answer is that the roster is multi-vendor by nature, and his repo proves it.
Draft description seed (for v5, ~600 chars): "My own open-source repo has ~150 branches opened by AI agents I scheduled and then stopped watching: security, UX and performance agents from Google, Cursor and others, including 15 near-identical attempts at the same optimization. Agents are becoming a standing workforce, but every vendor shows only its own. PolyAgent already connects Claude, Jules, Cursor and Gemini agents behind one interface. I'm building the manager on top: every standing agent's record of what got merged, what got abandoned, and what it keeps repeating, so a developer can tune, merge or retire agents like a team."
