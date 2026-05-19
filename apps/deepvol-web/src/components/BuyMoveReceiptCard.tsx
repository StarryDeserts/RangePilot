import type { TransactionStatus as TransactionStatusType } from "@rangepilot/types/deepbookPredict";
import type { DeepVolQuoteState } from "../hooks/useDeepVolQuote";
import { useBuyMoveReceipt } from "../hooks/useBuyMoveReceipt";
import { useSuiWallet } from "../hooks/useSuiWallet";
import { formatAtomicAmount } from "../lib/format";

type BuyMoveReceiptCardProps = {
  quote: DeepVolQuoteState;
  predictManagerId: string | null;
};

export function BuyMoveReceiptCard({ quote, predictManagerId }: BuyMoveReceiptCardProps) {
  const wallet = useSuiWallet();
  const buy = useBuyMoveReceipt({ quote, predictManagerId });

  return (
    <section className="card transactionCard">
      <div className="cardHeader">
        <div>
          <div className="eyebrow">Wallet-gated action</div>
          <h2>Buy MOVE receipt</h2>
        </div>
        <span className={buy.canSubmit ? "statusBadge successBadge" : "statusBadge blockedBadge"}>
          {buy.canSubmit ? "Ready" : "Blocked"}
        </span>
      </div>
      <p>
        DeepVol builds one transaction that calls `receipt::buy_move_receipt&lt;DUSDC&gt;`. The Move entrypoint derives the UP and
        DOWN legs from the VolSeries, mints both Predict positions, deposits the Create Fee, and transfers a non-custodial
        MoveReceipt to your wallet.
      </p>
      <dl className="detailsGrid">
        <div>
          <dt>Wallet</dt>
          <dd>{wallet.address ? "Connected" : "Not connected"}</dd>
        </div>
        <div>
          <dt>Network</dt>
          <dd>{wallet.isTestnet ? "Sui Testnet" : "Blocked"}</dd>
        </div>
        <div>
          <dt>PredictManager</dt>
          <dd className="mono wrapText">{predictManagerId ?? "Required"}</dd>
        </div>
        <div>
          <dt>Expected premium</dt>
          <dd>{formatAtomicAmount(quote.expectedPremiumAtomic)} DUSDC</dd>
        </div>
      </dl>

      {buy.blockers.length > 0 && (
        <div className="blockerList">
          <strong>Wallet prompt disabled</strong>
          <ul>
            {buy.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
          </ul>
        </div>
      )}

      <button className="primaryButton" type="button" disabled={!buy.canSubmit} onClick={buy.submit}>
        {buy.canSubmit ? "Review in wallet" : "Preflight required"}
      </button>
      <TransactionStatus status={buy.transactionStatus} />
    </section>
  );
}

function TransactionStatus({ status }: { status: TransactionStatusType }) {
  if (status.state === "idle") {
    return null;
  }

  return (
    <section className={`transactionStatus ${status.state}`}>
      <strong>Transaction status:</strong> {status.state}
      {status.message && <p>{status.message}</p>}
      {status.error && <p className="errorText">{status.error}</p>}
      {status.digest && <p>Digest: <span className="mono">{status.digest}</span></p>}
      {status.explorerUrl && (
        <p>
          <a href={status.explorerUrl} target="_blank" rel="noreferrer">Open in Sui Explorer</a>
        </p>
      )}
    </section>
  );
}
