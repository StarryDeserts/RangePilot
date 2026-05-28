import { useEffect, useMemo } from "react";
import type { DeepVolMachineStep, DeepVolTradeMachine } from "../core/types";
import { useActiveBtcPredictMarket } from "../market/useActiveBtcPredictMarket";
import { usePredictManagerSession } from "../predictManager/usePredictManagerSession";
import { useActiveBtcMoveSeries } from "./useActiveBtcMoveSeries";
import { useBtcMoveMintableRange } from "./useBtcMoveMintableRange";
import { useBuyMoveReceipt } from "./useBuyMoveReceipt";
import { useCreateVolSeries } from "./useCreateVolSeries";
import { useDeepVolPreflight } from "./useDeepVolPreflight";
import { useDeepVolQuote } from "./useDeepVolQuote";

export type UseMoveTradeMachineParams = {
  quantityInput?: string;
};

export function useMoveTradeMachine({ quantityInput = "10000" }: UseMoveTradeMachineParams = {}): DeepVolTradeMachine {
  const activeMarket = useActiveBtcPredictMarket();
  const manager = usePredictManagerSession();
  const mintability = useBtcMoveMintableRange({
    activeMarket: activeMarket.market,
    predictManagerId: manager.predictManagerId,
    quantity: quantityInput,
  });
  const seriesCreator = useCreateVolSeries(activeMarket.market, {
    status: mintability.status,
    oracleId: mintability.candidate?.oracleId ?? null,
    expiry: mintability.candidate?.expiry ?? null,
    lowerStrike: mintability.candidate?.lowerStrike ?? null,
    upperStrike: mintability.candidate?.upperStrike ?? null,
    recordCreatedSeries: mintability.recordCreatedSeries,
  });
  const series = useActiveBtcMoveSeries(activeMarket.market, {
    quantity: quantityInput,
    predictManagerId: manager.predictManagerId,
  });
  const quote = useDeepVolQuote({
    quantityInput,
    predictManagerId: manager.predictManagerId,
    seriesId: series.seriesId,
  });
  const preflight = useDeepVolPreflight({
    quote,
    predictManagerId: manager.predictManagerId,
    walletDusdcChecked: manager.balanceQuery.isFetched,
  });
  const quoteWithPreflight = useMemo(() => ({
    ...quote,
    preflight: preflight.preflight,
  }), [preflight.preflight, quote]);
  const walletExecution = useBuyMoveReceipt({
    quote: quoteWithPreflight,
    predictManagerId: manager.predictManagerId,
  });

  useEffect(() => {
    if (seriesCreator.createdSeriesId && seriesCreator.createdSeriesId !== series.seriesId) {
      series.setSeriesId(seriesCreator.createdSeriesId);
    }
  }, [series.setSeriesId, series.seriesId, seriesCreator.createdSeriesId]);

  const blockers = useMemo(() => [...new Set([
    ...manager.blockers,
    ...(activeMarket.market ? [] : [activeMarket.statusMessage]),
    ...mintability.blockers,
    ...series.blockers,
    ...quote.blockers,
    ...preflight.blockers,
    ...walletExecution.blockers,
  ].filter(Boolean))], [activeMarket.market, activeMarket.statusMessage, manager.blockers, mintability.blockers, preflight.blockers, quote.blockers, series.blockers, walletExecution.blockers]);

  const canCreateSeries = Boolean(mintability.candidate && seriesCreator.canCreate);

  return {
    product: "MOVE",
    status: deriveMoveStatus(blockers, quote.status, preflight.status, walletExecution.transactionStatus.state),
    steps: [
      step("activeMarket", "Validate BTC market", activeMarket.market ? "passed" : activeMarket.isLoading || activeMarket.isRefreshing ? "active" : "blocked", activeMarket.statusMessage),
      step("mintability", "Generate mintable BTC MOVE range", mintability.status === "passed" ? "passed" : mintability.status === "running" ? "active" : mintability.status === "failed" ? "failed" : mintability.blockers.length ? "blocked" : "pending", mintability.blockers[0]),
      step("series", "Create or select VolSeries", series.status === "ready" ? "passed" : series.status === "loading" ? "active" : series.blockers.length ? "blocked" : "pending", series.statusMessage),
      step("quote", "Quote", quote.status === "ready" ? "passed" : quote.status === "loading" ? "active" : quote.status === "error" ? "failed" : quote.blockers.length ? "blocked" : "pending", quote.error ?? quote.blockers[0]),
      step("preflight", "Preflight", preflight.status === "passed" ? "passed" : preflight.status === "running" ? "active" : preflight.status === "blocked" ? "blocked" : "pending", preflight.blockers[0]),
      step("wallet", "Wallet execution", walletExecution.canSubmit ? "passed" : walletExecution.blockers.length ? "blocked" : "pending", walletExecution.blockers[0]),
    ],
    blockers,
    actions: {
      refreshActiveMarket: {
        label: "Refresh active BTC market",
        disabled: activeMarket.isRefreshing,
        run: activeMarket.refresh,
      },
      generateMintableRange: {
        label: "Generate mintable range",
        disabled: mintability.status === "running" || mintability.blockers.length > 0,
        run: mintability.regenerate,
      },
      createOrSelectVolSeries: {
        label: "Create or select VolSeries",
        disabled: !canCreateSeries,
        run: () => {
          const candidate = mintability.candidate;
          if (!candidate) return;
          seriesCreator.create({
            lowerStrike: candidate.lowerStrike,
            upperStrike: candidate.upperStrike,
          });
        },
      },
      refreshQuote: {
        label: "Refresh quote",
        disabled: quote.isLoading || quote.blockers.length > 0,
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
    },
    diagnostics: {
      activeMarket: activeMarket.diagnostics,
      mintability: mintability.advancedDiagnostics,
      quoteWarnings: quote.warnings,
      quoteError: quote.error,
      preflightWarnings: preflight.warnings,
      transactionStatus: walletExecution.transactionStatus,
    },
    result: {
      activeMarket: activeMarket.market,
      predictManagerId: manager.predictManagerId,
      mintabilityCandidate: mintability.candidate,
      series: series.series,
      quote: quoteWithPreflight,
      preflight: preflight.preflight,
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

function deriveMoveStatus(
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
