import type {
  DeepBookPredictNetworkConfig,
  PredictManagerCreatedEventCandidate,
  RangeMintedEvent,
} from "@rangepilot/types/deepbookPredict";
import { resolveDeepBookPredictConfig } from "./config.ts";

const MANAGER_CREATED_SUFFIX = "::predict_manager::PredictManagerCreated";
const RANGE_MINTED_SUFFIX = "::predict::RangeMinted";
const MANAGER_EVENT_ID_FIELDS = [
  "manager_id",
  "managerId",
  "manager",
  "predict_manager",
  "predictManager",
  "id",
  "object_id",
  "objectId",
] as const;
const SUI_OBJECT_ID_PATTERN = /^0x[0-9a-fA-F]+$/;

export type DeepBookPredictEventLike = {
  type?: string;
  parsedJson?: unknown;
  [key: string]: unknown;
};

export type DeepBookPredictObjectChangeLike = {
  type?: string;
  objectType?: string;
  objectId?: string;
  [key: string]: unknown;
};

export type PredictManagerIdRecoveryResult = {
  managerId: string | null;
  source: "event" | "object_change" | "event_and_object_change" | null;
  event: PredictManagerCreatedEventCandidate | null;
  objectChangeCandidates: string[];
  ambiguous: boolean;
  message: string;
};

export type PredictManagerCreateResultLike = {
  events?: readonly DeepBookPredictEventLike[] | null;
  objectChanges?: readonly DeepBookPredictObjectChangeLike[] | null;
};

export function parsePredictManagerCreatedEvent(
  events: readonly DeepBookPredictEventLike[] | null | undefined,
  config?: DeepBookPredictNetworkConfig,
): PredictManagerCreatedEventCandidate | null {
  const resolvedConfig = resolveDeepBookPredictConfig(config);
  const candidate = events?.find((event) => isPredictManagerCreatedEvent(event, resolvedConfig));

  if (!candidate?.type) {
    return null;
  }

  const managerId = extractManagerIdFromParsedJson(candidate.parsedJson);

  return {
    eventType: candidate.type,
    managerId,
    rawParsedJson: candidate.parsedJson ?? null,
    rawEvent: candidate,
    unconfirmedReason: managerId
      ? undefined
      : "PredictManagerCreated event matched, but manager ID field was not found in known public field names.",
  };
}

export function parseRangeMintedEvent(
  result: { events?: readonly DeepBookPredictEventLike[] | null },
  config?: DeepBookPredictNetworkConfig,
): RangeMintedEvent | null {
  const resolvedConfig = resolveDeepBookPredictConfig(config);
  const event = result.events?.find((candidate) => isRangeMintedEvent(candidate, resolvedConfig));

  if (!event?.type) {
    return null;
  }

  return {
    type: event.type,
    parsedJson: isRecord(event.parsedJson) ? event.parsedJson : null,
  };
}

export function recoverPredictManagerIdFromCreateResult(
  result: PredictManagerCreateResultLike,
  config?: DeepBookPredictNetworkConfig,
): PredictManagerIdRecoveryResult {
  const resolvedConfig = resolveDeepBookPredictConfig(config);
  const event = parsePredictManagerCreatedEvent(result.events, resolvedConfig);
  const objectChangeCandidates = extractPredictManagerObjectChangeIds(
    result.objectChanges,
    resolvedConfig,
  );
  const uniqueObjectChangeCandidates = [...new Set(objectChangeCandidates)];
  const eventManagerId = event?.managerId ?? null;

  if (eventManagerId && uniqueObjectChangeCandidates.includes(eventManagerId)) {
    return {
      managerId: eventManagerId,
      source: "event_and_object_change",
      event,
      objectChangeCandidates: uniqueObjectChangeCandidates,
      ambiguous: false,
      message: "Recovered manager ID from matching PredictManagerCreated event and created object change.",
    };
  }

  if (eventManagerId && uniqueObjectChangeCandidates.length === 0) {
    return {
      managerId: eventManagerId,
      source: "event",
      event,
      objectChangeCandidates: uniqueObjectChangeCandidates,
      ambiguous: false,
      message: "Recovered manager ID from PredictManagerCreated event.",
    };
  }

  if (!eventManagerId && uniqueObjectChangeCandidates.length === 1) {
    return {
      managerId: uniqueObjectChangeCandidates[0],
      source: "object_change",
      event,
      objectChangeCandidates: uniqueObjectChangeCandidates,
      ambiguous: false,
      message: "Recovered manager ID from the single PredictManager created object change.",
    };
  }

  return {
    managerId: null,
    source: null,
    event,
    objectChangeCandidates: uniqueObjectChangeCandidates,
    ambiguous: uniqueObjectChangeCandidates.length > 1,
    message:
      uniqueObjectChangeCandidates.length > 1
        ? "Multiple PredictManager created object changes were found; refusing to choose one."
        : "Unable to recover PredictManager ID from event or object changes.",
  };
}

function isPredictManagerCreatedEvent(
  event: DeepBookPredictEventLike,
  config: DeepBookPredictNetworkConfig,
): boolean {
  const eventType = event.type ?? "";

  return (
    eventType.startsWith(`${config.packageId}::`) &&
    eventType.endsWith(MANAGER_CREATED_SUFFIX)
  );
}

function isRangeMintedEvent(
  event: DeepBookPredictEventLike,
  config: DeepBookPredictNetworkConfig,
): boolean {
  const eventType = event.type ?? "";

  return (
    eventType.startsWith(`${config.packageId}::`) &&
    eventType.endsWith(RANGE_MINTED_SUFFIX)
  );
}

function extractManagerIdFromParsedJson(parsedJson: unknown): string | null {
  if (!isRecord(parsedJson)) {
    return null;
  }

  for (const field of MANAGER_EVENT_ID_FIELDS) {
    const value = parsedJson[field];

    if (typeof value === "string" && isSuiObjectId(value)) {
      return value;
    }
  }

  return null;
}

function extractPredictManagerObjectChangeIds(
  objectChanges: readonly DeepBookPredictObjectChangeLike[] | null | undefined,
  config: DeepBookPredictNetworkConfig,
): string[] {
  const managerObjectPrefix = `${config.packageId}::predict_manager::PredictManager`;

  return (
    objectChanges
      ?.filter((objectChange) => objectChange.type === "created")
      .filter((objectChange) => objectChange.objectType?.startsWith(managerObjectPrefix))
      .map((objectChange) => objectChange.objectId)
      .filter((objectId): objectId is string => Boolean(objectId && isSuiObjectId(objectId))) ?? []
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSuiObjectId(value: string): boolean {
  return SUI_OBJECT_ID_PATTERN.test(value);
}
