import type { RedeemPreflightUiState } from "./useDeepVolRedeemPreflight";

export function redeemExecutionBlockers(state: RedeemPreflightUiState & { stale: boolean }): string[] {
  const blockers = ["Redeem execution will be enabled after DeepVol-12 controlled browser validation."];

  if (state.stale) {
    blockers.push("Run redeem preflight again for the current wallet and receipt state.");
  }

  if (!state.up.preflightPassed && !state.down.preflightPassed) {
    blockers.push("At least one UP or DOWN leg must pass explicit redeem preflight.");
  }

  return blockers;
}
