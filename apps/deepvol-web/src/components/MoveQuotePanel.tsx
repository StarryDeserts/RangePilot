import type { DeepVolQuoteState } from "../hooks/useDeepVolQuote";
import { formatAtomicAmount, formatTimestampMs, shortId } from "../lib/format";

type MoveQuotePanelProps = {
  quote: DeepVolQuoteState;
};

export function MoveQuotePanel({ quote }: MoveQuotePanelProps) {
  return (
    <section className={`card quotePanel state-${quote.status}`}>
      <div className="cardHeader">
        <div>
          <div className="eyebrow">Runtime quote and preflight</div>
          <h2>BTC MOVE preview</h2>
        </div>
        <span className="statusBadge">{quote.status}</span>
      </div>

      {quote.error && <p className="errorText">{quote.error}</p>}

      <dl className="detailsGrid">
        <div>
          <dt>VolSeries</dt>
          <dd className="mono" title={quote.series?.seriesId}>{shortId(quote.series?.seriesId)}</dd>
        </div>
        <div>
          <dt>Oracle</dt>
          <dd className="mono" title={quote.series?.oracleId}>{shortId(quote.series?.oracleId)}</dd>
        </div>
        <div>
          <dt>Expiry</dt>
          <dd>{formatTimestampMs(quote.series?.expiry)}</dd>
        </div>
        <div>
          <dt>Lower / DOWN strike</dt>
          <dd>{quote.series?.lowerStrike ?? "Not available"}</dd>
        </div>
        <div>
          <dt>Upper / UP strike</dt>
          <dd>{quote.series?.upperStrike ?? "Not available"}</dd>
        </div>
        <div>
          <dt>Quantity</dt>
          <dd>{quote.quantity}</dd>
        </div>
        <div>
          <dt>UP quote</dt>
          <dd>{formatAtomicAmount(quote.upQuoteAtomic)} DUSDC</dd>
        </div>
        <div>
          <dt>DOWN quote</dt>
          <dd>{formatAtomicAmount(quote.downQuoteAtomic)} DUSDC</dd>
        </div>
        <div>
          <dt>Expected premium</dt>
          <dd>{formatAtomicAmount(quote.expectedPremiumAtomic)} DUSDC</dd>
        </div>
        <div>
          <dt>Max premium paid</dt>
          <dd>{formatAtomicAmount(quote.maxPremiumPaidAtomic)} DUSDC</dd>
        </div>
        <div>
          <dt>Create Fee</dt>
          <dd>{formatAtomicAmount(quote.createFeeAtomic)} DUSDC</dd>
        </div>
        <div>
          <dt>Fee coin</dt>
          <dd className="mono" title={quote.feeCoin?.coinObjectId}>{shortId(quote.feeCoin?.coinObjectId)}</dd>
        </div>
        <div>
          <dt>Quoted at</dt>
          <dd>{formatTimestampMs(quote.quotedAtMs)}</dd>
        </div>
        <div>
          <dt>Preflight</dt>
          <dd>{quote.preflight.message}</dd>
        </div>
      </dl>

      {quote.warnings.length > 0 && (
        <div className="warningList">
          <strong>Warnings</strong>
          <ul>
            {quote.warnings.map((warning) => <li key={warning}>{warning}</li>)}
          </ul>
        </div>
      )}

      {quote.blockers.length > 0 && (
        <div className="blockerList">
          <strong>Buy blockers</strong>
          <ul>
            {quote.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
          </ul>
        </div>
      )}
    </section>
  );
}
