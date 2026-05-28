import type { DeepVolMachineStep, DeepVolTradeMachine, DeepVolTradingProduct } from "../core/types";
import { useActiveBtcPredictMarket } from "../market/useActiveBtcPredictMarket";
import { usePredictManagerSession } from "../predictManager/usePredictManagerSession";
import type { PrimitiveKind } from "./primitiveQuoteGate";
import { usePrimitiveMintableRange } from "./usePrimitiveMintableRange";
import { usePrimitiveMintableStrike } from "./usePrimitiveMintableStrike";
import { usePrimitivePreflight } from "./usePrimitivePreflight";
import { usePrimitiveQuote } from "./usePrimitiveQuote";
import { usePrimitiveWalletExecution } from "./usePrimitiveWalletExecution";

export type UsePrimitiveTradeMachineParams = {
  quantityInput?: string;
};

export function usePrimitiveTradeMachine(
  primitiveKind: PrimitiveKind,
  { quantityInput = "10000" }: UsePrimitiveTradeMachineParams = {},
): DeepVolTradeMachine {
  const activeMarket = useActiveBtcPredictMarket();
  const manager = usePredictManagerSession();
  const strikeMintability = usePrimitiveMintableStrike({
    activeMarket: activeMarket.market,
    predictManagerId: manager.predictManagerId,
    quantity: quantityInput,
    primitiveKind,
  });
  const rangeMintability = usePrimitiveMintableRange({
    activeMarket: activeMarket.market,
    predictManagerId: manager.predictManagerId,
    quantity: quantityInput,
  });
  const strikeInput = primitiveKind === "RANGE"
    ? ""
    : strikeMintability.candidate?.strike
      ?? (primitiveKind === "UP" ? activeMarket.market?.suggestedUpStrike : activeMarket.market?.suggestedDownStrike)
      ?? "";
  const lowerStrikeInput = rangeMintability.candidate?.lowerStrike ?? activeMarket.market?.suggestedLowerStrike ?? "";
  const upperStrikeInput = rangeMintability.candidate?.higherStrike ?? activeMarket.market?.suggestedUpperStrike ?? "";
  const quote = usePrimitiveQuote({
    activeMarket: activeMarket.market,
    primitiveKind,
    quantityInput,
    strikeInput,
    lowerStrikeInput,
    upperStrikeInput,
  });
  const preflight = usePrimitivePreflight({
    quote,
    predictManagerId: manager.predictManagerId,
  });
  const isStrikeMintabilityCurrent = Boolean(
    primitiveKind !== "RANGE" &&
      activeMarket.market &&
      strikeMintability.status === "passed" &&
      strikeMintability.candidate &&
      strikeMintability.candidate.oracleId === activeMarket.market.oracleId &&
      strikeMintability.candidate.expiry === activeMarket.market.expiry &&
      strikeMintability.candidate.strike === strikeInput &&
      strikeMintability.candidate.direction === (primitiveKind === "UP" ? "up" : "down"),
  );
  const isRangeMintabilityCurrent = Boolean(
    primitiveKind === "RANGE" &&
      activeMarket.market &&
      rangeMintability.status === "passed" &&
      rangeMintability.candidate &&
      rangeMintability.candidate.oracleId === activeMarket.market.oracleId &&
      rangeMintability.candidate.expiry === activeMarket.market.expiry &&
      rangeMintability.candidate.lowerStrike === lowerStrikeInput &&
      rangeMintability.candidate.higherStrike === upperStrikeInput,
  );
  const primitiveMintabilityStatus = isStrikeMintabilityCurrent ? strikeMintability.status : "idle";
  const rangeMintabilityStatus = isRangeMintabilityCurrent ? rangeMintability.status : "idle";
  const walletExecution = usePrimitiveWalletExecution({
    quote,
    preflight,
    predictManagerId: manager.predictManagerId,
    primitiveMintabilityStatus,
    rangeMintabilityStatus,
  });
  const mintability = primitiveKind === "RANGE" ? rangeMintability : strikeMintability;
  const mintabilityStatus = primitiveKind === "RANGE" ? rangeMintabilityStatus : primitiveMintabilityStatus;
  const mintabilityStepLabel = primitiveKind === "RANGE"
    ? "Generate mintable interval"
    : `Generate mintable ${primitiveKind} strike`;
  const actionName = primitiveKind === "RANGE" ? "generateMintableInterval" : "generateMintableStrike";
  const actions = {
    refreshActiveMarket: {
      label: "Refresh active BTC market",
      disabled: activeMarket.isRefreshing,
      run: activeMarket.refresh,
    },
    refreshQuote: {
      label: "Refresh quote",
      disabled: !quote.canRefresh || quote.isLoading,
      run: quote.refreshQuote,
    },
    runPreflight: {
      label: "Run preflight",
      disabled: !preflight.canRun || preflight.isRunning,
      run: preflight.runPreflight,
    },
    reviewInWallet: {
      label: "Review in wallet",
      disabled: !walletExecution.canSubmit,
      run: walletExecution.submit,
    },
    [actionName]: {
      label: primitiveKind === "RANGE" ? "Generate mintable interval" : "Generate mintable strike",
      disabled: mintability.status === "running" || mintability.blockers.length > 0,
      run: mintability.regenerate,
    },
  };
  const blockers = [...new Set([
    ...manager.blockers,
    ...(activeMarket.market ? [] : [activeMarket.statusMessage]),
    ...mintability.blockers,
    ...quote.blockers,
    ...preflight.blockers,
    ...walletExecution.blockers,
  ].filter(Boolean))];

  return {
    product: primitiveKind as DeepVolTradingProduct,
    status: derivePrimitiveStatus(blockers, quote.status, preflight.status, walletExecution.transactionStatus.state),
    steps: [
      step("activeMarket", "Validate BTC market", activeMarket.market ? "passed" : activeMarket.isLoading || activeMarket.isRefreshing ? "active" : "blocked", activeMarket.statusMessage),
      step("mintability", mintabilityStepLabel, mintabilityStatus === "passed" ? "passed" : mintability.status === "running" ? "active" : mintability.status === "failed" ? "failed" : mintability.blockers.length ? "blocked" : "pending", mintability.blockers[0]),
      step("quote", "Quote", quote.status === "ready" ? "passed" : quote.status === "loading" ? "active" : quote.status === "error" ? "failed" : quote.blockers.length ? "blocked" : "pending", quote.error ?? quote.blockers[0]),
      step("preflight", "Preflight", preflight.status === "passed" ? "passed" : preflight.status === "running" ? "active" : preflight.status === "blocked" ? "blocked" : "pending", preflight.blockers[0]),
      step("wallet", "Wallet execution", walletExecution.canSubmit ? "passed" : walletExecution.blockers.length ? "blocked" : "pending", walletExecution.blockers[0]),
    ],
    blockers,
    actions,
    diagnostics: {
      activeMarket: activeMarket.diagnostics,
      mintability: mintability.advancedDiagnostics,
      quoteWarnings: quote.warnings,
      quoteError: quote.error,
      preflightWarnings: preflight.warnings,
      preflightAbortMessage: preflight.abortMessage,
      transactionStatus: walletExecution.transactionStatus,
    },
    result: {
      activeMarket: activeMarket.market,
      predictManagerId: manager.predictManagerId,
      mintabilityCandidate: mintability.candidate,
      quote,
      preflight,
      transactionStatus: walletExecution.transactionStatus,
    },
  };
}

function step(id: string, label: string, status: DeepVolMachineStep["status"], detail?: string | null): DeepVolMachineStep {
  return {
    id,
    label,
    status,
    detail: detail ?? undefined,
  };
}

function derivePrimitiveStatus(
  blockers: string[],
  quoteStatus: string,
  preflightStatus: string,
  transactionState: string,
): DeepVolTradeMachine["status"] {
  if (transactionState === "success") return "confirmed";
  if (transactionState === "failed") return "failed";
  if (transactionState === "awaiting_wallet") return "awaiting_wallet";
  if (preflightStatus === "running") return "preflighting";
  if (quoteStatus === "loading") return "quoting";
  return blockers.length > 0 ? "blocked" : "ready";
}
