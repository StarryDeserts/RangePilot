import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSuiClient, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import type { DusdcCoin, TransactionStatus } from "@rangepilot/types/deepbookPredict";
import {
  buildCreateManagerTransaction,
  buildDepositDusdcTransaction,
  buildSuiExplorerTransactionUrl,
  findPredictManagerByOwner,
  parsePredictManagerCreatedEvent,
  translateDeepBookPredictError,
} from "@rangepilot/sdk/deepbookPredict";
import { DEEPBOOK_PREDICT_TESTNET } from "@rangepilot/config/deepbookPredictTestnet";

const MANAGER_STORAGE_PREFIX = "rangepilot:predict-manager";

export function usePredictManager(address: string | null) {
  const client = useSuiClient();
  const queryClient = useQueryClient();
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>({
    state: "idle",
  });
  const storageKey = useMemo(
    () =>
      address
        ? `${MANAGER_STORAGE_PREFIX}:${DEEPBOOK_PREDICT_TESTNET.network}:${address}`
        : null,
    [address],
  );
  const [knownManagerId, setKnownManagerId] = useState<string | null>(null);

  useEffect(() => {
    if (!storageKey) {
      setKnownManagerId(null);
      return;
    }

    setKnownManagerId(window.localStorage.getItem(storageKey));
  }, [storageKey]);

  const managerQuery = useQuery({
    queryKey: ["predict-manager", address, knownManagerId],
    queryFn: () =>
      findPredictManagerByOwner({
        owner: address!,
        knownManagerId,
        config: DEEPBOOK_PREDICT_TESTNET,
      }),
    enabled: Boolean(address),
  });

  const signAndExecuteTransaction = useSignAndExecuteTransaction({
    execute: async ({ bytes, signature }) =>
      client.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: {
          showEvents: true,
          showObjectChanges: true,
          showRawEffects: true,
        },
      }),
  });

  function rememberManagerId(managerId: string) {
    if (!storageKey) {
      return;
    }

    window.localStorage.setItem(storageKey, managerId);
    setKnownManagerId(managerId);
  }

  function createManager() {
    if (!address) {
      setTransactionStatus({
        state: "failed",
        error: "Connect a Sui Testnet wallet before creating a Predict Account.",
      });
      return;
    }

    setTransactionStatus({
      state: "awaiting_wallet",
      message: "Confirm create_manager in your browser wallet.",
    });

    try {
      const transaction = buildCreateManagerTransaction({
        config: DEEPBOOK_PREDICT_TESTNET,
      });

      signAndExecuteTransaction.mutate(
        {
          transaction,
          chain: "sui:testnet",
        },
        {
          onSuccess: (result) => {
            const event = parsePredictManagerCreatedEvent(result.events, DEEPBOOK_PREDICT_TESTNET);
            const digest = result.digest;
            const explorerUrl = buildSuiExplorerTransactionUrl(digest);

            if (event?.managerId) {
              rememberManagerId(event.managerId);
            }

            setTransactionStatus({
              state: "success",
              digest,
              explorerUrl,
              message: event?.managerId
                ? "Predict Account created and manager ID stored."
                : "Transaction succeeded, but manager ID recovery remains unconfirmed. Copy the manager ID manually after confirming event fields.",
            });
            void queryClient.invalidateQueries({ queryKey: ["predict-manager"] });
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

  function depositDusdc(amountAtomic: string, coins: readonly DusdcCoin[]) {
    const managerId =
      managerQuery.data?.status === "found" ? managerQuery.data.manager.managerId : null;

    if (!managerId) {
      setTransactionStatus({
        state: "failed",
        error: "A Predict Account manager ID is required before depositing DUSDC.",
      });
      return;
    }

    setTransactionStatus({
      state: "building",
      message: "Checking DUSDC coin selection and deposit PTB readiness.",
    });

    try {
      const transaction = buildDepositDusdcTransaction({
        managerId,
        amountAtomic,
        coins: [...coins],
        config: DEEPBOOK_PREDICT_TESTNET,
      });

      setTransactionStatus({
        state: "awaiting_wallet",
        message: "Confirm deposit<DUSDC> in your browser wallet.",
      });

      signAndExecuteTransaction.mutate(
        {
          transaction,
          chain: "sui:testnet",
        },
        {
          onSuccess: (result) => {
            setTransactionStatus({
              state: "success",
              digest: result.digest,
              explorerUrl: buildSuiExplorerTransactionUrl(result.digest),
              message: "DUSDC deposit transaction succeeded.",
            });
            void queryClient.invalidateQueries({ queryKey: ["dusdc-balance"] });
            void queryClient.invalidateQueries({ queryKey: ["predict-manager"] });
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

  function setManualManagerId(managerId: string) {
    const trimmedManagerId = managerId.trim();

    if (!trimmedManagerId) {
      return;
    }

    rememberManagerId(trimmedManagerId);
  }

  return {
    managerQuery,
    knownManagerId,
    transactionStatus,
    createManager,
    depositDusdc,
    setManualManagerId,
  };
}
