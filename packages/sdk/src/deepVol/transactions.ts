import { Transaction } from "@mysten/sui/transactions";
import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils";
import { DEEPVOL_TESTNET } from "@rangepilot/config/deepVolTestnet";
import type {
  CreateMoveReceiptParams,
  CreateVolSeriesParams,
  DeactivateVolSeriesParams,
  DeepVolTestnetConfig,
  MarkMoveReceiptSettledParams,
} from "@rangepilot/types/deepVol";
import { DeepBookPredictUnconfirmedBindingError } from "../deepbookPredict/errors.ts";

export type DeepVolPackageOptions = {
  config?: DeepVolTestnetConfig;
  packageId?: string | null;
};

export type BuildCreateVolSeriesTransactionOptions = CreateVolSeriesParams & DeepVolPackageOptions;
export type BuildDeactivateVolSeriesTransactionOptions = DeactivateVolSeriesParams & DeepVolPackageOptions;
export type BuildCreateMoveReceiptTransactionOptions = CreateMoveReceiptParams &
  DeepVolPackageOptions & {
    requireBinaryMintValidationPassed?: boolean;
  };
export type BuildMarkMoveReceiptSettledTransactionOptions = MarkMoveReceiptSettledParams & DeepVolPackageOptions;

export function buildCreateVolSeriesTransaction(
  params: BuildCreateVolSeriesTransactionOptions,
): Transaction {
  const packageId = resolveDeepVolPackageId(params);
  const metadataUriBytes = [...new TextEncoder().encode(params.metadataUri)];
  const tx = new Transaction();

  tx.moveCall({
    target: `${packageId}::series::create_series`,
    arguments: [
      tx.pure.id(params.oracleId),
      tx.pure.u64(normalizePositiveInteger(params.expiry, "VolSeries expiry")),
      tx.pure.u64(normalizePositiveInteger(params.lowerStrike, "VolSeries lower strike")),
      tx.pure.u64(normalizePositiveInteger(params.upperStrike, "VolSeries upper strike")),
      tx.pure.u64(String(params.createFeeBps ?? params.config?.defaultCreateFeeBps ?? DEEPVOL_TESTNET.defaultCreateFeeBps)),
      tx.pure.vector("u8", metadataUriBytes),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ],
  });

  return tx;
}

export function buildDeactivateVolSeriesTransaction(
  params: BuildDeactivateVolSeriesTransactionOptions,
): Transaction {
  const packageId = resolveDeepVolPackageId(params);
  const tx = new Transaction();

  tx.moveCall({
    target: `${packageId}::series::deactivate_series`,
    arguments: [tx.object(params.seriesId), tx.object(SUI_CLOCK_OBJECT_ID)],
  });

  return tx;
}

export function buildCreateMoveReceiptTransaction(
  params: BuildCreateMoveReceiptTransactionOptions,
): Transaction {
  assertBinaryMintValidationGate(params);

  const packageId = resolveDeepVolPackageId(params);
  const tx = new Transaction();

  tx.moveCall({
    target: `${packageId}::receipt::create_move_receipt`,
    arguments: [
      tx.object(params.seriesId),
      tx.pure.id(params.predictManagerId),
      tx.pure.u64(normalizePositiveInteger(params.quantity, "MoveReceipt quantity")),
      tx.pure.u64(normalizePositiveInteger(params.premiumPaid, "MoveReceipt premium paid")),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ],
  });

  return tx;
}

export function buildMarkMoveReceiptSettledTransaction(
  params: BuildMarkMoveReceiptSettledTransactionOptions,
): Transaction {
  const packageId = resolveDeepVolPackageId(params);
  const tx = new Transaction();

  tx.moveCall({
    target: `${packageId}::receipt::mark_receipt_settled`,
    arguments: [tx.object(params.receiptId), tx.object(SUI_CLOCK_OBJECT_ID)],
  });

  return tx;
}

function resolveDeepVolPackageId(params: DeepVolPackageOptions): string {
  const packageId = params.packageId ?? params.config?.packageId ?? DEEPVOL_TESTNET.packageId;

  if (!packageId) {
    throw new DeepBookPredictUnconfirmedBindingError(
      "DeepVol package ID is unavailable because DeepVol-3 is local-only. The package must be manually configured, published, and passed as packageId before building DeepVol transactions.",
    );
  }

  return packageId;
}

function assertBinaryMintValidationGate(params: BuildCreateMoveReceiptTransactionOptions): void {
  if (!params.requireBinaryMintValidationPassed) {
    throw new DeepBookPredictUnconfirmedBindingError(
      "DeepVol MoveReceipt creation must follow confirmed UP/DOWN binary mint validation. This builder only creates the receipt transaction and does not mint DeepBook Predict legs.",
    );
  }
}

function normalizePositiveInteger(value: string, label: string): string {
  const normalized = BigInt(value);

  if (normalized <= 0n) {
    throw new DeepBookPredictUnconfirmedBindingError(`${label} must be greater than 0.`);
  }

  return normalized.toString();
}
