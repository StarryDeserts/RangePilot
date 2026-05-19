import { useMemo } from "react";
import { useSuiClient } from "@mysten/dapp-kit";
import { useQuery } from "@tanstack/react-query";
import type { MoveReceipt } from "@rangepilot/types/deepVol";
import { useDeepVolConfig } from "./useDeepVolConfig";
import { useSuiWallet } from "./useSuiWallet";
import type { StoredDeepVolReceipt } from "./useBuyMoveReceipt";
import { DEEPVOL_STORAGE_KEYS } from "../lib/constants";

type ReceiptSource = "local" | "validation_reference";

export type DeepVolPortfolioReceipt = {
  source: ReceiptSource;
  receiptId: string;
  digest: string | null;
  object: MoveReceipt | null;
  readbackError: string | null;
};

export function useDeepVolPortfolio() {
  const client = useSuiClient();
  const wallet = useSuiWallet();
  const config = useDeepVolConfig();
  const storedReceipts = useMemo(readStoredReceipts, []);
  const receiptRefs = storedReceipts.length > 0
    ? storedReceipts
        .filter((entry) => entry.receiptId)
        .map((entry) => ({
          source: "local" as const,
          receiptId: entry.receiptId!,
          digest: entry.digest,
        }))
    : [
        {
          source: "validation_reference" as const,
          receiptId: config.validatedReferenceReceiptId,
          digest: config.validatedReferenceBuyDigest,
        },
      ];

  const query = useQuery({
    queryKey: ["deepvol-portfolio", wallet.address, receiptRefs.map((entry) => entry.receiptId).join(":")],
    queryFn: async () => Promise.all(
      receiptRefs.map(async (entry): Promise<DeepVolPortfolioReceipt> => {
        try {
          const receipt = await readMoveReceipt(client, entry.receiptId);
          return {
            ...entry,
            object: receipt,
            readbackError: null,
          };
        } catch (error) {
          return {
            ...entry,
            object: null,
            readbackError: error instanceof Error ? error.message : String(error),
          };
        }
      }),
    ),
  });

  return {
    receipts: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error instanceof Error ? query.error.message : null,
    hasLocalReceipts: storedReceipts.length > 0,
  };
}

function readStoredReceipts(): StoredDeepVolReceipt[] {
  try {
    const raw = window.localStorage.getItem(DEEPVOL_STORAGE_KEYS.receipts);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isStoredReceipt) : [];
  } catch {
    return [];
  }
}

function isStoredReceipt(value: unknown): value is StoredDeepVolReceipt {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Partial<StoredDeepVolReceipt>;
  return typeof record.digest === "string" && typeof record.seriesId === "string" && typeof record.owner === "string";
}

async function readMoveReceipt(
  client: {
    getObject(input: {
      id: string;
      options?: { showContent?: boolean; showOwner?: boolean };
    }): Promise<unknown>;
  },
  receiptId: string,
): Promise<MoveReceipt> {
  const response = await client.getObject({
    id: receiptId,
    options: { showContent: true, showOwner: true },
  });
  const fields = (response as ParsedMoveObject).data?.content?.fields;

  if (!fields) {
    throw new Error("MoveReceipt object content is unavailable from Sui Testnet.");
  }

  return {
    receiptId,
    owner: readAddressField(fields.owner) ?? "",
    seriesId: readIdField(fields.series_id ?? fields.seriesId) ?? "",
    predictManagerId: readIdField(fields.predict_manager_id ?? fields.predictManagerId) ?? "",
    oracleId: readIdField(fields.oracle_id ?? fields.oracleId) ?? "",
    expiry: readScalarField(fields.expiry) ?? "",
    lowerStrike: readScalarField(fields.lower_strike ?? fields.lowerStrike) ?? "",
    upperStrike: readScalarField(fields.upper_strike ?? fields.upperStrike) ?? "",
    upStrike: readScalarField(fields.up_strike ?? fields.upStrike) ?? "",
    downStrike: readScalarField(fields.down_strike ?? fields.downStrike) ?? "",
    quantity: readScalarField(fields.quantity) ?? "",
    premiumPaid: readScalarField(fields.premium_paid ?? fields.premiumPaid) ?? "",
    createFeePaid: readScalarField(fields.create_fee_paid ?? fields.createFeePaid) ?? "",
    createdAtMs: readScalarField(fields.created_at_ms ?? fields.createdAtMs) ?? "",
    status: Number(readScalarField(fields.status) ?? 0) as MoveReceipt["status"],
  };
}

type ParsedMoveObject = {
  data?: {
    content?: {
      fields?: Record<string, unknown>;
    };
  };
};

function readScalarField(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "bigint" || typeof value === "boolean") {
    return String(value);
  }

  if (typeof value === "object" && "fields" in value) {
    return readScalarField((value as { fields?: unknown }).fields);
  }

  return null;
}

function readAddressField(value: unknown): string | null {
  return readScalarField(value);
}

function readIdField(value: unknown): string | null {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>;
    return readIdField(record.id ?? record.bytes ?? record.fields);
  }

  return null;
}
