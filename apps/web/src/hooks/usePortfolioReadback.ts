import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import type { RangeKeyInput, TransactionStatus } from "@rangepilot/types/deepbookPredict";
import { DEEPBOOK_PREDICT_TESTNET } from "@rangepilot/config/deepbookPredictTestnet";
import {
  buildRedeemRangeTransaction,
  buildSuiExplorerTransactionUrl,
  createDeepBookPredictServerClient,
  extractManagerDusdcBalanceAtomic,
  getManagerSummary,
  parseRangeRedeemedEvent,
  prepareRangeRedeem,
  readRangePositionQuantity,
  translateDeepBookPredictError,
  type GuidedRangeRedeemPreparation,
} from "@rangepilot/sdk/deepbookPredict";
import {
  type PersistedRangeKey,
  useRangeTradingPersistence,
} from "./useRangeTradingPersistence";

const DEFAULT_REDEEM_QUANTITY = "500";
const EMPTY_MANUAL_RANGE: PersistedRangeKey = {
  oracleId: "",
  oracleObjectId: "",
  underlyingAsset: null,
  expiry: "",
  lowerStrike: "",
  higherStrike: "",
};

export function usePortfolioReadback({
  address,
  isTestnet,
  managerId,
}: {
  address: string | null;
  isTestnet: boolean;
  managerId: string | null;
}) {
  const client = useSuiClient();
  const queryClient = useQueryClient();
  const persistence = useRangeTradingPersistence(address);
  const [manualRange, setManualRange] = useState<PersistedRangeKey>(EMPTY_MANUAL_RANGE);
  const [redeemQuantity, setRedeemQuantity] = useState(DEFAULT_REDEEM_QUANTITY);
  const [preparation, setPreparation] = useState<GuidedRangeRedeemPreparation | null>(null);
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>({ state: "idle" });
  const persistedRange = persistence.record?.lastRangeKey ?? null;
  const activeRange = persistedRange ?? normalizeManualRange(manualRange);
  const activeManagerId = managerId ?? persistence.record?.managerId ?? null;
  const signAndExecuteTransaction = useSignAndExecuteTransaction({
    execute: async ({ bytes, signature }) =>
      client.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: {
          showEvents: true,
          showEffects: true,
          showObjectChanges: true,
          showRawEffects: true,
        },
      }),
  });
  const server = useMemo(
    () => createDeepBookPredictServerClient({ config: DEEPBOOK_PREDICT_TESTNET }),
    [],
  );
  const rangePositionQuery = useQuery({
    queryKey: ["portfolio-readback", address, activeManagerId, activeRange],
    queryFn: () =>
      readRangePositionQuantity({
        ...(activeRange as RangeKeyInput),
        managerId: activeManagerId!,
        client,
        sender: address!,
        config: DEEPBOOK_PREDICT_TESTNET,
      }),
    enabled: Boolean(address && isTestnet && activeManagerId && activeRange),
    staleTime: 10_000,
  });
  const managerSummaryQuery = useQuery({
    queryKey: ["manager-summary-diagnostic", activeManagerId],
    queryFn: () => getManagerSummary(server, activeManagerId!),
    enabled: Boolean(activeManagerId && isTestnet),
    staleTime: 10_000,
  });
  const managerBalanceAtomic = extractManagerDusdcBalanceAtomic(managerSummaryQuery.data);
  const canRedeem = useMemo(() => {
    if (!preparation?.canRedeem || !activeRange || !activeManagerId) {
      return false;
    }

    return (
      preparation.quantity === redeemQuantity &&
      preparation.rangeKey.oracleId === activeRange.oracleId &&
      preparation.rangeKey.expiry === activeRange.expiry &&
      preparation.rangeKey.lowerStrike === activeRange.lowerStrike &&
      preparation.rangeKey.higherStrike === activeRange.higherStrike &&
      BigInt(preparation.quote?.redeemPayoutAtomic ?? "0") > 0n
    );
  }, [activeManagerId, activeRange, preparation, redeemQuantity]);

  function updateManualRange(patch: Partial<PersistedRangeKey>) {
    setManualRange((current) => ({
      ...current,
      ...patch,
    }));
    setPreparation(null);
  }

  async function prepareRedeemForRange(range = activeRange, quantity = redeemQuantity) {
    if (!address || !isTestnet || !activeManagerId || !range) {
      setTransactionStatus({
        state: "failed",
        error: "A Sui Testnet wallet, Predict Account, and RangeKey are required before redeem preflight.",
      });
      return null;
    }

    setTransactionStatus({
      state: "building",
      message: "Running fresh direct range_position readback, quote, and redeem_range preflight.",
    });

    try {
      const result = await prepareRangeRedeem({
        client,
        sender: address,
        managerId: activeManagerId,
        rangeKey: range,
        quantity,
        config: DEEPBOOK_PREDICT_TESTNET,
      });

      setPreparation(result);
      setTransactionStatus({
        state: result.canRedeem ? "success" : "failed",
        message: result.canRedeem
          ? "Direct readback and full redeem preflight passed. Wallet redeem is enabled for this exact range and quantity."
          : "Redeem remains blocked because readback, payout, or full preflight did not pass.",
        error: result.canRedeem ? undefined : result.blockers.map((blocker) => blocker.message).join("\n"),
      });
      return result;
    } catch (error) {
      setTransactionStatus({
        state: "failed",
        error: translateDeepBookPredictError(error),
      });
      return null;
    }
  }

  async function redeem() {
    if (!address || !isTestnet || !activeManagerId || !activeRange) {
      setTransactionStatus({
        state: "failed",
        error: "A Sui Testnet wallet, Predict Account, and RangeKey are required before redeeming.",
      });
      return;
    }

    const freshPreparation = await prepareRedeemForRange(activeRange, redeemQuantity);

    if (!freshPreparation?.canRedeem) {
      return;
    }

    try {
      const transaction = buildRedeemRangeTransaction({
        ...activeRange,
        managerId: activeManagerId,
        quantity: redeemQuantity,
        config: DEEPBOOK_PREDICT_TESTNET,
        allowRealTestnetRedeem: true,
      });

      setTransactionStatus({
        state: "awaiting_wallet",
        message: "Confirm redeem_range<DUSDC> in your browser wallet.",
      });

      signAndExecuteTransaction.mutate(
        {
          transaction,
          chain: "sui:testnet",
        },
        {
          onSuccess: (result) => {
            const event = parseRangeRedeemedEvent(result, DEEPBOOK_PREDICT_TESTNET);

            persistence.updateRecord({
              managerId: activeManagerId,
              lastRangeKey: activeRange,
              lastRedeemDigest: result.digest,
            });
            setTransactionStatus({
              state: "success",
              digest: result.digest,
              explorerUrl: buildSuiExplorerTransactionUrl(result.digest),
              message: event ? "RangeRedeemed event parsed. Refresh direct range_position for updated active quantity." : "Redeem succeeded; RangeRedeemed event was not parsed from wallet result.",
            });
            void queryClient.invalidateQueries({ queryKey: ["portfolio-readback"] });
            void queryClient.invalidateQueries({ queryKey: ["manager-summary-diagnostic"] });
          },
          onError: (error) => {
            setTransactionStatus({
              state: "failed",
              error: translateDeepBookPredictError(error),
            });
          },
        },
      );
    } catch (error) {
      setTransactionStatus({
        state: "blocked_unconfirmed",
        error: translateDeepBookPredictError(error),
      });
    }
  }

  return {
    persistenceRecord: persistence.record,
    activeManagerId,
    persistedRange,
    manualRange,
    activeRange,
    updateManualRange,
    redeemQuantity,
    setRedeemQuantity,
    preparation,
    transactionStatus,
    rangePositionQuery,
    managerSummaryQuery,
    managerBalanceAtomic,
    canRedeem,
    prepareRedeem: () => prepareRedeemForRange(),
    redeem,
  };
}

function normalizeManualRange(range: PersistedRangeKey): PersistedRangeKey | null {
  if (
    !range.oracleId.trim() ||
    !range.oracleObjectId.trim() ||
    !range.expiry.trim() ||
    !range.lowerStrike.trim() ||
    !range.higherStrike.trim()
  ) {
    return null;
  }

  return {
    ...range,
    oracleId: range.oracleId.trim(),
    oracleObjectId: range.oracleObjectId.trim(),
    expiry: range.expiry.trim(),
    lowerStrike: range.lowerStrike.trim(),
    higherStrike: range.higherStrike.trim(),
    quantity: range.quantity?.trim() || undefined,
  };
}
