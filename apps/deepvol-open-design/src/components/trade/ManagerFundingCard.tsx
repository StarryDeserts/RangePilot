import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import type { TransactionStatus } from "@rangepilot/types/deepbookPredict";
import {
  buildDepositDusdcTransaction,
  selectDusdcCoinsForAmount,
  buildSuiExplorerTransactionUrl,
  translateDeepBookPredictError,
} from "@rangepilot/sdk/deepbookPredict";
import { DEEPBOOK_PREDICT_TESTNET } from "@rangepilot/config/deepbookPredictTestnet";
import { useSuiWallet } from "../../hooks/useSuiWallet";
import { useDeepVolDusdcBalance } from "../../hooks/useDeepVolDusdcBalance";
import { formatAtomicAmount } from "../../lib/format";
import { TESTNET_CHAIN } from "../../lib/constants";
import { TransactionStatusStrip } from "./TransactionStatusStrip";

type Props = {
  managerId: string;
  managerBalanceAtomic: string | null;
  onDeposited?: () => void;
};

export function ManagerFundingCard({ managerId, managerBalanceAtomic, onDeposited }: Props) {
  const wallet = useSuiWallet();
  const client = useSuiClient();
  const queryClient = useQueryClient();
  const dusdcBalance = useDeepVolDusdcBalance();
  const [depositAmountAtomic, setDepositAmountAtomic] = useState("");
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

  const selectedCoins = useMemo(() => {
    if (!dusdcBalance.data || !/^[1-9][0-9]*$/.test(depositAmountAtomic)) return null;
    try {
      return selectDusdcCoinsForAmount(dusdcBalance.data.coins, depositAmountAtomic);
    } catch {
      return null;
    }
  }, [dusdcBalance.data, depositAmountAtomic]);

  const canDeposit = Boolean(
    wallet.address && wallet.isTestnet && managerId && selectedCoins && depositAmountAtomic,
  );

  function depositDusdc() {
    if (!wallet.address || !wallet.isTestnet || !managerId) {
      setTransactionStatus({
        state: "blocked_unconfirmed",
        error: "Connect a Sui Testnet wallet with a valid PredictManager before depositing.",
      });
      return;
    }
    if (!selectedCoins) {
      setTransactionStatus({
        state: "blocked_unconfirmed",
        error: "Wallet DUSDC coins cannot cover the requested deposit amount.",
      });
      return;
    }

    setTransactionStatus({ state: "building", message: "Building deposit<DUSDC> transaction." });

    try {
      const transaction = buildDepositDusdcTransaction({
        managerId,
        amountAtomic: depositAmountAtomic,
        coins: selectedCoins,
        config: DEEPBOOK_PREDICT_TESTNET,
        allowRealTestnetDeposit: true,
      });

      setTransactionStatus({ state: "awaiting_wallet", message: "Confirm deposit in your wallet." });

      signAndExecuteTransaction.mutate(
        { transaction, chain: TESTNET_CHAIN },
        {
          onSuccess: (result) => {
            setTransactionStatus({
              state: "success",
              digest: result.digest,
              explorerUrl: buildSuiExplorerTransactionUrl(result.digest),
              message: "DUSDC deposited. Refresh quote/preflight after balance settles.",
            });
            void queryClient.invalidateQueries({ queryKey: ["deepvol-dusdc-balance"] });
            void queryClient.invalidateQueries({ queryKey: ["deepvol-predict-manager-balance"] });
            onDeposited?.();
          },
          onError: (err) => {
            setTransactionStatus({
              state: "failed",
              error: translateDeepBookPredictError(err),
            });
          },
        },
      );
    } catch (err) {
      setTransactionStatus({
        state: "blocked_unconfirmed",
        error: translateDeepBookPredictError(err),
      });
    }
  }

  const isDepositing = signAndExecuteTransaction.isPending;

  return (
    <div className="space-y-4">
      <div className="glass-inner p-5 space-y-4">
        <div>
          <div className="text-sm font-medium text-white">Deposit DUSDC</div>
          <p className="mt-1 text-[12px] text-ink-mid">
            Fund your PredictManager with DUSDC before quoting or trading primitives.
          </p>
        </div>

        <div className="space-y-2 text-[13px]">
          <div className="flex justify-between">
            <span className="text-ink-mid">Manager balance</span>
            <span className="font-mono text-white">{formatAtomicAmount(managerBalanceAtomic)} DUSDC</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-mid">Wallet DUSDC</span>
            <span className="font-mono text-white">
              {dusdcBalance.isLoading ? (
                <span className="inline-flex items-center gap-1"><span className="spinner" /> Loading...</span>
              ) : (
                <>{formatAtomicAmount(dusdcBalance.data?.totalAtomic)} DUSDC</>
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-mid">Wallet coins</span>
            <span className="font-mono text-white">{dusdcBalance.data?.coins.length ?? 0}</span>
          </div>
        </div>

        {dusdcBalance.error && (
          <div className="toast-warn p-3 rounded-xl text-[12px]">
            Wallet DUSDC balance check failed: {dusdcBalance.error instanceof Error ? dusdcBalance.error.message : String(dusdcBalance.error)}
          </div>
        )}

        <div>
          <label className="text-[11px] text-ink-low block mb-1">Deposit amount (atomic DUSDC)</label>
          <input
            className="input w-full text-[12px] font-mono"
            inputMode="numeric"
            placeholder="1000000"
            value={depositAmountAtomic}
            onChange={(e) => setDepositAmountAtomic(e.target.value)}
          />
          <p className="text-[11px] text-ink-low mt-1">1 DUSDC = 1,000,000 atomic units.</p>
        </div>

        <button
          onClick={depositDusdc}
          disabled={!canDeposit || isDepositing}
          className={
            !canDeposit || isDepositing
              ? "w-full rounded-2xl py-4 font-medium text-ink-low bg-white/[0.03] border border-white/10 cursor-not-allowed inline-flex items-center justify-center gap-2"
              : "bg-cta w-full rounded-2xl py-4 font-medium text-white shadow-cta ring-aqua"
          }
        >
          {isDepositing ? (
            <><span className="spinner" /> Depositing...</>
          ) : (
            "Deposit DUSDC to PredictManager"
          )}
        </button>
      </div>

      <TransactionStatusStrip status={transactionStatus} />
    </div>
  );
}
