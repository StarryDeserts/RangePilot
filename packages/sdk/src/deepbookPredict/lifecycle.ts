import type {
  DeepBookPredictManagerSummary,
  DeepBookPredictNetworkConfig,
  DeepBookPredictObjectId,
  DeepBookPredictOracleRecord,
  DeepBookPredictOracleState,
  ManagerRangePositionResult,
  MintAbortClassification,
  MintRangePreflightResult,
  OnchainAskBoundsResult,
  RangeKeyInput,
  RangeQuoteAttempt,
  RangeQuoteAttemptSuccess,
  RangeQuoteCandidate,
  RangeQuotePreview,
  RedeemRangePreflightResult,
} from "@rangepilot/types/deepbookPredict";
import { resolveDeepBookPredictConfig } from "./config.ts";
import { translateDeepBookPredictError } from "./errors.ts";
import {
  deriveCandidateRanges,
  devInspectAskBounds,
  devInspectRangeQuote,
  RANGE_QUOTE_QUANTITY_SWEEP,
  scanRangeQuoteQuantities,
} from "./quote.ts";
import { normalizePositiveInteger, normalizeRangeKeyInput } from "./rangeKey.ts";
import { readRangePositionQuantity } from "./portfolio.ts";
import { createDeepBookPredictServerClient, type DeepBookPredictServerClient } from "./server.ts";
import {
  devInspectMintRangePreflight,
  devInspectRedeemRangePreflight,
  isMintPreflightPassed,
  isRedeemPreflightPassed,
} from "./trade.ts";

export type DeepBookPredictLifecycleClient = {
  devInspectTransactionBlock(input: {
    sender: string;
    transactionBlock: unknown;
  }): Promise<unknown>;
};

export type GuidedLifecycleBlocker = {
  code: string;
  message: string;
};

export type ActiveRangeOracleContext = {
  oracleId: DeepBookPredictObjectId;
  oracleObjectId: DeepBookPredictObjectId;
  underlyingAsset: string | null;
  status: string;
  expiry: string;
  minStrike: string | null;
  tickSize: string | null;
  spot: string | null;
  forward: string | null;
  publicAskBounds: unknown | null;
  onchainAskBounds: OnchainAskBoundsResult | null;
  candidates: RangeQuoteCandidate[];
  warnings: string[];
  blockers: GuidedLifecycleBlocker[];
};

export type LoadActiveRangeOracleContextsParams = {
  server?: DeepBookPredictServerClient;
  client: DeepBookPredictLifecycleClient;
  sender: string;
  config?: DeepBookPredictNetworkConfig;
  underlyingAsset?: string;
  nowMs?: number;
  maxOracles?: number;
};

export type MintableRangeCandidate = RangeQuoteAttemptSuccess & {
  preflight: MintRangePreflightResult;
};

export type MintableRangeScanResult = {
  managerId: DeepBookPredictObjectId;
  managerSummary: DeepBookPredictManagerSummary | null;
  managerBalanceAtomic: string | null;
  oracleContexts: ActiveRangeOracleContext[];
  quoteAttempts: RangeQuoteAttempt[];
  preflightAttempts: MintableRangeCandidate[];
  selectedCandidate: MintableRangeCandidate | null;
  blockers: GuidedLifecycleBlocker[];
  warnings: string[];
};

export type ScanMintableRangeCandidatesParams = {
  client: DeepBookPredictLifecycleClient;
  sender: string;
  managerId: DeepBookPredictObjectId;
  server?: DeepBookPredictServerClient;
  config?: DeepBookPredictNetworkConfig;
  underlyingAsset?: string;
  maxQuoteCandidates?: number;
  maxPreflightCandidates?: number;
  quantities?: readonly (string | bigint)[];
};

export type GuidedRangeMintPreparation = {
  candidate: RangeQuoteCandidate;
  quantity: string;
  quote: RangeQuotePreview | null;
  preflight: MintRangePreflightResult | null;
  canMint: boolean;
  blockers: GuidedLifecycleBlocker[];
  warnings: string[];
};

export type PrepareRangeMintParams = {
  client: DeepBookPredictLifecycleClient;
  sender: string;
  managerId: DeepBookPredictObjectId;
  candidate: RangeQuoteCandidate;
  quantity: string | bigint;
  config?: DeepBookPredictNetworkConfig;
};

export type GuidedRangeRedeemPreparation = {
  rangeKey: RangeKeyInput & { oracleObjectId: DeepBookPredictObjectId };
  quantity: string;
  position: ManagerRangePositionResult | null;
  quote: RangeQuotePreview | null;
  preflight: RedeemRangePreflightResult | null;
  canRedeem: boolean;
  blockers: GuidedLifecycleBlocker[];
  warnings: string[];
};

export type PrepareRangeRedeemParams = {
  client: DeepBookPredictLifecycleClient;
  sender: string;
  managerId: DeepBookPredictObjectId;
  rangeKey: RangeKeyInput & { oracleObjectId: DeepBookPredictObjectId };
  quantity: string | bigint;
  config?: DeepBookPredictNetworkConfig;
  allowZeroPayout?: boolean;
};

export function extractManagerDusdcBalanceAtomic(summary: unknown): string | null {
  if (!isRecord(summary)) {
    return null;
  }

  const balanceRecords = Array.isArray(summary.balances) ? summary.balances : [];
  const dusdcRecord = balanceRecords.find((entry) => {
    if (!isRecord(entry)) {
      return false;
    }

    const symbol = stringOrNull(entry.symbol) ?? stringOrNull(entry.asset) ?? stringOrNull(entry.quote_asset);
    const coinType = stringOrNull(entry.coin_type) ?? stringOrNull(entry.coinType) ?? stringOrNull(entry.type);

    return symbol?.toUpperCase() === "DUSDC" || coinType?.toLowerCase().includes("::dusdc::dusdc") === true;
  });

  if (isRecord(dusdcRecord)) {
    const balance = integerStringOrNull(dusdcRecord.balance ?? dusdcRecord.amount ?? dusdcRecord.value);

    if (balance !== null) {
      return balance;
    }
  }

  return integerStringOrNull(summary.trading_balance);
}

export async function loadActiveRangeOracleContexts(
  params: LoadActiveRangeOracleContextsParams,
): Promise<ActiveRangeOracleContext[]> {
  const config = resolveDeepBookPredictConfig(params.config);
  const server = params.server ?? createDeepBookPredictServerClient({ config });
  const nowMs = params.nowMs ?? Date.now();
  const oracleRecords = await server.getOracles(config.predictId);
  const activeOracles = oracleRecords
    .filter((oracle) => oracle.status === "active")
    .filter((oracle) => stringOrNull(oracle.underlying_asset) === (params.underlyingAsset ?? "BTC"))
    .filter((oracle) => {
      const expiry = integerStringOrNull(oracle.expiry);
      return expiry !== null && BigInt(expiry) > BigInt(nowMs);
    })
    .sort(compareOracleExpiry)
    .slice(0, params.maxOracles ?? 4);

  const contexts: ActiveRangeOracleContext[] = [];

  for (const oracle of activeOracles) {
    contexts.push(await loadOracleContext({
      oracle,
      server,
      client: params.client,
      sender: params.sender,
      config,
    }));
  }

  return contexts;
}

export async function scanMintableRangeCandidates(
  params: ScanMintableRangeCandidatesParams,
): Promise<MintableRangeScanResult> {
  const config = resolveDeepBookPredictConfig(params.config);
  const server = params.server ?? createDeepBookPredictServerClient({ config });
  const blockers: GuidedLifecycleBlocker[] = [];
  const warnings: string[] = [];
  let managerSummary: DeepBookPredictManagerSummary | null = null;
  let managerBalanceAtomic: string | null = null;

  try {
    managerSummary = await server.getManagerSummary(params.managerId);
    managerBalanceAtomic = extractManagerDusdcBalanceAtomic(managerSummary);
  } catch (error) {
    warnings.push(`Manager summary unavailable: ${translateDeepBookPredictError(error)}`);
  }

  if (managerBalanceAtomic === null) {
    blockers.push({
      code: "manager_balance_unavailable",
      message: "Public server manager DUSDC balance was unavailable; mint cost coverage cannot be confirmed.",
    });
  }

  const oracleContexts = await loadActiveRangeOracleContexts({
    server,
    client: params.client,
    sender: params.sender,
    config,
    underlyingAsset: params.underlyingAsset,
  });
  const candidates = oracleContexts
    .flatMap((context) => context.candidates)
    .slice(0, params.maxQuoteCandidates ?? 80);

  if (candidates.length === 0) {
    blockers.push({
      code: "no_range_candidates",
      message: "No active oracle produced range candidates from runtime strike and price metadata.",
    });
  }

  const quoteAttempts = candidates.length > 0
    ? await scanRangeQuoteQuantities({
        candidates,
        client: params.client,
        sender: params.sender,
        quantities: params.quantities ?? RANGE_QUOTE_QUANTITY_SWEEP,
        config,
      })
    : [];
  const positiveQuotes = quoteAttempts
    .filter((attempt): attempt is RangeQuoteAttemptSuccess => attempt.status === "success" && BigInt(attempt.mintCostAtomic) > 0n)
    .filter((attempt) => managerBalanceAtomic === null || BigInt(managerBalanceAtomic) >= BigInt(attempt.mintCostAtomic));

  if (positiveQuotes.length === 0 && quoteAttempts.length > 0) {
    blockers.push({
      code: "no_positive_affordable_quote",
      message: "Quote scan did not find a positive mint cost covered by the manager DUSDC balance.",
    });
  }

  const preflightAttempts: MintableRangeCandidate[] = [];

  for (const candidate of positiveQuotes.slice(0, params.maxPreflightCandidates ?? 12)) {
    const preflight = await devInspectMintRangePreflight({
      ...candidate,
      managerId: params.managerId,
      quantity: candidate.quantity,
      client: params.client,
      sender: params.sender,
      config,
      candidateParams: {
        widthTicks: candidate.widthTicks,
        strategy: candidate.strategy,
        mintCostAtomic: candidate.mintCostAtomic,
        redeemPayoutAtomic: candidate.redeemPayoutAtomic,
      },
    });

    preflightAttempts.push({
      ...candidate,
      preflight,
    });
  }

  const selectedCandidate = preflightAttempts.find((candidate) => isMintPreflightPassed(candidate.preflight)) ?? null;

  if (!selectedCandidate && positiveQuotes.length > 0) {
    blockers.push({
      code: "mint_preflight_failed",
      message: "Positive quotes were found, but full mint_range preflight did not pass for the bounded candidate set.",
    });
  }

  return {
    managerId: params.managerId,
    managerSummary,
    managerBalanceAtomic,
    oracleContexts,
    quoteAttempts,
    preflightAttempts,
    selectedCandidate,
    blockers,
    warnings,
  };
}

export async function prepareRangeMint(
  params: PrepareRangeMintParams,
): Promise<GuidedRangeMintPreparation> {
  const config = resolveDeepBookPredictConfig(params.config);
  const quantity = normalizePositiveInteger(params.quantity, "Range mint quantity");
  const blockers: GuidedLifecycleBlocker[] = [];
  const warnings: string[] = [];
  let quote: RangeQuotePreview | null = null;
  let preflight: MintRangePreflightResult | null = null;

  try {
    quote = await devInspectRangeQuote({
      ...params.candidate,
      client: params.client,
      sender: params.sender,
      quantity,
      config,
    });
  } catch (error) {
    blockers.push({
      code: "quote_failed",
      message: translateDeepBookPredictError(error),
    });
  }

  if (quote && BigInt(quote.mintCostAtomic) <= 0n) {
    blockers.push({
      code: "zero_mint_cost",
      message: "Official range quote returned zero mint cost; full mint remains blocked.",
    });
  }

  if (quote && BigInt(quote.mintCostAtomic) > 0n) {
    preflight = await devInspectMintRangePreflight({
      ...params.candidate,
      managerId: params.managerId,
      quantity,
      client: params.client,
      sender: params.sender,
      config,
      candidateParams: {
        widthTicks: params.candidate.widthTicks,
        strategy: params.candidate.strategy,
        mintCostAtomic: quote.mintCostAtomic,
        redeemPayoutAtomic: quote.redeemPayoutAtomic,
      },
    });

    if (preflight.status === "failed") {
      blockers.push({
        code: "mint_preflight_failed",
        message: formatAbort(preflight.abort),
      });
    }
  }

  return {
    candidate: params.candidate,
    quantity,
    quote,
    preflight,
    canMint: blockers.length === 0 && preflight !== null && isMintPreflightPassed(preflight),
    blockers,
    warnings,
  };
}

export async function prepareRangeRedeem(
  params: PrepareRangeRedeemParams,
): Promise<GuidedRangeRedeemPreparation> {
  const config = resolveDeepBookPredictConfig(params.config);
  const quantity = normalizePositiveInteger(params.quantity, "Range redeem quantity");
  const normalizedRangeKey = normalizeRangeKeyInput(params.rangeKey);
  const rangeKey = {
    ...normalizedRangeKey,
    oracleObjectId: params.rangeKey.oracleObjectId,
  };
  const blockers: GuidedLifecycleBlocker[] = [];
  const warnings: string[] = [];
  let position: ManagerRangePositionResult | null = null;
  let quote: RangeQuotePreview | null = null;
  let preflight: RedeemRangePreflightResult | null = null;

  try {
    position = await readRangePositionQuantity({
      ...rangeKey,
      managerId: params.managerId,
      client: params.client,
      sender: params.sender,
      config,
    });
  } catch (error) {
    blockers.push({
      code: "range_position_failed",
      message: translateDeepBookPredictError(error),
    });
  }

  if (position) {
    const activeQuantity = BigInt(position.quantity);
    const requestedQuantity = BigInt(quantity);

    if (activeQuantity === 0n) {
      blockers.push({
        code: "no_active_quantity",
        message: "Direct range_position readback returned zero active quantity.",
      });
    }

    if (requestedQuantity > activeQuantity) {
      blockers.push({
        code: "redeem_quantity_exceeds_position",
        message: `Requested redeem quantity ${quantity} exceeds direct active quantity ${position.quantity}.`,
      });
    }
  }

  if (blockers.length === 0) {
    try {
      quote = await devInspectRangeQuote({
        ...rangeKey,
        client: params.client,
        sender: params.sender,
        quantity,
        config,
      });
    } catch (error) {
      blockers.push({
        code: "quote_failed",
        message: translateDeepBookPredictError(error),
      });
    }
  }

  if (quote && !params.allowZeroPayout && BigInt(quote.redeemPayoutAtomic) <= 0n) {
    blockers.push({
      code: "zero_redeem_payout",
      message: "Official range quote returned zero redeem payout; redeem is blocked by default.",
    });
  }

  if (quote && blockers.length === 0) {
    preflight = await devInspectRedeemRangePreflight({
      ...rangeKey,
      managerId: params.managerId,
      quantity,
      client: params.client,
      sender: params.sender,
      config,
      candidateParams: {
        redeemQuantity: quantity,
        positionQuantityBefore: position?.quantity,
        redeemPayoutAtomic: quote.redeemPayoutAtomic,
      },
    });

    if (preflight.status === "failed") {
      blockers.push({
        code: "redeem_preflight_failed",
        message: formatAbort(preflight.abort),
      });
    }
  }

  return {
    rangeKey,
    quantity,
    position,
    quote,
    preflight,
    canRedeem: blockers.length === 0 && preflight !== null && isRedeemPreflightPassed(preflight),
    blockers,
    warnings,
  };
}

async function loadOracleContext(params: {
  oracle: DeepBookPredictOracleRecord;
  server: DeepBookPredictServerClient;
  client: DeepBookPredictLifecycleClient;
  sender: string;
  config: DeepBookPredictNetworkConfig;
}): Promise<ActiveRangeOracleContext> {
  const warnings: string[] = [];
  const blockers: GuidedLifecycleBlocker[] = [];
  const oracleId = params.oracle.oracle_id;
  const expiry = integerStringOrNull(params.oracle.expiry);
  const minStrike = integerStringOrNull(params.oracle.min_strike);
  const tickSize = integerStringOrNull(params.oracle.tick_size);
  let oracleState: DeepBookPredictOracleState | null = null;
  let publicAskBounds: unknown | null = null;
  let onchainAskBounds: OnchainAskBoundsResult | null = null;
  let latestPrice: { spot?: unknown; forward?: unknown } | null = null;

  try {
    oracleState = await params.server.getOracleState(oracleId);
  } catch (error) {
    warnings.push(`Oracle state unavailable for ${oracleId}: ${translateDeepBookPredictError(error)}`);
  }

  try {
    publicAskBounds = await params.server.getOracleAskBounds(oracleId);
  } catch (error) {
    warnings.push(`Public ask-bounds unavailable for ${oracleId}: ${translateDeepBookPredictError(error)}`);
  }

  try {
    latestPrice = await params.server.getLatestOraclePrice(oracleId);
  } catch (error) {
    warnings.push(`Latest price unavailable for ${oracleId}: ${translateDeepBookPredictError(error)}`);
  }

  onchainAskBounds = await devInspectAskBounds({
    oracleId,
    client: params.client,
    sender: params.sender,
    config: params.config,
  });

  if (onchainAskBounds.status === "unavailable") {
    warnings.push(`Onchain ask-bounds unavailable for ${oracleId}: ${formatAbort(onchainAskBounds.abort)}`);
  }

  const spot = integerStringOrNull(latestPrice?.spot ?? oracleState?.latest_price?.spot);
  const forward = integerStringOrNull(latestPrice?.forward ?? oracleState?.latest_price?.forward);
  let candidates: RangeQuoteCandidate[] = [];

  if (!expiry || !minStrike || !tickSize) {
    blockers.push({
      code: "missing_strike_grid",
      message: "Oracle is missing expiry, min_strike, or tick_size metadata needed for RangeKey candidates.",
    });
  } else if (!spot && !forward) {
    blockers.push({
      code: "missing_price_anchor",
      message: "Oracle is missing live spot/forward price anchors needed for candidate generation.",
    });
  } else {
    candidates = deriveCandidateRanges({
      oracleId,
      oracleObjectId: oracleId,
      underlyingAsset: stringOrNull(params.oracle.underlying_asset),
      expiry,
      minStrike,
      tickSize,
      spot,
      forward,
    });
  }

  return {
    oracleId,
    oracleObjectId: oracleId,
    underlyingAsset: stringOrNull(params.oracle.underlying_asset),
    status: String(params.oracle.status),
    expiry: expiry ?? String(params.oracle.expiry),
    minStrike,
    tickSize,
    spot,
    forward,
    publicAskBounds,
    onchainAskBounds,
    candidates,
    warnings,
    blockers,
  };
}

function compareOracleExpiry(left: DeepBookPredictOracleRecord, right: DeepBookPredictOracleRecord): number {
  const leftExpiry = integerStringOrNull(left.expiry);
  const rightExpiry = integerStringOrNull(right.expiry);

  if (leftExpiry === null && rightExpiry === null) {
    return 0;
  }

  if (leftExpiry === null) {
    return 1;
  }

  if (rightExpiry === null) {
    return -1;
  }

  const leftBigInt = BigInt(leftExpiry);
  const rightBigInt = BigInt(rightExpiry);

  return leftBigInt < rightBigInt ? -1 : leftBigInt > rightBigInt ? 1 : 0;
}

function formatAbort(abort: MintAbortClassification): string {
  const label = [abort.module, abort.function, abort.code].filter(Boolean).join("::");
  const known = abort.constantName ? ` (${abort.constantName})` : "";
  const likelyCause = abort.likelyCause ? ` ${abort.likelyCause}` : "";

  return `${label || "Move abort"}${known}: ${abort.message}${likelyCause}`;
}

function integerStringOrNull(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number" && typeof value !== "bigint") {
    return null;
  }

  try {
    const integer = BigInt(value);
    return integer >= 0n ? integer.toString() : null;
  } catch {
    return null;
  }
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
