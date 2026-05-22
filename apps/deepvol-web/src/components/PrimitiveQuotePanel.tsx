import type { PrimitivePreflightController } from "../hooks/usePrimitivePreflight";
import type { PrimitiveQuoteState } from "../hooks/usePrimitiveQuote";
import { PRIMITIVE_EXECUTION_DISABLED_BLOCKER, buildPrimitiveExecutionBlockers } from "../hooks/primitiveQuoteGate";
import { formatAtomicAmount, formatTimestampMs, shortId } from "../lib/format";
import { DataGrid } from "./ui/DataGrid";
import { StateCallout } from "./ui/StateCallout";
import { StatusPill } from "./ui/StatusPill";

type PrimitiveQuotePanelProps = {
  quote: PrimitiveQuoteState;
  preflight: PrimitivePreflightController;
};

export function PrimitiveQuotePanel({ quote, preflight }: PrimitiveQuotePanelProps) {
  const executionBlockers = buildPrimitiveExecutionBlockers();

  return (
    <section className={`card quotePanel state-${quote.status}`}>
      <div className="cardHeader">
        <div>
          <div className="eyebrow">Preview only</div>
          <h2>{quote.primitiveKind} primitive quote</h2>
        </div>
        <div className="cardActions">
          <StatusPill tone={statusTone(quote.status)}>{quote.status}</StatusPill>
          <button className="secondaryButton" type="button" disabled={!quote.canRefresh || quote.isRefreshing} onClick={quote.refreshQuote}>
            {quote.isRefreshing ? "Refreshing" : "Refresh quote"}
          </button>
        </div>
      </div>

      <StateCallout tone="info" title="Direct primitive trade boundary">
        Primitive trades do not create a DeepVol MoveReceipt. Only BTC MOVE creates a receipt in this app.
      </StateCallout>

      {quote.error && (
        <StateCallout tone="danger" title="Quote error">
          {quote.error}
        </StateCallout>
      )}

      <div className="primitiveQuoteMetrics">
        <article className="metricCard metricCard-hero">
          <span>Mint cost preview</span>
          <strong>{formatAtomicAmount(quote.mintCostAtomic)} DUSDC</strong>
          <small>Runtime devInspect quote for the selected primitive and quantity.</small>
        </article>
        <article className="metricCard">
          <span>Redeem payout preview</span>
          <strong>{formatAtomicAmount(quote.redeemPayoutAtomic)} DUSDC</strong>
          <small>Runtime-dependent payout preview; refresh before wallet review in future flows.</small>
        </article>
        <article className="metricCard">
          <span>Quote source</span>
          <strong>{quote.mintCostAtomic ? "devInspect" : "Not ready"}</strong>
          <small>No wallet signature or transaction submission is used.</small>
        </article>
      </div>

      <DataGrid
        variant="compact"
        items={[
          {
            label: "VolSeries",
            value: <span className="mono" title={quote.series?.seriesId}>{shortId(quote.series?.seriesId)}</span>,
          },
          {
            label: "Oracle",
            value: <span className="mono" title={quote.series?.oracleId}>{shortId(quote.series?.oracleId)}</span>,
          },
          { label: "Expiry", value: formatTimestampMs(quote.series?.expiry) },
          { label: "Quantity", value: quote.quantity },
          { label: "Strike", value: quote.strike ?? "Not applicable" },
          { label: "Lower / upper", value: quote.lowerStrike && quote.upperStrike ? `${quote.lowerStrike} / ${quote.upperStrike}` : "Not applicable" },
          { label: "Quoted at", value: formatTimestampMs(quote.quotedAtMs) },
          { label: "Preflight ran", value: formatTimestampMs(preflight.lastRunAtMs) },
        ]}
      />

      <section className={`preflightAction state-${preflight.status}`} aria-live="polite">
        <div>
          <span className="eyebrow">devInspect only</span>
          <strong>Run primitive mint preflight</strong>
          <p>{preflight.status === "passed" ? "Primitive mint preflight passed for the selected quote." : "Preflight builds the primitive mint PTB and runs devInspect only."}</p>
        </div>
        <button className="primaryButton" type="button" disabled={!preflight.canRun || preflight.isRunning} onClick={preflight.runPreflight}>
          {preflight.isRunning ? "Running preflight" : "Run preflight"}
        </button>
      </section>

      {preflight.abortMessage && (
        <StateCallout tone="danger" title="Preflight failed">
          <p>{preflight.abortMessage}</p>
          {preflight.abortKnownReason && <small>Known reason: {preflight.abortKnownReason}</small>}
        </StateCallout>
      )}

      <section className="primitiveExecutionDisabled">
        <div>
          <span className="eyebrow">Execution disabled</span>
          <strong>Buy primitive / Mint primitive</strong>
          <p>{PRIMITIVE_EXECUTION_DISABLED_BLOCKER}</p>
        </div>
        <button className="primaryButton" type="button" disabled>
          Buy primitive disabled
        </button>
      </section>

      {[...quote.warnings, ...preflight.warnings].length > 0 && (
        <StateCallout tone="info" title="Diagnostics">
          <ul>
            {[...quote.warnings, ...preflight.warnings].map((warning) => <li key={warning}>{warning}</li>)}
          </ul>
        </StateCallout>
      )}

      {quote.blockers.length > 0 && (
        <StateCallout tone="warning" title="Quote blockers">
          <ul>
            {quote.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
          </ul>
        </StateCallout>
      )}

      {preflight.blockers.length > 0 && (
        <StateCallout tone="warning" title="Preflight blockers">
          <ul>
            {preflight.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
          </ul>
        </StateCallout>
      )}

      {executionBlockers.length > 0 && (
        <StateCallout tone="warning" title="Execution blockers">
          <ul>
            {executionBlockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
          </ul>
        </StateCallout>
      )}
    </section>
  );
}

function statusTone(status: PrimitiveQuoteState["status"]) {
  if (status === "ready") {
    return "success";
  }

  if (status === "blocked" || status === "loading") {
    return "warning";
  }

  if (status === "error") {
    return "danger";
  }

  return "neutral";
}
