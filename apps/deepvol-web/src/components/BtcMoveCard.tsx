import { useDeepVolConfig } from "../hooks/useDeepVolConfig";
import { shortId } from "../lib/format";

export function BtcMoveCard() {
  const config = useDeepVolConfig();

  return (
    <section className="heroCard cardGlow">
      <div className="eyebrow">Primary MVP market</div>
      <h1>BTC MOVE</h1>
      <p className="heroCopy">
        BTC MOVE = UP + DOWN. Trade movement, not direction, through a protocol-enforced DeepVol receipt.
      </p>
      <div className="pillRow">
        <span className="pill">BTC only</span>
        <span className="pill">Sui Testnet</span>
        <span className="pill">Non-custodial receipt</span>
      </div>
      <dl className="detailsGrid">
        <div>
          <dt>VolSeries</dt>
          <dd className="mono" title={config.configuredSeriesId}>{shortId(config.configuredSeriesId)}</dd>
        </div>
        <div>
          <dt>ProtocolVault</dt>
          <dd className="mono" title={config.protocolVaultId ?? undefined}>{shortId(config.protocolVaultId)}</dd>
        </div>
        <div>
          <dt>Create Fee</dt>
          <dd>{config.defaultCreateFeeBps} bps</dd>
        </div>
      </dl>
      <a className="primaryLink" href="/buy/btc-move">Open BTC MOVE</a>
    </section>
  );
}
