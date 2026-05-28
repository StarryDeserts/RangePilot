export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type DeepVolTradingConfig = {
  network: string;
  packageId: string;
  protocolVaultId: string;
  predictId: string;
  publicServer: string;
  dusdcCoinType: string;
  dusdcCurrencyId: number | string;
  dusdcDecimals: number;
  primaryMarket?: string;
  receiptCustody?: string;
  configuredSeriesId?: string | null;
  validatedReferenceReceiptId?: string | null;
  validatedReferenceBuyDigest?: string | null;
  isPackageConfigured: boolean;
  isProtocolVaultConfigured: boolean;
  isDusdcConfigured: boolean;
  isMvpSeriesConfigured?: boolean;
};

export type DeepVolWalletState = {
  address: string | null;
  activeNetwork: string | null;
  walletName: string | null;
  connectionStatus: string;
  isConnected: boolean;
  isConnecting: boolean;
  isTestnet: boolean;
  walletSupportsTestnet: boolean;
};

export type DeepVolSuiClientLike = Record<string, unknown>;

export type DeepVolTransactionExecutor = (input: unknown) => Promise<unknown>;

export type DeepVolTradingEnvironment = {
  config: DeepVolTradingConfig;
  wallet: DeepVolWalletState;
  suiClient: DeepVolSuiClientLike;
  executeTransaction?: DeepVolTransactionExecutor;
  storage?: StorageLike | null;
  now?: () => number;
};

export function browserStorage(): StorageLike | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}
