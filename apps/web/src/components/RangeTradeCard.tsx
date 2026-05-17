import type { MintAbortClassification, RangeQuoteCandidate } from "@rangepilot/types/deepbookPredict";
import type { MintableRangeCandidate } from "@rangepilot/sdk/deepbookPredict";
import { useRangeTrading } from "../hooks/useRangeTrading";
import { RangeKeyDetails } from "./RangeKeyDetails";
import { TransactionStatus } from "./TransactionStatus";

export function RangeTradeCard({
  address,
  isTestnet,
  managerId,
}: {
  address: string | null;
  isTestnet: boolean;
  managerId: string | null;
}) {
  const trading = useRangeTrading({ address, isTestnet, managerId });
  const selected = trading.selectedCandidate;
  const managerBalanceAtomic = trading.scanResult?.managerBalanceAtomic ?? null;

  return (
    <section className="card wideCard">
      <h2>Guided range trade</h2>
      <p className="noticeInline">
        Quote success alone does not enable mint. Full mint preflight is required before wallet approval.
      </p>
      <dl className="details compactDetails">
        <dt>Manager ID</dt>
        <dd className="mono breakAll">{managerId ?? "Load or create a Predict Account first"}</dd>
        <dt>Manager DUSDC balance</dt>
        <dd className="mono">{managerBalanceAtomic ?? "Run candidate scan to read public server summary"}</dd>
        <dt>Scan status</dt>
        <dd>{trading.isScanning ? "Scanning" : trading.scanResult ? "Completed" : "Not started"}</dd>
      </dl>

      <div className="actions stackedActions">
        <button disabled={!address || !isTestnet || !managerId || trading.isScanning} onClick={trading.findCandidate}>
          Find mintable Testnet range candidate
        </button>
      </div>

      {trading.scanResult && (
        <ScanSummary result={trading.scanResult} />
      )}

      <section className="subsection">
        <h3>Selected range</h3>
        <RangeKeyDetails range={selected} />
        {candidateOptions(trading.scanResult?.preflightAttempts).length > 1 && (
          <label className="fieldStack">
            Select preflight-passed candidate
            <select
              value={selected ? candidateKey(selected) : ""}
              onChange={(event) => {
                const next = trading.scanResult?.preflightAttempts.find(
                  (candidate) => candidateKey(candidate) === event.target.value,
                );
                trading.setSelectedCandidate(next ?? null);
              }}
            >
              {candidateOptions(trading.scanResult?.preflightAttempts).map((candidate) => (
                <option key={candidateKey(candidate)} value={candidateKey(candidate)}>
                  {candidate.underlyingAsset ?? "range"} {candidate.lowerStrike}/{candidate.higherStrike} quantity {candidate.quantity}
                </option>
              ))}
            </select>
          </label>
        )}
      </section>

      <label className="fieldStack">
        Quantity
        <input
          inputMode="numeric"
          pattern="[0-9]*"
          value={trading.quantity}
          onChange={(event) => trading.setQuantity(event.target.value)}
        />
      </label>

      <div className="actions stackedActions">
        <button disabled={!selected || trading.isPreparing} onClick={trading.prepareMint}>
          Run quote + mint preflight
        </button>
        <button disabled={!trading.canMint} onClick={trading.mint}>
          Mint range with wallet
        </button>
      </div>

      {trading.preparation && (
        <section className="subsection">
          <h3>Quote + preflight</h3>
          <dl className="details compactDetails">
            <dt>Mint cost atomic</dt>
            <dd className="mono">{trading.preparation.quote?.mintCostAtomic ?? "Not available"}</dd>
            <dt>Redeem payout atomic</dt>
            <dd className="mono">{trading.preparation.quote?.redeemPayoutAtomic ?? "Not available"}</dd>
            <dt>Full mint preflight</dt>
            <dd>{trading.preparation.preflight?.status ?? "Not run"}</dd>
            <dt>Mint enabled</dt>
            <dd>{trading.canMint ? "Yes" : "No"}</dd>
          </dl>
          <BlockerList blockers={trading.preparation.blockers} warnings={trading.preparation.warnings} />
        </section>
      )}

      <TransactionStatus status={trading.transactionStatus} />
    </section>
  );
}

function ScanSummary({ result }: { result: ReturnType<typeof useRangeTrading>["scanResult"] }) {
  if (!result) {
    return null;
  }

  return (
    <section className="subsection">
      <h3>Candidate scan summary</h3>
      <dl className="details compactDetails">
        <dt>Oracle contexts</dt>
        <dd>{result.oracleContexts.length}</dd>
        <dt>Quote attempts</dt>
        <dd>{result.quoteAttempts.length}</dd>
        <dt>Preflight attempts</dt>
        <dd>{result.preflightAttempts.length}</dd>
        <dt>Selected candidate</dt>
        <dd>{result.selectedCandidate ? "Found" : "Not found"}</dd>
      </dl>
      <BlockerList blockers={result.blockers} warnings={result.warnings} />
      {result.preflightAttempts.some((attempt) => attempt.preflight.status === "failed") && (
        <details>
          <summary>Failed mint preflight diagnostics</summary>
          <ul className="statusList">
            {result.preflightAttempts
              .flatMap((attempt) => attempt.preflight.status === "failed" ? [{ attempt, abort: attempt.preflight.abort }] : [])
              .slice(0, 6)
              .map(({ attempt, abort }) => (
                <li key={candidateKey(attempt)}>
                  {attempt.lowerStrike}/{attempt.higherStrike}: {formatAbort(abort)}
                </li>
              ))}
          </ul>
        </details>
      )}
    </section>
  );
}

function BlockerList({
  blockers,
  warnings,
}: {
  blockers: readonly { message: string }[];
  warnings: readonly string[];
}) {
  return (
    <>
      {blockers.length > 0 && (
        <ul className="statusList error">
          {blockers.map((blocker) => (
            <li key={blocker.message}>{blocker.message}</li>
          ))}
        </ul>
      )}
      {warnings.length > 0 && (
        <ul className="statusList warningText">
          {warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}
    </>
  );
}

function candidateOptions(candidates: readonly MintableRangeCandidate[] | undefined) {
  return candidates?.filter((candidate) => candidate.preflight.status === "passed") ?? [];
}

function candidateKey(candidate: RangeQuoteCandidate) {
  return `${candidate.oracleId}:${candidate.expiry}:${candidate.lowerStrike}:${candidate.higherStrike}:${candidate.widthTicks}:${candidate.strategy}`;
}

function formatAbort(abort: MintAbortClassification) {
  const label = [abort.module, abort.function, abort.code].filter(Boolean).join("::");
  return `${label || "Move abort"}${abort.constantName ? ` (${abort.constantName})` : ""}`;
}
