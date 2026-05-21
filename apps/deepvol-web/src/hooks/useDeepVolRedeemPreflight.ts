import { useCallback, useMemo, useRef, useState } from "react";
import { useSuiClient } from "@mysten/dapp-kit";
import { DEEPBOOK_PREDICT_TESTNET } from "@rangepilot/config/deepbookPredictTestnet";
import {
  devInspectBinaryQuote,
  devInspectRedeemBinaryPosition,
  readBinaryPositionQuantity,
} from "@rangepilot/sdk/deepbookPredict";
import type { MoveReceipt } from "@rangepilot/types/deepVol";
import { useSuiWallet } from "./useSuiWallet";

export type RedeemLegUiState = {
  direction: "up" | "down";
  strike: string | null;
  receiptQuantityAtomic: string | null;
  managerPositionQuantityAtomic: string | null;
  preflightQuantityAtomic: string | null;
  redeemPayoutAtomic: string | null;
  preflightPassed: boolean;
  blocker: string | null;
};

export type RedeemPreflightUiState = {
  up: RedeemLegUiState;
  down: RedeemLegUiState;
  isChecking: boolean;
  message: string;
  dependencyKey: string | null;
  executionEnabled: false;
};

const initialLeg = (direction: "up" | "down"): RedeemLegUiState => ({
  direction,
  strike: null,
  receiptQuantityAtomic: null,
  managerPositionQuantityAtomic: null,
  preflightQuantityAtomic: null,
  redeemPayoutAtomic: null,
  preflightPassed: false,
  blocker: null,
});

export function useDeepVolRedeemPreflight(receipt: MoveReceipt | null) {
  const client = useSuiClient();
  const wallet = useSuiWallet();
  const requestId = useRef(0);
  const [state, setState] = useState<RedeemPreflightUiState>({
    up: initialLeg("up"),
    down: initialLeg("down"),
    isChecking: false,
    message: "Run redeem preflight to inspect the underlying UP and DOWN positions.",
    dependencyKey: null,
    executionEnabled: false,
  });
  const dependencyKey = useMemo(() => buildRedeemDependencyKey(receipt, wallet.address, wallet.isTestnet), [receipt, wallet.address, wallet.isTestnet]);

  const runPreflight = useCallback(async () => {
    const currentRequestId = requestId.current + 1;
    requestId.current = currentRequestId;

    if (!receipt) {
      setState({
        up: initialLeg("up"),
        down: initialLeg("down"),
        isChecking: false,
        message: "Receipt readback is required before redeem preflight.",
        dependencyKey: null,
        executionEnabled: false,
      });
      return;
    }

    if (!wallet.address || !wallet.isTestnet) {
      setState({
        up: buildBlockedLeg("up", receipt.upStrike || receipt.upperStrike, "Connect a Sui Testnet wallet before redeem preflight."),
        down: buildBlockedLeg("down", receipt.downStrike || receipt.lowerStrike, "Connect a Sui Testnet wallet before redeem preflight."),
        isChecking: false,
        message: "Connect a Sui Testnet wallet before redeem preflight.",
        dependencyKey,
        executionEnabled: false,
      });
      return;
    }

    setState((current) => ({
      ...current,
      isChecking: true,
      message: "Checking PredictManager positions and redeem preflight...",
      dependencyKey,
      executionEnabled: false,
    }));

    const up = await inspectLeg({ receipt, direction: "up", sender: wallet.address, client });
    const down = await inspectLeg({ receipt, direction: "down", sender: wallet.address, client });

    if (requestId.current !== currentRequestId) {
      return;
    }

    const passed = up.preflightPassed || down.preflightPassed;
    setState({
      up,
      down,
      isChecking: false,
      message: passed
        ? "Redeem preflight passed for at least one leg. Real redeem execution stays disabled until DeepVol-12 controlled validation."
        : "Redeem preflight is blocked. Review the leg diagnostics before attempting a future redeem.",
      dependencyKey,
      executionEnabled: false,
    });
  }, [client, dependencyKey, receipt, wallet.address, wallet.isTestnet]);

  const stale = state.dependencyKey !== null && state.dependencyKey !== dependencyKey;
  const upStrike = receipt?.upStrike || receipt?.upperStrike || state.up.strike;
  const downStrike = receipt?.downStrike || receipt?.lowerStrike || state.down.strike;

  return {
    ...state,
    up: { ...state.up, strike: upStrike, receiptQuantityAtomic: receipt?.quantity ?? state.up.receiptQuantityAtomic },
    down: { ...state.down, strike: downStrike, receiptQuantityAtomic: receipt?.quantity ?? state.down.receiptQuantityAtomic },
    stale,
    runPreflight,
    canRunPreflight: Boolean(receipt && wallet.address && wallet.isTestnet && !state.isChecking),
  };
}

async function inspectLeg({
  receipt,
  direction,
  sender,
  client,
}: {
  receipt: MoveReceipt;
  direction: "up" | "down";
  sender: string;
  client: Parameters<typeof readBinaryPositionQuantity>[0]["client"];
}): Promise<RedeemLegUiState> {
  const strike = direction === "up" ? receipt.upStrike || receipt.upperStrike : receipt.downStrike || receipt.lowerStrike;
  const receiptQuantityAtomic = receipt.quantity || null;
  const base = {
    direction,
    strike,
    receiptQuantityAtomic,
    managerPositionQuantityAtomic: null,
    preflightQuantityAtomic: null,
    redeemPayoutAtomic: null,
    preflightPassed: false,
  };

  if (!receipt.predictManagerId || !receipt.oracleId || !receipt.expiry || !strike || !receiptQuantityAtomic) {
    return { ...base, blocker: "Receipt readback is missing the PredictManager, oracle, expiry, strike, or quantity needed for redeem." };
  }

  try {
    const position = await readBinaryPositionQuantity({
      client,
      sender,
      managerId: receipt.predictManagerId,
      oracleId: receipt.oracleId,
      expiry: receipt.expiry,
      strike,
      direction,
      config: DEEPBOOK_PREDICT_TESTNET,
    });

    const managerPositionQuantityAtomic = position.quantity;
    const preflightQuantityAtomic = receiptScopedQuantity(managerPositionQuantityAtomic, receiptQuantityAtomic);

    if (BigInt(managerPositionQuantityAtomic) === 0n) {
      return { ...base, managerPositionQuantityAtomic, blocker: "No underlying position quantity is available for this leg." };
    }

    if (BigInt(preflightQuantityAtomic) === 0n) {
      return { ...base, managerPositionQuantityAtomic, preflightQuantityAtomic, blocker: "No receipt-scoped position quantity is available for this leg." };
    }

    let redeemPayoutAtomic: string | null = null;

    try {
      const quote = await devInspectBinaryQuote({
        client,
        sender,
        oracleId: receipt.oracleId,
        oracleObjectId: receipt.oracleId,
        expiry: receipt.expiry,
        strike,
        direction,
        quantity: preflightQuantityAtomic,
        config: DEEPBOOK_PREDICT_TESTNET,
      });
      redeemPayoutAtomic = quote.redeemPayoutAtomic;
    } catch (error) {
      return {
        ...base,
        managerPositionQuantityAtomic,
        preflightQuantityAtomic,
        blocker: `Redeem payout preview blocked: ${formatError(error)}`,
      };
    }

    const preflight = await devInspectRedeemBinaryPosition({
      client,
      sender,
      managerId: receipt.predictManagerId,
      oracleId: receipt.oracleId,
      oracleObjectId: receipt.oracleId,
      expiry: receipt.expiry,
      strike,
      direction,
      quantity: preflightQuantityAtomic,
      config: DEEPBOOK_PREDICT_TESTNET,
    });

    if (preflight.status !== "passed") {
      return {
        ...base,
        managerPositionQuantityAtomic,
        preflightQuantityAtomic,
        redeemPayoutAtomic,
        blocker: preflight.abort.constantName
          ? `${preflight.abort.constantName}: ${preflight.abort.message}`
          : preflight.abort.message,
      };
    }

    return {
      ...base,
      managerPositionQuantityAtomic,
      preflightQuantityAtomic,
      redeemPayoutAtomic,
      preflightPassed: true,
      blocker: null,
    };
  } catch (error) {
    return { ...base, blocker: formatError(error) };
  }
}

function buildRedeemDependencyKey(receipt: MoveReceipt | null, walletAddress: string | null, walletTestnet: boolean) {
  return [
    walletAddress ?? "",
    walletTestnet ? "testnet" : "not-testnet",
    receipt?.receiptId ?? "",
    receipt?.predictManagerId ?? "",
    receipt?.oracleId ?? "",
    receipt?.expiry ?? "",
    receipt?.upStrike ?? receipt?.upperStrike ?? "",
    receipt?.downStrike ?? receipt?.lowerStrike ?? "",
    receipt?.quantity ?? "",
  ].join(":");
}

function buildBlockedLeg(direction: "up" | "down", strike: string | null, blocker: string): RedeemLegUiState {
  return {
    direction,
    strike,
    receiptQuantityAtomic: null,
    managerPositionQuantityAtomic: null,
    preflightQuantityAtomic: null,
    redeemPayoutAtomic: null,
    preflightPassed: false,
    blocker,
  };
}

function receiptScopedQuantity(managerPositionQuantityAtomic: string, receiptQuantityAtomic: string): string {
  const managerQuantity = BigInt(managerPositionQuantityAtomic);
  const receiptQuantity = BigInt(receiptQuantityAtomic);
  return (managerQuantity < receiptQuantity ? managerQuantity : receiptQuantity).toString();
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
