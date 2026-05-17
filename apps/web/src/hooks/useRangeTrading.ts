import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import type { RangeQuoteCandidate, TransactionStatus } from "@rangepilot/types/deepbookPredict";
import { DEEPBOOK_PREDICT_TESTNET } from "@rangepilot/config/deepbookPredictTestnet";
import {
  buildMintRangeTransaction,
  buildSuiExplorerTransactionUrl,
  parseRangeMintedEvent,
  prepareRangeMint,
  scanMintableRangeCandidates,
  translateDeepBookPredictError,
  type GuidedRangeMintPreparation,
  type MintableRangeScanResult,
} from "@rangepilot/sdk/deepbookPredict";
import { useRangeTradingPersistence } from "./useRangeTradingPersistence";

const DEFAULT_MINT_QUANTITY = "1000";

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
  const persistence = useRangeTradingPersistence(address);
  const [scanResult, setScanResult] = useState<MintableRangeScanResult | null>(null);
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
      preparation.candidate.expiry === selectedCandidate.expiry &&
      preparation.candidate.lowerStrike === selectedCandidate.lowerStrike &&
      preparation.candidate.higherStrike === selectedCandidate.higherStrike
    );
  }, [managerId, preparation, quantity, selectedCandidate]);

  async function findCandidate() {
    if (!address || !isTestnet || !managerId) {
      setTransactionStatus({
        state: "failed",
        error: "Connect a Sui Testnet wallet and load a Predict Account before scanning.",
      });
      return;
    }

    setIsScanning(true);
    setPreparation(null);
    setTransactionStatus({
      state: "building",
      message: "Scanning runtime active oracles, quotes, and mint preflights.",
    });

    try {
      const result = await scanMintableRangeCandidates({
        client,
        sender: address,
        managerId,
        config: DEEPBOOK_PREDICT_TESTNET,
      });

      setScanResult(result);
      setSelectedCandidate(result.selectedCandidate);
      setQuantity(result.selectedCandidate?.quantity ?? quantity);
      persistence.updateRecord({ managerId });
      setTransactionStatus({
        state: result.selectedCandidate ? "success" : "failed",
        message: result.selectedCandidate
          ? "Found a range candidate whose full mint preflight passed."
          : "Candidate scan completed without a preflight-passing mint candidate.",
        error: result.selectedCandidate ? undefined : result.blockers.map((blocker) => blocker.message).join("\n"),
      });
    } catch (error) {
      setTransactionStatus({
        state: "failed",
        error: translateDeepBookPredictError(error),
      });
    } finally {
      setIsScanning(false);
    }
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
            const eventFields = event?.fields;
            const persistedRange = {
              oracleId: eventFields?.oracleId ?? selectedCandidate.oracleId,
              oracleObjectId: selectedCandidate.oracleObjectId,
              underlyingAsset: selectedCandidate.underlyingAsset,
              expiry: eventFields?.expiry ?? String(selectedCandidate.expiry),
              lowerStrike: eventFields?.lowerStrike ?? String(selectedCandidate.lowerStrike),
              higherStrike: eventFields?.higherStrike ?? String(selectedCandidate.higherStrike),
              quantity: eventFields?.quantity ?? quantity,
            };

            persistence.updateRecord({
              managerId,
              lastRangeKey: persistedRange,
              lastMintDigest: result.digest,
            });
            setTransactionStatus({
              state: "success",
              digest: result.digest,
              explorerUrl: buildSuiExplorerTransactionUrl(result.digest),
              message: event ? "RangeMinted event parsed and last RangeKey persisted." : "Mint succeeded; RangeMinted event was not parsed from wallet result.",
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
    prepareMint: () => prepareMintForCandidate(),
    mint,
  };
}
