import { bench, describe } from 'vitest';
import { renderTable, StatusRow } from "../src/format.js";

const NUM_ROWS = 10000;

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

const rows = generateData(NUM_ROWS);

describe('format', () => {
  bench('renderTable', () => {
    renderTable(rows);
  });
});
