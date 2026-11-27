# PolyAgent: Speedrun SR008 drafts v7 (Oct 31, 2026)

Rewritten from drafts-v6.md against Parvez's Oct 31 feedback. Paste as plain text; counts computed, recount in the live form (it counts line breaks). Sources pulled for this pass: his edited Synapse story in Notion (fetched Oct 29), his Substack posts "My AI Dev Workflow 2026," "Multi-Agent Orchestration," and "Agent Hooks, Steering & Skills," and his Jules screenshots (scheduled agents on parvezk/polyagent: Bolt, Palette, security tasks).

## What changed, mapped to his feedback
- **Soul:** every section now leads with conviction and specifics (the legibility through-line, the randomized-trial result, the north-star paragraph) instead of process narration.
- **Startup description restructured:** paragraph 1 defines PolyAgent first (cross-vendor multi-agent panel, the problem, who it is for), paragraph 2 is his lived pain (the stalled scheduled-agent queue).
- **Synapse:** now uses his "generates the interface, with dynamic visualizations" framing and the substance from his edited Notion story: plain-language questions, interface composed live, about 60 percent of 200 randomized-trial users preferred it, rollout to 253 fulfillment centers and 110 sort centers.
- **DeepViz reordered exactly as he asked:** co-founded from the NYU thesis, then the six-week Combine accelerator, demo day, and $10,000 grant, then what it did. "Tandon" removed. "Unsafe or unfair behavior" replaced with "its reasoning could be inspected, its errors caught."
- **Experience, third paragraph upgraded:** no longer the flat "written about how I manage them" line. It now states the actual practice, multi-agent orchestration with Claude Code agent teams and hooks/skills running the operational layer, and names the workflow posts.
- **Team tightened to team:** solo/full-time/what he built, one first-user paragraph, the legibility through-line, and a co-founder paragraph with a position (building covered, distribution is the gap, the search is deliberate) instead of the one-line version.
- **Anything else rewritten around the north star:** generative interfaces, dynamic visualization, the human-judgement/agent-execution loop, and the adopted pitch line (artifact, state, review gate, backward and sideways moves). The month-by-month pivot narration is gone; the Jules shutdown survives as a single clause supporting the permanence argument, and can be deleted without breaking anything if he still wants it out.

## One-liner (98/100) — unchanged, his pick
PolyAgent helps developers track, understand and approve coding agents across vendors in one place

## Startup description (794/800)
PolyAgent is a cross-vendor multi-agent panel for developers who run coding agents from several companies. Every vendor keeps its agents in its own product, with its own queue and hand-back, so there is no single place to dispatch work, track it, and approve what returns. PolyAgent is that place.

I built it from my own sprawl: scheduled agents run nightly on my repos, sweeping security findings, UX and accessibility problems and performance regressions, beside teams I steer by day. Last week, every session they had opened on two repos sat stalled at "needs clarification," waiting on me, in separate tools. PolyAgent puts every run in one queue: waiting on me, ready to review, running, failed, so work needing a human comes first. Next, each run will say what the agent changed and why.

## Relevant experience (984/1000)
At Amazon (Staff Front End Engineer, L6, Middle Mile technology) I proposed and led Synapse end to end. Synapse replaced the sort centers' dashboards with a conversational interface: operators ask in plain language and Synapse generates the interface for the answer, with dynamic visualizations composed live. About 60 percent of 200 trial users preferred it to the legacy dashboards, and it rolled out to 253 fulfillment centers and 110 sort centers.

In 2019 I co-founded DeepViz from my NYU master's thesis and went through NYC Media Lab's six-week Combine accelerator, pitched at demo day, and won a $10,000 grant. It showed, through interactive visualization, how a deep neural network reaches a decision, so its reasoning could be inspected, its errors caught.

Today I build through multi-agent orchestration, running Claude Code agent teams and hooks and skills for the operational layer, documented on my Substack in "My AI Dev Workflow 2026" and "Multi-Agent Orchestration."

## Tell us more about the team (963/1000)
I am the only founder, I work on PolyAgent full-time, and I built the current product myself: four vendor adapters behind one interface, the CLI and the Next.js dashboard, Supabase auth and state, tests and deployment, demoed live at Vercel Ship NYC in June 2026.

I am also its first user. The queue at the center of PolyAgent exists because my own scheduled agents kept stalling while they waited for my answers, inside tools I had to open one at a time.

Legibility is the through-line of my work: DeepViz made a neural network's reasoning visible, Synapse made warehouse operations answerable in plain language, and PolyAgent makes agent work understandable to the human who has to approve it.

On the team itself, I know my gap precisely: building is covered and distribution is not. I am looking for a co-founder who has taken a developer product to market and wants to own that side, and finding that person is one of the reasons I am applying to Speedrun.

## Anything else (992/1000)
PolyAgent has no users or revenue yet, and I have not incorporated. Code is public at github.com/parvezk/polyagent; demo at loom.com/share/9eae6d05a1c24dfbab4b7b6d34858b98.

What drives me is the long build. I have spent years on generative interfaces and dynamic visualization, and on the loop between human judgement and an agent's execution. PolyAgent's north star is to be the layer that carries the artifact, the state, and the review gate across the tools a builder uses, as work moves through research, design, build and review, and backward and sideways as it needs to. Vendors keep replacing agents and models; Google retired Jules, one I used daily, this month. The layer where the human understands, steers, and approves the work can stay neutral and permanent.

Next month I ship change summaries in the queue, run it on my own repos daily, and put it in front of developers who run three or more agents. I am based in New York and can relocate to San Francisco for the residency.

## Flags before submitting (his call)
1. **The roster line in the description.** His feedback wanted the scheduled-agent roster to read broader than the copied "performance, UX and security" (backend design work, on-call agents). The form text stays truthful to his Jules screenshots, which show exactly Bolt (performance), Palette (UX), and the security tasks, reordered so security leads and the trio reads as a sweep rather than a feature list. If he wants the broader framing in the form, the honest version needs agents he actually runs; say the word and that one clause gets swapped.
2. **Vercel Ship finalist status** still says only "demoed live," per the v6 verification note (PolyAgent was not visible in the public showcase's first 24 projects). Add "as one of five finalists" only with the Vercel email or event page in hand.
3. **The Jules clause in Anything else** is one sentence ("Vendors keep replacing agents and models; Google retired Jules, one I used daily, this month."). Deleting it drops that answer to about 890 characters and loses nothing structural.
4. Amazon dates (2022 to 2026) remain out, as in v6. DeepViz co-founder unnamed, as in v6.
