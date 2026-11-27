# PolyAgent — a16z Speedrun SR008
## Session working file v1 — Mon Oct 26, 2026 (Muse, Speedrun side chat)

Shared folder for all agents on this: `/Users/parvezkose/dev2/_pocs/a16z-speedrun-26`
Deadline: Sun Nov 1, 2026, 11:59pm PT. Rolling reviews, earlier is better.
Parvez's submission target: **by or before Friday night Oct 30** — no Halloween scramble.
He submits himself. Drafts are prepared with him in chat / in this folder.

## 1. The five decisions — status Oct 26

1. **Full-time? YES.** Locked by Parvez Oct 26.
2. **Solo founder? YES, for now.** Solo founder, 1 founder, 1 FTE on the form.
3. **Build location: NYC on the form, open to relocation.** Covers the 12-week SF residency honestly.
4. **Founded date: TBD — Parvez's call still open.** Product is not launched beyond hackathon participation.
   - Recommendation (Muse): **June 2026.** The GitHub repo was created Jun 23, 2026, the MVP plan is dated 2026-06-23, and the first working version was publicly demoed at Vercel Ship NYC. The Linear project was created Mar 10, 2026, but that was planning; June is when a product existed in public. Defensible either way, June is easier to evidence.
5. **No users — the central challenge.** Story, pitch, problem, target user, target domain, and target company are all openly incomplete. That is the work of this session (sections 3–4), not something to paper over.

## 2. Verified facts (checked Oct 21–26, 2026)

- GitHub `parvezk/polyagent`: public, 208 commits, created 2026-06-23. Adapters for Claude (Anthropic Managed Agents SDK), Jules (raw REST), Cursor (`@cursor/sdk`), Gemini (Interactions/Antigravity REST), all behind a shared `AgentAdapter` port (`dispatch` / `getStatus` / `getOutput` / `sendFollowup`). CLI + Next.js web dashboard, Supabase auth + RLS sessions, tests with fakes, Playwright e2e.
- Vercel Ship NYC hackathon: top 5 of 23, demoed live.
- Linear project P-PK-16 (created Mar 10, 2026): Milestone 1 CLI dispatch+status 75%, Milestone 2 web dashboard + Supabase + deploy 63%, Milestone 3 vendor expansion + repo selection 42%. Claude and Jules adapters In Review, Gemini adapter In Progress, Cursor adapter Done, web dashboard Done.
- A Loom demo video link exists in the Linear project overview.
- `www.polyagent.pro` is live with a sign-in page: "Vendor-agnostic agent control plane."
- **Do NOT use the raw Vercel deployment URL** (`polyagent-ir216ualk-...vercel.app`) in the application — checked Oct 26, it sits behind Vercel deployment protection (login wall). Use polyagent.pro, GitHub, and the Loom link.
- Rose Johnson (Partner, a16z Speedrun) emailed Oct 23 that the SR008 application was started but never submitted, noting earlier submissions get more review time.
- No users, no revenue, no funding, not publicly launched. Nothing in the drafts below claims otherwise.

## 3. Failure cases — reviewer objections, answered early

**F1. "A horizontal control plane with no users is a tool, not a company."**
The strongest objection, and true of the broad framing. Answer with the narrow wedge already written in Parvez's own Linear plan: assign 2–4 parallel feature tasks to different coding agents, track progress in one place, review and merge outputs through a shared control pane. Sell that workflow first; the horizontal layer is where it expands after the wedge lands. Do not lead with "universal agent platform."

**F2. "The vendors will build this themselves."**
Each vendor is building visibility into its own agents and has no incentive to surface a competitor's runs neutrally. Cursor will not give Jules equal billing in its dashboard. A neutral layer only works if it belongs to none of them, in the same way developers trust a neutral tool to sit above competing clouds. That neutrality is the product, and it is also why an independent company has to build it.

**F3. "Orchestration UIs already exist (Conductor, Superset, Emdash, vendor dashboards)."**
Parvez already tracks these in his Linear backlog. The ones developers know are mostly local, single-ecosystem, or tied to one vendor's agents. PolyAgent's difference is cloud agents across four vendors behind one adapter model, with the same dispatch and status loop in a CLI and a web dashboard, plus a local layer (Polyshell) planned for skills and configuration portability. Keep this claim scoped to what ships today: cross-vendor dispatch, status, output, and follow-up.

**F4. "No traction."**
Unavoidable and stated plainly in the Anything Else draft. What exists instead: a working product across four vendor APIs, 208 commits, a hackathon finalist demo in front of the Vercel community, and a founder who uses these agents daily in his own workflow. The application frames Speedrun as the distribution and company-building step, which matches what the program says it funds at this stage.

**F5. "Solo founder risk."**
Answered in the Team draft: he built the whole stack alone, which is evidence for the technical bar; the gap is named honestly as distribution and company building, and finding a co-founder is an explicit goal of being in the program rather than a problem hidden from reviewers.

**F6. "Who pays, and for what?"**
Hypothesis only, labelled as such if asked: developers and small teams who already pay for two or more agent subscriptions and run parallel work would pay for unified dispatch, status, history, and output comparison. Pricing is unvalidated. Do not put a pricing claim in the form; the honest sentence is that willingness to pay is one of the first things the launch is designed to test.

**F7. "Why now?"**
From Parvez's own Linear research notes (Pragmatic Engineer, "Why are cloud agents suddenly a thing?"): coding models became good enough for long autonomous tasks, MCP and skills made context and tooling mainstream, context windows reached a million tokens, and cloud capacity matured. A year earlier, parallel cloud agents were a demo; now they are a daily workflow with a coordination problem attached.

## 4. Recommended positioning (needs Parvez's sign-off)

- **Target user (primary):** developers who already run more than one cloud coding agent — power users, indie builders, and staff-level engineers parallelizing feature work across Claude, Jules, Cursor, and Gemini.
- **Target user (expansion):** small product teams assigning parallel work across agents and needing one place to review it.
- **Target domain:** developer tools for agentic coding.
- **Form categories:** Primary — Infrastructure / Dev Tools. Secondary — B2B / Enterprise Applications.
- **Company in one line:** the neutral control plane above competing coding-agent vendors.
- The earlier creative / AI-UX vertical idea stays parked. It would require a different product surface, and nothing in the shipped build points there yet.

## 5. Draft form answers v1 (all within form limits)

### One-sentence pitch — pick one (limit 100)
- A (94): `One control plane to dispatch and track coding agents across Claude, Cursor, Jules, and Gemini`
- B (90): `PolyAgent lets developers run parallel coding agents across vendors from one control plane`
- C (99): `Assemble the best agent for every job: dispatch and track coding agents across vendors in one place`

### Startup description (735 / 800)
Developers now run parallel feature work through cloud coding agents from several vendors at once, and each vendor has its own dashboard, status model, and way of returning work. PolyAgent is the control plane for that work. A developer assigns two to four parallel tasks to the agents best suited to them, whether Claude, Jules, Cursor, or Gemini, follows every run from one CLI and web dashboard, sends follow-ups, and reviews the outputs together instead of tab-switching between vendor tools. Each vendor sits behind a shared adapter, so new agents can be added without rebuilding the workflow. PolyAgent placed top five of twenty-three at the Vercel Ship NYC hackathon and the core dispatch and tracking loop is built and working.

### Relevant experience (752 / 1,000)
Parvez Kose is a staff-level software engineer with more than fifteen years building product at scale. At Amazon from 2022 to 2026, at L6 in Middle Mile technology in New York, he built Synapse, a conversational AI system that generated dynamic interfaces with React, TypeScript, Python, Bedrock and retrieval over WebSocket streaming, deployed to 363 sortation sites worldwide. Before Amazon he was a senior engineer at EY and spent a decade at Publicis Sapient building platforms for enterprise clients. He holds a master's in information technology from NYU, where his thesis covered explainable deep learning and visual interpretability. He works daily across Claude Code, Cursor, Jules and Gemini, and PolyAgent grew directly out of that workflow.

### Tell us more about the team (747 / 1,000)
PolyAgent is currently a solo founder build. Parvez designed and built the full system himself, from the vendor adapters and CLI to the Next.js dashboard, Supabase state and auth, and the deployed web product, and he demoed it to a top five finish of twenty-three projects at Vercel Ship NYC. The honest gap is distribution and company building rather than product. He has no co-founder today and is open about looking for one through building in public and the Speedrun network. His background combines staff-level engineering depth with a visual communication degree and a master's thesis on explainable AI, which is why the product bet is on legibility: a control plane developers can actually read at a glance while several agents run at once.

### Anything else we should know (763 / 1,000)
PolyAgent has not launched publicly yet and has no users, and I am applying with that on the table rather than dressed up. What exists is a working product: four vendor adapters behind one interface, a CLI and web dashboard, two hundred plus commits, and a hackathon finalist demo at Vercel Ship NYC. The next step is a public open-source launch of the harness, with the launch writing already planned as a Substack series and an X announcement. I am applying to Speedrun because the program is the forcing function that turns a strong solo build into a company, with first users, a distribution plan, and a team. If the wedge needs to narrow from the horizontal control plane to one workflow, I would rather learn that in the room than keep polishing in private.

### Simple fill-ins
- Full-time: Yes. Founders full-time: 1. Total FTE: 1.
- Startup name: PolyAgent. Website: https://www.polyagent.pro
- Where do you intend to build: United States, New York (open to relocation — SF residency).
- When founded: TBD (recommendation: June 2026, see §1.4).
- Links: LinkedIn linkedin.com/in/parvezkose, GitHub github.com/parvezk, X x.com/parvez__, portfolio parvezkose.com.

## 6. Still open — needs Parvez

1. Founded month/year: June 2026 as recommended, or March 2026 (Linear inception)?
2. One-liner A, B, or C?
3. Categories as recommended (Dev Tools primary, B2B secondary)?
4. "Where did you learn about Speedrun?" — what is the true answer (X, the Rose Johnson email only flagged the unsubmitted draft; the original source is his to name).
5. Traction / additional info: attach the Loom demo link where the form allows, yes/no on a short team video in the remaining days. A deck is out of scope unless he decides otherwise — it eats the launch window.
6. Positioning in §4: sign off, or push back on the primary user.

## 7. Launch-collateral reuse (same writing, three surfaces)

- The Startup description above is the core of the MVP launch announcement with the hackathon sentence swapped for the launch date.
- The Anything Else draft's first paragraph is the honest opening of the Substack launch post: what exists, what does not, and why it is going public now.
- One-liner B is the X announcement hook; one-liner C ("Assemble the best agent for every job") is the GitHub README tagline already in the repo.
