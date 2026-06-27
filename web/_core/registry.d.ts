import type { Vendor } from "./types.js";
import type { AgentAdapter } from "./adapters/adapter.js";
/** Build a live adapter for a vendor, wired to its real port + resolved key. */
export declare function buildAdapter(vendor: Vendor): AgentAdapter;
