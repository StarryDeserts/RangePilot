import { buildSuiExplorerTransactionUrl } from "@rangepilot/sdk/deepbookPredict";
import type { PersistedRangeKey } from "../hooks/useRangeTradingPersistence";
import { usePortfolioReadback } from "../hooks/usePortfolioReadback";
import { RangeKeyDetails } from "./RangeKeyDetails";
import { TransactionStatus } from "./TransactionStatus";

export function PortfolioReadbackCard({
  address,
  isTestnet,
  managerId,
}: {
  address: string | null;
  isTestnet: boolean;
  managerId: string | null;
}) {
  const portfolio = usePortfolioReadback({ address, isTestnet, managerId });

  return (
    <section className="card wideCard">
      <h2>Portfolio readback + redeem</h2>
      <p className="noticeInline">
        Direct devInspect range_position is the wallet-critical active quantity source. Public server summaries are diagnostic only.
      </p>

      <dl className="details compactDetails">
        <dt>Manager ID</dt>
        <dd className="mono breakAll">{portfolio.activeManagerId ?? "Load or enter a manager first"}</dd>
        <dt>Manager DUSDC balance</dt>
        <dd className="mono">{portfolio.managerBalanceAtomic ?? "Unavailable from diagnostic summary"}</dd>
        <dt>Manager summary</dt>
        <dd>{portfolio.managerSummaryQuery.status}</dd>
        <dt>Last mint digest</dt>
        <dd><DigestLink digest={portfolio.persistenceRecord?.lastMintDigest} /></dd>
        <dt>Last redeem digest</dt>
        <dd><DigestLink digest={portfolio.persistenceRecord?.lastRedeemDigest} /></dd>
      </dl>

      <section className="subsection">
        <h3>{portfolio.persistedRange ? "Persisted RangeKey" : "Manual RangeKey"}</h3>
        <RangeKeyDetails range={portfolio.activeRange} />
        {!portfolio.persistedRange && (
          <ManualRangeForm range={portfolio.manualRange} updateRange={portfolio.updateManualRange} />
        )}
      </section>

      <section className="subsection">
        <h3>Direct active quantity</h3>
        <dl className="details compactDetails">
          <dt>Readback status</dt>
          <dd>{portfolio.rangePositionQuery.status}</dd>
          <dt>Active quantity</dt>
          <dd className="mono">{portfolio.rangePositionQuery.data?.quantity ?? "Not read"}</dd>
        </dl>
        {portfolio.rangePositionQuery.error && (
          <p className="error">{portfolio.rangePositionQuery.error.message}</p>
        )}
        <div className="actions stackedActions">
          <button disabled={!portfolio.activeRange} onClick={() => portfolio.rangePositionQuery.refetch()}>
            Refresh direct range_position
          </button>
        </div>
      </section>

      <label className="fieldStack">
        Redeem quantity
        <input
          inputMode="numeric"
          pattern="[0-9]*"
          value={portfolio.redeemQuantity}
          onChange={(event) => portfolio.setRedeemQuantity(event.target.value)}
        />
      </label>

      <div className="actions stackedActions">
        <button disabled={!portfolio.activeRange} onClick={portfolio.prepareRedeem}>
          Run redeem quote + preflight
        </button>
        <button disabled={!portfolio.canRedeem} onClick={portfolio.redeem}>
          Redeem range with wallet
        </button>
      </div>

      {portfolio.preparation && (
        <section className="subsection">
          <h3>Redeem preparation</h3>
          <dl className="details compactDetails">
            <dt>Direct quantity</dt>
            <dd className="mono">{portfolio.preparation.position?.quantity ?? "Not available"}</dd>
            <dt>Mint cost atomic</dt>
            <dd className="mono">{portfolio.preparation.quote?.mintCostAtomic ?? "Not available"}</dd>
            <dt>Redeem payout atomic</dt>
            <dd className="mono">{portfolio.preparation.quote?.redeemPayoutAtomic ?? "Not available"}</dd>
            <dt>Full redeem preflight</dt>
            <dd>{portfolio.preparation.preflight?.status ?? "Not run"}</dd>
            <dt>Redeem enabled</dt>
            <dd>{portfolio.canRedeem ? "Yes" : "No"}</dd>
          </dl>
          {portfolio.preparation.blockers.length > 0 && (
            <ul className="statusList error">
              {portfolio.preparation.blockers.map((blocker) => (
                <li key={blocker.message}>{blocker.message}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      <TransactionStatus status={portfolio.transactionStatus} />
    </section>
  );
}

function ManualRangeForm({
  range,
  updateRange,
}: {
  range: PersistedRangeKey;
  updateRange: (patch: Partial<PersistedRangeKey>) => void;
}) {
  return (
    <div className="manualRangeGrid">
      <RangeInput label="Oracle ID" value={range.oracleId} onChange={(value) => updateRange({ oracleId: value })} />
      <RangeInput label="Oracle object ID" value={range.oracleObjectId} onChange={(value) => updateRange({ oracleObjectId: value })} />
      <RangeInput label="Expiry" value={range.expiry} onChange={(value) => updateRange({ expiry: value })} />
      <RangeInput label="Lower strike" value={range.lowerStrike} onChange={(value) => updateRange({ lowerStrike: value })} />
      <RangeInput label="Higher strike" value={range.higherStrike} onChange={(value) => updateRange({ higherStrike: value })} />
    </div>
  );
}

function RangeInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = `manual-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <label className="fieldStack" htmlFor={id}>
      {label}
      <input id={id} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function DigestLink({ digest }: { digest: string | undefined }) {
  if (!digest) {
    return <span>Not available</span>;
  }

  return (
    <a href={buildSuiExplorerTransactionUrl(digest)} target="_blank" rel="noreferrer">
      <span className="mono breakAll">{digest}</span>
    </a>
  );
}
