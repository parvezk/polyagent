import { PostHog } from "posthog-node";
import { randomUUID } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";

// ---------------------------------------------------------------------------
// CLI product instrumentation.
//
// The CLI historically shipped zero instrumentation (only the web app captured
// events), so there was no way to measure the dispatch flow. This module is a
// thin, best-effort PostHog wrapper: it captures only when a project key is
// configured and it NEVER throws — analytics must never break a dispatch.
// ---------------------------------------------------------------------------

/** Stable anonymous id for this machine, so wizard events string together into a person. */
const ANON_ID_PATH = join(homedir(), ".polyagent", "anon-id");

function resolveAnonId(): string {
  try {
    return readFileSync(ANON_ID_PATH, "utf8").trim() || writeAnonId();
  } catch {
    return writeAnonId();
  }
}

function writeAnonId(): string {
  const id = randomUUID();
  try {
    mkdirSync(dirname(ANON_ID_PATH), { recursive: true });
    writeFileSync(ANON_ID_PATH, id);
  } catch {
    // Read-only home / permissions: fall back to an ephemeral id for this run.
  }
  return id;
}

let client: PostHog | null | undefined;
let distinctId: string | undefined;

/** Lazily build the client. Returns null (and caches it) when analytics is unconfigured. */
function getClient(): PostHog | null {
  if (client !== undefined) return client;

  const key = process.env.POSTHOG_API_KEY ?? process.env.POSTHOG_KEY;
  if (!key) {
    client = null;
    return client;
  }

  try {
    client = new PostHog(key, {
      host: process.env.POSTHOG_HOST ?? "https://us.i.posthog.com",
      flushAt: 1, // short-lived CLI process: don't batch, send promptly
      flushInterval: 0,
    });
    distinctId = resolveAnonId();
  } catch {
    client = null;
  }
  return client;
}

/** Capture a CLI event. No-op (and swallows all errors) when analytics is unconfigured. */
export function capture(event: string, properties: Record<string, unknown> = {}): void {
  const ph = getClient();
  if (!ph) return;
  try {
    ph.capture({
      distinctId: distinctId ?? "polyagent-cli-anon",
      event,
      properties: { ...properties, $lib: "polyagent-cli" },
    });
  } catch {
    // Never let instrumentation break the CLI.
  }
}

/** Flush any pending events before the process exits. Safe to call unconditionally. */
export async function shutdownAnalytics(): Promise<void> {
  if (!client) return;
  try {
    await client.shutdown();
  } catch {
    // ignore
  }
}
