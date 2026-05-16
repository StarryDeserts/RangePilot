import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Secp256k1Keypair } from "@mysten/sui/keypairs/secp256k1";
import { Secp256r1Keypair } from "@mysten/sui/keypairs/secp256r1";
import { DEEPBOOK_PREDICT_TESTNET } from "@rangepilot/config/deepbookPredictTestnet";
import {
  RANGE_WIN_CONDITION_COPY,
  buildMintRangeTransaction,
  buildSuiExplorerTransactionUrl,
  createDeepBookPredictServerClient,
  devInspectRangeQuote,
  parseRangeMintedEvent,
} from "@rangepilot/sdk/deepbookPredict";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(repoRoot, ".env.local");
const cachePath = path.join(repoRoot, ".local", "predict-manager-cache.json");
const config = DEEPBOOK_PREDICT_TESTNET;
const verifiedSignerAddress = "0xc558e37d20405a9751c81124ac8d167e2b2d368b834319adafa549449e0715f5";
const verifiedManagerId = "0x6f341e107a87812fd4fddfc4fc50a7e3ab5bc21cabff2cd39dd86b662fa75599";
const maxMintCostAtomic = 5_000_000n;
const quantity = "1";
const forbiddenTargets = ["redeem_range", "::supply", "::withdraw"];

main().catch((error) => {
  console.error("Range validation failed:", sanitizeError(error));
  process.exitCode = 1;
});

async function main() {
  const mode = parseMode(process.argv.slice(2));
  assertTestnetConfig();

  const privateKey = await loadPrivateKeyFromEnvLocal();
  console.log("SUI_PRIVATE_KEY loaded: yes");

  const signer = keypairFromPrivateKey(privateKey);
  const address = signer.toSuiAddress();
  const client = new SuiJsonRpcClient({
    url: getJsonRpcFullnodeUrl("testnet"),
    network: "testnet",
  });
  const server = createDeepBookPredictServerClient({ config });

  console.log(`Mode: ${mode}`);
  console.log(`Signer address: ${address}`);
  console.log(`Network: ${config.network}`);
  console.log(`Public server: ${config.publicServer}`);

  const quoteContext = await buildQuoteContext({ server, client, address });
  printQuoteSummary(quoteContext);

  if (mode === "quote-only") {
    console.log("Quote-only mode: no mint transaction submitted.");
    return;
  }

  if (!quoteContext.gates.passed) {
    console.log("Mint skipped: safety gates did not pass.");
    return;
  }

  printMintWarning(quoteContext);
  const mintTx = buildMintRangeTransaction({
    managerId: quoteContext.managerId,
    oracleId: quoteContext.range.oracleId,
    oracleObjectId: quoteContext.oracleObjectId,
    expiry: quoteContext.range.expiry,
    lowerStrike: quoteContext.range.lowerStrike,
    higherStrike: quoteContext.range.higherStrike,
    quantity,
    config,
    allowRealTestnetMint: true,
  });
  assertNoForbiddenTargets(mintTx, "mint_range");

  const mintResult = await client.signAndExecuteTransaction({
    transaction: mintTx,
    signer,
    options: executionOptions(),
  });
  requireSuccess(mintResult, "mint_range");

  const explorerUrl = buildSuiExplorerTransactionUrl(mintResult.digest, config.network);
  const mintedEvent = parseRangeMintedEvent(mintResult, config);
  const refreshedManagerSummary = await tryRead("manager_summary_after_mint", () =>
    server.getManagerSummary(quoteContext.managerId),
  );
  const refreshedPositionsSummary = await tryRead("positions_summary_after_mint", () =>
    server.getManagerPositionsSummary(quoteContext.managerId),
  );

  console.log("\nMint validation summary");
  console.log("executed: yes");
  console.log(`digest: ${mintResult.digest}`);
  console.log(`explorer: ${explorerUrl}`);
  console.log(`RangeMinted event: ${mintedEvent ? JSON.stringify(eventShape(mintedEvent)) : "not found"}`);
  console.log(`manager summary readback: ${formatReadResult(refreshedManagerSummary)}`);
  console.log(`positions summary readback: ${formatReadResult(refreshedPositionsSummary)}`);
}

async function buildQuoteContext({ server, client, address }) {
  const blockers = [];
  const managerId = await resolveManagerId(address);
  const managerSummary = await server.getManagerSummary(managerId);
  const managerOwner = isRecord(managerSummary) && typeof managerSummary.owner === "string"
    ? managerSummary.owner
    : null;
  const managerBalanceAtomic = findLikelyBalance(managerSummary);

  if (managerOwner !== address) {
    blockers.push(`Manager owner mismatch or unavailable: expected ${address}, got ${managerOwner ?? "unknown"}.`);
  }

  if (managerBalanceAtomic === null) {
    blockers.push("Manager DUSDC balance was not readable from public server summary.");
  }

  const selectedOracle = await server.discoverDefaultOracle();

  if (!selectedOracle) {
    blockers.push("No active unexpired oracle was discovered at runtime.");
  }

  const oracleId = selectedOracle?.oracle_id ?? null;
  const oracleState = oracleId
    ? await tryRead("oracle_state", () => server.getOracleState(oracleId))
    : { kind: "error", source: "oracle_state", message: "No oracle ID available." };
  const askBounds = oracleId
    ? await tryRead("oracle_ask_bounds", () => server.getOracleAskBounds(oracleId))
    : { kind: "error", source: "oracle_ask_bounds", message: "No oracle ID available." };
  const oracleRecord = selectOracleRecord(selectedOracle, oracleState);
  const oracleObjectId = oracleId;
  const activeOracle = oracleRecord
    ? {
        oracleId: oracleRecord.oracle_id,
        oracleObjectId,
        underlyingAsset: stringOrNull(oracleRecord.underlying_asset),
        status: String(oracleRecord.status ?? "unknown"),
        expiry: normalizeIntegerOrNull(oracleRecord.expiry) ?? "",
      }
    : null;

  if (!activeOracle?.oracleId || !activeOracle.oracleObjectId) {
    blockers.push("Runtime oracle ID was not available.");
  }

  if (activeOracle?.status !== "active") {
    blockers.push(`Selected oracle status is not active: ${activeOracle?.status ?? "unknown"}.`);
  }

  if (!activeOracle?.expiry) {
    blockers.push("Selected oracle expiry was not readable.");
  }

  if (askBounds.kind === "error") {
    blockers.push(`Ask-bounds read failed: ${askBounds.message}.`);
  } else if (askBounds.value === null) {
    blockers.push("Ask-bounds returned null; mint eligibility is not confirmed.");
  }

  const strikeGrid = deriveStrikeGrid(oracleRecord);
  const range = strikeGrid && activeOracle
    ? deriveSafeTestRange(activeOracle.oracleId, activeOracle.expiry, strikeGrid)
    : null;

  if (!strikeGrid) {
    blockers.push("Strike grid could not be derived from runtime oracle metadata.");
  }

  if (!range) {
    blockers.push("Safe test range could not be derived.");
  }

  let quote = null;
  let quoteError = null;

  if (range && activeOracle?.oracleObjectId) {
    try {
      quote = await devInspectRangeQuote({
        client,
        sender: address,
        oracleObjectId: activeOracle.oracleObjectId,
        oracleId: range.oracleId,
        expiry: range.expiry,
        lowerStrike: range.lowerStrike,
        higherStrike: range.higherStrike,
        quantity,
        config,
      });
    } catch (error) {
      quoteError = sanitizeError(error);
      blockers.push(`Quote preview failed: ${quoteError}`);
    }
  }

  if (quote) {
    const mintCost = BigInt(quote.mintCostAtomic);

    if (mintCost > maxMintCostAtomic) {
      blockers.push(`Mint cost ${quote.mintCostAtomic} exceeds 5 DUSDC cap.`);
    }

    if (managerBalanceAtomic !== null && BigInt(managerBalanceAtomic) < mintCost) {
      blockers.push(
        `Manager balance ${managerBalanceAtomic} atomic DUSDC is below mint cost ${quote.mintCostAtomic}.`,
      );
    }
  }

  return {
    address,
    managerId,
    managerOwner,
    managerBalanceAtomic,
    managerSummaryKeys: topLevelKeys(managerSummary),
    selectedOracle,
    activeOracle,
    oracleObjectId: activeOracle?.oracleObjectId ?? null,
    oracleState,
    askBounds,
    strikeGrid,
    range,
    quantity,
    quote,
    quoteError,
    gates: {
      passed: blockers.length === 0,
      blockers,
    },
  };
}

function parseMode(args) {
  const allowedModes = new Set(["--quote-only", "--mint"]);

  if (args.length !== 1 || !allowedModes.has(args[0])) {
    throw new Error("Use exactly one mode: --quote-only or --mint.");
  }

  return args[0] === "--mint" ? "mint" : "quote-only";
}

function assertTestnetConfig() {
  if (config.network !== "testnet") {
    throw new Error("DeepBook Predict config is not Sui Testnet; aborting.");
  }
}

async function resolveManagerId(address) {
  const cache = await readManagerCache();
  const cached = cache.testnet?.[address];

  if (typeof cached === "string" && cached.startsWith("0x")) {
    return cached;
  }

  if (address === verifiedSignerAddress) {
    return verifiedManagerId;
  }

  throw new Error("No verified manager ID is available for this signer.");
}

async function readManagerCache() {
  try {
    const contents = await readFile(cachePath, "utf8");
    const parsed = JSON.parse(contents);
    return isRecord(parsed) ? parsed : { testnet: {} };
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") {
      return { testnet: {} };
    }

    throw error;
  }
}

async function loadPrivateKeyFromEnvLocal() {
  const contents = await readFile(envPath, "utf8");
  const parsed = parseEnv(contents);
  const value = parsed.SUI_PRIVATE_KEY?.trim();

  if (!value) {
    throw new Error("SUI_PRIVATE_KEY is not configured in .env.local.");
  }

  return value;
}

function parseEnv(contents) {
  const env = {};

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const equalsIndex = trimmed.indexOf("=");

    if (equalsIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

function keypairFromPrivateKey(privateKey) {
  const decoded = decodeSuiPrivateKey(privateKey);

  switch (decoded.scheme) {
    case "ED25519":
      return Ed25519Keypair.fromSecretKey(decoded.secretKey);
    case "Secp256k1":
      return Secp256k1Keypair.fromSecretKey(decoded.secretKey);
    case "Secp256r1":
      return Secp256r1Keypair.fromSecretKey(decoded.secretKey);
    default:
      throw new Error(`Unsupported Sui private key scheme: ${decoded.scheme}`);
  }
}

function selectOracleRecord(selectedOracle, oracleState) {
  if (oracleState.kind !== "error" && isRecord(oracleState.value.oracle)) {
    return oracleState.value.oracle;
  }

  return selectedOracle;
}

function deriveStrikeGrid(oracle) {
  if (!isRecord(oracle)) {
    return null;
  }

  const minStrike = normalizeIntegerOrNull(oracle.min_strike);
  const tickSize = normalizeIntegerOrNull(oracle.tick_size);

  if (!minStrike || !tickSize || BigInt(tickSize) <= 0n) {
    return null;
  }

  return {
    minStrike,
    tickSize,
    source: "public_server_oracle_metadata",
  };
}

function deriveSafeTestRange(oracleId, expiry, strikeGrid) {
  const lowerStrike = BigInt(strikeGrid.minStrike) + BigInt(strikeGrid.tickSize);
  const higherStrike = lowerStrike + BigInt(strikeGrid.tickSize);

  return {
    oracleId,
    expiry,
    lowerStrike: lowerStrike.toString(),
    higherStrike: higherStrike.toString(),
  };
}

async function tryRead(source, read) {
  try {
    return {
      kind: "ok",
      source,
      value: await read(),
    };
  } catch (error) {
    return {
      kind: "error",
      source,
      message: sanitizeError(error),
    };
  }
}

function executionOptions() {
  return {
    showEffects: true,
    showEvents: true,
    showObjectChanges: true,
    showBalanceChanges: true,
  };
}

function requireSuccess(result, label) {
  const status = result.effects?.status;

  if (status?.status !== "success") {
    throw new Error(`${label} did not succeed: ${status?.error ?? "unknown execution error"}`);
  }
}

function assertNoForbiddenTargets(tx, label) {
  const data = JSON.stringify(tx.getData());
  const found = forbiddenTargets.find((target) => data.includes(target));

  if (found) {
    throw new Error(`${label} transaction contains forbidden target ${found}; aborting before execution.`);
  }
}

function printQuoteSummary(context) {
  console.log("\nRange quote validation");
  console.log(`signer address: ${context.address}`);
  console.log(`manager ID: ${context.managerId}`);
  console.log(`manager owner: ${context.managerOwner ?? "unknown"}`);
  console.log(`manager DUSDC balance: ${context.managerBalanceAtomic ?? "unknown"} atomic`);
  console.log(`manager summary keys: ${context.managerSummaryKeys.join(",") || "none"}`);
  console.log(`active oracle: ${context.activeOracle?.oracleId ?? "none"}`);
  console.log(`oracle object candidate: ${context.oracleObjectId ?? "none"}`);
  console.log(`underlying: ${context.activeOracle?.underlyingAsset ?? "unknown"}`);
  console.log(`expiry: ${context.activeOracle?.expiry ?? "unknown"}`);
  console.log(`strike grid: ${context.strikeGrid ? `${context.strikeGrid.minStrike}/${context.strikeGrid.tickSize} (${context.strikeGrid.source})` : "unavailable"}`);
  console.log(`lower/higher strikes: ${context.range ? `${context.range.lowerStrike}/${context.range.higherStrike}` : "unavailable"}`);
  console.log(`win condition: ${RANGE_WIN_CONDITION_COPY}`);
  console.log(`ask-bounds: ${formatReadResult(context.askBounds)}`);
  console.log(`quote preview: ${context.quote ? `mint=${context.quote.mintCostAtomic} redeem=${context.quote.redeemPayoutAtomic}` : `blocked (${context.quoteError ?? "not attempted"})`}`);
  console.log(`safety gates: ${context.gates.passed ? "passed" : "blocked"}`);

  for (const blocker of context.gates.blockers) {
    console.log(`- ${blocker}`);
  }
}

function printMintWarning(context) {
  console.log("\nREAL SUI TESTNET MINT WARNING");
  console.log("Submitting one predict::mint_range<DUSDC> transaction because all safety gates passed.");
  console.log(`Mint cost: ${context.quote.mintCostAtomic} atomic DUSDC.`);
  console.log("Forbidden actions remain blocked: redeem_range, supply, withdraw, mainnet.");
}

function formatReadResult(result) {
  if (result.kind === "error") {
    return `error (${result.source}: ${result.message})`;
  }

  if (result.value === null) {
    return `${result.source}: null`;
  }

  if (isRecord(result.value) || Array.isArray(result.value)) {
    return `${result.source}: keys=${topLevelKeys(result.value).join(",") || "none"}`;
  }

  return `${result.source}: ${String(result.value)}`;
}

function findLikelyBalance(value) {
  if (!isRecord(value)) {
    return null;
  }

  const matchingQuoteBalance = Array.isArray(value.balances)
    ? value.balances.find((entry) => {
        return (
          isRecord(entry) &&
          typeof entry.quote_asset === "string" &&
          entry.quote_asset.endsWith("::dusdc::DUSDC")
        );
      })
    : null;

  if (matchingQuoteBalance && isRecord(matchingQuoteBalance)) {
    const balance = numericAtomicString(matchingQuoteBalance.balance);

    if (balance !== null) {
      return balance;
    }
  }

  for (const field of ["trading_balance", "account_value", "balance"]) {
    const candidate = numericAtomicString(value[field]);

    if (candidate !== null) {
      return candidate;
    }
  }

  return null;
}

function numericAtomicString(value) {
  if (typeof value === "string" && /^\d+$/.test(value)) {
    return value;
  }

  if (typeof value === "number" && Number.isSafeInteger(value) && value >= 0) {
    return String(value);
  }

  return null;
}

function normalizeIntegerOrNull(value) {
  if (typeof value === "bigint") {
    return value >= 0n ? value.toString() : null;
  }

  if (typeof value === "number" && Number.isSafeInteger(value) && value >= 0) {
    return String(value);
  }

  if (typeof value === "string" && /^\d+$/.test(value)) {
    return BigInt(value).toString();
  }

  return null;
}

function stringOrNull(value) {
  return typeof value === "string" ? value : null;
}

function topLevelKeys(value) {
  if (!isRecord(value) && !Array.isArray(value)) {
    return [];
  }

  return Object.keys(value).slice(0, 24);
}

function eventShape(event) {
  return {
    type: event.type,
    parsedJsonKeys: event.parsedJson ? Object.keys(event.parsedJson).slice(0, 24) : [],
  };
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitizeError(error) {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/suiprivkey1[0-9a-z]+/gi, "[redacted-sui-private-key]");
}
