import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils";
import { Transaction } from "@mysten/sui/transactions";
import type {
  FollowStrategyAndMintPlan,
  FollowStrategyParams,
  RangePilotWrapperConfig,
} from "@rangepilot/types/rangePilotStrategy";
import { DeepBookPredictUnconfirmedBindingError } from "../deepbookPredict/errors.ts";

export const RANGE_PILOT_WRAPPER_TESTNET: RangePilotWrapperConfig = {
  network: "testnet",
  packageId: null,
  wrapperPackageId: null,
  moduleName: "strategy",
  platformFeeRecipient: null,
};

export type BuildFollowStrategyAndMintTransactionOptions = FollowStrategyParams & {
  wrapper?: RangePilotWrapperConfig;
  wrapperPackageId?: string;
  requireQuotePreviewPassed?: boolean;
  requireFullMintPreflightPassed?: boolean;
};

export function buildFollowStrategyAndMintPlan(
  params: BuildFollowStrategyAndMintTransactionOptions,
): FollowStrategyAndMintPlan {
  const wrapperPackageId = resolveWrapperPackageId(params);

  return {
    strategyId: params.strategyId,
    predictId: params.predictId,
    managerId: params.managerId,
    oracleObjectId: params.oracleObjectId,
    feeCoinObjectId: params.feeCoinObjectId,
    feeAmountAtomic: normalizePositiveInteger(
      params.feeAmountAtomic,
      "Strategy follow fee amount",
    ),
    quantity: normalizePositiveInteger(params.quantity, "Strategy follow quantity"),
    quoteCoinType: params.quoteCoinType,
    wrapperPackageId,
    target: `${wrapperPackageId}::strategy::follow_strategy_and_mint`,
    requiresQuotePreview: true,
    requiresFullMintPreflight: true,
    signsOrExecutes: false,
  };
}

export function buildFollowStrategyAndMintTransaction(
  params: BuildFollowStrategyAndMintTransactionOptions,
): Transaction {
  assertFollowSafetyGates(params);

  const plan = buildFollowStrategyAndMintPlan(params);
  const tx = new Transaction();

  tx.moveCall({
    target: plan.target,
    typeArguments: [plan.quoteCoinType],
    arguments: [
      tx.object(plan.strategyId),
      tx.object(plan.predictId),
      tx.object(plan.managerId),
      tx.object(plan.oracleObjectId),
      tx.object(plan.feeCoinObjectId),
      tx.pure.u64(plan.feeAmountAtomic),
      tx.pure.u64(plan.quantity),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ],
  });

  return tx;
}

function assertFollowSafetyGates(
  params: BuildFollowStrategyAndMintTransactionOptions,
): void {
  if (!params.requireQuotePreviewPassed || !params.requireFullMintPreflightPassed) {
    throw new DeepBookPredictUnconfirmedBindingError(
      "RangePilot strategy follow transaction building requires an official DeepBook Predict quote preview and full mint preflight to pass first.",
    );
  }
}

function resolveWrapperPackageId(
  params: BuildFollowStrategyAndMintTransactionOptions,
): string {
  const packageId =
    params.wrapperPackageId ??
    params.wrapper?.wrapperPackageId ??
    params.wrapper?.packageId ??
    null;

  if (!packageId) {
    throw new DeepBookPredictUnconfirmedBindingError(
      "RangePilot wrapper package ID is TBD. Publish the wrapper package and pass wrapperPackageId before building follow_strategy_and_mint transactions.",
    );
  }

  return packageId;
}

function normalizePositiveInteger(value: string, label: string): string {
  const normalized = BigInt(value);

  if (normalized <= 0n) {
    throw new DeepBookPredictUnconfirmedBindingError(`${label} must be greater than 0.`);
  }

  return normalized.toString();
}
