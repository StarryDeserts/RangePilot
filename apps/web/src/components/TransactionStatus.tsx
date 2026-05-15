import type { TransactionStatus as TransactionStatusType } from "@rangepilot/types/deepbookPredict";

export function TransactionStatus({ status }: { status: TransactionStatusType }) {
  return (
    <section className={`transactionStatus ${status.state}`}>
      <strong>Transaction status:</strong> {status.state}
      {status.message && <p>{status.message}</p>}
      {status.error && <p className="error">{status.error}</p>}
      {status.digest && (
        <p>
          Digest: <span className="mono">{status.digest}</span>
        </p>
      )}
      {status.explorerUrl && (
        <p>
          <a href={status.explorerUrl} target="_blank" rel="noreferrer">
            Open in Sui Explorer
          </a>
        </p>
      )}
    </section>
  );
}
