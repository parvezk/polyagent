import type { SessionStatus } from "../types.js";
export declare function normalizeSessionStatus(vendorStatus: string): SessionStatus;
/**
 * Adapters catch vendor blips and return `unknown` instead of throwing.
 * Pollers must not persist that sentinel — otherwise a transient error
 * clobbers real states like `needs_review` / `running`.
 */
export declare function isPersistableLiveStatus(status: SessionStatus): boolean;
