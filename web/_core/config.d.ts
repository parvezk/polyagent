import type { Vendor } from "./types.js";
/** Where dispatched sessions are persisted. */
export declare const STATE_PATH: string;
/** Resolve a vendor's API key from the environment, or throw a helpful error. */
export declare function resolveKey(vendor: Vendor): string;
