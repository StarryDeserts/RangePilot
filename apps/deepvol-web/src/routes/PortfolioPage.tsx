import { ReceiptSummaryCard } from "../components/ReceiptSummaryCard";
import { useDeepVolPortfolio } from "../hooks/useDeepVolPortfolio";

export function PortfolioPage() {
  const portfolio = useDeepVolPortfolio();

  return (
    <div className="pageGrid">
      <section className="introPanel">
        <div className="eyebrow">Portfolio scaffold</div>
        <h1>DeepVol receipts</h1>
        <p>
          This page reads locally stored receipts from successful wallet flows. Without local records, it shows the DeepVol-5
          validated receipt as a labeled reference artifact. General receipt enumeration requires a future indexer.
        </p>
      </section>

      {!portfolio.hasLocalReceipts && (
        <section className="noticeBanner">
          No local receipt history was found for this browser, so the validation receipt is shown as reference evidence only.
        </section>
      )}

      {portfolio.isLoading && <section className="card">Loading receipt readback…</section>}
      {portfolio.error && <section className="card errorText">{portfolio.error}</section>}
      {portfolio.receipts.map((receipt) => (
        <ReceiptSummaryCard key={`${receipt.source}:${receipt.receiptId}`} receipt={receipt} />
      ))}
    </div>
  );
}
