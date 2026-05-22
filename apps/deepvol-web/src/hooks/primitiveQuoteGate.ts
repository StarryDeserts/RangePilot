import type { VolSeries } from "@rangepilot/types/deepVol";

export type PrimitiveKind = "UP" | "DOWN" | "RANGE";

export type PrimitiveInputState = {
  primitiveKind: PrimitiveKind;
  walletAddress: string | null;
  walletConnected: boolean;
  walletTestnet: boolean;
  series: VolSeries | null;
  quantity: string | null;
  strike: string | null;
  lowerStrike: string | null;
  upperStrike: string | null;
  predictManagerId?: string | null;
  mintCostAtomic?: string | null;
  redeemPayoutAtomic?: string | null;
  quoteDependencyKey?: string | null;
  preflightQuoteDependencyKey?: string | null;
};

export const PRIMITIVE_EXECUTION_DISABLED_BLOCKER = "Primitive wallet execution is disabled in DeepVol-14.";

export function buildPrimitiveQuoteBlockers(input: PrimitiveInputState): string[] {
  const blockers: string[] = [];

  if (!input.walletConnected || !input.walletAddress) {
    blockers.push("Connect a Sui wallet before refreshing primitive quotes.");
  }

  if (input.walletConnected && !input.walletTestnet) {
    blockers.push("Switch the connected wallet to Sui Testnet before refreshing primitive quotes.");
  }

  if (!input.series) {
    blockers.push("Configured BTC MOVE VolSeries must be loaded before primitive quotes.");
  }

  if (input.series && !input.series.active) {
    blockers.push("Configured BTC MOVE VolSeries is inactive.");
  }

  if (input.series && BigInt(input.series.lowerStrike) >= BigInt(input.series.upperStrike)) {
    blockers.push("Configured BTC MOVE VolSeries has invalid strike ordering.");
  }

  if (!input.quantity) {
    blockers.push("Enter a positive integer quantity for primitive quote.");
  }

  if ((input.primitiveKind === "UP" || input.primitiveKind === "DOWN") && !input.strike) {
    blockers.push("Enter a positive strike for UP/DOWN primitive quote.");
  }

  if (input.primitiveKind === "RANGE") {
    if (!input.lowerStrike || !input.upperStrike) {
      blockers.push("Enter positive lower and upper strikes for RANGE primitive quote.");
    } else if (BigInt(input.lowerStrike) >= BigInt(input.upperStrike)) {
      blockers.push("RANGE lower strike must be below upper strike.");
    }
  }

  return [...new Set(blockers)];
}

export function buildPrimitivePreflightBlockers(input: PrimitiveInputState): string[] {
  const blockers = [...buildPrimitiveQuoteBlockers(input)];

  if (!input.predictManagerId) {
    blockers.push("Enter a PredictManager ID before running primitive mint preflight.");
  }

  if (!input.mintCostAtomic || !input.redeemPayoutAtomic) {
    blockers.push("Refresh a fresh primitive quote before running mint preflight.");
  }

  if (input.quoteDependencyKey && input.preflightQuoteDependencyKey && input.quoteDependencyKey !== input.preflightQuoteDependencyKey) {
    blockers.push("Run primitive mint preflight again for the current quote and wallet state.");
  }

  return [...new Set(blockers)];
}

export function buildPrimitiveExecutionBlockers(): string[] {
  return [PRIMITIVE_EXECUTION_DISABLED_BLOCKER];
}

export function buildPrimitiveQuoteDependencyKey(input: PrimitiveInputState): string {
  return [
    input.walletAddress ?? "no-wallet",
    input.walletTestnet ? "testnet" : "not-testnet",
    input.series?.seriesId ?? "no-series",
    input.series?.oracleId ?? "no-oracle",
    input.series?.expiry ?? "no-expiry",
    input.primitiveKind,
    input.quantity ?? "no-quantity",
    input.strike ?? "no-strike",
    input.lowerStrike ?? "no-lower",
    input.upperStrike ?? "no-upper",
  ].join(":");
}

export function buildPrimitivePreflightDependencyKey(input: PrimitiveInputState): string {
  return [
    buildPrimitiveQuoteDependencyKey(input),
    input.predictManagerId ?? "no-manager",
    input.mintCostAtomic ?? "no-mint-cost",
    input.redeemPayoutAtomic ?? "no-redeem-payout",
  ].join(":");
}
