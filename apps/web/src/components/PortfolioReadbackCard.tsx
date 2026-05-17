import { buildSuiExplorerTransactionUrl } from "@rangepilot/sdk/deepbookPredict";
import type { KnownRangeKeyRecord, PersistedRangeKey } from "../hooks/useRangeTradingPersistence";
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
        Direct devInspect range_position is the wallet-critical active quantity source. Public server summaries and mint history are diagnostic recovery hints only.
      </p>

      <dl className="details compactDetails">
        <dt>Manager ID</dt>
        <dd className="mono breakAll">{portfolio.activeManagerId ?? "Load or enter a manager first"}</dd>
        <dt>Manager DUSDC balance</dt>
        <dd className="mono">{portfolio.managerBalanceAtomic ?? "Unavailable from diagnostic summary"}</dd>
        <dt>Manager summary</dt>
        <dd>{portfolio.managerSummaryQuery.status}</dd>
        <dt>Mint history recovery</dt>
        <dd>{portfolio.mintHistoryQuery.status}</dd>
        <dt>Last mint digest</dt>
        <dd><DigestLink digest={portfolio.persistenceRecord?.lastMintDigest} /></dd>
        <dt>Last redeem digest</dt>
        <dd><DigestLink digest={portfolio.persistenceRecord?.lastRedeemDigest} /></dd>
      </dl>

      <KnownRangeRecovery portfolio={portfolio} />
      <MintDigestImport portfolio={portfolio} disabled={!address || !isTestnet || !managerId} />

      <section className="subsection">
        <h3>{portfolio.useManualRange ? "Manual RangeKey target" : "Selected recovered range"}</h3>
        <RangeKeyDetails range={portfolio.activeRange} />
        {!portfolio.activeRange && (
          <p className="warningText">No recovered minted range is selected yet. Import a mint digest or use Advanced Debug.</p>
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

      <details className="subsection">
        <summary>Advanced Debug: Enter RangeKey manually</summary>
        <p className="muted">Manual RangeKey entry is a developer fallback. Redeem still requires direct range_position readback, quote, positive payout, and full redeem preflight.</p>
        <ManualRangeForm range={portfolio.manualRange} updateRange={portfolio.updateManualRange} />
        <div className="actions stackedActions">
          <button disabled={!canUseManualRange(portfolio.manualRange)} onClick={portfolio.useManualRangeNow}>
            Use manual RangeKey
          </button>
        </div>
      </details>

      <TransactionStatus status={portfolio.transactionStatus} />
    </section>
  );
}

type PortfolioReadbackState = ReturnType<typeof usePortfolioReadback>;

function KnownRangeRecovery({ portfolio }: { portfolio: PortfolioReadbackState }) {
  return (
    <section className="subsection">
      <h3>Known recovered ranges</h3>
      {portfolio.knownRanges.length === 0 ? (
        <p className="warningText">No known minted ranges recovered for this manager yet.</p>
      ) : (
        <>
          <label className="checkboxRow">
            <input
              type="checkbox"
              checked={portfolio.showInactiveRanges}
              onChange={(event) => portfolio.setShowInactiveRanges(event.target.checked)}
            />
            Show inactive ranges
          </label>
          <div className="knownRangeList">
            {portfolio.visibleKnownRanges.map((range) => (
              <KnownRangeRow
                key={range.key}
                range={range}
                selected={portfolio.selectedKnownRange?.key === range.key && !portfolio.useManualRange}
                onSelect={() => portfolio.selectRange(range.key)}
              />
            ))}
          </div>
          {portfolio.visibleKnownRanges.length === 0 && (
            <p className="muted">Inactive ranges are hidden. Enable “Show inactive ranges” to inspect zero-quantity records.</p>
          )}
        </>
      )}
    </section>
  );
}

function KnownRangeRow({
  range,
  selected,
  onSelect,
}: {
  range: KnownRangeKeyRecord;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <article className={`knownRangeItem${selected ? " selected" : ""}`}>
      <dl className="details compactDetails">
        <dt>Range</dt>
        <dd className="mono breakAll">{range.lowerStrike}/{range.higherStrike}</dd>
        <dt>Status</dt>
        <dd>{formatKnownRangeStatus(range)}</dd>
        <dt>Source</dt>
        <dd>{range.source}</dd>
        <dt>Readback quantity</dt>
        <dd className="mono">{range.lastReadbackQuantity ?? "Not confirmed"}</dd>
        <dt>Mint digest</dt>
        <dd><DigestLink digest={range.mintDigests[0]} /></dd>
      </dl>
      <div className="actions stackedActions">
        <button disabled={selected} onClick={onSelect}>
          {selected ? "Selected" : "Use range"}
        </button>
      </div>
    </article>
  );
}

function MintDigestImport({
  portfolio,
  disabled,
}: {
  portfolio: PortfolioReadbackState;
  disabled: boolean;
}) {
  return (
    <section className="subsection">
      <h3>Import from mint transaction digest</h3>
      <p className="muted">Use this when local recovery has no RangeMinted event for the active manager.</p>
      <form
        className="formRow"
        onSubmit={(event) => {
          event.preventDefault();
          void portfolio.importMintDigest();
        }}
      >
        <input
          className="mono"
          placeholder="Mint transaction digest"
          value={portfolio.mintDigestInput}
          onChange={(event) => portfolio.setMintDigestInput(event.target.value)}
        />
        <button disabled={disabled || portfolio.importStatus.state === "loading" || !portfolio.mintDigestInput.trim()}>
          Import minted range
        </button>
      </form>
      {portfolio.importStatus.message && <p className="success">{portfolio.importStatus.message}</p>}
      {portfolio.importStatus.error && <p className="error">{portfolio.importStatus.error}</p>}
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

function formatKnownRangeStatus(range: KnownRangeKeyRecord) {
  if (range.status === "inactive") {
    return "Inactive";
  }

  if (range.status === "active") {
    return "Active";
  }

  return "Unconfirmed";
}

function canUseManualRange(range: PersistedRangeKey) {
  return Boolean(
    range.oracleId.trim() &&
      range.oracleObjectId.trim() &&
      range.expiry.trim() &&
      range.lowerStrike.trim() &&
      range.higherStrike.trim(),
  );
}
