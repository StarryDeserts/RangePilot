import { BtcMoveCard } from "../components/BtcMoveCard";

export function MarketsPage() {
  return (
    <div className="pageGrid">
      <section className="introPanel">
        <div className="eyebrow">DeepVol structured products</div>
        <h1>Trade movement, not direction.</h1>
        <p>
          DeepVol packages official DeepBook Predict binary legs into a standardized BTC MOVE receipt. The MVP focuses on a
          single validated BTC Testnet series and keeps advanced primitives out of the primary flow.
        </p>
      </section>
      <BtcMoveCard />
    </div>
  );
}
