import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import type { RangeKeyInput, TransactionStatus } from "@rangepilot/types/deepbookPredict";
import { DEEPBOOK_PREDICT_TESTNET } from "@rangepilot/config/deepbookPredictTestnet";
import {
  buildRedeemRangeTransaction,
  buildSuiExplorerTransactionUrl,
  createDeepBookPredictServerClient,
  extractManagerDusdcBalanceAtomic,
  extractRangePositionFromMintEvent,
  getManagerSummary,
  getRangeMintHistory,
  parseRangeMintedEvent,
  parseRangeRedeemedEvent,
  prepareRangeRedeem,
  readRangePositionQuantity,
  translateDeepBookPredictError,
  type GuidedRangeRedeemPreparation,
} from "@rangepilot/sdk/deepbookPredict";
import {
  rangeKey,
  type KnownRangeKeyRecord,
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

type ImportStatus = {
  state: "idle" | "loading" | "success" | "failed";
  message?: string;
  error?: string;
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
  const activeManagerId = managerId;
  const persistence = useRangeTradingPersistence(address, activeManagerId);
  const {
    selectKnownRange: persistSelectedKnownRange,
    updateKnownRangeReadback,
    upsertKnownRange,
    updateDigests,
  } = persistence;
  const [manualRange, setManualRange] = useState<PersistedRangeKey>(EMPTY_MANUAL_RANGE);
  const [useManualRange, setUseManualRange] = useState(false);
  const [showInactiveRanges, setShowInactiveRanges] = useState(false);
  const [mintDigestInput, setMintDigestInput] = useState("");
  const [importStatus, setImportStatus] = useState<ImportStatus>({ state: "idle" });
  const [redeemQuantity, setRedeemQuantity] = useState(DEFAULT_REDEEM_QUANTITY);
  const [preparation, setPreparation] = useState<GuidedRangeRedeemPreparation | null>(null);
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>({ state: "idle" });
  const knownRanges = persistence.record?.knownRanges ?? [];
  const visibleKnownRanges = knownRanges.filter((range) => showInactiveRanges || range.status !== "inactive");
  const selectedKnownRange = findKnownRange(visibleKnownRanges, persistence.record?.lastSelectedRangeKey)
    ?? findKnownRange(knownRanges, persistence.record?.lastSelectedRangeKey);
  const manualActiveRange = useManualRange ? normalizeManualRange(manualRange) : null;
  const activeRange = manualActiveRange ?? selectedKnownRange ?? null;
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
    queryKey: ["portfolio-readback", address, activeManagerId, activeRange ? rangeKey(activeRange) : null],
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
  const mintHistoryQuery = useQuery({
    queryKey: ["range-mint-history-recovery", activeManagerId],
    queryFn: () => getRangeMintHistory(server, { managerId: activeManagerId!, limit: 20 }),
    enabled: Boolean(activeManagerId && isTestnet && knownRanges.length === 0),
    staleTime: 60_000,
  });
  const managerBalanceAtomic = extractManagerDusdcBalanceAtomic(managerSummaryQuery.data);
  const canRedeem = useMemo(() => {
    if (!preparation?.canRedeem || !activeRange || !activeManagerId) {
      return false;
    }

    return (
      preparation.quantity === redeemQuantity &&
      preparation.rangeKey.oracleId === activeRange.oracleId &&
      preparation.rangeKey.oracleObjectId === activeRange.oracleObjectId &&
      preparation.rangeKey.expiry === activeRange.expiry &&
      preparation.rangeKey.lowerStrike === activeRange.lowerStrike &&
      preparation.rangeKey.higherStrike === activeRange.higherStrike &&
      BigInt(preparation.quote?.redeemPayoutAtomic ?? "0") > 0n
    );
  }, [activeManagerId, activeRange, preparation, redeemQuantity]);

  useEffect(() => {
    if (!rangePositionQuery.data || !activeRange || useManualRange) {
      return;
    }

    updateKnownRangeReadback(activeRange, rangePositionQuery.data.quantity);
  }, [activeRange, rangePositionQuery.data, updateKnownRangeReadback, useManualRange]);

  useEffect(() => {
    if (!mintHistoryQuery.data || !activeManagerId || knownRanges.length > 0) {
      return;
    }

    for (const record of mintHistoryQuery.data) {
      const range = normalizeMintHistoryRecord(record);

      if (range) {
        upsertKnownRange({
          ...range,
          source: "mint_history",
          status: "unknown",
          mintDigest: digestFromRecord(record),
        });
      }
    }
  }, [activeManagerId, knownRanges.length, mintHistoryQuery.data, upsertKnownRange]);

  function updateManualRange(patch: Partial<PersistedRangeKey>) {
    setManualRange((current) => ({
      ...current,
      ...patch,
    }));
    setPreparation(null);
  }

  function useManualRangeNow() {
    setUseManualRange(true);
    setPreparation(null);
  }

  function selectRange(key: string) {
    setUseManualRange(false);
    setPreparation(null);
    persistSelectedKnownRange(key);
  }

  async function importMintDigest(digest = mintDigestInput.trim()) {
    if (!address || !isTestnet || !activeManagerId || !digest) {
      setImportStatus({
        state: "failed",
        error: "A Sui Testnet wallet, Predict Account, and mint transaction digest are required for import.",
      });
      return;
    }

    setImportStatus({ state: "loading", message: "Fetching transaction events and parsing RangeMinted." });

    try {
      const result = await client.getTransactionBlock({
        digest,
        options: {
          showEvents: true,
          showEffects: true,
          showObjectChanges: true,
        },
      });
      const event = parseRangeMintedEvent(result, DEEPBOOK_PREDICT_TESTNET);

      if (!event) {
        setImportStatus({
          state: "failed",
          error: "No RangeMinted event was found in that transaction.",
        });
        return;
      }

      const position = extractRangePositionFromMintEvent(event, digest);

      if (!position) {
        setImportStatus({
          state: "failed",
          error: "RangeMinted event was found, but RangeKey fields were incomplete.",
        });
        return;
      }

      if (position.managerId !== activeManagerId) {
        setImportStatus({
          state: "failed",
          error: "Imported RangeMinted manager ID does not match the active Predict Account.",
        });
        return;
      }

      if (event.fields?.trader && event.fields.trader.toLowerCase() !== address.toLowerCase()) {
        setImportStatus({
          state: "failed",
          error: "Imported RangeMinted trader does not match the connected wallet.",
        });
        return;
      }

      const range: PersistedRangeKey = {
        oracleId: position.oracleId,
        oracleObjectId: position.oracleId,
        underlyingAsset: null,
        expiry: String(position.expiry),
        lowerStrike: String(position.lowerStrike),
        higherStrike: String(position.higherStrike),
        quantity: position.quantity,
      };

      upsertKnownRange({
        ...range,
        source: "digest_import",
        status: "unknown",
        mintDigest: digest,
      });
      setUseManualRange(false);
      setImportStatus({ state: "success", message: "RangeMinted event imported. Direct range_position readback will confirm active quantity." });
      void queryClient.invalidateQueries({ queryKey: ["portfolio-readback"] });
    } catch (error) {
      setImportStatus({
        state: "failed",
        error: translateDeepBookPredictError(error),
      });
    }
  }

  async function prepareRedeemForRange(range = activeRange, quantity = redeemQuantity) {
    if (!address || !isTestnet || !activeManagerId || !range) {
      setTransactionStatus({
        state: "failed",
        error: "A Sui Testnet wallet, Predict Account, and recovered RangeKey are required before redeem preflight.",
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

            if (!useManualRange) {
              upsertKnownRange({
                ...activeRange,
                source: "local_storage",
                lastRedeemDigest: result.digest,
              });
            }
            updateDigests({ lastRedeemDigest: result.digest });
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
    knownRanges,
    visibleKnownRanges,
    selectedKnownRange,
    showInactiveRanges,
    setShowInactiveRanges,
    useManualRange,
    manualRange,
    activeRange,
    updateManualRange,
    useManualRangeNow,
    selectRange,
    mintDigestInput,
    setMintDigestInput,
    importStatus,
    importMintDigest: () => importMintDigest(),
    redeemQuantity,
    setRedeemQuantity,
    preparation,
    transactionStatus,
    rangePositionQuery,
    managerSummaryQuery,
    mintHistoryQuery,
    managerBalanceAtomic,
    canRedeem,
    prepareRedeem: () => prepareRedeemForRange(),
    redeem,
  };
}

function findKnownRange(
  ranges: readonly KnownRangeKeyRecord[],
  selectedKey: string | undefined,
): KnownRangeKeyRecord | null {
  return ranges.find((range) => range.key === selectedKey) ?? ranges[0] ?? null;
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

function normalizeMintHistoryRecord(record: Record<string, unknown>): PersistedRangeKey | null {
  const oracleId = stringField(record, "oracle_id") ?? stringField(record, "oracleId");
  const expiry = integerField(record, "expiry");
  const lowerStrike = integerField(record, "lower_strike") ?? integerField(record, "lowerStrike");
  const higherStrike = integerField(record, "higher_strike") ?? integerField(record, "higherStrike");
  const quantity = integerField(record, "quantity");

  if (!oracleId || !expiry || !lowerStrike || !higherStrike) {
    return null;
  }

  return {
    oracleId,
    oracleObjectId: oracleId,
    underlyingAsset: stringField(record, "underlying_asset") ?? stringField(record, "underlyingAsset"),
    expiry,
    lowerStrike,
    higherStrike,
    quantity: quantity ?? undefined,
  };
}

function digestFromRecord(record: Record<string, unknown>) {
  return stringField(record, "digest") ?? stringField(record, "event_digest") ?? undefined;
}

function stringField(record: Record<string, unknown>, field: string): string | null {
  const value = record[field];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function integerField(record: Record<string, unknown>, field: string): string | null {
  const value = record[field];

  if (typeof value !== "string" && typeof value !== "number" && typeof value !== "bigint") {
    return null;
  }

  try {
    const integer = BigInt(value);
    return integer >= 0n ? integer.toString() : null;
  } catch {
    return null;
  }
}
