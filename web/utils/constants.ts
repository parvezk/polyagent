import { type VendorKey } from "@/components/vendor-icon";

export const CLAUDE_MODELS = ["claude-opus-4-8", "claude-sonnet-4-6"];

export const VENDOR_KEYS = {
  CLAUDE: "claude",
  JULES: "jules",
  CURSOR: "cursor",
  GEMINI: "gemini",
} as const satisfies Record<string, VendorKey>;

export const VENDORS: VendorKey[] = Object.values(VENDOR_KEYS);
export const DEFAULT_VENDOR = VENDOR_KEYS.CLAUDE;
export const MODEL_SELECTION_VENDOR = VENDOR_KEYS.CLAUDE;
export const SOURCE_REPOSITORY_CONFIG = {
  vendor: VENDOR_KEYS.JULES,
  endpoint: "/api/jules/sources",
} as const satisfies { vendor: VendorKey; endpoint: string };
export const REPO_REQUIRED_VENDORS: VendorKey[] = [VENDOR_KEYS.JULES, VENDOR_KEYS.CURSOR];
