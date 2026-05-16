import { Transaction } from "@mysten/sui/transactions";
import type {
  DeepBookPredictNetworkConfig,
  RangeMintParams,
} from "@rangepilot/types/deepbookPredict";
import { resolveDeepBookPredictConfig } from "./config.ts";
import { DeepBookPredictUnconfirmedBindingError } from "./errors.ts";
import {
  buildRangeKeyTransactionArgument,
  normalizePositiveInteger,
} from "./rangeKey.ts";

const SUI_CLOCK_OBJECT_ID = "0x6";

export type BuildMintRangeTransactionOptions = RangeMintParams & {
  config?: DeepBookPredictNetworkConfig;
  allowRealTestnetMint?: boolean;
};

export function buildMintRangeTransaction(
  params: BuildMintRangeTransactionOptions,
): Transaction {
  const config = resolveDeepBookPredictConfig(params.config);
  const quantity = normalizePositiveInteger(params.quantity, "Range mint quantity");

  if (!params.allowRealTestnetMint) {
    throw new DeepBookPredictUnconfirmedBindingError(
      `MUST CONFIRM BEFORE REAL MINT: ${config.packageId}::predict::mint_range<${config.quoteAssets.DUSDC.coinType}> must only be built by the gated Testnet validation flow after quote and safety gates pass.`,
    );
  }

  if (config.network !== "testnet") {
    throw new DeepBookPredictUnconfirmedBindingError(
      "Real range mint transaction building is only allowed for Sui Testnet validation.",
    );
  }

  const tx = new Transaction();
  const rangeKey = buildRangeKeyTransactionArgument(tx, params, config);

  tx.moveCall({
    target: `${config.packageId}::predict::mint_range`,
    typeArguments: [config.quoteAssets.DUSDC.coinType],
    arguments: [
      tx.object(config.predictId),
      tx.object(params.managerId),
      tx.object(params.oracleObjectId),
      rangeKey,
      tx.pure.u64(quantity),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ],
  });

  return tx;
}
