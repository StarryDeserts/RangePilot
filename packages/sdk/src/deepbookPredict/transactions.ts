import { Transaction } from "@mysten/sui/transactions";
import type {
  DeepBookPredictAmountLike,
  DeepBookPredictNetwork,
  DeepBookPredictNetworkConfig,
  DepositDusdcParams,
} from "@rangepilot/types/deepbookPredict";
import { resolveDeepBookPredictConfig } from "./config";
import { selectDusdcCoinsForAmount } from "./coins";
import { DeepBookPredictUnconfirmedBindingError } from "./errors";

export type BuildCreateManagerTransactionOptions = {
  config?: DeepBookPredictNetworkConfig;
};

export type BuildDepositDusdcTransactionOptions = DepositDusdcParams & {
  config?: DeepBookPredictNetworkConfig;
};

export function buildCreateManagerTransaction(
  options: BuildCreateManagerTransactionOptions = {},
): Transaction {
  const config = resolveDeepBookPredictConfig(options.config);
  const tx = new Transaction();

  tx.moveCall({
    target: `${config.packageId}::predict::create_manager`,
  });

  return tx;
}

export function buildDepositDusdcTransaction(
  params: BuildDepositDusdcTransactionOptions,
): Transaction {
  const config = resolveDeepBookPredictConfig(params.config);

  selectDusdcCoinsForAmount(params.coins, params.amountAtomic);

  throw new DeepBookPredictUnconfirmedBindingError(
    `MUST CONFIRM BEFORE REAL DEPOSIT: ${config.packageId}::predict_manager::deposit<${config.quoteAssets.DUSDC.coinType}> PTB coin merge/split and Coin<DUSDC> argument construction are not validated yet.`,
  );
}

export function buildSuiExplorerTransactionUrl(
  digest: string,
  network: DeepBookPredictNetwork = "testnet",
): string {
  return `https://suiexplorer.com/txblock/${encodeURIComponent(digest)}?network=${encodeURIComponent(network)}`;
}

export function normalizeAmountAtomic(amount: DeepBookPredictAmountLike): string {
  const normalized = BigInt(amount);

  if (normalized <= 0n) {
    throw new DeepBookPredictUnconfirmedBindingError(
      "Deposit amount must be greater than 0 atomic units.",
    );
  }

  return normalized.toString();
}
