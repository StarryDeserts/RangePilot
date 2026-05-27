import type { TransactionStatus } from "@rangepilot/types/deepbookPredict";

export function TransactionStatusStrip({ status }: { status: TransactionStatus }) {
  if (status.state === "idle") return null;

  const toastClass =
    status.state === "success" ? "toast-pass"
    : status.state === "failed" ? "toast-fail"
    : status.state === "blocked_unconfirmed" ? "toast-warn"
    : "";

  const label =
    status.state === "success" ? "Transaction confirmed"
    : status.state === "failed" ? "Transaction failed"
    : status.state === "awaiting_wallet" ? "Confirm in wallet..."
    : status.state === "building" ? "Preparing transaction..."
    : status.state === "blocked_unconfirmed" ? "Blocked"
    : "Processing...";

  return (
    <div className={`${toastClass} p-3 rounded-xl`}>
      <div className="text-[12px] font-medium text-white inline-flex items-center gap-2">
        {(status.state === "awaiting_wallet" || status.state === "building") && (
          <span className="spinner" />
        )}
        {label}
      </div>
      {status.message && (
        <p className="text-[11px] text-ink-mid mt-1">{status.message}</p>
      )}
      {status.error && (
        <p className="text-[11px] text-ink-mid mt-1">{status.error}</p>
      )}
      {status.explorerUrl && (
        <a
          href={status.explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-aqua-400 hover:underline mt-1 inline-block"
        >
          View on Sui Explorer
        </a>
      )}
    </div>
  );
}
