import type { DeepVolPortfolioReceipt } from "../hooks/useDeepVolPortfolio";
import { formatAtomicAmount, formatTimestampMs, shortId } from "../lib/format";
import { redeemExecutionBlockers } from "../hooks/redeemMoveReceiptGate";
import { useDeepVolRedeemPreflight, type RedeemLegUiState } from "../hooks/useDeepVolRedeemPreflight";
import { DataGrid } from "./ui/DataGrid";
import { StateCallout } from "./ui/StateCallout";
import { StatusPill } from "./ui/StatusPill";

type ReceiptSummaryCardProps = {
  receipt: DeepVolPortfolioReceipt;
};

export function ReceiptSummaryCard({ receipt }: ReceiptSummaryCardProps) {
  const object = receipt.object;
  const sourceLabel = receipt.source === "local" ? "Local browser record" : "Controlled validation artifact";
  const redeem = useDeepVolRedeemPreflight(object, receipt.storedRecord);
  const redeemBlockers = redeemExecutionBlockers(redeem);

  return (
    <section className="card receiptCard">
      <div className="receiptTopRow">
        <div>
          <div className="eyebrow">{sourceLabel}</div>
          <h2>BTC MOVE Receipt</h2>
        </div>
        <div className="receiptStatusStack">
          <StatusPill tone={receipt.storedRecord?.redeemValidation ? "success" : object ? "success" : "warning"}>
            {receipt.storedRecord?.redeemValidation ? "Local redeemed" : object ? statusLabel(object.status) : "Readback pending"}
          </StatusPill>
          <StatusPill tone={receipt.source === "local" ? "info" : "neutral"}>{sourceLabel}</StatusPill>
        </div>
      </div>

      <div className="receiptMetricRow">
        <article>
          <span>Quantity</span>
          <strong>{object?.quantity ?? "Not available"}</strong>
        </article>
        <article>
          <span>Premium paid</span>
          <strong>{formatAtomicAmount(object?.premiumPaid)} DUSDC</strong>
        </article>
        <article>
          <span>Expiry</span>
          <strong>{formatTimestampMs(object?.expiry)}</strong>
        </article>
      </div>

      <div className="receiptLegRow">
        <article>
          <span>DOWN leg</span>
          <strong>Below {object?.lowerStrike ?? "lower strike"}</strong>
        </article>
        <article>
          <span>UP leg</span>
          <strong>Above {object?.upperStrike ?? "upper strike"}</strong>
        </article>
      </div>

      <DataGrid
        variant="compact"
        items={[
          {
            label: "Receipt ID",
            value: <span className="mono" title={receipt.receiptId}>{shortId(receipt.receiptId)}</span>,
          },
          {
            label: "Digest",
            value: <span className="mono" title={receipt.digest ?? undefined}>{shortId(receipt.digest)}</span>,
          },
          {
            label: "Owner",
            value: <span className="mono" title={object?.owner}>{shortId(object?.owner)}</span>,
          },
          {
            label: "VolSeries",
            value: <span className="mono" title={object?.seriesId}>{shortId(object?.seriesId)}</span>,
          },
          {
            label: "PredictManager",
            value: <span className="mono" title={object?.predictManagerId}>{shortId(object?.predictManagerId)}</span>,
          },
          { label: "Create Fee", value: `${formatAtomicAmount(object?.createFeePaid)} DUSDC` },
        ]}
      />

      <section className="redeemSection" aria-labelledby={`redeem-${receipt.receiptId}`}>
        <div className="redeemSectionHeader">
          <div>
            <div className="eyebrow">Guided redeem</div>
            <h3 id={`redeem-${receipt.receiptId}`}>Redeem readiness</h3>
          </div>
          <StatusPill tone={redeem.up.preflightPassed || redeem.down.preflightPassed ? "success" : "warning"}>
            {redeem.up.preflightPassed || redeem.down.preflightPassed ? "Preflight observed" : "Preflight required"}
          </StatusPill>
        </div>

        <div className="redeemLegGrid">
          <RedeemLegCard leg={redeem.down} label="DOWN leg" />
          <RedeemLegCard leg={redeem.up} label="UP leg" />
        </div>

        <div className="redeemActions">
          <button className="primaryButton" type="button" onClick={redeem.runPreflight} disabled={!redeem.canRunPreflight}>
            {redeem.isChecking ? "Running preflight..." : "Run redeem preflight"}
          </button>
          <button className="secondaryButton" type="button" onClick={redeem.executeControlledRedeem} disabled={!redeem.canExecute}>
            {redeem.transactionStatus.state === "building" || redeem.transactionStatus.state === "awaiting_wallet"
              ? "Redeem pending..."
              : "Redeem both receipt legs"}
          </button>
        </div>

        <p className="redeemMessage">{redeem.stale ? "Run redeem preflight again for the current wallet and receipt state." : redeem.message}</p>
        <TransactionStatusPanel status={redeem.transactionStatus} />
        {redeem.reconciliation && <RedeemReconciliationPanel reconciliation={redeem.reconciliation} />}

        <StateCallout tone="info" title="Non-custodial redeem boundary">
          This is a non-custodial receipt. The underlying UP and DOWN positions remain in your PredictManager. MVP redeem is guided:
          DeepVol helps you redeem the underlying positions, but it does not custody them. Because positions are non-custodial, advanced users can redeem
          directly through DeepBook Predict. DeepVol MVP focuses on guided UX and receipt tracking.
        </StateCallout>

        <StateCallout tone={redeem.canExecute ? "success" : "warning"} title={redeem.canExecute ? "Controlled execution ready" : "Controlled execution blockers"}>
          {redeemBlockers.length > 0
            ? redeemBlockers.join(" ")
            : "Fresh preflight, exact receipt gates, Testnet wallet, and one-shot checks are ready for one controlled browser-wallet redeem."}
        </StateCallout>
      </section>

      {receipt.readbackError && (
        <StateCallout tone="warning" title="Receipt readback limitation">
          {receipt.readbackError}
        </StateCallout>
      )}
      <StateCallout tone="info" title="Position boundary">
        Underlying positions stay in PredictManager. This MVP reads known/local receipts; general receipt indexing is future work.
      </StateCallout>
    </section>
  );
}

function TransactionStatusPanel({ status }: { status: ReturnType<typeof useDeepVolRedeemPreflight>["transactionStatus"] }) {
  if (status.state === "idle") {
    return null;
  }

  return (
    <div className={`redeemExecutionStatus redeemExecutionStatus-${status.state}`}>
      <strong>{transactionStatusLabel(status.state)}</strong>
      {status.message && <span>{status.message}</span>}
      {status.error && <span>{status.error}</span>}
      {status.digest && (
        <a href={status.explorerUrl} target="_blank" rel="noreferrer" className="mono">
          {shortId(status.digest)}
        </a>
      )}
    </div>
  );
}

function RedeemReconciliationPanel({ reconciliation }: { reconciliation: NonNullable<ReturnType<typeof useDeepVolRedeemPreflight>["reconciliation"]> }) {
  return (
    <div className="redeemReconciliationPanel">
      <div className="redeemReconciliationHeader">
        <strong>{reconciliation.status === "reconciled" ? "Redeem reconciled" : "Redeem needs review"}</strong>
        <StatusPill tone={reconciliation.status === "reconciled" ? "success" : "warning"}>
          {reconciliation.status === "reconciled" ? "Local/indexer-limited" : "Warnings"}
        </StatusPill>
      </div>
      <DataGrid
        variant="compact"
        items={[
          { label: "Digest", value: <a className="mono" href={reconciliation.explorerUrl} target="_blank" rel="noreferrer">{shortId(reconciliation.digest)}</a> },
          { label: "Total payout", value: reconciliation.totalPayoutAtomic ? `${formatAtomicAmount(reconciliation.totalPayoutAtomic)} DUSDC` : "Unavailable" },
          { label: "Manager balance before", value: formatAtomicAmount(reconciliation.managerBalanceBeforeAtomic) },
          { label: "Manager balance after", value: formatAtomicAmount(reconciliation.managerBalanceAfterAtomic) },
          { label: "UP position", value: `${reconciliation.up.positionBeforeAtomic ?? "?"} → ${reconciliation.up.positionAfterAtomic ?? "?"}` },
          { label: "DOWN position", value: `${reconciliation.down.positionBeforeAtomic ?? "?"} → ${reconciliation.down.positionAfterAtomic ?? "?"}` },
        ]}
      />
      {reconciliation.warnings.length > 0 && (
        <ul className="redeemWarningList">
          {reconciliation.warnings.map((warning) => <li key={warning}>{warning}</li>)}
        </ul>
      )}
    </div>
  );
}

function RedeemLegCard({ leg, label }: { leg: RedeemLegUiState; label: string }) {
  return (
    <article className="redeemLegCard">
      <div className="redeemLegCardTop">
        <span>{label}</span>
        <StatusPill tone={leg.preflightPassed ? "success" : leg.blocker ? "warning" : "neutral"}>
          {leg.preflightPassed ? "Passed" : leg.blocker ? "Blocked" : "Not checked"}
        </StatusPill>
      </div>
      <DataGrid
        variant="compact"
        items={[
          { label: "Strike", value: leg.strike ?? "Not available" },
          { label: "Receipt quantity", value: leg.receiptQuantityAtomic ?? "Not available" },
          { label: "Manager position", value: leg.managerPositionQuantityAtomic ?? "Run preflight" },
          { label: "Preflight quantity", value: leg.preflightQuantityAtomic ?? "Run preflight" },
          { label: "Redeem payout", value: leg.redeemPayoutAtomic ? `${formatAtomicAmount(leg.redeemPayoutAtomic)} DUSDC` : "Unavailable" },
        ]}
      />
      {leg.blocker && <p className="redeemLegBlocker">{leg.blocker}</p>}
    </article>
  );
}

function transactionStatusLabel(status: ReturnType<typeof useDeepVolRedeemPreflight>["transactionStatus"]["state"]): string {
  switch (status) {
    case "building":
      return "Building redeem";
    case "awaiting_wallet":
      return "Awaiting wallet";
    case "success":
      return "Redeem submitted";
    case "failed":
      return "Redeem failed";
    case "blocked_unconfirmed":
      return "Redeem blocked";
    case "submitted":
      return "Submitted";
    default:
      return "Redeem status";
  }
}

function statusLabel(status: number): string {
  switch (status) {
    case 0:
      return "Open";
    case 1:
      return "Settled marker";
    case 2:
      return "Cancelled";
    default:
      return `Unknown ${status}`;
  }
}
