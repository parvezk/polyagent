# Codex chat: decisions and observations

Living record requested by Parvez on October 29, 2026. Keep updates succinct and dated. Label founder reports, decisions, verified external facts and hypotheses separately. Preserve corrections rather than silently turning interpretations into facts. This file is a synthesis, not a transcript or proof of customer demand. Read MISSION.md for application coordination and writing-rules.md for prose rules.

## Decisions and constraints
- Submit the SR008 application by Friday night October 30, ahead of the November 1 deadline. Parvez submits himself.
- Full-time solo founder; 1 FTE; NYC, open to relocation; unincorporated. Saved form instructs 0 in the full-time-founder field for unincorporated applicants. Founding date remains open.
- October 28: begin with developers coordinating coding tasks across multiple agents.
- Shared MISSION subsequently records the approved line: “PolyAgent helps developers track, understand and approve coding agents across vendors in one place.” Track/understand/approve is the direction; do not imply the proposed review queue is already shipped.
- Build on the existing PolyAgent core. Current source-level capabilities cover dispatch/status/output/follow-up; production functionality requires separate verification.
- No users reported. Founder experience is evidence of personal pain, not product-market fit.
- Current shared workspace: `/Users/parvezkose/dev2/polyagent.pro/a16z-SR008`. MISSION identifies drafts-v6 as latest through its newer update; preserve other agents' drafting decisions. Do not silently replace them from this log.

## October 29: founder-confirmed pain
Parvez agreed with this synthesis: he was keeping the whole project's state in his head while individual tools managed their own pieces. Returning the next day meant rebuilding that mental picture before continuing.

| What happened | Work Parvez performed |
|---|---|
| Design work lived in Flow, AI Studio and Midjourney | Carried relevant work and instructions into Claude Code/Cursor |
| Sessions ran across apps, tabs and terminals | Remembered which session belonged to which task |
| Work paused overnight, hit limits or failed | Reconstructed where he stopped and what each session needed |
| Agents produced long responses | Read through them to find what was needed for the next decision |

- Agent Teams, tmux/Ghostty and custom notifications helped within development; cross-tool coordination still fell to Parvez.
- An unsent reply could leave a session waiting while he believed work was progressing. Detecting unsent input in unrelated apps would require access; it is not a current PolyAgent capability.
- He described cognitive exhaustion after two or three days, compounded by normal admin tasks and tab switching. Record as personal experience, not a medical or measured productivity claim.
- Latest clarification: handoffs included images, exported files, links, written instructions and prior decisions, plus markdown, SVGs and high-resolution JPEGs. Both artifacts and explanatory context moved between tools.
- Working problem statement: developers spanning design and coding tools repeatedly reconstruct what is happening and what they need to do next. Tab switching and text overload are manifestations of that burden.

## October 29: counterevidence and company question
- Founder objection: an MCP server or plugin may solve manual handoffs; that alone may not justify a startup. Accepted as a serious challenge.
- Assessment: a narrow transfer feature may be adequately served by an integration. Packaging as a plugin does not decide whether a business exists. Recurring value, adoption, willingness to pay and ability to retain users matter; none is established yet.
- Anthropic's official help documentation describes design-system sync and handoffs between Claude Design and Claude Code. Treat native integration as existing competition. Documentation does not establish production reliability or lossless preservation of all memory/state, and no hands-on reliability test occurred here.
- Product hypothesis: retain enough project context and pending decisions across tools and interruptions that a person can resume work without rereading scattered histories. This must show value beyond native integrations and a simple connector. It is not validated demand or a selected new implementation scope.
- Useful falsification test: try a native handoff or small connector on a real workflow first. If it removes most of the pain, narrow or reconsider PolyAgent's claim. If reconstructing pending work remains frequent, measure that residual burden and test whether a shared view reduces it.

## October 29: Jules announcement
- User supplied an email screenshot appearing to be from Jules/Google. It states sessions can be finished until November 11, 2026, then Jules becomes read-only; wind-down is December 31, 2026. It points users to Google Antigravity and says Google is consolidating its agentic coding efforts.
- Official Jules changelog search result independently corroborates the December 31 date. Direct web opening failed; detailed dates and successor wording above are attributed to the screenshot, not an independently read full changelog.
- Assessment: possible migration opportunity and evidence that dependencies change. Also evidence of vendor consolidation and integration risk for PolyAgent. It does not prove abandoned demand, reduced competition or willingness to pay.
- An adapter does not automatically preserve remote session history, artifacts, permissions or execution state, nor resume a job on another provider. Workflow survival requires explicit storage/export/migration capabilities and verification. Do not reuse earlier shared-note assertions that replaceable adapters guarantee survival.
- Shared MISSION records a decision to omit Jules from application prose. This log retains it as internal research evidence; current draft was not edited here.

## Sources
- Direct founder messages in this chat, October 27–29, and two screenshots supplied October 29.
- [Workflow post](https://designlogic.substack.com/p/my-ai-dev-workflow-2026-first-half), July 14. Retrieved October 28.
- [Agent Teams account](https://designlogic.substack.com/p/multi-agent-orchestration-how-i-parallelized), July 28. Retrieved October 28; describes a successful local workaround as well as prior pain.
- [Tmux/Ghostty setup](https://designlogic.substack.com/p/tmux-and-ghostty-for-agent-orchestration), August 19. Retrieved October 28.
- [Claude Design official guide](https://support.claude.com/en/articles/14604416-get-started-with-claude-design), read October 29. Documents design-system sync and movement between design and code.
- [Jules official changelog](https://jules.google/docs/changelog/2026-10-29), search result retrieved October 29; full-page retrieval failed.
- Detailed local context: session-2026-10-28-workflow-evidence.md; session-2026-10-29-design-development-handoffs.md; MISSION.md.

## October 31: application voice revision
Parvez found v6 accurate but mundane and missing founder ambition. Requested product-first framing, more substance from Synapse, a team-focused answer, and long-term vision in Anything else. Created `drafts-v7-codex.md` as a proposed revision, preserving v6. Read updated Synapse Notion account and Kiro hooks article. Corrected deployment wording to rollout in progress; omitted ambiguous preference metric. Screenshots support visible blocked sessions, not universal counts. Revision is within field limits and awaits Parvez's voice review; no new positioning decision or submission occurred.

## November 1: founder-edited v8
Parvez selected Codex v7 as closest to his voice and supplied a rewritten Notion draft. Created `draft-v8-codex.md` from his wording, within all five field limits. Added cross-functional leadership and Right Station rollout scale from the resume; kept Synapse and Day 1 Associate Experience distinct. Confirmed PRs 153/154 merged through GitHub metadata, not live deployment. Queue is current; change explanations remain future-facing. V8 awaits founder final review. Proposed camera plus brief queue screen share for the next video step. No submission.

## November 1: v8 voice and scope corrections
Updated v8 in place after founder feedback: AI platforms and named examples, concrete session-reconstruction explanation, human-in-loop queue, architecture ownership, separate stakeholder alignment and operations rollout, NYU interpretability research, accelerator acceptance with grant, and PolyAgent-linked passion for harness UI/infrastructure/durable workflows. Removed voluntary pre-traction/incorporation sentence from Anything else; dedicated fields remain truthful. No unsupported 50–70 engineer claim added. User authorized a parallel agent for the video script; working section by section.

## November 1: video opening approved direction
Updated video-script-codex.md with founder-requested opening: orchestrate parallel coding agents across AI platforms, name Claude/Codex/Cursor/Antigravity to explain separate environments, state shared oversight benefit, then use queue as one concrete example. Removed repetition and corrected “review queue surfaces sessions.” Remaining video sections are still provisional; expanded opening requires updated timing.

Video opening refinement: founder approved benefit before platform examples; updated script to “shared view ... across these platforms,” then named Claude Code, Codex, Cursor and Antigravity. Queue remains a concrete example after the overall benefit.

Video opening wording approved: “orchestrate multiple coding agents running in parallel across AI platforms”; shared view lets developers “follow progress without switching between separate AI platforms and step in where needed.” Updated these two sentences in the script, preserving other edits.

Script editing preference: apply agreed wording directly to video-script-codex.md without requiring a separate update request. Changed the opening to “PolyAgent combines all that work into one interface while letting me keep using the agents I choose.”
