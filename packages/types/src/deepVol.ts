import type {
  DeepBookPredictNetwork,
  DeepBookPredictObjectId,
} from "./deepbookPredict.ts";

export type DeepVolObjectId = DeepBookPredictObjectId;
export type VolSeriesObjectId = DeepVolObjectId;
export type MoveReceiptObjectId = DeepVolObjectId;
export type DeepVolProtocolVaultObjectId = DeepVolObjectId;
export type DeepVolMarketSymbol = "BTC";
export type DeepVolReceiptCustody = "non_custodial";
export type MoveReceiptStatus = 0 | 1 | 2;

export type DeepVolTestnetConfig = {
  network: DeepBookPredictNetwork;
  packageId: DeepVolObjectId | null;
  protocolVaultId: DeepVolProtocolVaultObjectId | null;
  defaultCreateFeeBps: 30;
  maxCreateFeeBps: 100;
  primaryMarket: DeepVolMarketSymbol;
  receiptCustody: DeepVolReceiptCustody;
};

export type VolSeries = {
  seriesId: VolSeriesObjectId;
  creator: string;
  oracleId: DeepVolObjectId;
  expiry: string;
  lowerStrike: string;
  upperStrike: string;
  metadataUri: string;
  createFeeBps: number;
  active: boolean;
  createdAtMs: string;
};

export type MoveReceipt = {
  receiptId: MoveReceiptObjectId;
  owner: string;
  seriesId: VolSeriesObjectId;
  predictManagerId: DeepVolObjectId;
  oracleId: DeepVolObjectId;
  expiry: string;
  lowerStrike: string;
  upperStrike: string;
  upStrike: string;
  downStrike: string;
  quantity: string;
  premiumPaid: string;
  createFeePaid: string;
  createdAtMs: string;
  status: MoveReceiptStatus;
};

export type VolSeriesCreatedEvent = Omit<VolSeries, "active">;
export type VolSeriesDeactivatedEvent = {
  seriesId: VolSeriesObjectId;
  creator: string;
  timestampMs: string;
};
export type MoveReceiptCreatedEvent = Omit<MoveReceipt, "status" | "createdAtMs"> & {
  timestampMs: string;
};
export type MoveReceiptMarkedSettledEvent = {
  receiptId: MoveReceiptObjectId;
  owner: string;
  timestampMs: string;
};

export type CreateVolSeriesParams = {
  oracleId: DeepVolObjectId;
  expiry: string;
  lowerStrike: string;
  upperStrike: string;
  metadataUri: string;
  createFeeBps?: number;
};

export type DeactivateVolSeriesParams = {
  seriesId: VolSeriesObjectId;
};

export type CreateMoveReceiptParams = {
  seriesId: VolSeriesObjectId;
  predictManagerId: DeepVolObjectId;
  quantity: string;
  premiumPaid: string;
};

export type MarkMoveReceiptSettledParams = {
  receiptId: MoveReceiptObjectId;
};
