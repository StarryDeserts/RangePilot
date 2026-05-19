import { useDeepVolConfig } from "../hooks/useDeepVolConfig";
import { shortId } from "../lib/format";

export function AdvancedDetails() {
  const config = useDeepVolConfig();

  return (
    <details className="advancedDetails">
      <summary>Advanced details</summary>
      <div className="advancedContent">
        <p>
          These IDs are configured Testnet deployment references. The validated receipt and digest are historical evidence,
          not live quote data or current market terms.
        </p>
        <dl className="detailsGrid">
          <div>
            <dt>DeepVol package</dt>
            <dd className="mono" title={config.packageId ?? undefined}>{shortId(config.packageId)}</dd>
          </div>
          <div>
            <dt>Predict object</dt>
            <dd className="mono" title={config.predictId}>{shortId(config.predictId)}</dd>
          </div>
          <div>
            <dt>DUSDC type</dt>
            <dd className="mono wrapText">{config.dusdcCoinType}</dd>
          </div>
          <div>
            <dt>Validated receipt</dt>
            <dd className="mono" title={config.validatedReferenceReceiptId}>{shortId(config.validatedReferenceReceiptId)}</dd>
          </div>
          <div>
            <dt>Validated buy digest</dt>
            <dd className="mono" title={config.validatedReferenceBuyDigest}>{shortId(config.validatedReferenceBuyDigest)}</dd>
          </div>
          <div>
            <dt>Custody model</dt>
            <dd>{config.receiptCustody.replace("_", " ")}</dd>
          </div>
        </dl>
        <p className="muted">
          The underlying UP and DOWN DeepBook Predict positions stay in the user's PredictManager. The MoveReceipt records
          protocol-enforced metadata and linkage; it is not a tradable custody claim in this MVP.
        </p>
      </div>
    </details>
  );
}
