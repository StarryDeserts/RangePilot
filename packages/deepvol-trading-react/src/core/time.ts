export const DEEPVOL_QUOTE_FRESHNESS_MS = 120_000;
export const DEEPVOL_PREFLIGHT_FRESHNESS_MS = 120_000;
export const DEEPVOL_MINTABILITY_PASS_TTL_MS = 5 * 60_000;

export function isFreshTimestamp(timestampMs: number | null | undefined, ttlMs: number, nowMs = Date.now()): boolean {
  return typeof timestampMs === "number" && nowMs - timestampMs <= ttlMs;
}
