import { DEEPBOOK_PREDICT_TESTNET } from "@rangepilot/config/deepbookPredictTestnet";
import type { DeepBookPredictNetworkConfig } from "@rangepilot/types/deepbookPredict";

export { DEEPBOOK_PREDICT_TESTNET };
export type { DeepBookPredictNetworkConfig };

export function resolveDeepBookPredictConfig(
  config: DeepBookPredictNetworkConfig = DEEPBOOK_PREDICT_TESTNET,
): DeepBookPredictNetworkConfig {
  return config;
}
