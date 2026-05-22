import { DataGrid } from "./ui/DataGrid";
import { StateCallout } from "./ui/StateCallout";
import { StatusPill } from "./ui/StatusPill";

export type PredictPrimitiveKind = "UP" | "DOWN" | "RANGE";

export type PredictPrimitive = {
  kind: PredictPrimitiveKind;
  meaning: string;
  winsWhen: string;
  riskCopy: string;
  status: "Scaffold only";
  ctaLabel: string;
};

export const PREDICT_PRIMITIVES = [
  {
    kind: "UP",
    meaning: "Buy upside.",
    winsWhen: "BTC expires above the selected strike.",
    riskCopy: "Raw Predict primitive; it does not create a DeepVol MoveReceipt.",
    status: "Scaffold only",
    ctaLabel: "Direct UP execution disabled",
  },
  {
    kind: "DOWN",
    meaning: "Buy downside.",
    winsWhen: "BTC expires below the selected strike.",
    riskCopy: "Raw Predict primitive; it does not create a DeepVol MoveReceipt.",
    status: "Scaffold only",
    ctaLabel: "Direct DOWN execution disabled",
  },
  {
    kind: "RANGE",
    meaning: "Buy inside-range exposure.",
    winsWhen: "BTC expires inside the selected lower / upper range.",
    riskCopy: "Complement to MOVE; direct RANGE execution is not enabled in DeepVol MVP yet.",
    status: "Scaffold only",
    ctaLabel: "Direct RANGE execution disabled",
  },
] as const satisfies readonly PredictPrimitive[];

export function PredictPrimitiveCards() {
  return (
    <section className="card primitiveSection">
      <div className="cardHeader">
        <div>
          <div className="eyebrow">Advanced primitives</div>
          <h2>Predict building blocks</h2>
        </div>
        <StatusPill tone="neutral">Scaffold only</StatusPill>
      </div>

      <StateCallout tone="info" title="BTC MOVE remains the enabled receipt product">
        Direct primitives are scaffold-only and do not create MoveReceipt. Only BTC MOVE creates a DeepVol receipt in this app.
      </StateCallout>

      <div className="primitiveGrid">
        {PREDICT_PRIMITIVES.map((primitive) => (
          <article className="primitiveCard primitiveCardScaffold" key={primitive.kind}>
            <div className="primitiveCardTop">
              <span>{primitive.kind}</span>
              <StatusPill tone="warning">{primitive.status}</StatusPill>
            </div>
            <DataGrid
              variant="compact"
              items={[
                { label: "Meaning", value: primitive.meaning },
                { label: "Wins when", value: primitive.winsWhen },
                { label: "Boundary", value: primitive.riskCopy },
              ]}
            />
            <div className="cardActions primitiveActions">
              <button className="secondaryButton" type="button" disabled>
                {primitive.ctaLabel}
              </button>
              <a className="primaryLink" href="/buy/btc-move">
                Trade BTC MOVE receipt
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
