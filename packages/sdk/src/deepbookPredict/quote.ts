import { Transaction } from "@mysten/sui/transactions";
import type {
  DeepBookPredictNetworkConfig,
  RangeKeyInput,
  RangeQuotePreview,
} from "@rangepilot/types/deepbookPredict";
import { resolveDeepBookPredictConfig } from "./config.ts";
import { DeepBookPredictUnconfirmedBindingError } from "./errors.ts";
import {
  buildRangeKeyTransactionArgument,
  normalizePositiveInteger,
  normalizeRangeKeyInput,
} from "./rangeKey.ts";

const SUI_CLOCK_OBJECT_ID = "0x6";

export type RangeQuoteParams = RangeKeyInput & {
  oracleObjectId: string;
  quantity: string | bigint;
  config?: DeepBookPredictNetworkConfig;
};

export type DevInspectRangeQuoteParams = RangeQuoteParams & {
  client: {
    devInspectTransactionBlock(input: {
      sender: string;
      transactionBlock: Transaction;
    }): Promise<unknown>;
  };
  sender: string;
};

export type DecodedRangeQuoteAmounts = {
  mintCostAtomic: string;
  redeemPayoutAtomic: string;
};

export function buildGetRangeTradeAmountsTransaction(
  params: RangeQuoteParams,
): Transaction {
  const config = resolveDeepBookPredictConfig(params.config);
  const quantity = normalizePositiveInteger(params.quantity, "Range quote quantity");
  const tx = new Transaction();
  const rangeKey = buildRangeKeyTransactionArgument(tx, params, config);

  tx.moveCall({
    target: `${config.packageId}::predict::get_range_trade_amounts`,
    arguments: [
      tx.object(config.predictId),
      tx.object(params.oracleObjectId),
      rangeKey,
      tx.pure.u64(quantity),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ],
  });

  return tx;
}

export async function devInspectRangeQuote(
  params: DevInspectRangeQuoteParams,
): Promise<RangeQuotePreview> {
  const transactionBlock = buildGetRangeTradeAmountsTransaction(params);
  const result = await params.client.devInspectTransactionBlock({
    sender: params.sender,
    transactionBlock,
  });

  if (isRecord(result) && typeof result.error === "string") {
    throw new DeepBookPredictUnconfirmedBindingError(
      `MUST CONFIRM BEFORE CODING: get_range_trade_amounts devInspect failed: ${result.error}`,
    );
  }

  const decoded = decodeDevInspectU64Pair(result);

  if (!decoded) {
    throw new DeepBookPredictUnconfirmedBindingError(
      "MUST CONFIRM BEFORE CODING: get_range_trade_amounts devInspect return shape did not decode to an unambiguous pair of u64 values.",
    );
  }

  return {
    rangeKey: normalizeRangeKeyInput(params),
    quantity: normalizePositiveInteger(params.quantity, "Range quote quantity"),
    mintCostAtomic: decoded.mintCostAtomic,
    redeemPayoutAtomic: decoded.redeemPayoutAtomic,
    source: "devInspect",
  };
}

export function decodeDevInspectU64Pair(result: unknown): DecodedRangeQuoteAmounts | null {
  const returnValues = extractReturnValues(result);
  const u64Values = returnValues
    .map(decodeU64ReturnValue)
    .filter((value): value is string => value !== null);

  if (u64Values.length !== 2 || u64Values.length !== returnValues.length) {
    return null;
  }

  return {
    mintCostAtomic: u64Values[0],
    redeemPayoutAtomic: u64Values[1],
  };
}

function extractReturnValues(result: unknown): unknown[] {
  if (!isRecord(result) || !Array.isArray(result.results)) {
    return [];
  }

  for (let index = result.results.length - 1; index >= 0; index -= 1) {
    const entry = result.results[index];

    if (isRecord(entry) && Array.isArray(entry.returnValues)) {
      return entry.returnValues;
    }
  }

  return [];
}

function decodeU64ReturnValue(value: unknown): string | null {
  if (!Array.isArray(value) || value.length !== 2) {
    return null;
  }

  const [bytes, type] = value;

  if (type !== "u64" || !Array.isArray(bytes) || bytes.length !== 8) {
    return null;
  }

  if (
    !bytes.every(
      (byte) => typeof byte === "number" && Number.isInteger(byte) && byte >= 0 && byte <= 255,
    )
  ) {
    return null;
  }

  return bytes.reduce((result, byte, index) => {
    return result + (BigInt(byte) << (8n * BigInt(index)));
  }, 0n).toString();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
