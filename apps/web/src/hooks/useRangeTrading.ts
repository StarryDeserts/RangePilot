import { useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import type { RangeQuoteCandidate, TransactionStatus } from "@rangepilot/types/deepbookPredict";
import { DEEPBOOK_PREDICT_TESTNET } from "@rangepilot/config/deepbookPredictTestnet";
import {
  buildMintRangeTransaction,
  buildSuiExplorerTransactionUrl,
  extractRangePositionFromMintEvent,
  parseRangeMintedEvent,
  prepareRangeMint,
  scanMintableRangeCandidates,
  translateDeepBookPredictError,
  type GuidedRangeMintPreparation,
  type MintableRangeScanProgress,
  type MintableRangeScanResult,
} from "@rangepilot/sdk/deepbookPredict";
import { useRangeTradingPersistence } from "./useRangeTradingPersistence";

const DEFAULT_MINT_QUANTITY = "1000";
const BROWSER_SCAN_LIMITS = {
  maxQuoteAttempts: 120,
  maxPreflightAttempts: 30,
  maxOracleContexts: 4,
};

type CandidateScanStatus = {
  state: "idle" | "scanning" | "success" | "no_candidate" | "cancelled" | "failed";
  message?: string;
  error?: string;
};

export type ManualCandidateInput = {
  oracleId: string;
  expiry: string;
  lowerStrike: string;
  higherStrike: string;
  quantity: string;
};

export function useRangeTrading({
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
  const persistence = useRangeTradingPersistence(address, managerId);
  const scanAbortController = useRef<AbortController | null>(null);
  const [scanResult, setScanResult] = useState<MintableRangeScanResult | null>(null);
  const [scanProgress, setScanProgress] = useState<MintableRangeScanProgress | null>(null);
  const [scanStatus, setScanStatus] = useState<CandidateScanStatus>({ state: "idle" });
  const [selectedCandidate, setSelectedCandidate] = useState<RangeQuoteCandidate | null>(null);
  const [quantity, setQuantity] = useState(DEFAULT_MINT_QUANTITY);
  const [preparation, setPreparation] = useState<GuidedRangeMintPreparation | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>({ state: "idle" });
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
  const canMint = useMemo(() => {
    if (!preparation?.canMint || !selectedCandidate || !managerId) {
      return false;
    }

    return (
      preparation.quantity === quantity &&
      preparation.candidate.oracleId === selectedCandidate.oracleId &&
      preparation.candidate.oracleObjectId === selectedCandidate.oracleObjectId &&
      preparation.candidate.expiry === selectedCandidate.expiry &&
      preparation.candidate.lowerStrike === selectedCandidate.lowerStrike &&
      preparation.candidate.higherStrike === selectedCandidate.higherStrike
    );
  }, [managerId, preparation, quantity, selectedCandidate]);

  async function findCandidate() {
    if (!address || !isTestnet || !managerId) {
      setScanStatus({
        state: "failed",
        error: "Connect a Sui Testnet wallet and load a Predict Account before scanning.",
      });
      return;
    }

    const controller = new AbortController();
    scanAbortController.current = controller;
    setIsScanning(true);
    setPreparation(null);
    setScanResult(null);
    setScanProgress(null);
    setScanStatus({
      state: "scanning",
      message: "Scanning runtime active oracles, quotes, and full mint preflights.",
    });

    try {
      const result = await scanMintableRangeCandidates({
        client,
        sender: address,
        managerId,
        config: DEEPBOOK_PREDICT_TESTNET,
        ...BROWSER_SCAN_LIMITS,
        signal: controller.signal,
        onProgress: setScanProgress,
      });

      setScanResult(result);
      setSelectedCandidate(result.selectedCandidate);

      if (result.selectedCandidate) {
        setQuantity(result.selectedCandidate.quantity);
      }

      if (result.cancelled || controller.signal.aborted) {
        setScanStatus({
          state: "cancelled",
          message: "Candidate scan cancelled.",
        });
      } else if (result.selectedCandidate) {
        setScanStatus({
          state: "success",
          message: "Found a range candidate whose full mint preflight passed.",
        });
      } else {
        setScanStatus({
          state: "no_candidate",
          message: "Candidate scan: no mintable candidate found.",
        });
      }
    } catch (error) {
      if (controller.signal.aborted) {
        setScanStatus({
          state: "cancelled",
          message: "Candidate scan cancelled.",
        });
      } else {
        setScanStatus({
          state: "failed",
          error: translateDeepBookPredictError(error),
        });
      }
    } finally {
      if (scanAbortController.current === controller) {
        scanAbortController.current = null;
      }
      setIsScanning(false);
    }
  }

  function cancelScan() {
    scanAbortController.current?.abort();
    setScanStatus({
      state: "cancelled",
      message: "Candidate scan cancellation requested.",
    });
  }

  async function prepareMintForCandidate(candidate = selectedCandidate, requestedQuantity = quantity) {
    if (!address || !isTestnet || !managerId || !candidate) {
      setTransactionStatus({
        state: "failed",
        error: "A Sui Testnet wallet, Predict Account, and selected range candidate are required before mint preflight.",
      });
      return null;
    }

    setIsPreparing(true);
    setTransactionStatus({
      state: "building",
      message: "Running fresh official quote and full mint_range preflight.",
    });

    try {
      const result = await prepareRangeMint({
        client,
        sender: address,
        managerId,
        candidate,
        quantity: requestedQuantity,
        config: DEEPBOOK_PREDICT_TESTNET,
      });

      setPreparation(result);
      setTransactionStatus({
        state: result.canMint ? "success" : "failed",
        message: result.canMint
          ? "Full mint preflight passed. Wallet mint is now enabled for this exact range and quantity."
          : "Mint remains blocked because full preflight did not pass.",
        error: result.canMint ? undefined : result.blockers.map((blocker) => blocker.message).join("\n"),
      });
      return result;
    } catch (error) {
      setTransactionStatus({
        state: "failed",
        error: translateDeepBookPredictError(error),
      });
      return null;
    } finally {
      setIsPreparing(false);
    }
  }

  async function importCandidate(input: ManualCandidateInput) {
    const candidate = buildManualCandidate(input);

    setSelectedCandidate(candidate);
    setQuantity(input.quantity.trim());
    setPreparation(null);
    setScanStatus({
      state: "success",
      message: "Imported candidate selected. Running quote and full mint preflight for this exact range.",
    });

    return prepareMintForCandidate(candidate, input.quantity.trim());
  }

  async function mint() {
    if (!address || !isTestnet || !managerId || !selectedCandidate) {
      setTransactionStatus({
        state: "failed",
        error: "A Sui Testnet wallet, Predict Account, and selected range candidate are required before minting.",
      });
      return;
    }

    const freshPreparation = await prepareMintForCandidate(selectedCandidate, quantity);

    if (!freshPreparation?.canMint) {
      return;
    }

    try {
      const transaction = buildMintRangeTransaction({
        ...selectedCandidate,
        managerId,
        quantity,
        config: DEEPBOOK_PREDICT_TESTNET,
        allowRealTestnetMint: true,
      });

      setTransactionStatus({
        state: "awaiting_wallet",
        message: "Confirm mint_range<DUSDC> in your browser wallet.",
      });

      signAndExecuteTransaction.mutate(
        {
          transaction,
          chain: "sui:testnet",
        },
        {
          onSuccess: (result) => {
            const event = parseRangeMintedEvent(result, DEEPBOOK_PREDICT_TESTNET);
            const eventPosition = event ? extractRangePositionFromMintEvent(event, result.digest) : null;
            const persistedRange = {
              oracleId: eventPosition?.oracleId ?? selectedCandidate.oracleId,
              oracleObjectId: selectedCandidate.oracleObjectId,
              underlyingAsset: selectedCandidate.underlyingAsset,
              expiry: String(eventPosition?.expiry ?? selectedCandidate.expiry),
              lowerStrike: String(eventPosition?.lowerStrike ?? selectedCandidate.lowerStrike),
              higherStrike: String(eventPosition?.higherStrike ?? selectedCandidate.higherStrike),
              quantity: String(eventPosition?.quantity ?? quantity),
            };

            persistence.upsertKnownRange({
              ...persistedRange,
              source: "mint_event",
              status: "unknown",
              mintDigest: result.digest,
            });
            setTransactionStatus({
              state: "success",
              digest: result.digest,
              explorerUrl: buildSuiExplorerTransactionUrl(result.digest),
              message: event ? "RangeMinted event parsed and known RangeKey persisted." : "Mint succeeded; RangeMinted event was not parsed from wallet result.",
            });
            void queryClient.invalidateQueries({ queryKey: ["portfolio-readback"] });
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
    scanResult,
    scanProgress,
    scanStatus,
    selectedCandidate,
    setSelectedCandidate,
    quantity,
    setQuantity,
    preparation,
    isScanning,
    isPreparing,
    transactionStatus,
    canMint,
    persistenceRecord: persistence.record,
    findCandidate,
    cancelScan,
    importCandidate,
    prepareMint: () => prepareMintForCandidate(),
    mint,
  };
}

function buildManualCandidate(input: ManualCandidateInput): RangeQuoteCandidate {
  const oracleId = input.oracleId.trim();
  const expiry = input.expiry.trim();
  const lowerStrike = input.lowerStrike.trim();
  const higherStrike = input.higherStrike.trim();
  const width = BigInt(higherStrike) - BigInt(lowerStrike);

  return {
    oracleId,
    oracleObjectId: oracleId,
    underlyingAsset: null,
    expiry,
    lowerStrike,
    higherStrike,
    widthTicks: width > 0n ? width.toString() : "1",
    anchorSource: "forward",
    anchorPrice: lowerStrike,
    strategy: "centered",
    family: "manual_import",
  };
}
