import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSuiClient, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import type { DusdcCoin, TransactionStatus } from "@rangepilot/types/deepbookPredict";
import {
  buildCreateManagerTransaction,
  buildDepositDusdcTransaction,
  buildSuiExplorerTransactionUrl,
  findPredictManagerByOwner,
  recoverPredictManagerIdFromCreateResult,
  translateDeepBookPredictError,
} from "@rangepilot/sdk/deepbookPredict";
import { DEEPBOOK_PREDICT_TESTNET } from "@rangepilot/config/deepbookPredictTestnet";

const MANAGER_STORAGE_PREFIX = "rangepilot:predict-manager";

export function usePredictManager(address: string | null, isTestnet = false) {
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
    enabled: Boolean(address && isTestnet),
  });
  const managerId =
    managerQuery.data?.status === "found"
      ? managerQuery.data.manager.managerId
      : knownManagerId;

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

  function rememberManagerId(managerId: string) {
    if (!storageKey) {
      return;
    }

    window.localStorage.setItem(storageKey, managerId);
    setKnownManagerId(managerId);
  }

  function createManager() {
    if (!address || !isTestnet) {
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
            const recovery = recoverPredictManagerIdFromCreateResult(result, DEEPBOOK_PREDICT_TESTNET);
            const digest = result.digest;
            const explorerUrl = buildSuiExplorerTransactionUrl(digest);

            if (recovery.managerId) {
              rememberManagerId(recovery.managerId);
            }

            setTransactionStatus({
              state: "success",
              digest,
              explorerUrl,
              message: recovery.managerId
                ? `${recovery.message} Manager ID stored.`
                : `${recovery.message} Copy the manager ID manually after confirming event fields.`,
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
    if (!managerId) {
      setTransactionStatus({
        state: "failed",
        error: "A Predict Account manager ID is required before depositing DUSDC.",
      });
      return;
    }

    if (!address || !isTestnet) {
      setTransactionStatus({
        state: "failed",
        error: "Connect a Sui Testnet wallet before depositing DUSDC.",
      });
      return;
    }

    if (!/^[1-9][0-9]*$/.test(amountAtomic)) {
      setTransactionStatus({
        state: "failed",
        error: "Deposit amount must be a positive integer in atomic DUSDC units.",
      });
      return;
    }

    if (coins.length === 0) {
      setTransactionStatus({
        state: "failed",
        error: "No DUSDC coin objects are available for deposit.",
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
        allowRealTestnetDeposit: true,
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
    managerId,
    transactionStatus,
    createManager,
    depositDusdc,
    setManualManagerId,
  };
}
