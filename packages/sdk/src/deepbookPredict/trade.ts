import { Transaction } from "@mysten/sui/transactions";
import type {
  BinaryRedeemPreflightResult,
  DeepBookPredictNetworkConfig,
  MarketKeyInput,
  MintAbortCandidateParams,
  MintAbortClassification,
  MintRangePreflightResult,
  RangeMintParams,
  RangeRedeemParams,
  RedeemAbortCandidateParams,
  RedeemAbortClassification,
  RedeemRangePreflightResult,
} from "@rangepilot/types/deepbookPredict";
import { resolveDeepBookPredictConfig } from "./config.ts";
import {
  classifyDeepBookPredictAbort,
  type ClassifyDeepBookPredictAbortOptions,
  DeepBookPredictUnconfirmedBindingError,
} from "./errors.ts";
import { buildMarketKeyTransactionArgument } from "./quote.ts";
import {
  buildRangeKeyTransactionArgument,
  normalizePositiveInteger,
} from "./rangeKey.ts";

const SUI_CLOCK_OBJECT_ID = "0x6";

export type BuildMintRangeTransactionOptions = RangeMintParams & {
  config?: DeepBookPredictNetworkConfig;
  allowRealTestnetMint?: boolean;
};

export type BuildRedeemRangeTransactionOptions = RangeRedeemParams & {
  config?: DeepBookPredictNetworkConfig;
  allowRealTestnetRedeem?: boolean;
};

export type BinaryRedeemParams = MarketKeyInput & {
  managerId: string;
  oracleObjectId: string;
  quantity: string | bigint;
};

export type BuildRedeemBinaryPositionTransactionOptions = BinaryRedeemParams & {
  config?: DeepBookPredictNetworkConfig;
  allowPreflightOnlyBinaryRedeem?: boolean;
  allowRealTestnetRedeem?: boolean;
};

export type DevInspectRedeemBinaryPositionParams = BinaryRedeemParams & {
  client: {
    devInspectTransactionBlock(input: {
      sender: string;
      transactionBlock: Transaction;
    }): Promise<unknown>;
  };
  sender: string;
  config?: DeepBookPredictNetworkConfig;
  candidateParams?: RedeemAbortCandidateParams;
};

export type DevInspectMintRangePreflightParams = RangeMintParams & {
  client: {
    devInspectTransactionBlock(input: {
      sender: string;
      transactionBlock: Transaction;
    }): Promise<unknown>;
  };
  sender: string;
  config?: DeepBookPredictNetworkConfig;
  candidateParams?: MintAbortCandidateParams;
};

export type DevInspectRedeemRangePreflightParams = RangeRedeemParams & {
  client: {
    devInspectTransactionBlock(input: {
      sender: string;
      transactionBlock: Transaction;
    }): Promise<unknown>;
  };
  sender: string;
  config?: DeepBookPredictNetworkConfig;
  candidateParams?: RedeemAbortCandidateParams;
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

export function buildRedeemRangeTransaction(
  params: BuildRedeemRangeTransactionOptions,
): Transaction {
  const config = resolveDeepBookPredictConfig(params.config);
  const quantity = normalizePositiveInteger(params.quantity, "Range redeem quantity");

  if (!params.allowRealTestnetRedeem) {
    throw new DeepBookPredictUnconfirmedBindingError(
      `MUST CONFIRM BEFORE REAL REDEEM: ${config.packageId}::predict::redeem_range<${config.quoteAssets.DUSDC.coinType}> must only be built by the gated Testnet validation flow after quote, direct readback, and full preflight gates pass.`,
    );
  }

  if (config.network !== "testnet") {
    throw new DeepBookPredictUnconfirmedBindingError(
      "Real range redeem transaction building is only allowed for Sui Testnet validation.",
    );
  }

  const tx = new Transaction();
  const rangeKey = buildRangeKeyTransactionArgument(tx, params, config);

  tx.moveCall({
    target: `${config.packageId}::predict::redeem_range`,
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

export function buildRedeemBinaryPositionTransaction(
  params: BuildRedeemBinaryPositionTransactionOptions,
): Transaction {
  const config = resolveDeepBookPredictConfig(params.config);
  const quantity = normalizePositiveInteger(params.quantity, "Binary redeem quantity");

  if (!params.allowPreflightOnlyBinaryRedeem && !params.allowRealTestnetRedeem) {
    throw new DeepBookPredictUnconfirmedBindingError(
      `MUST CONFIRM BEFORE REAL REDEEM: ${config.packageId}::predict::redeem<${config.quoteAssets.DUSDC.coinType}> must only be built for read-only preflight or a future approved controlled Testnet redeem after quote, position readback, and full preflight gates pass.`,
    );
  }

  if (config.network !== "testnet") {
    throw new DeepBookPredictUnconfirmedBindingError(
      "Binary redeem transaction building is only allowed for Sui Testnet validation.",
    );
  }

  const tx = new Transaction();
  const marketKey = buildMarketKeyTransactionArgument(tx, params, config);

  tx.moveCall({
    target: `${config.packageId}::predict::redeem`,
    typeArguments: [config.quoteAssets.DUSDC.coinType],
    arguments: [
      tx.object(config.predictId),
      tx.object(params.managerId),
      tx.object(params.oracleObjectId),
      marketKey,
      tx.pure.u64(quantity),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ],
  });

  return tx;
}

export async function devInspectMintRangePreflight(
  params: DevInspectMintRangePreflightParams,
): Promise<MintRangePreflightResult> {
  try {
    const transactionBlock = buildMintRangeTransaction({
      ...params,
      allowRealTestnetMint: true,
    });
    const result = await params.client.devInspectTransactionBlock({
      sender: params.sender,
      transactionBlock,
    });

    if (isRecord(result) && typeof result.error === "string") {
      return {
        status: "failed",
        abort: classifyMintAbort(result.error, { candidateParams: mintAbortCandidateParams(params) }),
      };
    }

    const status = isRecord(result) && isRecord(result.effects) && isRecord(result.effects.status)
      ? result.effects.status
      : null;

    if (status?.status !== "success") {
      return {
        status: "failed",
        abort: classifyMintAbort(
          typeof status?.error === "string" ? status.error : "mint_range devInspect did not succeed.",
          { candidateParams: mintAbortCandidateParams(params) },
        ),
      };
    }

    return { status: "passed" };
  } catch (error) {
    return {
      status: "failed",
      abort: classifyMintAbort(error, { candidateParams: mintAbortCandidateParams(params) }),
    };
  }
}

export async function devInspectRedeemRangePreflight(
  params: DevInspectRedeemRangePreflightParams,
): Promise<RedeemRangePreflightResult> {
  try {
    const transactionBlock = buildRedeemRangeTransaction({
      ...params,
      allowRealTestnetRedeem: true,
    });
    const result = await params.client.devInspectTransactionBlock({
      sender: params.sender,
      transactionBlock,
    });

    if (isRecord(result) && typeof result.error === "string") {
      return {
        status: "failed",
        abort: classifyRedeemAbort(result.error, { candidateParams: redeemAbortCandidateParams(params) }),
      };
    }

    const status = isRecord(result) && isRecord(result.effects) && isRecord(result.effects.status)
      ? result.effects.status
      : null;

    if (status?.status !== "success") {
      return {
        status: "failed",
        abort: classifyRedeemAbort(
          typeof status?.error === "string" ? status.error : "redeem_range devInspect did not succeed.",
          { candidateParams: redeemAbortCandidateParams(params) },
        ),
      };
    }

    return { status: "passed" };
  } catch (error) {
    return {
      status: "failed",
      abort: classifyRedeemAbort(error, { candidateParams: redeemAbortCandidateParams(params) }),
    };
  }
}

export async function devInspectRedeemBinaryPosition(
  params: DevInspectRedeemBinaryPositionParams,
): Promise<BinaryRedeemPreflightResult> {
  try {
    const transactionBlock = buildRedeemBinaryPositionTransaction({
      ...params,
      allowPreflightOnlyBinaryRedeem: true,
    });
    const result = await params.client.devInspectTransactionBlock({
      sender: params.sender,
      transactionBlock,
    });

    if (isRecord(result) && typeof result.error === "string") {
      return {
        status: "failed",
        abort: classifyRedeemAbort(result.error, { candidateParams: binaryRedeemAbortCandidateParams(params) }),
      };
    }

    const status = isRecord(result) && isRecord(result.effects) && isRecord(result.effects.status)
      ? result.effects.status
      : null;

    if (status?.status !== "success") {
      return {
        status: "failed",
        abort: classifyRedeemAbort(
          typeof status?.error === "string" ? status.error : "predict::redeem devInspect did not succeed.",
          { candidateParams: binaryRedeemAbortCandidateParams(params) },
        ),
      };
    }

    return { status: "passed" };
  } catch (error) {
    return {
      status: "failed",
      abort: classifyRedeemAbort(error, { candidateParams: binaryRedeemAbortCandidateParams(params) }),
    };
  }
}

export function isMintPreflightPassed(result: MintRangePreflightResult): boolean {
  return result.status === "passed";
}

export function isRedeemPreflightPassed(result: RedeemRangePreflightResult | BinaryRedeemPreflightResult): boolean {
  return result.status === "passed";
}

export function classifyMintAbort(
  errorOrMessage: unknown,
  options?: ClassifyDeepBookPredictAbortOptions,
): MintAbortClassification {
  return classifyDeepBookPredictAbort(errorOrMessage, options);
}

export function classifyRedeemAbort(
  errorOrMessage: unknown,
  options?: ClassifyDeepBookPredictAbortOptions,
): RedeemAbortClassification {
  return classifyDeepBookPredictAbort(errorOrMessage, options);
}

function mintAbortCandidateParams(params: RangeMintParams & { candidateParams?: MintAbortCandidateParams }): MintAbortCandidateParams {
  return {
    oracleId: params.oracleId,
    oracleObjectId: params.oracleObjectId,
    expiry: String(params.expiry),
    lowerStrike: String(params.lowerStrike),
    higherStrike: String(params.higherStrike),
    quantity: String(params.quantity),
    ...params.candidateParams,
  };
}

function redeemAbortCandidateParams(params: RangeRedeemParams & { candidateParams?: RedeemAbortCandidateParams }): RedeemAbortCandidateParams {
  return {
    oracleId: params.oracleId,
    oracleObjectId: params.oracleObjectId,
    expiry: String(params.expiry),
    lowerStrike: String(params.lowerStrike),
    higherStrike: String(params.higherStrike),
    quantity: String(params.quantity),
    redeemQuantity: String(params.quantity),
    ...params.candidateParams,
  };
}

function binaryRedeemAbortCandidateParams(params: BinaryRedeemParams & { candidateParams?: RedeemAbortCandidateParams }): RedeemAbortCandidateParams {
  return {
    oracleId: params.oracleId,
    oracleObjectId: params.oracleObjectId,
    expiry: String(params.expiry),
    quantity: String(params.quantity),
    redeemQuantity: String(params.quantity),
    ...params.candidateParams,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
