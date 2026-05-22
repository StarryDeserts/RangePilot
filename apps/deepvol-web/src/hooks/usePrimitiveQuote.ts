import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSuiClient } from "@mysten/dapp-kit";
import { useQuery } from "@tanstack/react-query";
import type { VolSeries } from "@rangepilot/types/deepVol";
import { DEEPBOOK_PREDICT_TESTNET } from "@rangepilot/config/deepbookPredictTestnet";
import {
  devInspectBinaryQuote,
  devInspectRangeQuote,
} from "@rangepilot/sdk/deepbookPredict";
import { useDeepVolConfig } from "./useDeepVolConfig";
import { useSuiWallet } from "./useSuiWallet";
import { readVolSeries } from "../lib/deepVolSeries";
import { normalizePositiveIntegerInput } from "../lib/format";
import {
  buildPrimitiveQuoteBlockers,
  buildPrimitiveQuoteDependencyKey,
  type PrimitiveInputState,
  type PrimitiveKind,
} from "./primitiveQuoteGate";

export type PrimitiveQuoteStatus = "idle" | "loading" | "ready" | "blocked" | "error";

export type PrimitiveQuoteState = {
  status: PrimitiveQuoteStatus;
  primitiveKind: PrimitiveKind;
  series: VolSeries | null;
  quantity: string;
  strike: string | null;
  lowerStrike: string | null;
  upperStrike: string | null;
  mintCostAtomic: string | null;
  redeemPayoutAtomic: string | null;
  quotedAtMs: number | null;
  dependencyKey: string;
  blockers: string[];
  warnings: string[];
  error: string | null;
  diagnostic: unknown | null;
  isLoading: boolean;
  isRefreshing: boolean;
  canRefresh: boolean;
  refreshQuote: () => void;
};

type UsePrimitiveQuoteParams = {
  primitiveKind: PrimitiveKind;
  quantityInput: string;
  strikeInput: string;
  lowerStrikeInput: string;
  upperStrikeInput: string;
};

type PrimitiveQuoteRunState = {
  status: PrimitiveQuoteStatus;
  dependencyKey: string | null;
  mintCostAtomic: string | null;
  redeemPayoutAtomic: string | null;
  quotedAtMs: number | null;
  blockers: string[];
  warnings: string[];
  error: string | null;
  diagnostic: unknown | null;
};

const EMPTY_RUN_STATE: PrimitiveQuoteRunState = {
  status: "idle",
  dependencyKey: null,
  mintCostAtomic: null,
  redeemPayoutAtomic: null,
  quotedAtMs: null,
  blockers: [],
  warnings: [],
  error: null,
  diagnostic: null,
};

export function usePrimitiveQuote({
  primitiveKind,
  quantityInput,
  strikeInput,
  lowerStrikeInput,
  upperStrikeInput,
}: UsePrimitiveQuoteParams): PrimitiveQuoteState {
  const client = useSuiClient();
  const wallet = useSuiWallet();
  const config = useDeepVolConfig();
  const latestRunId = useRef(0);
  const [runState, setRunState] = useState<PrimitiveQuoteRunState>(EMPTY_RUN_STATE);

  const seriesQuery = useQuery({
    queryKey: ["primitive-vol-series", config.configuredSeriesId],
    enabled: Boolean(config.configuredSeriesId),
    queryFn: async () => readVolSeries(client, config.configuredSeriesId),
  });

  const quantity = normalizePositiveIntegerInput(quantityInput);
  const strike = primitiveKind === "UP" || primitiveKind === "DOWN"
    ? normalizePositiveIntegerInput(strikeInput)
    : null;
  const lowerStrike = primitiveKind === "RANGE"
    ? normalizePositiveIntegerInput(lowerStrikeInput)
    : null;
  const upperStrike = primitiveKind === "RANGE"
    ? normalizePositiveIntegerInput(upperStrikeInput)
    : null;

  const currentInput = useMemo<PrimitiveInputState>(() => ({
    primitiveKind,
    walletAddress: wallet.address,
    walletConnected: wallet.isConnected,
    walletTestnet: wallet.isTestnet,
    series: seriesQuery.data ?? null,
    quantity,
    strike,
    lowerStrike,
    upperStrike,
  }), [lowerStrike, primitiveKind, quantity, seriesQuery.data, strike, upperStrike, wallet.address, wallet.isConnected, wallet.isTestnet]);

  const dependencyKey = useMemo(() => buildPrimitiveQuoteDependencyKey(currentInput), [currentInput]);
  const baseBlockers = useMemo(() => buildPrimitiveQuoteBlockers(currentInput), [currentInput]);

  useEffect(() => {
    latestRunId.current += 1;
    setRunState(EMPTY_RUN_STATE);
  }, [dependencyKey]);

  const refreshQuote = useCallback(() => {
    const runId = latestRunId.current + 1;
    latestRunId.current = runId;
    const blockers = buildPrimitiveQuoteBlockers(currentInput);

    if (blockers.length > 0) {
      setRunState({
        status: "blocked",
        dependencyKey,
        mintCostAtomic: null,
        redeemPayoutAtomic: null,
        quotedAtMs: null,
        blockers,
        warnings: [],
        error: null,
        diagnostic: null,
      });
      return;
    }

    const series = currentInput.series;
    const sender = currentInput.walletAddress;
    const normalizedQuantity = currentInput.quantity;

    if (!series || !sender || !normalizedQuantity) {
      return;
    }

    setRunState({
      status: "loading",
      dependencyKey,
      mintCostAtomic: null,
      redeemPayoutAtomic: null,
      quotedAtMs: null,
      blockers: [],
      warnings: [],
      error: null,
      diagnostic: null,
    });

    void (async () => {
      try {
        const quote = primitiveKind === "RANGE"
          ? await devInspectRangeQuote({
              client,
              sender,
              oracleId: series.oracleId,
              oracleObjectId: series.oracleId,
              expiry: series.expiry,
              lowerStrike: lowerStrike ?? "",
              higherStrike: upperStrike ?? "",
              quantity: normalizedQuantity,
              config: DEEPBOOK_PREDICT_TESTNET,
            })
          : await devInspectBinaryQuote({
              client,
              sender,
              oracleId: series.oracleId,
              oracleObjectId: series.oracleId,
              expiry: series.expiry,
              strike: strike ?? "",
              direction: primitiveKind === "UP" ? "up" : "down",
              quantity: normalizedQuantity,
              config: DEEPBOOK_PREDICT_TESTNET,
            });

        if (latestRunId.current !== runId) {
          return;
        }

        setRunState({
          status: "ready",
          dependencyKey,
          mintCostAtomic: quote.mintCostAtomic,
          redeemPayoutAtomic: quote.redeemPayoutAtomic,
          quotedAtMs: Date.now(),
          blockers: [],
          warnings: [],
          error: null,
          diagnostic: quote.diagnostic ?? null,
        });
      } catch (error) {
        if (latestRunId.current !== runId) {
          return;
        }

        setRunState({
          status: "error",
          dependencyKey,
          mintCostAtomic: null,
          redeemPayoutAtomic: null,
          quotedAtMs: null,
          blockers: [],
          warnings: [],
          error: error instanceof Error ? error.message : String(error),
          diagnostic: null,
        });
      }
    })();
  }, [client, currentInput, dependencyKey, lowerStrike, primitiveKind, strike, upperStrike]);

  if (seriesQuery.isError) {
    return buildPrimitiveQuoteState({
      primitiveKind,
      series: null,
      quantity: quantity ?? quantityInput,
      strike,
      lowerStrike,
      upperStrike,
      dependencyKey,
      status: "error",
      blockers: baseBlockers,
      warnings: [],
      error: seriesQuery.error instanceof Error ? seriesQuery.error.message : String(seriesQuery.error),
      isLoading: false,
      isRefreshing: false,
      canRefresh: false,
      refreshQuote,
    });
  }

  const freshRun = runState.dependencyKey === dependencyKey ? runState : EMPTY_RUN_STATE;
  const loadingSeries = seriesQuery.isLoading && !seriesQuery.data;
  const status = loadingSeries ? "loading" : freshRun.status === "idle" && baseBlockers.length > 0 ? "blocked" : freshRun.status;
  const staleWarning = runState.dependencyKey && runState.dependencyKey !== dependencyKey
    ? ["Primitive quote inputs changed; refresh quote before preflight."]
    : [];

  return buildPrimitiveQuoteState({
    primitiveKind,
    series: seriesQuery.data ?? null,
    quantity: quantity ?? quantityInput,
    strike,
    lowerStrike,
    upperStrike,
    dependencyKey,
    status,
    mintCostAtomic: freshRun.mintCostAtomic,
    redeemPayoutAtomic: freshRun.redeemPayoutAtomic,
    quotedAtMs: freshRun.quotedAtMs,
    blockers: freshRun.status === "blocked" || freshRun.status === "error" ? freshRun.blockers : baseBlockers,
    warnings: [...freshRun.warnings, ...staleWarning],
    error: freshRun.error,
    diagnostic: freshRun.diagnostic,
    isLoading: loadingSeries || freshRun.status === "loading",
    isRefreshing: freshRun.status === "loading",
    canRefresh: !loadingSeries,
    refreshQuote,
  });
}

function buildPrimitiveQuoteState(params: Partial<PrimitiveQuoteState> & {
  primitiveKind: PrimitiveKind;
  quantity: string;
  dependencyKey: string;
  status: PrimitiveQuoteStatus;
  blockers: string[];
  warnings: string[];
  isLoading: boolean;
  isRefreshing: boolean;
  canRefresh: boolean;
  refreshQuote: () => void;
}): PrimitiveQuoteState {
  return {
    series: null,
    strike: null,
    lowerStrike: null,
    upperStrike: null,
    mintCostAtomic: null,
    redeemPayoutAtomic: null,
    quotedAtMs: null,
    error: null,
    diagnostic: null,
    ...params,
  };
}
