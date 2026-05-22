import { PREDICT_PRIMITIVES } from "../components/PredictPrimitiveCards";
import { ReceiptSummaryCard } from "../components/ReceiptSummaryCard";
import { PageHero } from "../components/ui/PageHero";
import { StateCallout } from "../components/ui/StateCallout";
import { StatusPill } from "../components/ui/StatusPill";
import { useDeepVolPortfolio } from "../hooks/useDeepVolPortfolio";

export function PortfolioPage() {
  const portfolio = useDeepVolPortfolio();
  const receiptCount = portfolio.receipts.length;

  return (
    <div className="pageGrid portfolioPage">
      <PageHero
        eyebrow="DeepVol receipts"
        title="Track BTC MOVE receipts."
        meta={(
          <div className="heroMetaPills">
            <StatusPill tone={portfolio.hasLocalReceipts ? "success" : "warning"}>
              {portfolio.hasLocalReceipts ? "Local records" : "Reference artifact"}
            </StatusPill>
            <StatusPill tone="neutral">Indexer future work</StatusPill>
          </div>
        )}
      >
        <p>
          DeepVol receipts summarize the MOVE package while the underlying UP and DOWN Predict positions remain in the user's
          PredictManager. This MVP reads known local receipts and a validation reference only.
        </p>
      </PageHero>

      <section className="portfolioSummaryBand">
        <article>
          <span>Receipt records</span>
          <strong>{receiptCount}</strong>
        </article>
        <article>
          <span>Source</span>
          <strong>{portfolio.hasLocalReceipts ? "Local browser records" : "Validation reference"}</strong>
        </article>
        <article>
          <span>Readback mode</span>
          <strong>Known/local receipt only</strong>
        </article>
        <article>
          <span>Indexer</span>
          <strong>Future work</strong>
        </article>
      </section>

      {!portfolio.hasLocalReceipts && (
        <StateCallout tone="info" title="Create your first local receipt">
          No local receipt history was found for this browser. Start on <a href="/buy/btc-move">BTC MOVE</a> to connect a Testnet wallet,
          prepare a PredictManager, fund DUSDC, quote, run preflight, and only then review a buy transaction. The validation receipt below is
          reference evidence only, not connected-wallet inventory.
        </StateCallout>
      )}

      <section className="portfolioSection">
        <div className="cardHeader portfolioSectionHeader">
          <div>
            <div className="eyebrow">MOVE Receipts</div>
            <h2>Receipt-linked BTC MOVE positions</h2>
          </div>
          <StatusPill tone="success">Enabled receipt route</StatusPill>
        </div>
        {portfolio.isLoading && <section className="card">Loading receipt readback...</section>}
        {portfolio.error && (
          <StateCallout tone="danger" title="Portfolio readback error">
            {portfolio.error}
          </StateCallout>
        )}
        <div className="receiptList">
          {portfolio.receipts.map((receipt) => (
            <ReceiptSummaryCard key={`${receipt.source}:${receipt.receiptId}`} receipt={receipt} />
          ))}
        </div>
      </section>

      <section className="card primitiveSection">
        <div className="cardHeader">
          <div>
            <div className="eyebrow">Primitive Positions</div>
            <h2>Known-key readback groundwork</h2>
          </div>
          <StatusPill tone="neutral">Indexer future work</StatusPill>
        </div>
        <StateCallout tone="warning" title="Primitive trades do not create DeepVol MoveReceipt">
          Only BTC MOVE creates a receipt in this app. General primitive position indexing is future work; known/selected key readback is the first supported path.
        </StateCallout>
        <div className="primitiveGrid">
          {PREDICT_PRIMITIVES.map((primitive) => (
            <article className="primitiveCard primitivePositionCard" key={primitive.kind}>
              <span>{primitive.kind} positions</span>
              <p>{primitive.kind === "RANGE" ? "General RANGE indexing is future work." : "Known-key binary position readback is future work."}</p>
              <small>{primitive.riskCopy}</small>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
