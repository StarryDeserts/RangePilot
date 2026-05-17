import type {
  DeepBookPredictCoinType,
  DeepBookPredictNetwork,
  DeepBookPredictObjectId,
} from "./deepbookPredict.ts";

export type StrategyObjectId = DeepBookPredictObjectId;
export type PlatformFeeRecipient = DeepBookPredictObjectId;

export type RangePilotStrategyRangeKey = {
  oracleId: DeepBookPredictObjectId;
  expiry: string;
  lowerStrike: string;
  higherStrike: string;
};

export type RangePilotStrategyConfig = {
  network: DeepBookPredictNetwork;
  wrapperPackageId: DeepBookPredictObjectId | null;
  moduleName: "strategy";
  platformFeeRecipient: PlatformFeeRecipient | null;
};

export type RangePilotWrapperConfig = RangePilotStrategyConfig & {
  packageId: DeepBookPredictObjectId | null;
};

export type RangePilotStrategy = RangePilotStrategyRangeKey & {
  strategyId: DeepBookPredictObjectId;
  creator: string;
  defaultQuantity: string;
  creatorFeeBps: number;
  platformFeeBps: number;
  platformRecipient: string;
  metadataUri: string;
  active: boolean;
  createdAtMs: string;
};

export type StrategyCreatedEvent = RangePilotStrategyRangeKey & {
  strategyId: DeepBookPredictObjectId;
  creator: string;
  defaultQuantity: string;
  creatorFeeBps: number;
  platformFeeBps: number;
  platformRecipient: string;
  metadataUri: string;
  createdAtMs: string;
};

export type StrategyFollowedEvent = RangePilotStrategyRangeKey & {
  strategyId: DeepBookPredictObjectId;
  creator: string;
  follower: string;
  managerId: DeepBookPredictObjectId;
  quantity: string;
  feeAmountAtomic: string;
  creatorFeeAtomic: string;
  platformFeeAtomic: string;
  timestampMs: string;
};

export type StrategyDeactivatedEvent = {
  strategyId: DeepBookPredictObjectId;
  creator: string;
  timestampMs: string;
};

export type CreateStrategyParams = RangePilotStrategyRangeKey & {
  defaultQuantity: string;
  creatorFeeBps: number;
  platformFeeBps: number;
  platformRecipient: PlatformFeeRecipient;
  metadataUri: string;
};

export type FollowStrategyParams = {
  strategyId: StrategyObjectId;
  predictId: DeepBookPredictObjectId;
  managerId: DeepBookPredictObjectId;
  oracleObjectId: DeepBookPredictObjectId;
  feeCoinObjectId: DeepBookPredictObjectId;
  feeAmountAtomic: string;
  quantity: string;
  quoteCoinType: DeepBookPredictCoinType;
};

export type FollowStrategyAndMintParams = FollowStrategyParams;

export type FollowStrategyAndMintPlan = Omit<FollowStrategyParams, "feeAmountAtomic" | "quantity"> & {
  feeAmountAtomic: string;
  quantity: string;
  wrapperPackageId: DeepBookPredictObjectId;
  target: `${string}::strategy::follow_strategy_and_mint`;
  requiresQuotePreview: true;
  requiresFullMintPreflight: true;
  signsOrExecutes: false;
};
