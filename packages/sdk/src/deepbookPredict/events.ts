import type {
  DeepBookPredictNetworkConfig,
  PredictManagerCreatedEventCandidate,
} from "@rangepilot/types/deepbookPredict";
import { resolveDeepBookPredictConfig } from "./config";

const MANAGER_CREATED_SUFFIX = "::predict_manager::PredictManagerCreated";

export type DeepBookPredictEventLike = {
  type?: string;
  parsedJson?: unknown;
  [key: string]: unknown;
};

export function parsePredictManagerCreatedEvent(
  events: readonly DeepBookPredictEventLike[] | null | undefined,
  config?: DeepBookPredictNetworkConfig,
): PredictManagerCreatedEventCandidate | null {
  const resolvedConfig = resolveDeepBookPredictConfig(config);
  const candidate = events?.find((event) => {
    const eventType = event.type ?? "";
    return (
      eventType.startsWith(`${resolvedConfig.packageId}::`) &&
      eventType.endsWith(MANAGER_CREATED_SUFFIX)
    );
  });

  if (!candidate?.type) {
    return null;
  }

  return {
    eventType: candidate.type,
    managerId: null,
    rawParsedJson: candidate.parsedJson ?? null,
    rawEvent: candidate,
    unconfirmedReason:
      "PredictManagerCreated event fields are MUST CONFIRM BEFORE CODING before recovering manager ID from parsedJson.",
  };
}
