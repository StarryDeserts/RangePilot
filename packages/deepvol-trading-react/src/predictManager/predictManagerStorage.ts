import { normalizeSuiAddress } from "@mysten/sui/utils";
import { browserStorage, type StorageLike } from "../core/environment";

export const DEFAULT_PREDICT_MANAGER_STORAGE_PREFIX = "deepvol:predict-manager";

export type PredictManagerStorageSource = "created" | "manual" | "local_record" | "recovered";

export type StoredPredictManagerSession = {
  walletAddress: string;
  predictManagerId: string;
  createdDigest?: string;
  source: PredictManagerStorageSource;
  createdAt?: number;
  updatedAt: number;
};

export function buildPredictManagerStorageKey(
  network: string,
  walletAddress: string,
  storagePrefix = DEFAULT_PREDICT_MANAGER_STORAGE_PREFIX,
): string {
  return `${storagePrefix}:${network}:${normalizeSuiAddress(walletAddress)}`;
}

export function readStoredPredictManagerSession(
  network: string,
  walletAddress: string,
  storage: StorageLike | null = browserStorage(),
  storagePrefix = DEFAULT_PREDICT_MANAGER_STORAGE_PREFIX,
): StoredPredictManagerSession | null {
  if (!storage) {
    return null;
  }

  const normalizedWallet = normalizeSuiAddress(walletAddress);
  const raw = storage.getItem(buildPredictManagerStorageKey(network, normalizedWallet, storagePrefix));

  if (!raw) {
    return null;
  }

  const legacy = normalizeLegacyManagerId(raw, normalizedWallet);

  if (legacy) {
    return legacy;
  }

  try {
    const parsed = normalizeStoredPredictManagerSession(JSON.parse(raw));

    return parsed?.walletAddress === normalizedWallet ? parsed : null;
  } catch {
    return null;
  }
}

export function writeStoredPredictManagerSession(
  network: string,
  record: StoredPredictManagerSession,
  storage: StorageLike | null = browserStorage(),
  storagePrefix = DEFAULT_PREDICT_MANAGER_STORAGE_PREFIX,
): void {
  if (!storage) {
    return;
  }

  const normalizedRecord: StoredPredictManagerSession = {
    ...record,
    walletAddress: normalizeSuiAddress(record.walletAddress),
    predictManagerId: record.predictManagerId.trim(),
    updatedAt: record.updatedAt || Date.now(),
  };

  storage.setItem(
    buildPredictManagerStorageKey(network, normalizedRecord.walletAddress, storagePrefix),
    JSON.stringify(normalizedRecord),
  );
}

export function clearStoredPredictManagerSession(
  network: string,
  walletAddress: string,
  storage: StorageLike | null = browserStorage(),
  storagePrefix = DEFAULT_PREDICT_MANAGER_STORAGE_PREFIX,
): void {
  if (!storage) {
    return;
  }

  storage.removeItem(buildPredictManagerStorageKey(network, walletAddress, storagePrefix));
}

export function normalizeStoredPredictManagerSession(input: unknown): StoredPredictManagerSession | null {
  if (!isRecord(input)) {
    return null;
  }

  if (typeof input.walletAddress !== "string" || typeof input.predictManagerId !== "string") {
    return null;
  }

  if (!isPredictManagerStorageSource(input.source)) {
    return null;
  }

  const updatedAt = typeof input.updatedAt === "number" ? input.updatedAt : Date.now();
  const createdAt = typeof input.createdAt === "number" ? input.createdAt : undefined;
  const createdDigest = typeof input.createdDigest === "string" ? input.createdDigest : undefined;

  return {
    walletAddress: normalizeSuiAddress(input.walletAddress),
    predictManagerId: input.predictManagerId.trim(),
    createdDigest,
    source: input.source,
    createdAt,
    updatedAt,
  };
}

function normalizeLegacyManagerId(raw: string, walletAddress: string): StoredPredictManagerSession | null {
  const trimmed = raw.trim();

  if (!trimmed.startsWith("0x")) {
    return null;
  }

  return {
    walletAddress,
    predictManagerId: trimmed,
    source: "recovered",
    updatedAt: Date.now(),
  };
}

function isPredictManagerStorageSource(value: unknown): value is PredictManagerStorageSource {
  return value === "created" || value === "manual" || value === "local_record" || value === "recovered";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
