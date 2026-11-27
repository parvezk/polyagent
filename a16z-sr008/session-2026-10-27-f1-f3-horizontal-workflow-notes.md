# PolyAgent — Speedrun SR008
## F1–F3 notes — Tue Oct 27, 2026 (Parvez's responses + Muse synthesis)
Companion to `session-2026-10-26-failure-cases-and-drafts-v1.md` in this folder.

## Parvez's responses (his framing, Oct 27)

**F1:** He loves the horizontal angle. Every other coding agent / agentic workflow is building the vertical stack — vertical agentic infrastructure, harnesses that cover end-to-end product or SDLC for one phase or one vendor. A product is not only technical or agentic infrastructure: what about design, creative, and product pipelines (not project-management tools like Linear, Asana, Jira)? Open questions he posed: what is the selling point here, who are the users, and why would they pay?

**F2:** This was the actual founding motivation at Vercel Ship (June 2026). His daily workflow already assigns vendors by job:
- Gemini for creative studio; Antigravity manager IDE for planning and project sync with Linear
- Nano Banana for media assets (animation, vector art); Midjourney for high-end graphics, video, motion design
- Claude for coding and development; Codex agents for PR review
- Jules for proactive feature PRs; Cursor for its agent panel
- Linear to invoke feature development by connected agents through issues
His realization: one harness, one vendor, or one model cannot handle all of that, and cannot move work upstream to downstream or between phases. His process moves discovery→design→dev, back design←dev, then design→dev→deploy, deploy→verify, or async jumps like verify→design to cross-check. The old SDLC sequence does not describe this, and he wants the pitch to think beyond it, against Anthropic's AI-native SDLC playbook (claude.com/resources/articles/the-ai-native-sdlc-playbook). He wrote the connection-layer thinking up in his Substack post "My AI Dev Workflow 2026" (designlogic.substack.com/p/my-ai-dev-workflow-2026-first-half). He flags himself that these are high-level thoughts that may or may not carry pitch weight.

**F3:** Same root: he built the POC for his own custom async creative-dev workflow because other agent orchestration workflows were simply the standard SDLC + CI/CD + observability/tracing models.

F4–F7: Parvez will respond separately.

## What his own Substack post already proves (checked Oct 27)

The post, written months before this application, contains the pitch's core claims in his own words:
- "The cycle from idea to ship rarely follows the usual sequence of discovery, design, develop, deploy and repeat. It's more like surfing."
- Two modes, ideation (taste, judgement, scoping) and execution (multi-agent orchestration, agent teams, sandboxes, review, permissions), running across three streams: Research, Engineering, Design & Creative, with work moving through the seams between them.
- "In the agentic era, the real value isn't in any single tool or platform, or even the workflow itself. It's in the seams: where an idea turns into a visual exploration, where research becomes a spec, and a spec flows through design into execution, review, and ship."
- "Every tool above is interchangeable; the handoffs between them are what compound."
This matters for the application: the horizontal thesis is documented, published, and lived, not invented for the form. It is founder-market fit evidence.

## How the horizontal story fits Anthropic's AI-native SDLC playbook (checked Oct 27)

The playbook itself abandons the linear model: the process becomes a loop across six stages (Plan, Design, Build, Test, Deploy, Maintain); each stage ends by committing an artifact (intent.md, spec.md, plan.md, the diff, the PR and its review findings) that the next stage reads; handover between stages is meant to be automated and triggering; human attention concentrates at the gates; and because build collapsed, the bottleneck moved to the stages left and right of it.
The gap the playbook leaves: it describes that loop inside one vendor's ecosystem, with Claude at every stage. Parvez's workflow is the evidence that serious builders do not work that way — they use the best tool per stage and per job. PolyAgent's pitch position is the layer that makes the loop work across vendors: carrying the artifact, the state, and the review gates from one phase's tool to the next, including moves backward and sideways that a linear pipeline does not model.

## Muse's blunt assessment of pitch weight

This material does carry weight, and it is the strongest version of the pitch, for three reasons: the thesis is published and lived rather than reverse-engineered for the form; Anthropic's own playbook makes the category legible to a reviewer in one line; and it separates PolyAgent from the many applicants whose "multi-agent orchestration" only means parallel coding agents in the Build phase.
The risk is scope sprawl reading as unfocused. The mitigation is a wedge/vision split that stays honest about what ships:
- **Wedge (ships today):** cross-vendor coding-agent dispatch, status, output, and follow-up across Claude, Jules, Cursor, and Gemini, in a CLI and web dashboard. The Build phase is where working adapters and APIs exist, so it is where the product starts.
- **Vision (what Speedrun funds):** the same control plane across the product cycle — research, design, build, review, deploy — carrying context at the seams instead of forcing the builder to rebuild it at every handoff.
Two hard limits on claims: Midjourney, Nano Banana / Flow, and the creative tools have no adapters in the shipped product, so the application must present the creative pipeline as the direction, not as integrations that exist today. And the current UI is a dispatch and status surface; the non-linear workflow layer is the build direction, not a shipped feature. Reviewers can check the GitHub repo, so the drafts stay inside what it shows.

## Selling point, users, payment — answering Parvez's F1 questions

- **Selling point:** continuity. Work does not reset at each tool or phase boundary. The builder keeps one operating picture of what is running where, what each agent produced, and what is waiting on their judgement, while each job runs on the vendor best at it.
- **First users:** AI-native solo builders and very small product teams whose work spans research, design, media, and code — creative technologists, design engineers, indie studios. People whose tool map already looks like Parvez's nine-tool list. Expansion: small product teams assigning parallel work across agents and phases.
- **Why they would pay:** they already pay separately for five to nine subscriptions, and the cost they feel is coordination time and context lost at handoffs, not generation. A control plane priced like one more subscription (a hypothesis in the $20–40/month pro range, teams per seat) only has to save a few handoffs a week. Pricing remains unvalidated and stays out of the form as a claim; willingness to pay is a stated launch test (see F6 in the v1 file).

## Draft delta proposed (not yet applied to v1)

### Startup description v2 (788 / 800)
Developers now run parallel work through coding agents from several vendors, each with its dashboard, status model, and way of returning work. PolyAgent is the control plane for that work. A developer assigns two to four parallel tasks to the agents best suited to them, whether Claude, Jules, Cursor, or Gemini, follows every run from one CLI and web dashboard, and reviews the outputs together instead of tab-switching between vendor tools. Each vendor sits behind a shared adapter, so new agents slot in without rebuilding the workflow. The coding loop is the first wedge. The longer build is the same control plane across the product cycle, carrying context as work moves between research, design, build, review, and back. PolyAgent placed top five of twenty-three at Vercel Ship NYC.

### Optional one-liner D (95 / 100)
`The control plane for running coding, design and creative agents across vendors in one workflow`
Use only if Parvez wants the vision in the one-liner; A–C in v1 stay safer because they describe what ships.

## Alignment update (later Oct 27, from MISSION.md / drafts-v2.md in the renamed shared folder)

- Shared folder was renamed to `/Users/parvezkose/dev2/_pocs/a16z-SR008`; MISSION.md there is the alignment doc and drafts-v2.md holds current working answers.
- Parvez rejected one-liners A/B/C: multi-vendor alone is not a reason to exist, parallel spawning is commoditizing, and why only engineers. New candidates: **D** human oversight of agent work (legible, approvable; fits DeepViz/explainability) and **E** — D aimed first at designers/PMs who ship through coding agents but cannot read diffs. The F1–F3 horizontal analysis in this file supports D/E: the person moving work across research, design, build, and review is often not a pure engineer, and the pain at the seams is oversight and continuity, not dispatch.
- Correction to claims discipline: side-by-side output comparison and one-prompt fan-out are NOT shipped (vision in the deck). Description v2's phrase "reviews the outputs together" must not be read as that feature; "pull results back into one place" is the safe wording.

## Still open
- Parvez's responses to F4, F5, F6, F7.
- Whether the wedge/vision split above is the story he wants to submit, and the D vs E pitch-angle pick.
- Founded date, "where did you learn about Speedrun", Loom/video — carried from v1 §6.
