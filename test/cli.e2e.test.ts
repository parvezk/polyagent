import { describe, it, expect, beforeEach } from "vitest";
import { execFile } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// End-to-end smoke tests that spawn the REAL commander entrypoint (src/cli.ts
// via tsx, i.e. near-production) as a subprocess. No vendor API keys and no
// network: state is isolated to a temp file via POLYAGENT_STATE_PATH, and the
// registry is swapped for the deterministic fake via POLYAGENT_FAKE_ADAPTERS.

const CLI = fileURLToPath(new URL("../src/cli.ts", import.meta.url));
const TSX = fileURLToPath(new URL("../node_modules/.bin/tsx", import.meta.url));

const CLI_TIMEOUT = 30_000;

interface RunResult {
  code: number;
  stdout: string;
  stderr: string;
}

function runCli(args: string[], env: Record<string, string> = {}): Promise<RunResult> {
  return new Promise((resolve) => {
    execFile(
      TSX,
      [CLI, ...args],
      { env: { ...process.env, ...env }, timeout: CLI_TIMEOUT },
      (err, stdout, stderr) => {
        // execFile passes a non-null err with a numeric `code` on non-zero exit.
        const code =
          err && typeof (err as { code?: unknown }).code === "number"
            ? (err as { code: number }).code
            : 0;
        resolve({ code, stdout, stderr });
      },
    );
  });
}

describe("polyagent CLI (e2e)", () => {
  let statePath: string;
  let baseEnv: Record<string, string>;

  beforeEach(() => {
    const dir = mkdtempSync(join(tmpdir(), "pa-e2e-"));
    statePath = join(dir, "state.json");
    baseEnv = { POLYAGENT_STATE_PATH: statePath, POLYAGENT_FAKE_ADAPTERS: "1" };
  });

  // -------------------------------------------------------------------------
  // Deterministic validation branches (no adapter built, no keys needed)
  // -------------------------------------------------------------------------

  it(
    "dispatch with a prompt but no --vendor exits 1 with a helpful message",
    async () => {
      const { code, stderr } = await runCli(["dispatch", "do a thing"], baseEnv);
      expect(code).toBe(1);
      expect(stderr).toContain("--vendor is required");
    },
    CLI_TIMEOUT,
  );

  it(
    "dispatch --vendor jules without --repo exits 1 with a helpful message",
    async () => {
      const { code, stderr } = await runCli(
        ["dispatch", "--vendor", "jules", "fix the bug"],
        baseEnv,
      );
      expect(code).toBe(1);
      expect(stderr).toContain("Jules needs a repo");
    },
    CLI_TIMEOUT,
  );

  it(
    "status with no sessions prints the empty-state message",
    async () => {
      const { code, stdout } = await runCli(["status"], baseEnv);
      expect(code).toBe(0);
      expect(stdout).toContain("No sessions yet");
    },
    CLI_TIMEOUT,
  );

  it(
    "status <unknown id> with no sessions reports the id is missing",
    async () => {
      const { code, stdout } = await runCli(["status", "nope"], baseEnv);
      expect(code).toBe(0);
      expect(stdout).toContain("No session with id nope");
    },
    CLI_TIMEOUT,
  );

  // -------------------------------------------------------------------------
  // Happy path against fake adapters: dispatch → persist → status → followup
  // -------------------------------------------------------------------------

  it(
    "dispatch persists a session that status then followup can find",
    async () => {
      const dispatch = await runCli(
        ["dispatch", "--vendor", "claude", "Refactor the session store"],
        baseEnv,
      );
      expect(dispatch.code).toBe(0);
      expect(dispatch.stdout).toContain("Dispatched claude session fake_claude_1 (running)");
      expect(dispatch.stdout).toContain("label: Refactor the session store");

      const status = await runCli(["status"], baseEnv);
      expect(status.code).toBe(0);
      expect(status.stdout).toContain("fake_claude_1");

      const followup = await runCli(["followup", "fake_claude_1", "any update?"], baseEnv);
      expect(followup.code).toBe(0);
      expect(followup.stdout).toContain("Sent follow-up to claude session fake_claude_1");
    },
    CLI_TIMEOUT,
  );

  it(
    "followup to an unknown session exits 1",
    async () => {
      const { code, stderr } = await runCli(["followup", "ghost", "hi"], baseEnv);
      expect(code).toBe(1);
      expect(stderr).toContain("No session with id ghost");
    },
    CLI_TIMEOUT,
  );
});
