# PolyAgent — Speedrun SR008 drafts v3 (Oct 28, 2026)

**Status: current working answers.** Replaces drafts-v2.md (kept for history). Char counts computed by script.

## Story in one paragraph
Audience stays as approved Oct 28: developers coordinating coding work across multiple agents. What changed is the problem: not dispatching agents (vendors are commoditizing that) but **making agent work understandable to the human who has to approve it** (Parvez's north star, Oct 28). PolyAgent's existing core (adapters, normalized status, one session store, CLI + dashboard) is the collection layer that review needs; the new piece is a review layer on top. Founder fit: thesis + DeepViz on explainable AI, and his own published posts on the attention/steering pain.

## What is shipped vs. what is being built (keep the drafts inside this)
- Shipped (source-level): cross-vendor dispatch, status, output, follow-up; CLI + web dashboard; Supabase auth.
- Being built, NOT shipped: review card (plain-language change summary, conflicts across runs, risk flags, recommendation), side-by-side comparison. Always phrase as "building".

## One-liner (limit 100)

- **1. North star (recommended)** (89): `PolyAgent makes the work of AI agent swarms understandable, so humans can approve it fast`
- **2. Developer-specific** (94): `PolyAgent helps developers understand and approve what their coding agents did, across vendors`
- **3. Closest to the Oct 28 approved line** (98): `PolyAgent helps developers track, understand and approve coding agents across vendors in one place`

## Startup description — 731/800

Developers now run several coding agents at once, often from different vendors. Writing code got cheap; the human became the bottleneck. Every run ends in a diff, a transcript and a status in a different dashboard, and someone has to work out which agent needs input, which drifted, and what is safe to merge. PolyAgent is the review layer for that work. Its core already pulls runs from Claude, Jules, Cursor and Gemini into one CLI and web dashboard, with one status model and follow-ups from one place. On top of it I am building the review card: what each agent changed and why in plain language, where runs conflict, risk flags, and a recommendation the human accepts or rejects. Vendor neutrality is a feature, not the pitch.

## Relevant experience — 862/1000

For seven years my work has been about one question: how do people understand what AI is doing? My NYU Tandon master's thesis (MS, Integrated Digital Media, 2019) was on explainable deep learning and visual interpretability, and I turned it into DeepViz, which went through the NYC Media Lab Combine accelerator to Demo Day in 2019. From 2022 to 2026 I was an engineer at Amazon in Middle Mile technology, where I built Synapse, a conversational AI system that generates interfaces on the fly (React, TypeScript, Python, Bedrock, retrieval, WebSocket streaming), deployed to 363 sortation sites. Before that, EY and a decade at Publicis Sapient building enterprise platforms. I run Claude, Cursor, Jules, Codex and Gemini agents daily, write publicly about orchestrating them, and built PolyAgent's core alone: 208 commits, four vendor integrations, CLI and web.

## Tell us more about the team — 799/1000

PolyAgent is a solo founder company today, and I am full-time on it. I designed and built the whole core myself: four vendor adapters behind one interface, the CLI, the Next.js dashboard, Supabase auth and state, tests and deploy, and demoed it live at Vercel Ship NYC in June. I am also the first user. Since July I have written publicly about running agent teams in parallel, and about the tmux and Ghostty setup I built just to see which agent needs me and when to step in. That workaround is the product insight: the hard part is not starting agents, it is understanding their work fast enough to approve it. The through-line from DeepViz to PolyAgent is the same: make AI systems legible to the person accountable for them. [CONFIRM: co-founder plans and any advisors, or delete this sentence.]

## Anything else — 802/1000

PolyAgent has no users or revenue yet and is not incorporated; I would rather say that plainly. What exists: a working cross-vendor core in a public repo, a live hackathon demo, and three public posts (July and August 2026) documenting the pain from my own daily work: tracking which agent needs input, catching drift, and redirecting agents at checkpoints. The pivot from dispatch to review came from pressure-testing that work this month: spawning parallel agents is becoming free inside every vendor; understanding what they did is not. [FILL IN by Fri if done: who you talked to and what you heard.] Next: ship the first review card on the existing dashboard, open-source the CLI, and put it in front of developers running three or more agents. Demo: loom.com/share/9eae6d05a1c24dfbab4b7b6d34858b98

## Fill-ins
- Full-time: **Full-time**. Number of full-time founders: **0** (form says unincorporated applicants enter 0; recheck live form). Total FTE: **1**.
- College: New York University (Tandon). Highest education: Master's.
- Primary category: Infrastructure / Dev Tools. Secondary: B2B / Enterprise Applications.
- Build: United States, New York (open to relocation). Founded: June 2026 recommended (repo created 2026-06-23).
- Website https://www.polyagent.pro · GitHub github.com/parvezk/polyagent · Loom demo link.
- Traction: "Pre-launch, no users. Working cross-vendor core; Vercel Ship NYC demo; public workflow posts." Funding: none.
- Still yours: phone, citizenship, years of experience, LinkedIn/X/portfolio URLs, where you heard about Speedrun.

## Confirm before submitting
- Amazon: "363 sortation sites", 2022–2026 dates, title. Publicis "a decade". "Top 5 of 23" (removed from drafts until confirmed; add back if true).
- DeepViz: your role and what it achieved (one concrete result would strengthen the experience answer).
- Team answer bracket: co-founder plans / advisors.
- "seven years" in experience = 2019 thesis to now; adjust if your AI work started earlier.

## Video (optional, high value)
60–90 seconds, your own voice: the 2019 DeepViz → Amazon → PolyAgent through-line, then 30s of screen showing several agent runs and the question "which of these do I approve?". A rough mock of the review card is enough if it's labelled as in progress.
