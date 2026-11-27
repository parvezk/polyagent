# PolyAgent: Speedrun SR008 answers (v7, Oct 31, 2026)

## One-liner

PolyAgent helps developers track, understand and approve coding agents across vendors in one place

## Startup description

PolyAgent is a multi-agent control panel for developers who run coding agents from more than one vendor. It dispatches work to Claude, Cursor and Gemini agents, tracks every run through one status model, and routes the human-in-the-loop moments (questions, reviews, approvals) into a single queue.

I built it because my own setup outgrew the vendor dashboards. On a normal day I have a Claude Code agent team working in tmux panes, cloud agents opening PRs, and scheduled agents reviewing my repos overnight. Each vendor shows only its own agents, so the sessions waiting on me pile up in four places and I find them late. PolyAgent's queue sorts every run into waiting on me, ready to review, running and failed. Next, each item will explain what the agent changed and why.

## Relevant experience

In 2019 I co-founded DeepViz and took it through NYC Media Lab's six-week Combine accelerator, pitched at demo day, and won a $10,000 grant. DeepViz grew out of my NYU master's thesis, which used data visualization to explain how deep neural networks reach decisions, so teams could catch bias and failure modes before deployment.

As a Staff Front End Engineer (L6) at Amazon, I proposed and led Synapse, a generative interface that replaced the dashboards warehouse managers juggle every shift. A manager asks a question, an agent pulls live facility data, and the UI composes the answer as a dynamic visualization. In a randomized controlled trial with 200 operators, about 60% preferred it to the legacy dashboards. It rolled out to 253 North American fulfillment centers and 110 sort centers. I also designed its MCP-based architecture for other teams' data.

My dev setup today is a Claude Code agent team, a lead and up to four teammates, which I write about at designlogic.substack.com.

## Tell us more about the team

I am a solo, full-time founder. I built PolyAgent end to end, from the vendor adapters and CLI to the web control panel and the queue, and demoed it at Vercel Ship NYC in June 2026.

I have taken this kind of product from idea to production before. I led Synapse from proposal through a 200-person trial to rollout across Amazon's network, directing three engineers and working with design, product and security. DeepViz taught me the founder side: building with a co-founder, pitching to judges and investors, and winning a grant.

I plan to bring on a co-founder who has taken a developer tool to market, ideally someone who has led developer relations or growth at an AI infrastructure company. Until then I run engineering with agent teams, which is the workflow PolyAgent is built for.

## Anything else

My goal for PolyAgent is a command center where people direct teams of agents from any vendor and stay in control of the result. Chat windows and terminal panes were built for one agent at a time. When ten agents work in parallel, the person in charge needs to see the whole system: what is running, what each agent decided, where they disagree, and what needs a human.

I have worked on versions of this problem since 2019. DeepViz made neural networks visible. Synapse replaced dashboards with interfaces generated for each question. PolyAgent brings generative interfaces and live visualization to agent loops, so a developer can read a whole team of agents at a glance and step in at the right moment.

I start with coding because it is my daily work and where agents are furthest along. The same control panel can later run agents for design, research or operations.

PolyAgent has no users or revenue yet, and I have not incorporated. Code: github.com/parvezk/polyagent

---

# Appendix: notes for Parvez and agents

Character counts (the live form counts line breaks too, so recount there): One-liner 98/100, Startup description 775/800, Relevant experience 994/1000, Tell us more about the team 790/1000, Anything else 975/1000.

What changed from v6, per Parvez's Oct 31 notes:

- Description opens with what PolyAgent is and who it is for, in the terms a16z reviewers use (multi-agent control panel, cross-vendor, human-in-the-loop). The pain comes second.
- Experience leads with DeepViz plus the Combine accelerator and grant, then the thesis. "Tandon" removed. "Unsafe or unfair" reworded.
- Synapse rewritten from the updated Notion story (fetched Oct 31): proposed and led it, generative interface with dynamic visualization, RCT with 200 operators, about 60% preferred it, rollout to 253 FCs and 110 sort centers, MCP-based integration architecture. Tech stack left out.
- Team answer stays on the team: solo founder, track record leading Synapse and DeepViz, a specific co-founder profile.
- Anything else carries the vision: a command center for agent teams across vendors, generative interfaces and live visualization for agent loops, the line from DeepViz to Synapse to PolyAgent.
- Commentary moved here.

Things to check:

- Scheduled agents: the description says "scheduled agents reviewing my repos overnight" without listing them. Your real scheduled agents were performance, UX and security. I did not list API design, schema or on-call agents because you don't run those yet, and a reviewer may ask. If you do run others, name them.
- Vendors listed as dispatch targets: Claude, Cursor, Gemini (shipped adapters, Jules dropped). Codex and Grok are not adapters yet, so they are not claimed.
- "Rolled out to 253 FCs and 110 sort centers": your story says rollout was in batches and still expanding when you left in April 2026. If not all sites were live, change to "began rolling out to".
- "pitching to judges and investors" at DeepViz: confirm investors were in the room at demo day.
- Co-founder profile in the team answer is my suggestion. Change it if you have someone else in mind.
- Substack facts used: agent team capped at four teammates (Jul 28 post), tmux/Ghostty setup with idle and task-done hooks (Aug 19 post).

Fill-ins unchanged: Full-time. Full-time founders 0 (unincorporated, per the form; recheck live form). Total FTE 1. Infrastructure / Dev Tools, secondary B2B / Enterprise. New York, US. Founded June 2026. Website https://www.polyagent.pro. Funding none. Yours: phone, citizenship, years of experience, LinkedIn/X/portfolio, where you heard about Speedrun.
