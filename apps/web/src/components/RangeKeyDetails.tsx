import { RANGE_WIN_CONDITION_COPY } from "@rangepilot/sdk/deepbookPredict";

type RangeKeyDetailsProps = {
  range: {
    oracleId: string;
    oracleObjectId?: string;
    underlyingAsset?: string | null;
    expiry: string | bigint;
    lowerStrike: string | bigint;
    higherStrike: string | bigint;
    quantity?: string | bigint;
    anchorSource?: string;
    anchorPrice?: string;
    strategy?: string;
    widthTicks?: string;
  } | null;
};

export function RangeKeyDetails({ range }: RangeKeyDetailsProps) {
  if (!range) {
    return <p className="muted">No RangeKey selected.</p>;
  }

  return (
    <dl className="details compactDetails">
      <dt>Underlying</dt>
      <dd>{range.underlyingAsset ?? "Unknown"}</dd>
      <dt>Win condition</dt>
      <dd>{RANGE_WIN_CONDITION_COPY}</dd>
      <dt>Oracle ID</dt>
      <dd className="mono breakAll">{range.oracleId}</dd>
      {range.oracleObjectId && (
        <>
          <dt>Oracle object</dt>
          <dd className="mono breakAll">{range.oracleObjectId}</dd>
        </>
      )}
      <dt>Expiry</dt>
      <dd className="mono">{String(range.expiry)}</dd>
      <dt>Lower strike</dt>
      <dd className="mono">{String(range.lowerStrike)}</dd>
      <dt>Higher strike</dt>
      <dd className="mono">{String(range.higherStrike)}</dd>
      {range.quantity && (
        <>
          <dt>Quantity</dt>
          <dd className="mono">{String(range.quantity)}</dd>
        </>
      )}
      {range.strategy && (
        <>
          <dt>Strategy</dt>
          <dd>{range.strategy}</dd>
        </>
      )}
      {range.widthTicks && (
        <>
          <dt>Width ticks</dt>
          <dd className="mono">{range.widthTicks}</dd>
        </>
      )}
      {range.anchorSource && range.anchorPrice && (
        <>
          <dt>Anchor</dt>
          <dd>{range.anchorSource}: <span className="mono">{range.anchorPrice}</span></dd>
        </>
      )}
    </dl>
  );
}
