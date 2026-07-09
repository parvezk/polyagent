import { renderTable, StatusRow } from "../src/format.js";

const NUM_ROWS = 500000;
const ITERATIONS = 10;

function generateData(count: number): StatusRow[] {
  const data: StatusRow[] = [];
  for (let i = 0; i < count; i++) {
    data.push({
      vendor: `Vendor ${i % 10}`,
      id: `session-id-${Math.random().toString(36).substring(7)}`,
      label: `Test Label ${Math.random().toString(36).substring(7)}`,
      status: i % 2 === 0 ? "running" : "completed",
      lastUpdate: new Date().toISOString(),
    });
  }
  return data;
}

console.log(`Generating ${NUM_ROWS} rows...`);
const rows = generateData(NUM_ROWS);

console.log("Warming up...");
renderTable(rows.slice(0, 100)); // warmup

console.log(`Running benchmark (${ITERATIONS} iterations)...`);
const start = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  renderTable(rows);
}
const end = performance.now();

const totalMs = end - start;
const avgMs = totalMs / ITERATIONS;

console.log(`Total time: ${totalMs.toFixed(2)}ms`);
console.log(`Average time per renderTable call: ${avgMs.toFixed(2)}ms`);
