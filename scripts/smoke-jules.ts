// Live verify-gate for the Jules adapter. Requires JULES_API_KEY in .env.local
// and the Jules GitHub App installed on the target repo.
// Usage: npx tsx scripts/smoke-jules.ts <owner/repo> ["prompt"]
import { buildAdapter } from "../src/registry.js";

const repo = process.argv[2];
const prompt = process.argv[3] ?? "Open the README and summarize what this project does.";

if (!repo) {
  console.error("Usage: npx tsx scripts/smoke-jules.ts <owner/repo> [prompt]");
  process.exit(1);
}

const adapter = buildAdapter("jules");
const session = await adapter.dispatch({ prompt, repo });
console.log("Dispatched:", session);

for (let i = 0; i < 5; i++) {
  await new Promise((r) => setTimeout(r, 6000));
  const st = await adapter.getStatus(session.id);
  console.log(`poll ${i}: ${st.status}${st.summary ? " — " + st.summary.slice(0, 120) : ""}`);
}
