import { useCallback, useEffect, useMemo, useState } from "react";
import { DEEPBOOK_PREDICT_TESTNET } from "@rangepilot/config/deepbookPredictTestnet";
import { rangeCandidateKey } from "@rangepilot/sdk/deepbookPredict";

export type PersistedRangeKey = {
  oracleId: string;
  oracleObjectId: string;
  underlyingAsset: string | null;
  expiry: string;
  lowerStrike: string;
  higherStrike: string;
  quantity?: string;
};

export type RangePositionSource = "mint_event" | "local_storage" | "digest_import" | "mint_history" | "manual";
export type KnownRangeStatus = "unknown" | "active" | "inactive";

export type KnownRangeKeyRecord = PersistedRangeKey & {
  key: string;
  source: RangePositionSource;
  status: KnownRangeStatus;
  mintDigests: string[];
  lastRedeemDigest?: string;
  lastReadbackQuantity?: string;
  updatedAtMs: number;
};

export type RangeTradingPersistenceRecord = {
  knownRanges: KnownRangeKeyRecord[];
  lastSelectedRangeKey?: string;
  lastRangeKey?: PersistedRangeKey;
  lastMintDigest?: string;
  lastRedeemDigest?: string;
  updatedAtMs: number;
};

const RANGE_TRADING_STORAGE_PREFIX = "rangepilot:range-trading";

export function useRangeTradingPersistence(address: string | null, managerId?: string | null) {
  const legacyStorageKey = useMemo(
    () =>
      address
        ? `${RANGE_TRADING_STORAGE_PREFIX}:${DEEPBOOK_PREDICT_TESTNET.network}:${address}`
        : null,
    [address],
  );
  const storageKey = useMemo(
    () =>
      address && managerId
        ? `${RANGE_TRADING_STORAGE_PREFIX}:${DEEPBOOK_PREDICT_TESTNET.network}:${address}:${managerId}`
        : legacyStorageKey,
    [address, legacyStorageKey, managerId],
  );
  const [record, setRecord] = useState<RangeTradingPersistenceRecord | null>(null);

  useEffect(() => {
    if (!storageKey) {
      setRecord(null);
      return;
    }

    const current = readRecord(storageKey);
    const legacy = managerId && legacyStorageKey && legacyStorageKey !== storageKey
      ? readRecord(legacyStorageKey)
      : null;
    const migrated = current ?? migrateLegacyRecord(legacy);

    if (migrated && current === null) {
      window.localStorage.setItem(storageKey, JSON.stringify(migrated));
    }

    setRecord(migrated);
  }, [legacyStorageKey, managerId, storageKey]);

  const updateRecord = useCallback(
    (patch: Partial<Omit<RangeTradingPersistenceRecord, "updatedAtMs">>) => {
      if (!storageKey) {
        return;
      }

      setRecord((current) => writeRecord(storageKey, {
        ...(current ?? { knownRanges: [], updatedAtMs: Date.now() }),
        ...patch,
      }));
    },
    [storageKey],
  );

  const upsertKnownRange = useCallback(
    (range: PersistedRangeKey & {
      source: RangePositionSource;
      status?: KnownRangeStatus;
      mintDigest?: string;
      lastRedeemDigest?: string;
      lastReadbackQuantity?: string;
    }) => {
      if (!storageKey) {
        return;
      }

      setRecord((current) => {
        const base = current ?? { knownRanges: [], updatedAtMs: Date.now() };
        const key = rangeKey(range);
        const existing = base.knownRanges.find((knownRange) => knownRange.key === key);
        const mintDigests = uniqueStrings([
          ...(existing?.mintDigests ?? []),
          range.mintDigest,
        ]);
        const nextRange: KnownRangeKeyRecord = {
          ...existing,
          ...range,
          key,
          source: range.source,
          status: range.status ?? existing?.status ?? "unknown",
          mintDigests,
          lastRedeemDigest: range.lastRedeemDigest ?? existing?.lastRedeemDigest,
          lastReadbackQuantity: range.lastReadbackQuantity ?? existing?.lastReadbackQuantity,
          updatedAtMs: Date.now(),
        };
        const knownRanges = [
          nextRange,
          ...base.knownRanges.filter((knownRange) => knownRange.key !== key),
        ];

        return writeRecord(storageKey, {
          ...base,
          knownRanges,
          lastSelectedRangeKey: key,
          lastRangeKey: nextRange,
          lastMintDigest: range.mintDigest ?? base.lastMintDigest,
          lastRedeemDigest: range.lastRedeemDigest ?? base.lastRedeemDigest,
        });
      });
    },
    [storageKey],
  );

  const updateKnownRangeReadback = useCallback(
    (range: PersistedRangeKey, quantity: string) => {
      if (!storageKey) {
        return;
      }

      setRecord((current) => {
        if (!current) {
          return current;
        }

        const key = rangeKey(range);
        const status = BigInt(quantity) > 0n ? "active" as const : "inactive" as const;
        let changed = false;
        const knownRanges = current.knownRanges.map((knownRange) => {
          if (knownRange.key !== key) {
            return knownRange;
          }

          if (knownRange.status === status && knownRange.lastReadbackQuantity === quantity) {
            return knownRange;
          }

          changed = true;
          return {
            ...knownRange,
            status,
            lastReadbackQuantity: quantity,
            updatedAtMs: Date.now(),
          };
        });

        if (!changed) {
          return current;
        }

        return writeRecord(storageKey, {
          ...current,
          knownRanges,
        });
      });
    },
    [storageKey],
  );

  const selectKnownRange = useCallback(
    (key: string) => {
      updateRecord({ lastSelectedRangeKey: key });
    },
    [updateRecord],
  );

  const updateDigests = useCallback(
    (patch: { lastMintDigest?: string; lastRedeemDigest?: string }) => {
      updateRecord(patch);
    },
    [updateRecord],
  );

  return {
    record,
    storageKey,
    legacyStorageKey,
    updateRecord,
    upsertKnownRange,
    updateKnownRangeReadback,
    selectKnownRange,
    updateDigests,
  };
}

export function rangeKey(range: PersistedRangeKey): string {
  return rangeCandidateKey(range);
}

function writeRecord(storageKey: string, record: Omit<RangeTradingPersistenceRecord, "updatedAtMs"> & { updatedAtMs?: number }) {
  const next: RangeTradingPersistenceRecord = {
    ...record,
    knownRanges: record.knownRanges ?? [],
    updatedAtMs: Date.now(),
  };

  window.localStorage.setItem(storageKey, JSON.stringify(next));
  return next;
}

function readRecord(storageKey: string): RangeTradingPersistenceRecord | null {
  const raw = window.localStorage.getItem(storageKey);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return normalizeRecord(parsed);
  } catch {
    return null;
  }
}

function migrateLegacyRecord(record: RangeTradingPersistenceRecord | null): RangeTradingPersistenceRecord | null {
  if (!record?.lastRangeKey) {
    return record;
  }

  const key = rangeKey(record.lastRangeKey);
  const knownRange: KnownRangeKeyRecord = {
    ...record.lastRangeKey,
    key,
    source: "local_storage",
    status: "unknown",
    mintDigests: record.lastMintDigest ? [record.lastMintDigest] : [],
    lastRedeemDigest: record.lastRedeemDigest,
    updatedAtMs: Date.now(),
  };

  return {
    ...record,
    knownRanges: [
      knownRange,
      ...record.knownRanges.filter((range) => range.key !== key),
    ],
    lastSelectedRangeKey: record.lastSelectedRangeKey ?? key,
    updatedAtMs: Date.now(),
  };
}

function normalizeRecord(value: unknown): RangeTradingPersistenceRecord | null {
  if (!isRecord(value)) {
    return null;
  }

  const lastRangeKey = normalizeRangeKey(value.lastRangeKey);
  const knownRanges = Array.isArray(value.knownRanges)
    ? value.knownRanges.map(normalizeKnownRange).filter((range): range is KnownRangeKeyRecord => range !== null)
    : [];
  const record: RangeTradingPersistenceRecord = {
    knownRanges,
    updatedAtMs: typeof value.updatedAtMs === "number" ? value.updatedAtMs : Date.now(),
  };

  if (lastRangeKey) {
    record.lastRangeKey = lastRangeKey;
  }

  if (typeof value.lastSelectedRangeKey === "string") {
    record.lastSelectedRangeKey = value.lastSelectedRangeKey;
  }

  if (typeof value.lastMintDigest === "string") {
    record.lastMintDigest = value.lastMintDigest;
  }

  if (typeof value.lastRedeemDigest === "string") {
    record.lastRedeemDigest = value.lastRedeemDigest;
  }

  return migrateLegacyRecord(record);
}

function normalizeKnownRange(value: unknown): KnownRangeKeyRecord | null {
  const rangeKeyRecord = normalizeRangeKey(value);

  if (!rangeKeyRecord || !isRecord(value)) {
    return null;
  }

  const source = normalizeSource(value.source);
  const status = normalizeStatus(value.status);
  const mintDigests = Array.isArray(value.mintDigests)
    ? value.mintDigests.filter((digest): digest is string => typeof digest === "string")
    : [];

  return {
    ...rangeKeyRecord,
    key: typeof value.key === "string" ? value.key : rangeKey(rangeKeyRecord),
    source,
    status,
    mintDigests,
    lastRedeemDigest: typeof value.lastRedeemDigest === "string" ? value.lastRedeemDigest : undefined,
    lastReadbackQuantity: typeof value.lastReadbackQuantity === "string" ? value.lastReadbackQuantity : undefined,
    updatedAtMs: typeof value.updatedAtMs === "number" ? value.updatedAtMs : Date.now(),
  };
}

function normalizeRangeKey(value: unknown): PersistedRangeKey | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.oracleId !== "string" ||
    typeof value.oracleObjectId !== "string" ||
    typeof value.expiry !== "string" ||
    typeof value.lowerStrike !== "string" ||
    typeof value.higherStrike !== "string"
  ) {
    return null;
  }

  return {
    oracleId: value.oracleId,
    oracleObjectId: value.oracleObjectId,
    underlyingAsset: typeof value.underlyingAsset === "string" ? value.underlyingAsset : null,
    expiry: value.expiry,
    lowerStrike: value.lowerStrike,
    higherStrike: value.higherStrike,
    quantity: typeof value.quantity === "string" ? value.quantity : undefined,
  };
}

function normalizeSource(value: unknown): RangePositionSource {
  switch (value) {
    case "mint_event":
    case "local_storage":
    case "digest_import":
    case "mint_history":
    case "manual":
      return value;
    default:
      return "local_storage";
  }
}

function normalizeStatus(value: unknown): KnownRangeStatus {
  switch (value) {
    case "active":
    case "inactive":
    case "unknown":
      return value;
    default:
      return "unknown";
  }
}

function uniqueStrings(values: Array<string | undefined>) {
  return [...new Set(values.filter((value): value is string => typeof value === "string" && value.length > 0))];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
