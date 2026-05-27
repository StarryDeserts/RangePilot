import { useState } from "react";
import type { PredictManagerSession } from "../../hooks/usePredictManagerSession";
import { formatAtomicAmount, shortId } from "../../lib/format";
import { ManagerFundingCard } from "./ManagerFundingCard";
import { TransactionStatusStrip } from "./TransactionStatusStrip";

type Props = { manager: PredictManagerSession };

export function PredictManagerSetup({ manager }: Props) {
  const { status, transactionStatus } = manager;

  if (status === "ready") {
    const isFunded = manager.balance !== null && manager.balance !== "0" && BigInt(manager.balance) > 0n;

    if (isFunded) {
      return (
        <div className="px-6 pt-4 pb-2">
          <div className="flex items-center justify-between text-[12px]">
            <span className="inline-flex items-center gap-2 text-ink-mid">
              <span className="dot-live" /> PredictManager ready
            </span>
            <span className="font-mono text-seafoam-400">{formatAtomicAmount(manager.balance)} DUSDC</span>
          </div>
        </div>
      );
    }

    return (
      <div className="p-6 pb-3 space-y-4">
        <ManagerFundingCard
          managerId={manager.predictManagerId!}
          managerBalanceAtomic={manager.balance}
          onDeposited={() => manager.refresh()}
        />
      </div>
    );
  }

  return (
    <div className="p-6 pb-3 space-y-4">
      {status === "wallet_required" && <WalletRequiredBlock />}
      {status === "wrong_network" && <WrongNetworkBlock />}
      {status === "missing" && <MissingManagerBlock manager={manager} />}
      {status === "loading" && <LoadingBlock />}
      {(status === "invalid" || status === "error") && (
        <ErrorBlock manager={manager} />
      )}
      <TransactionStatusStrip status={transactionStatus} />
    </div>
  );
}

function WalletRequiredBlock() {
  return (
    <div className="glass-inner p-5">
      <div className="text-sm font-medium text-white">Connect wallet</div>
      <p className="mt-1 text-[12px] text-ink-mid">
        Connect a Sui Testnet wallet from the navbar to begin trading.
      </p>
    </div>
  );
}

function WrongNetworkBlock() {
  return (
    <div className="glass-inner p-5">
      <div className="text-sm font-medium text-white">Switch to Sui Testnet</div>
      <p className="mt-1 text-[12px] text-ink-mid">
        DeepVol Predict is available on Sui Testnet only. Switch networks in your wallet.
      </p>
    </div>
  );
}

function MissingManagerBlock({ manager }: { manager: PredictManagerSession }) {
  return (
    <div className="glass-inner p-5 space-y-4">
      <div>
        <div className="text-sm font-medium text-white">Create PredictManager</div>
        <p className="mt-1 text-[12px] text-ink-mid">
          PredictManager is your personal DeepBook Predict account for holding
          DUSDC balances and primitive positions.
        </p>
      </div>
      <button
        onClick={manager.createManager}
        disabled={!manager.canCreate || manager.isCreating}
        className={
          !manager.canCreate || manager.isCreating
            ? "w-full rounded-2xl py-4 font-medium text-ink-low bg-white/[0.03] border border-white/10 cursor-not-allowed inline-flex items-center justify-center gap-2"
            : "bg-cta w-full rounded-2xl py-4 font-medium text-white shadow-cta ring-aqua"
        }
      >
        {manager.isCreating ? (
          <>
            <span className="spinner" /> Creating PredictManager...
          </>
        ) : (
          "Create PredictManager"
        )}
      </button>
    </div>
  );
}

function LoadingBlock() {
  return (
    <div className="glass-inner p-5 flex items-center gap-3">
      <span className="spinner" />
      <div>
        <div className="text-sm font-medium text-white">Validating PredictManager...</div>
        <p className="mt-0.5 text-[11px] text-ink-mid">
          Checking object type and owner on Sui Testnet.
        </p>
      </div>
    </div>
  );
}

function ErrorBlock({ manager }: { manager: PredictManagerSession }) {
  const [manualInput, setManualInput] = useState("");

  return (
    <div className="glass-inner p-5 space-y-3">
      <div>
        <div className="text-sm font-medium text-white">
          {manager.status === "invalid"
            ? "PredictManager invalid"
            : "Validation error"}
        </div>
        <p className="mt-1 text-[12px] text-ink-mid">
          {manager.validationMessage ??
            "The stored PredictManager could not be validated for the connected wallet."}
        </p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={manager.refresh}
          className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm hover:border-aqua-400/40 ring-aqua"
        >
          Refresh
        </button>
        <button
          onClick={manager.clear}
          className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm hover:border-aqua-400/40 ring-aqua"
        >
          Clear saved manager
        </button>
      </div>
      <details className="group">
        <summary className="cursor-pointer text-[11px] text-ink-low select-none">
          <span className="inline-block transition-transform group-open:rotate-90">›</span>{" "}
          Advanced / Developer
        </summary>
        <div className="mt-3 space-y-2">
          <p className="text-[11px] text-ink-mid">
            Paste a PredictManager object ID to store locally. This overrides auto-discovery.
          </p>
          <input
            className="input w-full text-[12px] font-mono"
            placeholder="0x..."
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
          />
          <button
            onClick={() => {
              const trimmed = manualInput.trim();
              if (trimmed) manager.setManualManager(trimmed);
            }}
            disabled={!manualInput.trim()}
            className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm hover:border-aqua-400/40 ring-aqua disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Store locally
          </button>
          {manager.knownManagerId && (
            <p className="text-[10px] text-ink-low font-mono">
              Current: {shortId(manager.knownManagerId)}
              {manager.source ? ` (${manager.source})` : ""}
            </p>
          )}
        </div>
      </details>
    </div>
  );
}

