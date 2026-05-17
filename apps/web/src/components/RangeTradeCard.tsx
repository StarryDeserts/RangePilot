import { useState } from "react";
import type { MintAbortClassification, RangeQuoteCandidate } from "@rangepilot/types/deepbookPredict";
import type { MintableRangeCandidate } from "@rangepilot/sdk/deepbookPredict";
import { useRangeTrading, type ManualCandidateInput } from "../hooks/useRangeTrading";
import { RangeKeyDetails } from "./RangeKeyDetails";
import { TransactionStatus } from "./TransactionStatus";

const EMPTY_MANUAL_CANDIDATE: ManualCandidateInput = {
  oracleId: "",
  expiry: "",
  lowerStrike: "",
  higherStrike: "",
  quantity: "1000",
};

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
  const [manualCandidate, setManualCandidate] = useState<ManualCandidateInput>(EMPTY_MANUAL_CANDIDATE);

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
        <dt>Candidate scan</dt>
        <dd>{formatScanState(trading.scanStatus.state)}</dd>
      </dl>

      <div className="actions stackedActions">
        <button disabled={!address || !isTestnet || !managerId || trading.isScanning} onClick={trading.findCandidate}>
          Find mintable Testnet range candidate
        </button>
        {trading.isScanning && (
          <button type="button" onClick={trading.cancelScan}>
            Cancel scan
          </button>
        )}
      </div>

      <CandidateScanStatus trading={trading} />

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

      <details className="subsection">
        <summary>Advanced Diagnostics: import candidate</summary>
        <p className="muted">Developer fallback for candidate fields from script output or diagnostics. Imported candidates still require full mint preflight.</p>
        <div className="manualRangeGrid">
          <RangeInput label="Oracle ID" value={manualCandidate.oracleId} onChange={(oracleId) => setManualCandidate((current) => ({ ...current, oracleId }))} />
          <RangeInput label="Expiry" value={manualCandidate.expiry} onChange={(expiry) => setManualCandidate((current) => ({ ...current, expiry }))} />
          <RangeInput label="Lower strike" value={manualCandidate.lowerStrike} onChange={(lowerStrike) => setManualCandidate((current) => ({ ...current, lowerStrike }))} />
          <RangeInput label="Higher strike" value={manualCandidate.higherStrike} onChange={(higherStrike) => setManualCandidate((current) => ({ ...current, higherStrike }))} />
          <RangeInput label="Quantity" value={manualCandidate.quantity} onChange={(quantity) => setManualCandidate((current) => ({ ...current, quantity }))} />
        </div>
        <div className="actions stackedActions">
          <button disabled={!canImportCandidate(manualCandidate) || trading.isPreparing} onClick={() => trading.importCandidate(manualCandidate)}>
            Run quote + full mint preflight for imported candidate
          </button>
        </div>
      </details>

      <TransactionStatus status={trading.transactionStatus} />
    </section>
  );
}

function CandidateScanStatus({ trading }: { trading: ReturnType<typeof useRangeTrading> }) {
  const progress = trading.scanProgress;

  return (
    <section className="subsection">
      <h3>Candidate scan status</h3>
      <dl className="details compactDetails">
        <dt>Status</dt>
        <dd>{formatScanState(trading.scanStatus.state)}</dd>
        <dt>Message</dt>
        <dd>{trading.scanStatus.message ?? trading.scanStatus.error ?? "Not started"}</dd>
        <dt>Oracle progress</dt>
        <dd>{progress ? `Scanning oracle ${progress.oracleIndex}/${progress.oracleTotal}` : "Not scanning"}</dd>
        <dt>Quote attempts</dt>
        <dd>{progress ? `${progress.quoteAttempts}/${progress.maxQuoteAttempts}` : "0/120"}</dd>
        <dt>Preflight attempts</dt>
        <dd>{progress ? `${progress.preflightAttempts}/${progress.maxPreflightAttempts}` : "0/30"}</dd>
        <dt>Current candidate</dt>
        <dd className="mono breakAll">{progress?.currentCandidate ? `${progress.currentCandidate.lowerStrike}/${progress.currentCandidate.higherStrike}` : "None"}</dd>
      </dl>
      {trading.scanStatus.state === "no_candidate" && (
        <p className="warningText">No mintable candidate found within browser scan limits. Try again later, refresh market data, or use Advanced Diagnostics.</p>
      )}
      {trading.scanStatus.error && <p className="error">{trading.scanStatus.error}</p>}
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
        <dt>Positive affordable quotes</dt>
        <dd>{result.diagnostics.positiveAffordableQuoteCount}</dd>
        <dt>Dominant failure</dt>
        <dd>{result.diagnostics.dominantAbortGroup?.key ?? "None"}</dd>
        <dt>Selected candidate</dt>
        <dd>{result.selectedCandidate ? "Found" : "Not found"}</dd>
      </dl>
      {result.diagnostics.summary.length > 0 && (
        <ul className="statusList warningText">
          {result.diagnostics.summary.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
      <BlockerList blockers={result.blockers} warnings={result.warnings} />
      <details>
        <summary>Advanced Details: raw scan diagnostics</summary>
        {result.diagnostics.abortGroups.length > 0 && (
          <ul className="statusList">
            {result.diagnostics.abortGroups.map((group) => (
              <li key={group.key}>
                {group.key}: {group.count} failure{group.count === 1 ? "" : "s"}
              </li>
            ))}
          </ul>
        )}
        {result.preflightAttempts.some((attempt) => attempt.preflight.status === "failed") && (
          <ul className="statusList">
            {result.preflightAttempts
              .flatMap((attempt) => attempt.preflight.status === "failed" ? [{ attempt, abort: attempt.preflight.abort }] : [])
              .slice(0, 12)
              .map(({ attempt, abort }) => (
                <li key={candidateKey(attempt)}>
                  {attempt.lowerStrike}/{attempt.higherStrike} quantity {attempt.quantity}: {formatAbort(abort)}
                </li>
              ))}
          </ul>
        )}
      </details>
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

function RangeInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = `trade-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <label className="fieldStack" htmlFor={id}>
      {label}
      <input id={id} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function candidateOptions(candidates: readonly MintableRangeCandidate[] | undefined) {
  return candidates?.filter((candidate) => candidate.preflight.status === "passed") ?? [];
}

function candidateKey(candidate: RangeQuoteCandidate & { quantity?: string }) {
  return `${candidate.oracleId}:${candidate.expiry}:${candidate.lowerStrike}:${candidate.higherStrike}:${candidate.quantity ?? ""}`;
}

function formatAbort(abort: MintAbortClassification) {
  const label = [abort.module, abort.function, abort.code].filter(Boolean).join("::");
  return `${label || "Move abort"}${abort.constantName ? ` (${abort.constantName})` : ""}`;
}

function formatScanState(state: ReturnType<typeof useRangeTrading>["scanStatus"]["state"]) {
  switch (state) {
    case "no_candidate":
      return "No mintable candidate found";
    case "cancelled":
      return "Cancelled";
    case "failed":
      return "Scan error";
    case "scanning":
      return "Scanning";
    case "success":
      return "Found";
    default:
      return "Not started";
  }
}

function canImportCandidate(candidate: ManualCandidateInput) {
  return Boolean(
    candidate.oracleId.trim() &&
      candidate.expiry.trim() &&
      candidate.lowerStrike.trim() &&
      candidate.higherStrike.trim() &&
      /^[1-9][0-9]*$/.test(candidate.quantity.trim()),
  );
}
