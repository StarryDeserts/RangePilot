import { useEffect, useMemo, useState } from "react";
import { AdvancedDetails } from "../components/AdvancedDetails";
import { BuyMoveReceiptCard } from "../components/BuyMoveReceiptCard";
import { MoveQuotePanel } from "../components/MoveQuotePanel";
import { useDeepVolConfig } from "../hooks/useDeepVolConfig";
import { useDeepVolQuote } from "../hooks/useDeepVolQuote";
import { useSuiWallet } from "../hooks/useSuiWallet";
import { DEFAULT_MOVE_QUANTITY, DEEPVOL_STORAGE_KEYS } from "../lib/constants";
import { normalizePositiveIntegerInput, shortId } from "../lib/format";

export function BuyMovePage() {
  const wallet = useSuiWallet();
  const config = useDeepVolConfig();
  const [quantityInput, setQuantityInput] = useState(DEFAULT_MOVE_QUANTITY);
  const [predictManagerInput, setPredictManagerInput] = useState("");
  const storageKey = useMemo(
    () => wallet.address ? `${DEEPVOL_STORAGE_KEYS.predictManager}:${config.network}:${wallet.address}` : null,
    [config.network, wallet.address],
  );

  useEffect(() => {
    if (!storageKey) {
      setPredictManagerInput("");
      return;
    }

    setPredictManagerInput(window.localStorage.getItem(storageKey) ?? "");
  }, [storageKey]);

  const normalizedQuantity = normalizePositiveIntegerInput(quantityInput) ?? quantityInput;
  const predictManagerId = predictManagerInput.trim() || null;
  const quote = useDeepVolQuote({
    quantityInput: normalizedQuantity,
    predictManagerId,
  });

  function rememberPredictManager() {
    if (!storageKey || !predictManagerId) {
      return;
    }

    window.localStorage.setItem(storageKey, predictManagerId);
  }

  return (
    <div className="pageGrid twoColumn">
      <section className="card buySetupCard">
        <div className="eyebrow">Buy BTC MOVE</div>
        <h1>Open a DeepVol receipt</h1>
        <p>
          The wallet flow remains disabled until fresh quotes, fee coin preparation, and full browser preflight are available.
          This prevents a stale or unsafe wallet prompt.
        </p>
        <dl className="detailsGrid">
          <div>
            <dt>Configured VolSeries</dt>
            <dd className="mono" title={config.configuredSeriesId}>{shortId(config.configuredSeriesId)}</dd>
          </div>
          <div>
            <dt>ProtocolVault</dt>
            <dd className="mono" title={config.protocolVaultId ?? undefined}>{shortId(config.protocolVaultId)}</dd>
          </div>
          <div>
            <dt>Predict object</dt>
            <dd className="mono" title={config.predictId}>{shortId(config.predictId)}</dd>
          </div>
          <div>
            <dt>Quote asset</dt>
            <dd>DUSDC</dd>
          </div>
        </dl>
        <label className="fieldLabel">
          Quantity
          <input
            value={quantityInput}
            inputMode="numeric"
            onChange={(event) => setQuantityInput(event.target.value)}
          />
        </label>
        <label className="fieldLabel">
          PredictManager ID
          <input
            value={predictManagerInput}
            placeholder="0x..."
            onChange={(event) => setPredictManagerInput(event.target.value)}
          />
        </label>
        <button className="secondaryButton" type="button" disabled={!predictManagerId} onClick={rememberPredictManager}>
          Store PredictManager locally
        </button>
      </section>

      <MoveQuotePanel quote={quote} />
      <BuyMoveReceiptCard quote={quote} predictManagerId={predictManagerId} />
      <AdvancedDetails />
    </div>
  );
}
