"use client";

import { useSyncExternalStore } from "react";
import type { QueueGroup, QueueSort, QueueVendor } from "@/lib/queue";

export type QueueLayout = "list" | "board";

export interface QueuePrefs {
  layout: QueueLayout;
  sort: QueueSort;
  vendors: QueueVendor[]; // empty = all vendors
  collapsed: QueueGroup[]; // list view groups the viewer folded
}

export const DEFAULT_QUEUE_PREFS: QueuePrefs = {
  layout: "list",
  sort: "recent",
  vendors: [],
  collapsed: [],
};

const KEY = "polyagent.queue.prefs";
const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cached: QueuePrefs = DEFAULT_QUEUE_PREFS;

function parse(raw: string | null): QueuePrefs {
  if (!raw) return DEFAULT_QUEUE_PREFS;
  try {
    const p = JSON.parse(raw) as Partial<QueuePrefs>;
    return {
      layout: p.layout === "board" ? "board" : "list",
      sort: p.sort === "vendor" ? "vendor" : "recent",
      vendors: Array.isArray(p.vendors) ? p.vendors : [],
      collapsed: Array.isArray(p.collapsed) ? p.collapsed : [],
    };
  } catch {
    return DEFAULT_QUEUE_PREFS;
  }
}

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return cachedRaw ?? null;
  }
}

function getSnapshot(): QueuePrefs {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cached = parse(raw);
  }
  return cached;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function write(next: QueuePrefs) {
  const raw = JSON.stringify(next);
  try {
    window.localStorage.setItem(KEY, raw);
  } catch {
    /* storage unavailable: keep it in memory for this page */
  }
  cachedRaw = raw;
  cached = next;
  listeners.forEach((l) => l());
}

// View, sort, filter and folded groups, remembered per browser.
export function useQueuePrefs() {
  const prefs = useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_QUEUE_PREFS);
  const update = (patch: Partial<QueuePrefs>) => write({ ...getSnapshot(), ...patch });
  return [prefs, update] as const;
}
