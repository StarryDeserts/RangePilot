import { useCallback, useMemo, useState } from "react";
import { useSuiClient } from "@mysten/dapp-kit";
import { DEEPBOOK_PREDICT_TESTNET } from "@rangepilot/config/deepbookPredictTestnet";
import { findMintableRangePrimitiveCandidate } from "@rangepilot/sdk/deepbookPredict";
import type {
  RangePrimitiveMintableCandidate,
  RangePrimitiveMintableAttempt,
  PrimitiveActiveMarketContext,
} from "@rangepilot/types/deepbookPredict";
import {
  buildRangePrimitiveMintabilityKey,
  clearRangePrimitiveMintabilityRecord,
  recordRangePrimitiveMintabilityPass,
  type PrimitiveMintabilityRecord,
} from "../lib/primitiveMintability";
import { useSuiWallet } from "./useSuiWallet";

export type RangePrimitiveMintableStatus = "idle" | "blocked" | "running" | "passed" | "failed";

export type RangePrimitiveMintableController = {
  status: RangePrimitiveMintableStatus;
  candidate: RangePrimitiveMintableCandidate | null;
  validationRecord: PrimitiveMintabilityRecord | null;
  attempts: RangePrimitiveMintableAttempt[];
  blockers: string[];
  advancedDiagnostics: string[];
  quoteAtomic: string | null;
  regenerate: () => Promise<void>;
  invalidate: () => void;
};

export function usePrimitiveMintableRange({
  activeMarket,
  predictManagerId,
  quantity,
}: {
  activeMarket: PrimitiveActiveMarketContext | null;
  predictManagerId: string | null;
  quantity: string;
}): RangePrimitiveMintableController {
  const client = useSuiClient();
  const wallet = useSuiWallet();
  const [state, setState] = useState<{
    status: RangePrimitiveMintableStatus;
    candidate: RangePrimitiveMintableCandidate | null;
    validationRecord: PrimitiveMintabilityRecord | null;
    attempts: RangePrimitiveMintableAttempt[];
    blockers: string[];
    advancedDiagnostics: string[];
    quoteAtomic: string | null;
  }>({
    status: "idle",
    candidate: null,
    validationRecord: null,
    attempts: [],
    blockers: [],
    advancedDiagnostics: [],
    quoteAtomic: null,
  });

  const prerequisiteBlockers = useMemo(() => {
    const blockers: string[] = [];

    if (!wallet.address || !wallet.isConnected) blockers.push("Connect a Sui wallet before validating a mintable RANGE interval.");
    if (wallet.isConnected && !wallet.isTestnet) blockers.push("Switch to Sui Testnet before validating a mintable RANGE interval.");
    if (!predictManagerId) blockers.push("Create or store a PredictManager before validating a mintable RANGE interval.");
    if (!activeMarket) blockers.push("Discover an active BTC market first.");
    if (activeMarket && activeMarket.status !== "live") blockers.push("Active BTC market must be live before validating a mintable RANGE interval.");

    return blockers;
  }, [activeMarket, predictManagerId, wallet.address, wallet.isConnected, wallet.isTestnet]);

  const invalidate = useCallback(() => {
    if (state.candidate) {
      clearRangePrimitiveMintabilityRecord({
        oracleId: state.candidate.oracleId,
        expiry: state.candidate.expiry,
        lowerStrike: state.candidate.lowerStrike,
        upperStrike: state.candidate.higherStrike,
        quantity,
        predictManagerId,
      });
    }

    setState({
      status: "idle",
      candidate: null,
      validationRecord: null,
      attempts: [],
      blockers: [],
      advancedDiagnostics: [],
      quoteAtomic: null,
    });
  }, [predictManagerId, quantity, state.candidate]);

  const regenerate = useCallback(async () => {
    if (prerequisiteBlockers.length > 0 || !activeMarket || !wallet.address || !predictManagerId) {
      setState((current) => ({
        ...current,
        status: "blocked",
        blockers: prerequisiteBlockers,
      }));
      return;
    }

    setState({
      status: "running",
      candidate: null,
      validationRecord: null,
      attempts: [],
      blockers: [],
      advancedDiagnostics: [],
      quoteAtomic: null,
    });

    const result = await findMintableRangePrimitiveCandidate({
      client,
      sender: wallet.address,
      managerId: predictManagerId,
      oracleId: activeMarket.oracleId,
      oracleObjectId: activeMarket.oracleObjectId,
      expiry: activeMarket.expiry,
      quantity,
      underlyingAsset: activeMarket.underlyingAsset,
      spot: activeMarket.spot,
      forward: activeMarket.forward,
      tickSize: activeMarket.tickSize,
      minStrike: activeMarket.minStrike,
      config: DEEPBOOK_PREDICT_TESTNET,
    });

    if (result.status === "found") {
      const cacheInput = {
        oracleId: result.candidate.oracleId,
        expiry: result.candidate.expiry,
        lowerStrike: result.candidate.lowerStrike,
        upperStrike: result.candidate.higherStrike,
        quantity,
        predictManagerId,
      };

      const validationRecord = recordRangePrimitiveMintabilityPass(
        cacheInput,
        "Mintable RANGE interval found. Quote and mint preflight passed for this BTC market.",
      );

      setState({
        status: "passed",
        candidate: result.candidate,
        validationRecord,
        attempts: result.attempts,
        blockers: [],
        advancedDiagnostics: [
          ...result.diagnostics,
          `validationKey=${buildRangePrimitiveMintabilityKey(cacheInput)}`,
        ],
        quoteAtomic: result.quote.mintCostAtomic,
      });
      return;
    }

    setState({
      status: "failed",
      candidate: null,
      validationRecord: null,
      attempts: result.attempts,
      blockers: result.blockers.length > 0
        ? result.blockers
        : ["No mintable RANGE interval was found for the current market. Try refreshing the active BTC market."],
      advancedDiagnostics: result.diagnostics,
      quoteAtomic: null,
    });
  }, [activeMarket, client, predictManagerId, prerequisiteBlockers, quantity, wallet.address]);

  return {
    ...state,
    blockers: [...new Set([...prerequisiteBlockers, ...state.blockers])],
    regenerate,
    invalidate,
  };
}
