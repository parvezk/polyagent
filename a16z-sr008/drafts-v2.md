# PolyAgent — Speedrun SR008 drafts v2 (Oct 27, 2026)

Working answers. Char counts are computed, limits from the form. Earlier v1 lives in `session-2026-10-26-failure-cases-and-drafts-v1.md`.

## 1. Pitch angle — historical alternatives; October 28 choice below

| Angle | Story | Who | Risk |
|---|---|---|---|
| **A. Neutral control plane** | Switzerland above competing agent vendors | Devs using 2+ vendors | Sounds horizontal, "tool not company" |
| **B. Developer workflow (recommended)** | One place to run, track and review parallel agent work; best-of-N comparison next | Power users, indie builders, staff engineers running 2+ cloud agents | Must show real devs feel this pain (do the conversations) |
| **C. Agent ops for teams** | Govern, audit, cost-track agents across vendors | Eng managers at 20–200 person cos | Furthest from what ships; enterprise sales story with zero users |

Why B: it matches what the product does today, it is demo-able in the Loom, and it keeps A as the "why we win" line and C as the expansion story if asked in the interview.

## 2. One-liner (limit 100)

- **A (neutral layer)** (83): `The neutral control plane for coding agents across Claude, Cursor, Jules and Gemini`
- **B (developer workflow, recommended)** (81): `One place for developers to run, track and review coding agents from every vendor`
- **B-alt (best-of-N, roadmap)** (87): `Run coding agents from every vendor in parallel on one task, then merge the best result`
- **C (team agent ops)** (87): `Agent ops for engineering teams: dispatch, track and audit coding agents across vendors`

## 3. Startup description (angle B) — 795/800

Developers now split feature work across cloud coding agents from several vendors: Claude, Cursor, Jules, Gemini. Each has its own dashboard, status model and way of handing work back, so four agents in parallel means four tabs and no shared picture of what is done. PolyAgent is one control plane for it. You dispatch each task to the agent that fits, watch every run in one normalized view (19 vendor states mapped to 5), send follow-ups, and pull results back from a CLI or web dashboard. Each vendor sits behind one four-method adapter, so adding the next agent takes days, not a rewrite. Next: send one task to several agents at once and compare outputs side by side, so you merge the best result, not the first. No vendor will fairly show a rival's agents, so this layer has to be neutral.

## 4. Relevant experience — 832/1000

I have shipped product for 15+ years, and I have done the zero-to-one loop before. In 2019 I took DeepViz, an explainable-ML product built from my NYU research, through the NYC Media Lab Combine accelerator to Demo Day. From 2022 to 2026 I was an L6 engineer at Amazon in Middle Mile technology, where I built Synapse, a conversational AI system that generates interfaces on the fly (React, TypeScript, Python, Bedrock, retrieval over WebSocket streaming), deployed to 363 sortation sites worldwide. Before that: senior engineer at EY and a decade at Publicis Sapient building enterprise platforms. Master's in IT from NYU, thesis on explainable deep learning. I run Claude Code, Cursor, Jules and Gemini every day. I built PolyAgent alone because I needed it: 208 commits in eight weeks and a top 5 of 23 finish at Vercel Ship NYC.

## 5. Tell us more about the team — 907/1000

PolyAgent is a solo build today, and the build is the proof. I designed and shipped the whole system myself: four vendor adapters, the CLI, the Next.js dashboard, Supabase auth and state, tests and deploy, then demoed it live to a top 5 finish at Vercel Ship NYC. I am the user: I run parallel work across four agent vendors daily, so I feel every gap in the workflow before a customer has to explain it. I have also been through an accelerator before (NYC Media Lab, DeepViz), so I know the gap between a good build and a company is distribution, users and team. That is exactly what I am working on now. I do not have a co-founder yet; I am looking for a go-to-market or developer-relations partner and want the Speedrun network to help me find the right one. My mix of staff-level engineering and explainable-AI research is why the product bet is legibility: seeing what every agent is doing at a glance.

## 6. Anything else (fill the bracket before submitting) — 878/1000

PolyAgent has no users yet and has not launched publicly. I would rather say that plainly than dress it up. What exists is a working product across four vendor APIs, a public repo, and a live demo that finished top 5 of 23 at Vercel Ship NYC. This week I am talking to developers who pay for two or more coding agents. [FILL IN by Fri: number of conversations and the one thing you learned, e.g. 'In 10 conversations, 7 said their real pain is reviewing outputs, not dispatching'.] Next is a public open-source launch of the CLI with a Substack and X write-up, then the side-by-side output comparison. I am applying to Speedrun because it is the forcing function that turns a strong solo build into a company: first users, a distribution plan and a co-founder. If the wedge needs to narrow, I want to learn that in the room. Demo: loom.com/share/9eae6d05a1c24dfbab4b7b6d34858b98

## 7. Fill-ins
- Full-time: **Full-time**. Full-time founders: **0 under the saved form instructions for unincorporated applicants** (confirmed unincorporated October 28; verify live wording). Total FTE: **1**.
- CEO: Parvez Kose, pxkose@gmail.com (as shown on form), phone [you].
- Country/City: United States, New York. Citizenship: [you]. College: New York University. Highest education: Master's.
- Years of experience: **15+** [confirm exact number]. Technical end-to-end: **Yes**.
- LinkedIn linkedin.com/in/parvezkose · GitHub github.com/parvezk · X x.com/parvez__ · Portfolio parvezkose.com [confirm each].
- Startup name: PolyAgent. Website: https://www.polyagent.pro
- Primary category: Infrastructure / Dev Tools. Secondary: B2B / Enterprise Applications.
- Build: United States, New York (open to relocation).
- Founded: **June 2026** recommended (repo created 2026-06-23).
- Traction: "Pre-launch, no users. Working product across 4 vendor APIs; top 5/23 Vercel Ship NYC; demo: Loom link." Add conversation count once done.
- Funding history: none. Active round: none.
- Where did you learn about Speedrun: [you].

## 8. Facts to confirm before submitting
- "363 sortation sites", "L6", "decade at Publicis Sapient", years of experience, NYU degree name. These came from an earlier session, not from a source I checked.
- "Top 5 of 23" at Vercel Ship NYC.
- "19 vendor states mapped to 5" (from the launch deck).

## 9. Highest-leverage moves left this week
1. **Talk to 10 developers** who pay for 2+ coding agents (X, Vercel community, ex-Amazon peers). Speedrun reads this as slope. Put the result in §6.
2. **Record a 1–2 min team video** on your phone: who you are, DeepViz to Amazon to PolyAgent, a 30s screen demo. No script polish, no AI voice.
3. Submit Thursday night if possible; early apps get the first look.

## October 28 update — authoritative over older alternatives above
Parvez approved the initial audience: developers coordinating coding tasks across multiple agents. Approved provisional one-liner (88 characters):

PolyAgent helps developers dispatch and track coding agents across vendors in one place.

The existing startup description is not submission-ready: remove unsupported categorical vendor claims, avoid implying all vendor APIs were live-verified, and do not present proposed conversations as completed work. Sections above remain working drafts, not approved final answers. The example interview numbers in section 6 are placeholders, not evidence.

Degree clarification from Parvez: MS is the graduate degree, Information Technology the major, and Integrated Digital Media a category under it. Short alternative that avoids taxonomy: “MS, NYU Tandon; research in explainable deep learning and visual interpretability.”

Workflow-derived problem paragraph (proposed, not founder-approved):

Running more coding agents also creates coordination work: checking progress, spotting blocked sessions, and deciding when to intervene. I experienced this while building an NYC mobility visualization and built a local command center using Agent Teams, tmux, status displays, and notifications. PolyAgent starts with dispatch and tracking across coding-agent vendors. I am testing which coordination problems remain when developers work across those tools.
