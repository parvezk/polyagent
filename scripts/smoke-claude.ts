// Live verify-gate for the Claude adapter. Requires ANTHROPIC_API_KEY in .env.local.
// Usage: npx tsx scripts/smoke-claude.ts ["prompt"]
import { buildAdapter } from "../src/registry.js";

const prompt = process.argv[2] ?? "Create a Python script that prints the first 10 primes, then run it.";

const adapter = buildAdapter("claude");
const session = await adapter.dispatch({ prompt });
console.log("Dispatched:", session);

for (let i = 0; i < 5; i++) {
  await new Promise((r) => setTimeout(r, 6000));
  const st = await adapter.getStatus(session.id);
  console.log(`poll ${i}: ${st.status}${st.summary ? " — " + st.summary.slice(0, 120) : ""}`);
}
