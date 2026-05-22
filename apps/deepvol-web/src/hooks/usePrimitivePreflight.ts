import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSuiClient } from "@mysten/dapp-kit";
import { DEEPBOOK_PREDICT_TESTNET } from "@rangepilot/config/deepbookPredictTestnet";
import {
  devInspectMintBinaryPreflight,
  devInspectMintRangePreflight,
} from "@rangepilot/sdk/deepbookPredict";
import { useSuiWallet } from "./useSuiWallet";
import type { PrimitiveQuoteState } from "./usePrimitiveQuote";
import {
  buildPrimitivePreflightBlockers,
  buildPrimitivePreflightDependencyKey,
  type PrimitiveInputState,
} from "./primitiveQuoteGate";

export type PrimitivePreflightStatus = "idle" | "ready" | "running" | "blocked" | "passed" | "failed";

export type PrimitivePreflightController = {
  status: PrimitivePreflightStatus;
  canRun: boolean;
  isRunning: boolean;
  blockers: string[];
  warnings: string[];
  lastRunAtMs: number | null;
  dependencyKey: string;
  abortMessage: string | null;
  abortKnownReason: string | null;
  runPreflight: () => void;
};

type UsePrimitivePreflightParams = {
  quote: PrimitiveQuoteState;
  predictManagerId: string | null;
};

type PrimitivePreflightRunState = {
  status: PrimitivePreflightStatus;
  dependencyKey: string | null;
  lastRunAtMs: number | null;
  blockers: string[];
  warnings: string[];
  abortMessage: string | null;
  abortKnownReason: string | null;
};

const EMPTY_PREFLIGHT_STATE: PrimitivePreflightRunState = {
  status: "idle",
  dependencyKey: null,
  lastRunAtMs: null,
  blockers: [],
  warnings: [],
  abortMessage: null,
  abortKnownReason: null,
};

export function usePrimitivePreflight({ quote, predictManagerId }: UsePrimitivePreflightParams): PrimitivePreflightController {
  const client = useSuiClient();
  const wallet = useSuiWallet();
  const latestRunId = useRef(0);
  const [runState, setRunState] = useState<PrimitivePreflightRunState>(EMPTY_PREFLIGHT_STATE);

  const input = useMemo<PrimitiveInputState>(() => ({
    primitiveKind: quote.primitiveKind,
    walletAddress: wallet.address,
    walletConnected: wallet.isConnected,
    walletTestnet: wallet.isTestnet,
    series: quote.series,
    quantity: quote.quantity,
    strike: quote.strike,
    lowerStrike: quote.lowerStrike,
    upperStrike: quote.upperStrike,
    predictManagerId,
    mintCostAtomic: quote.mintCostAtomic,
    redeemPayoutAtomic: quote.redeemPayoutAtomic,
    quoteDependencyKey: quote.dependencyKey,
    preflightQuoteDependencyKey: quote.dependencyKey,
  }), [predictManagerId, quote.dependencyKey, quote.lowerStrike, quote.mintCostAtomic, quote.primitiveKind, quote.quantity, quote.redeemPayoutAtomic, quote.series, quote.strike, quote.upperStrike, wallet.address, wallet.isConnected, wallet.isTestnet]);

  const dependencyKey = useMemo(() => buildPrimitivePreflightDependencyKey(input), [input]);
  const blockers = useMemo(() => buildPrimitivePreflightBlockers(input), [input]);

  useEffect(() => {
    latestRunId.current += 1;
    setRunState(EMPTY_PREFLIGHT_STATE);
  }, [dependencyKey]);

  const runPreflight = useCallback(() => {
    const runId = latestRunId.current + 1;
    latestRunId.current = runId;
    const currentBlockers = buildPrimitivePreflightBlockers(input);

    if (currentBlockers.length > 0) {
      setRunState({
        status: "blocked",
        dependencyKey,
        lastRunAtMs: null,
        blockers: currentBlockers,
        warnings: [],
        abortMessage: null,
        abortKnownReason: null,
      });
      return;
    }

    const series = input.series;
    const sender = input.walletAddress;
    const quantity = input.quantity;

    if (!series || !sender || !predictManagerId || !quantity) {
      return;
    }

    setRunState({
      status: "running",
      dependencyKey,
      lastRunAtMs: null,
      blockers: [],
      warnings: [],
      abortMessage: null,
      abortKnownReason: null,
    });

    void (async () => {
      const result = input.primitiveKind === "RANGE"
        ? await devInspectMintRangePreflight({
            client,
            sender,
            managerId: predictManagerId,
            oracleId: series.oracleId,
            oracleObjectId: series.oracleId,
            expiry: series.expiry,
            lowerStrike: input.lowerStrike ?? "",
            higherStrike: input.upperStrike ?? "",
            quantity,
            config: DEEPBOOK_PREDICT_TESTNET,
            candidateParams: {
              mintCostAtomic: input.mintCostAtomic ?? undefined,
              redeemPayoutAtomic: input.redeemPayoutAtomic ?? undefined,
            },
          })
        : await devInspectMintBinaryPreflight({
            client,
            sender,
            managerId: predictManagerId,
            oracleId: series.oracleId,
            oracleObjectId: series.oracleId,
            expiry: series.expiry,
            strike: input.strike ?? "",
            direction: input.primitiveKind === "UP" ? "up" : "down",
            quantity,
            config: DEEPBOOK_PREDICT_TESTNET,
            candidateParams: {
              mintCostAtomic: input.mintCostAtomic ?? undefined,
              redeemPayoutAtomic: input.redeemPayoutAtomic ?? undefined,
            },
          });

      if (latestRunId.current !== runId) {
        return;
      }

      setRunState({
        status: result.status === "passed" ? "passed" : "failed",
        dependencyKey,
        lastRunAtMs: Date.now(),
        blockers: [],
        warnings: [],
        abortMessage: result.status === "failed" ? result.abort.message : null,
        abortKnownReason: result.status === "failed" ? result.abort.knownReason : null,
      });
    })();
  }, [client, dependencyKey, input, predictManagerId]);

  const freshRun = runState.dependencyKey === dependencyKey ? runState : EMPTY_PREFLIGHT_STATE;
  const status = freshRun.status === "idle"
    ? blockers.length > 0 ? "blocked" : "ready"
    : freshRun.status;

  return {
    status,
    canRun: blockers.length === 0 && freshRun.status !== "running",
    isRunning: freshRun.status === "running",
    blockers: freshRun.status === "blocked" ? freshRun.blockers : blockers,
    warnings: freshRun.warnings,
    lastRunAtMs: freshRun.lastRunAtMs,
    dependencyKey,
    abortMessage: freshRun.abortMessage,
    abortKnownReason: freshRun.abortKnownReason,
    runPreflight,
  };
}
