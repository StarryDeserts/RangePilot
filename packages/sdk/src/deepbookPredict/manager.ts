import type {
  DeepBookPredictAmountLike,
  DeepBookPredictNetworkConfig,
  ManagerDiscoveryLayerResult,
  ManagerDiscoveryResult,
  PredictManagerRef,
} from "@rangepilot/types/deepbookPredict";
import { resolveDeepBookPredictConfig } from "./config.ts";
import { DeepBookPredictUnconfirmedBindingError } from "./errors.ts";

export type FindPredictManagerByOwnerParams = {
  owner: string;
  knownManagerId?: string | null;
  config?: DeepBookPredictNetworkConfig;
};

export type GetManagerBalanceParams = {
  managerId: string;
  config?: DeepBookPredictNetworkConfig;
};

export type ManagerBalanceResult = {
  managerId: string;
  coinType: string;
  decimals: 6;
  balanceAtomic: string;
  source: "direct_read" | "dev_inspect" | "public_server";
};

export async function findPredictManagerByOwner({
  owner,
  knownManagerId,
  config,
}: FindPredictManagerByOwnerParams): Promise<ManagerDiscoveryResult> {
  const resolvedConfig = resolveDeepBookPredictConfig(config);
  const layers: ManagerDiscoveryLayerResult[] = [];

  if (knownManagerId) {
    const manager: PredictManagerRef = {
      managerId: knownManagerId,
      owner,
      network: resolvedConfig.network,
      source: "local_storage",
    };

    layers.push({
      layer: "local_storage",
      status: "found",
      message:
        "Using locally stored manager ID as a hint; direct owner validation remains pending.",
    });

    return {
      status: "found",
      manager,
      layers,
    };
  }

  layers.push({
    layer: "local_storage",
    status: "not_found",
    message: "No local manager ID hint is stored for this wallet and network.",
  });
  layers.push({
    layer: "public_server",
    status: "unconfirmed",
    message:
      "Public server /managers owner filtering and response schema are MUST CONFIRM BEFORE CODING.",
  });
  layers.push({
    layer: "event_scan",
    status: "unconfirmed",
    message:
      "PredictManagerCreated event fields and event-scan query are MUST CONFIRM BEFORE CODING.",
  });

  return {
    status: "unconfirmed",
    owner,
    network: resolvedConfig.network,
    reason:
      "Manager discovery beyond a local hint is not confirmed. UI may offer create_manager but must not claim discovery is complete.",
    layers,
  };
}

export async function getManagerBalance(
  params: GetManagerBalanceParams,
): Promise<ManagerBalanceResult> {
  const config = resolveDeepBookPredictConfig(params.config);

  throw new DeepBookPredictUnconfirmedBindingError(
    `MUST CONFIRM BEFORE CODING: predict_manager::balance<DUSDC> read strategy for manager ${params.managerId} is not validated. Expected coin type ${config.quoteAssets.DUSDC.coinType}.`,
  );
}

export function createManualPredictManagerRef(
  managerId: string,
  owner: string,
  config?: DeepBookPredictNetworkConfig,
): PredictManagerRef {
  const resolvedConfig = resolveDeepBookPredictConfig(config);

  return {
    managerId,
    owner,
    network: resolvedConfig.network,
    source: "manual",
  };
}

export function normalizeManagerDepositAmount(
  amountAtomic: DeepBookPredictAmountLike,
): string {
  const amount = BigInt(amountAtomic);

  if (amount <= 0n) {
    throw new DeepBookPredictUnconfirmedBindingError(
      "Deposit amount must be greater than 0 atomic units.",
    );
  }

  return amount.toString();
}
