import { useMemo, useState } from "react";
import type { DusdcBalance } from "@rangepilot/types/deepbookPredict";
import { useDusdcBalance } from "../hooks/useDusdcBalance";
import { usePredictManager } from "../hooks/usePredictManager";
import { TransactionStatus } from "./TransactionStatus";

export function PredictManagerCard({
  address,
  isTestnet,
}: {
  address: string | null;
  isTestnet: boolean;
}) {
  const balanceQuery = useDusdcBalance(address);
  const manager = usePredictManager(address);
  const [manualManagerId, setManualManagerId] = useState("");
  const [depositAmountAtomic, setDepositAmountAtomic] = useState("1000000");
  const managerResult = manager.managerQuery.data;
  const managerId =
    managerResult?.status === "found" ? managerResult.manager.managerId : null;
  const canCreate = Boolean(address && isTestnet);
  const canDeposit = Boolean(
    address &&
      isTestnet &&
      managerId &&
      isPositiveInteger(depositAmountAtomic) &&
      balanceQuery.data?.coins.length,
  );
  const depositLabel = useMemo(
    () => formatDepositLabel(depositAmountAtomic),
    [depositAmountAtomic],
  );

  return (
    <section className="card">
      <h2>Predict Account</h2>
      {!address && <p>Connect a wallet to discover or create a Predict Account.</p>}
      {manager.managerQuery.isLoading && <p>Checking manager hint…</p>}
      {manager.managerQuery.error && (
        <p className="error">{manager.managerQuery.error.message}</p>
      )}
      {managerResult && (
        <>
          <dl className="details">
            <dt>Discovery status</dt>
            <dd>{managerResult.status}</dd>
            <dt>Manager ID</dt>
            <dd className="mono breakAll">{managerId ?? "Not confirmed"}</dd>
          </dl>
          {"layers" in managerResult && (
            <ul className="layers">
              {managerResult.layers.map((layer) => (
                <li key={layer.layer}>
                  <strong>{layer.layer}:</strong> {layer.status} — {layer.message}
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <div className="actions">
        <button disabled={!canCreate} onClick={manager.createManager}>
          Create Predict Account
        </button>
      </div>

      <form
        className="manualManager"
        onSubmit={(event) => {
          event.preventDefault();
          manager.setManualManagerId(manualManagerId);
        }}
      >
        <label htmlFor="manual-manager-id">Manual manager ID hint</label>
        <div className="formRow">
          <input
            id="manual-manager-id"
            value={manualManagerId}
            onChange={(event) => setManualManagerId(event.target.value)}
            placeholder="0x…"
          />
          <button disabled={!address || !manualManagerId.trim()} type="submit">
            Store hint
          </button>
        </div>
      </form>

      <form
        className="depositForm"
        onSubmit={(event) => {
          event.preventDefault();
          manager.depositDusdc(
            depositAmountAtomic,
            (balanceQuery.data as DusdcBalance | undefined)?.coins ?? [],
          );
        }}
      >
        <label htmlFor="deposit-amount">Deposit amount, atomic DUSDC units</label>
        <div className="formRow">
          <input
            id="deposit-amount"
            inputMode="numeric"
            pattern="[0-9]*"
            value={depositAmountAtomic}
            onChange={(event) => setDepositAmountAtomic(event.target.value)}
          />
          <button disabled={!canDeposit} type="submit">
            Deposit DUSDC
          </button>
        </div>
        <p className="muted">Selected amount: {depositLabel}</p>
      </form>

      <TransactionStatus status={manager.transactionStatus} />
    </section>
  );
}

function isPositiveInteger(value: string) {
  return /^[1-9][0-9]*$/.test(value);
}

function formatDepositLabel(amountAtomic: string) {
  if (!isPositiveInteger(amountAtomic)) {
    return "invalid amount";
  }

  const scale = 1_000_000n;
  const amount = BigInt(amountAtomic);
  const whole = amount / scale;
  const fraction = (amount % scale).toString().padStart(6, "0").replace(/0+$/, "");

  return `${fraction ? `${whole}.${fraction}` : whole.toString()} DUSDC`;
}
