import { useCallback, useEffect, useMemo, useState } from "react";
import { DEEPBOOK_PREDICT_TESTNET } from "@rangepilot/config/deepbookPredictTestnet";

export type PersistedRangeKey = {
  oracleId: string;
  oracleObjectId: string;
  underlyingAsset: string | null;
  expiry: string;
  lowerStrike: string;
  higherStrike: string;
  quantity?: string;
};

export type RangeTradingPersistenceRecord = {
  managerId?: string;
  lastRangeKey?: PersistedRangeKey;
  lastMintDigest?: string;
  lastRedeemDigest?: string;
  updatedAtMs: number;
};

const RANGE_TRADING_STORAGE_PREFIX = "rangepilot:range-trading";

export function useRangeTradingPersistence(address: string | null) {
  const storageKey = useMemo(
    () =>
      address
        ? `${RANGE_TRADING_STORAGE_PREFIX}:${DEEPBOOK_PREDICT_TESTNET.network}:${address}`
        : null,
    [address],
  );
  const [record, setRecord] = useState<RangeTradingPersistenceRecord | null>(null);

  useEffect(() => {
    if (!storageKey) {
      setRecord(null);
      return;
    }

    setRecord(readRecord(storageKey));
  }, [storageKey]);

  const updateRecord = useCallback(
    (patch: Partial<Omit<RangeTradingPersistenceRecord, "updatedAtMs">>) => {
      if (!storageKey) {
        return;
      }

      setRecord((current) => {
        const next: RangeTradingPersistenceRecord = {
          ...(current ?? { updatedAtMs: Date.now() }),
          ...patch,
          updatedAtMs: Date.now(),
        };

        window.localStorage.setItem(storageKey, JSON.stringify(next));
        return next;
      });
    },
    [storageKey],
  );

  return {
    record,
    storageKey,
    updateRecord,
  };
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

function normalizeRecord(value: unknown): RangeTradingPersistenceRecord | null {
  if (!isRecord(value)) {
    return null;
  }

  const lastRangeKey = normalizeRangeKey(value.lastRangeKey);
  const record: RangeTradingPersistenceRecord = {
    updatedAtMs: typeof value.updatedAtMs === "number" ? value.updatedAtMs : Date.now(),
  };

  if (typeof value.managerId === "string") {
    record.managerId = value.managerId;
  }

  if (lastRangeKey) {
    record.lastRangeKey = lastRangeKey;
  }

  if (typeof value.lastMintDigest === "string") {
    record.lastMintDigest = value.lastMintDigest;
  }

  if (typeof value.lastRedeemDigest === "string") {
    record.lastRedeemDigest = value.lastRedeemDigest;
  }

  return record;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
