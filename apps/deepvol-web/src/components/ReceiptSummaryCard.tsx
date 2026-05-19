import type { DeepVolPortfolioReceipt } from "../hooks/useDeepVolPortfolio";
import { formatAtomicAmount, formatTimestampMs, shortId } from "../lib/format";

type ReceiptSummaryCardProps = {
  receipt: DeepVolPortfolioReceipt;
};

export function ReceiptSummaryCard({ receipt }: ReceiptSummaryCardProps) {
  const object = receipt.object;

  return (
    <section className="card receiptCard">
      <div className="cardHeader">
        <div>
          <div className="eyebrow">
            {receipt.source === "local" ? "Locally stored receipt" : "DeepVol-5 validation artifact"}
          </div>
          <h2>MoveReceipt</h2>
        </div>
        <span className="statusBadge">{object ? statusLabel(object.status) : "Readback pending"}</span>
      </div>
      <dl className="detailsGrid">
        <div>
          <dt>Receipt ID</dt>
          <dd className="mono" title={receipt.receiptId}>{shortId(receipt.receiptId)}</dd>
        </div>
        <div>
          <dt>Digest</dt>
          <dd className="mono" title={receipt.digest ?? undefined}>{shortId(receipt.digest)}</dd>
        </div>
        <div>
          <dt>Owner</dt>
          <dd className="mono" title={object?.owner}>{shortId(object?.owner)}</dd>
        </div>
        <div>
          <dt>VolSeries</dt>
          <dd className="mono" title={object?.seriesId}>{shortId(object?.seriesId)}</dd>
        </div>
        <div>
          <dt>PredictManager</dt>
          <dd className="mono" title={object?.predictManagerId}>{shortId(object?.predictManagerId)}</dd>
        </div>
        <div>
          <dt>Expiry</dt>
          <dd>{formatTimestampMs(object?.expiry)}</dd>
        </div>
        <div>
          <dt>DOWN / lower</dt>
          <dd>{object?.lowerStrike ?? "Not available"}</dd>
        </div>
        <div>
          <dt>UP / upper</dt>
          <dd>{object?.upperStrike ?? "Not available"}</dd>
        </div>
        <div>
          <dt>Quantity</dt>
          <dd>{object?.quantity ?? "Not available"}</dd>
        </div>
        <div>
          <dt>Premium paid</dt>
          <dd>{formatAtomicAmount(object?.premiumPaid)} DUSDC</dd>
        </div>
        <div>
          <dt>Create Fee paid</dt>
          <dd>{formatAtomicAmount(object?.createFeePaid)} DUSDC</dd>
        </div>
      </dl>
      {receipt.readbackError && <p className="warningText">{receipt.readbackError}</p>}
      <p className="muted">
        This receipt is metadata and linkage only. The current UP/DOWN position quantities must be read from the underlying
        PredictManager; this scaffold does not include a full indexer.
      </p>
    </section>
  );
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
