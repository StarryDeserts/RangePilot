export type DeepBookPredictNetwork = "testnet";
export type DeepBookPredictObjectId = string;
export type DeepBookPredictCoinType = string;
export type DeepBookPredictIntegerLike = number | string;

export type DeepBookPredictNetworkConfig = {
  network: DeepBookPredictNetwork;
  publicServer: string;
  packageId: DeepBookPredictObjectId;
  registryId: DeepBookPredictObjectId;
  predictId: DeepBookPredictObjectId;
  quoteAssets: {
    DUSDC: {
      coinType: DeepBookPredictCoinType;
      currencyId: DeepBookPredictObjectId;
      decimals: 6;
    };
  };
  plpCoinType: DeepBookPredictCoinType;
  sourceBranch: "predict-testnet-4-16";
};

export type DeepBookPredictOracleStatus =
  | "active"
  | "settled"
  | "inactive"
  | "pending_settlement"
  | (string & {});

export type DeepBookPredictServerStatus = {
  status?: string;
  latest_onchain_checkpoint?: DeepBookPredictIntegerLike;
  current_time_ms?: DeepBookPredictIntegerLike;
  earliest_checkpoint?: DeepBookPredictIntegerLike;
  max_lag_pipeline?: string;
  max_checkpoint_lag?: DeepBookPredictIntegerLike;
  max_time_lag_seconds?: DeepBookPredictIntegerLike;
  pipelines?: unknown[];
  [key: string]: unknown;
};

export type DeepBookPredictPredictState = {
  predict_id: string;
  pricing: Record<string, unknown> | null;
  risk: Record<string, unknown> | null;
  trading_paused: boolean | null;
  quote_assets: string[];
  [key: string]: unknown;
};

export type DeepBookPredictOracleRecord = {
  predict_id: string;
  oracle_id: string;
  oracle_cap_id: string;
  underlying_asset: string;
  expiry: DeepBookPredictIntegerLike;
  min_strike: DeepBookPredictIntegerLike;
  tick_size: DeepBookPredictIntegerLike;
  status: DeepBookPredictOracleStatus;
  activated_at: DeepBookPredictIntegerLike | null;
  settlement_price: DeepBookPredictIntegerLike | null;
  settled_at: DeepBookPredictIntegerLike | null;
  created_checkpoint: DeepBookPredictIntegerLike;
  [key: string]: unknown;
};

export type DeepBookPredictOraclePriceUpdate = {
  event_digest: string;
  digest: string;
  sender: string;
  checkpoint: DeepBookPredictIntegerLike;
  checkpoint_timestamp_ms: DeepBookPredictIntegerLike;
  tx_index: DeepBookPredictIntegerLike;
  event_index: DeepBookPredictIntegerLike;
  package: string;
  oracle_id: string;
  spot: DeepBookPredictIntegerLike;
  forward: DeepBookPredictIntegerLike;
  onchain_timestamp: DeepBookPredictIntegerLike;
  [key: string]: unknown;
};

export type DeepBookPredictSviUpdate = {
  event_digest: string;
  digest: string;
  sender: string;
  checkpoint: DeepBookPredictIntegerLike;
  checkpoint_timestamp_ms: DeepBookPredictIntegerLike;
  tx_index: DeepBookPredictIntegerLike;
  event_index: DeepBookPredictIntegerLike;
  package: string;
  oracle_id: string;
  a: DeepBookPredictIntegerLike;
  b: DeepBookPredictIntegerLike;
  rho: DeepBookPredictIntegerLike;
  rho_negative: boolean;
  m: DeepBookPredictIntegerLike;
  m_negative: boolean;
  sigma: DeepBookPredictIntegerLike;
  onchain_timestamp: DeepBookPredictIntegerLike;
  [key: string]: unknown;
};

export type DeepBookPredictAskBounds = Record<string, unknown>;

export type DeepBookPredictOracleState = {
  oracle: DeepBookPredictOracleRecord;
  latest_price: DeepBookPredictOraclePriceUpdate | null;
  latest_svi: DeepBookPredictSviUpdate | null;
  ask_bounds: DeepBookPredictAskBounds | null;
  [key: string]: unknown;
};

export type DeepBookPredictVaultSummary = {
  predict_id: string;
  quote_assets: string[];
  vault_balance: DeepBookPredictIntegerLike;
  vault_value: DeepBookPredictIntegerLike;
  total_mtm: DeepBookPredictIntegerLike;
  total_max_payout: DeepBookPredictIntegerLike;
  available_liquidity: DeepBookPredictIntegerLike;
  available_withdrawal: DeepBookPredictIntegerLike;
  plp_total_supply: DeepBookPredictIntegerLike;
  plp_share_price: DeepBookPredictIntegerLike;
  utilization: DeepBookPredictIntegerLike;
  max_payout_utilization: DeepBookPredictIntegerLike;
  net_deposits: DeepBookPredictIntegerLike;
  total_supplied: DeepBookPredictIntegerLike;
  total_withdrawn: DeepBookPredictIntegerLike;
  [key: string]: unknown;
};

export type DeepBookPredictTradeRecord = Record<string, unknown>;

export type DeepBookPredictRangeInput = {
  oracleId: string;
  expiry: string | number | bigint;
  lowerStrike: string | number | bigint;
  higherStrike: string | number | bigint;
  quantity: string | number | bigint;
};

export type DeepBookPredictAmountLike = string | bigint;

export type PredictManagerSource =
  | "local_storage"
  | "public_server"
  | "event"
  | "transaction_result"
  | "manual";

export type PredictManagerRef = {
  managerId: DeepBookPredictObjectId;
  owner: string;
  network: DeepBookPredictNetwork;
  source: PredictManagerSource;
};

export type DusdcCoin = {
  coinObjectId: DeepBookPredictObjectId;
  version: string;
  digest: string;
  balanceAtomic: string;
  coinType: DeepBookPredictCoinType;
  previousTransaction?: string;
};

export type DusdcBalance = {
  coinType: DeepBookPredictCoinType;
  decimals: 6;
  totalAtomic: string;
  coins: DusdcCoin[];
};

export type PredictManagerCreatedEventCandidate = {
  eventType: string;
  managerId: DeepBookPredictObjectId | null;
  rawParsedJson: unknown;
  rawEvent: unknown;
  unconfirmedReason?: string;
};

export type CreateManagerResult = {
  digest: string;
  manager: PredictManagerRef | null;
  createdEvent: PredictManagerCreatedEventCandidate | null;
  explorerUrl?: string;
};

export type DepositDusdcParams = {
  managerId: DeepBookPredictObjectId;
  amountAtomic: DeepBookPredictAmountLike;
  coins: DusdcCoin[];
};

export type DepositDusdcResult = {
  digest: string;
  managerId: DeepBookPredictObjectId;
  amountAtomic: string;
  explorerUrl?: string;
};

export type ManagerDiscoveryLayerStatus =
  | "found"
  | "not_found"
  | "unconfirmed"
  | "error";

export type ManagerDiscoveryLayerResult = {
  layer: "local_storage" | "public_server" | "event_scan" | "manual";
  status: ManagerDiscoveryLayerStatus;
  message: string;
};

export type ManagerDiscoveryResult =
  | {
      status: "found";
      manager: PredictManagerRef;
      layers: ManagerDiscoveryLayerResult[];
    }
  | {
      status: "not_found";
      owner: string;
      network: DeepBookPredictNetwork;
      layers: ManagerDiscoveryLayerResult[];
    }
  | {
      status: "unconfirmed";
      owner: string;
      network: DeepBookPredictNetwork;
      reason: string;
      layers: ManagerDiscoveryLayerResult[];
    }
  | {
      status: "error";
      owner: string;
      network: DeepBookPredictNetwork;
      error: string;
      layers: ManagerDiscoveryLayerResult[];
    };

export type TransactionStatusState =
  | "idle"
  | "building"
  | "awaiting_wallet"
  | "submitted"
  | "success"
  | "failed"
  | "blocked_unconfirmed";

export type TransactionStatus = {
  state: TransactionStatusState;
  message?: string;
  digest?: string;
  explorerUrl?: string;
  error?: string;
};
