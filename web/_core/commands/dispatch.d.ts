import type { Vendor } from "../types.js";
export interface DispatchOptions {
    vendor: Vendor;
    repo?: string;
    branch?: string;
    model?: string;
}
export declare function dispatchCommand(prompt: string, opts: DispatchOptions): Promise<void>;
