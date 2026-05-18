import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import { Transaction } from "@mysten/sui/transactions";
import { DEEPBOOK_PREDICT_TESTNET } from "@rangepilot/config/deepbookPredictTestnet";
import {
  buildMarketKeyTransactionArgument,
  classifyMintAbort,
  createDeepBookPredictServerClient,
  deriveMarketQuoteCandidates,
  extractManagerDusdcBalanceAtomic,
  inspectDevInspectU64,
  scanBinaryQuoteSanity,
  summarizeDevInspectU64Diagnostic,
} from "@rangepilot/sdk/deepbookPredict";

const config = DEEPBOOK_PREDICT_TESTNET;
const clockObjectId = "0x6";
const defaultReadOnlySender = "0xc558e37d20405a9751c81124ac8d167e2b2d368b834319adafa549449e0715f5";
const maxOracleContexts = 2;
const readModeQuantities = ["1000", "10000", "100000"];
const maxCandidatesPerOracle = 18;
const forbiddenPreflightMoveCalls = [
  "predict::mint_range",
  "predict::redeem_range",
  "predict::redeem",
  "predict::redeem_permissionless",
  "predict::supply",
  "predict::withdraw",
  "predict::create_manager",
  "predict_manager::deposit",
  "strategy::follow_strategy_and_mint",
  "strategy::create_protocol_vault",
];
const forbiddenCommandKinds = [
  "Publish",
  "TransferObjects",
  "SplitCoins",
  "MergeCoins",
  "Upgrade",
];

main().catch((error) => {
  console.error("DeepVol binary leg validation failed:", sanitizeError(error));
  process.exitCode = 1;
});

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const mode = parseMode(options);
  assertTestnetConfig();

  const client = new SuiJsonRpcClient({
    url: getJsonRpcFullnodeUrl("testnet"),
    network: "testnet",
  });
  const server = createDeepBookPredictServerClient({ config });
  const sender = options.sender ?? defaultReadOnlySender;

  printSafetyHeader(mode, sender);

  const readResult = await runReadMode({
    client,
    server,
    sender,
    managerId: options.manager,
  });

  if (mode === "read") {
    return;
  }

  await runPreflightMode({
    client,
    server,
    readResult,
    sender: options.sender ?? null,
    managerId: options.manager ?? null,
  });
}

async function runReadMode({ client, server, sender, managerId }) {
  const contexts = await loadActiveBtcOracleContexts(server);
  const candidates = contexts.flatMap((context) => context.candidates);
  const { attempts, pair } = await scanForMovePair({ contexts, client, sender });
  const blockers = buildReadBlockers({ contexts, candidates, pair });
  const readback = pair && managerId
    ? await readBinaryPositions({ client, sender, managerId, pair })
    : null;

  printReadSummary({ contexts, candidates, attempts, pair, readback, blockers, managerId });

  return { contexts, candidates, attempts, pair, blockers, readback };
}

async function runPreflightMode({ client, server, readResult, sender, managerId }) {
  const blockers = [];

  if (!sender) {
    blockers.push("Preflight mode requires --sender <address>; no default sender is used for mint preflight.");
  }

  if (!managerId) {
    blockers.push("Preflight mode requires --manager <object-id>; no manager is guessed.");
  }

  if (!readResult.pair) {
    blockers.push("Preflight skipped because read mode did not select a nonzero UP/DOWN pair.");
  }

  let managerSummary = null;
  let managerBalanceAtomic = null;

  if (sender && managerId) {
    managerSummary = await tryRead("manager summary", () => server.getManagerSummary(managerId));
    const owner = stringOrNull(managerSummary.value?.owner);
    managerBalanceAtomic = managerSummary.status === "success"
      ? extractManagerDusdcBalanceAtomic(managerSummary.value)
      : null;

    if (owner && owner.toLowerCase() !== sender.toLowerCase()) {
      blockers.push(`Manager owner mismatch: expected ${sender}, got ${owner}.`);
    }

    if (readResult.pair && managerBalanceAtomic !== null && BigInt(managerBalanceAtomic) < BigInt(readResult.pair.totalPremiumAtomic)) {
      blockers.push(`Manager DUSDC balance ${managerBalanceAtomic} is below total premium ${readResult.pair.totalPremiumAtomic}.`);
    }
  }

  console.log("\nTwo-leg binary mint preflight");
  console.log(`sender: ${sender ?? "required"}`);
  console.log(`manager: ${managerId ?? "required"}`);
  console.log(`manager summary: ${managerSummary ? formatReadResult(managerSummary) : "skipped"}`);
  console.log(`manager DUSDC balance: ${managerBalanceAtomic ?? "unavailable"}`);

  if (blockers.length > 0) {
    console.log("two-leg PTB preflight: blocked");
    printBlockers(blockers);
    console.log("No write transactions submitted.");
    return;
  }

  const transactionBlock = buildTwoLegMintPreflightTransaction({
    pair: readResult.pair,
    managerId,
  });
  assertExpectedTwoLegPreflightTransaction(transactionBlock);

  const result = await client.devInspectTransactionBlock({
    sender,
    transactionBlock,
  });
  const status = devInspectStatus(result);

  console.log(`two-leg PTB preflight: ${status === "success" ? "passed" : "blocked"}`);

  if (status !== "success") {
    const abort = classifyMintAbort(devInspectError(result));
    console.log(`preflight abort: ${formatAbort(abort)}`);
  }

  console.log("No write transactions submitted.");
}

function buildTwoLegMintPreflightTransaction({ pair, managerId }) {
  const tx = new Transaction();
  const upKey = buildMarketKeyTransactionArgument(tx, pair.up.marketKey, config);

  tx.moveCall({
    target: `${config.packageId}::predict::mint`,
    typeArguments: [config.quoteAssets.DUSDC.coinType],
    arguments: [
      tx.object(config.predictId),
      tx.object(managerId),
      tx.object(pair.oracleObjectId),
      upKey,
      tx.pure.u64(pair.quantity),
      tx.object(clockObjectId),
    ],
  });

  const downKey = buildMarketKeyTransactionArgument(tx, pair.down.marketKey, config);

  tx.moveCall({
    target: `${config.packageId}::predict::mint`,
    typeArguments: [config.quoteAssets.DUSDC.coinType],
    arguments: [
      tx.object(config.predictId),
      tx.object(managerId),
      tx.object(pair.oracleObjectId),
      downKey,
      tx.pure.u64(pair.quantity),
      tx.object(clockObjectId),
    ],
  });

  return tx;
}

function buildManagerBinaryPositionTransaction({ managerId, marketKey }) {
  const tx = new Transaction();
  const key = buildMarketKeyTransactionArgument(tx, marketKey, config);

  tx.moveCall({
    target: `${config.packageId}::predict_manager::position`,
    arguments: [tx.object(managerId), key],
  });

  return tx;
}

async function readBinaryPositions({ client, sender, managerId, pair }) {
  const up = await readBinaryPosition({
    client,
    sender,
    managerId,
    label: "UP",
    marketKey: pair.up.marketKey,
  });
  const down = await readBinaryPosition({
    client,
    sender,
    managerId,
    label: "DOWN",
    marketKey: pair.down.marketKey,
  });

  return { up, down };
}

async function readBinaryPosition({ client, sender, managerId, label, marketKey }) {
  try {
    const transactionBlock = buildManagerBinaryPositionTransaction({ managerId, marketKey });
    assertReadbackTransaction(transactionBlock);
    const result = await client.devInspectTransactionBlock({ sender, transactionBlock });

    if (devInspectStatus(result) !== "success") {
      return {
        label,
        status: "blocked",
        quantity: null,
        blocker: devInspectError(result),
      };
    }

    const diagnostic = inspectDevInspectU64(result);

    if (!diagnostic.decoded) {
      return {
        label,
        status: "blocked",
        quantity: null,
        blocker: `position return did not decode to one u64: ${summarizeDevInspectU64Diagnostic(diagnostic)}`,
      };
    }

    return {
      label,
      status: "success",
      quantity: diagnostic.decoded,
      blocker: null,
    };
  } catch (error) {
    return {
      label,
      status: "blocked",
      quantity: null,
      blocker: sanitizeError(error),
    };
  }
}

async function loadActiveBtcOracleContexts(server) {
  const oracles = await server.getOracles(config.predictId);
  const nowMs = BigInt(Date.now());
  const active = oracles
    .filter((oracle) => oracle.status === "active")
    .filter((oracle) => stringOrNull(oracle.underlying_asset) === "BTC")
    .filter((oracle) => {
      const expiry = integerStringOrNull(oracle.expiry);
      return expiry !== null && BigInt(expiry) > nowMs;
    })
    .sort((left, right) => compareIntegerStrings(left.expiry, right.expiry))
    .slice(0, maxOracleContexts);
  const contexts = [];

  for (const oracle of active) {
    const oracleId = stringOrNull(oracle.oracle_id);
    const oracleState = oracleId ? await tryRead("oracle state", () => server.getOracleState(oracleId)) : null;
    const oracleRecord = isRecord(oracleState?.value?.oracle) ? oracleState.value.oracle : oracle;
    const latestPrice = isRecord(oracleState?.value?.latest_price) ? oracleState.value.latest_price : null;
    contexts.push(buildOracleContext(oracleRecord, latestPrice));
  }

  return contexts;
}

function buildOracleContext(oracleRecord, latestPrice) {
  const blockers = [];
  const oracleId = stringOrNull(oracleRecord?.oracle_id);
  const expiry = integerStringOrNull(oracleRecord?.expiry);
  const minStrike = integerStringOrNull(oracleRecord?.min_strike);
  const tickSize = integerStringOrNull(oracleRecord?.tick_size);
  const spot = integerStringOrNull(latestPrice?.spot);
  const forward = integerStringOrNull(latestPrice?.forward);
  const underlyingAsset = stringOrNull(oracleRecord?.underlying_asset);

  if (!oracleId) {
    blockers.push("Oracle ID unavailable.");
  }

  if (!expiry) {
    blockers.push("Expiry unavailable.");
  }

  if (!minStrike || !tickSize) {
    blockers.push("Strike grid unavailable.");
  }

  if (!spot && !forward) {
    blockers.push("Latest spot/forward unavailable; scanner cannot derive binary strikes.");
  }

  const candidates = oracleId && expiry && minStrike && tickSize && (spot || forward)
    ? deriveMarketQuoteCandidates({
        oracleId,
        oracleObjectId: oracleId,
        underlyingAsset,
        expiry,
        minStrike,
        tickSize,
        spot,
        forward,
      })
    : [];

  return {
    oracleId: oracleId ?? "unknown",
    oracleObjectId: oracleId ?? "unknown",
    underlyingAsset,
    status: stringOrNull(oracleRecord?.status) ?? "unknown",
    expiry: expiry ?? "unknown",
    minStrike: minStrike ?? "unknown",
    tickSize: tickSize ?? "unknown",
    spot,
    forward,
    blockers,
    candidates,
  };
}

async function scanForMovePair({ contexts, client, sender }) {
  const attempts = [];

  for (const context of contexts) {
    const candidates = rankBinaryCandidates(context.candidates).slice(0, maxCandidatesPerOracle);

    for (const quantity of readModeQuantities) {
      const batchAttempts = await scanBinaryQuoteSanity({
        candidates,
        client,
        sender,
        quantities: [quantity],
        config,
      });
      attempts.push(...batchAttempts);

      const pair = selectMovePair(attempts);
      if (pair) {
        return { attempts, pair };
      }
    }
  }

  return { attempts, pair: null };
}

function rankBinaryCandidates(candidates) {
  return [...candidates].sort((left, right) => {
    const anchorDelta = compareBigInt(
      absoluteDistance(BigInt(left.strike), BigInt(left.anchorPrice)),
      absoluteDistance(BigInt(right.strike), BigInt(right.anchorPrice)),
    );

    if (anchorDelta !== 0) {
      return anchorDelta;
    }

    if (left.anchorSource !== right.anchorSource) {
      return left.anchorSource === "forward" ? -1 : 1;
    }

    if (left.strike !== right.strike) {
      return compareBigInt(BigInt(left.strike), BigInt(right.strike));
    }

    return left.direction === right.direction ? 0 : left.direction === "down" ? -1 : 1;
  });
}

function absoluteDistance(left, right) {
  return left >= right ? left - right : right - left;
}

function selectMovePair(attempts) {
  const successes = attempts.filter((attempt) => attempt.status === "success" && BigInt(attempt.mintCostAtomic) > 0n);
  const pairs = [];

  for (const down of successes.filter((attempt) => attempt.direction === "down")) {
    for (const up of successes.filter((attempt) => attempt.direction === "up")) {
      if (down.oracleId !== up.oracleId || down.expiry !== up.expiry || down.quantity !== up.quantity) {
        continue;
      }

      if (BigInt(down.strike) >= BigInt(up.strike)) {
        continue;
      }

      const totalPremiumAtomic = (BigInt(up.mintCostAtomic) + BigInt(down.mintCostAtomic)).toString();
      pairs.push({
        product: "BTC_MOVE",
        oracleId: up.oracleId,
        oracleObjectId: up.oracleObjectId,
        expiry: up.expiry,
        lowerStrike: down.strike,
        upperStrike: up.strike,
        quantity: up.quantity,
        up: {
          side: "UP",
          marketKey: {
            oracleId: up.oracleId,
            expiry: up.expiry,
            strike: up.strike,
            direction: "up",
          },
          quote: up,
        },
        down: {
          side: "DOWN",
          marketKey: {
            oracleId: down.oracleId,
            expiry: down.expiry,
            strike: down.strike,
            direction: "down",
          },
          quote: down,
        },
        totalPremiumAtomic,
      });
    }
  }

  return pairs.sort(compareMovePairs)[0] ?? null;
}

function compareMovePairs(left, right) {
  const quantityDelta = compareBigInt(BigInt(left.quantity), BigInt(right.quantity));

  if (quantityDelta !== 0) {
    return quantityDelta;
  }

  const premiumDelta = compareBigInt(BigInt(left.totalPremiumAtomic), BigInt(right.totalPremiumAtomic));

  if (premiumDelta !== 0) {
    return premiumDelta;
  }

  const widthDelta = compareBigInt(
    BigInt(left.upperStrike) - BigInt(left.lowerStrike),
    BigInt(right.upperStrike) - BigInt(right.lowerStrike),
  );

  return widthDelta;
}

function buildReadBlockers({ contexts, candidates, pair }) {
  const blockers = [];

  if (contexts.length === 0) {
    blockers.push("No active unexpired BTC oracle was discovered at runtime.");
  }

  if (candidates.length === 0) {
    blockers.push("No binary MarketKey candidates could be derived from runtime BTC oracle metadata.");
  }

  if (!pair) {
    blockers.push("No same-oracle same-expiry UP/DOWN pair had lower < upper and nonzero mint costs for a shared quantity.");
  }

  for (const context of contexts) {
    for (const blocker of context.blockers) {
      blockers.push(`${context.oracleId}: ${blocker}`);
    }
  }

  return blockers;
}

function printSafetyHeader(mode, sender) {
  console.log(`Mode: deepvol-binary-${mode}`);
  console.log(`Network: ${config.network}`);
  console.log(`Public server: ${config.publicServer}`);
  console.log(`DevInspect sender: ${sender}`);
  console.log("No private key loaded.");
  console.log("No .env.local read.");
  console.log("No write transactions submitted.");
}

function printReadSummary({ contexts, candidates, attempts, pair, readback, blockers, managerId }) {
  const successes = attempts.filter((attempt) => attempt.status === "success");
  const nonzeroSuccesses = successes.filter((attempt) => BigInt(attempt.mintCostAtomic) > 0n);

  console.log("\nActive BTC oracle scan");
  console.log(`oracles scanned: ${contexts.length}`);
  for (const context of contexts) {
    console.log(`- oracle=${context.oracleId} underlying=${context.underlyingAsset ?? "unknown"} expiry=${context.expiry} spot=${context.spot ?? "unknown"} forward=${context.forward ?? "unknown"} candidates=${context.candidates.length}`);
  }

  console.log("\nBinary quote scan");
  console.log(`quantities tested: ${readModeQuantities.join(",")}`);
  console.log(`max candidates per oracle: ${maxCandidatesPerOracle}`);
  console.log(`candidates available: ${candidates.length}`);
  console.log(`attempts: ${attempts.length}`);
  console.log(`successes: ${successes.length}`);
  console.log(`nonzero successes: ${nonzeroSuccesses.length}`);
  printFailureSummary(attempts);

  console.log("\nSelected BTC MOVE pair");
  if (!pair) {
    console.log("status: blocked");
    printBlockers(blockers);
    return;
  }

  console.log("status: passed");
  console.log(`selected BTC oracle: ${pair.oracleId}`);
  console.log(`selected expiry: ${pair.expiry}`);
  console.log(`selected lower / upper strikes: ${pair.lowerStrike} / ${pair.upperStrike}`);
  console.log(`quantity: ${pair.quantity}`);
  console.log(`UP MarketKey: oracle=${pair.up.marketKey.oracleId} expiry=${pair.up.marketKey.expiry} strike=${pair.up.marketKey.strike} direction=${pair.up.marketKey.direction} constructor=market_key::up`);
  console.log(`DOWN MarketKey: oracle=${pair.down.marketKey.oracleId} expiry=${pair.down.marketKey.expiry} strike=${pair.down.marketKey.strike} direction=${pair.down.marketKey.direction} constructor=market_key::down`);
  console.log(`UP quote: mint=${pair.up.quote.mintCostAtomic} redeem=${pair.up.quote.redeemPayoutAtomic}`);
  console.log(`DOWN quote: mint=${pair.down.quote.mintCostAtomic} redeem=${pair.down.quote.redeemPayoutAtomic}`);
  console.log(`total premium: ${pair.totalPremiumAtomic}`);

  if (!managerId) {
    console.log("readback: skipped; pass --sender and --manager to read predict_manager::position.");
    return;
  }

  console.log("\nBinary position readback");
  console.log(`manager: ${managerId}`);
  printPositionReadback("UP", readback?.up ?? null);
  printPositionReadback("DOWN", readback?.down ?? null);
}

function printFailureSummary(attempts) {
  const failures = attempts.filter((attempt) => attempt.status === "failure");
  const groups = new Map();

  for (const failure of failures) {
    const key = `${failure.abort.module ?? "unknown"}::${failure.abort.function ?? "unknown"}::${failure.abort.code ?? "unknown"}`;
    groups.set(key, (groups.get(key) ?? 0) + 1);
  }

  if (groups.size === 0) {
    console.log("failure summary: none");
    return;
  }

  console.log("failure summary:");
  for (const [key, count] of [...groups.entries()].sort((left, right) => right[1] - left[1])) {
    console.log(`- ${key}: ${count}`);
  }
}

function printPositionReadback(label, result) {
  if (!result) {
    console.log(`${label} position: unavailable`);
    return;
  }

  if (result.status === "success") {
    console.log(`${label} position: quantity=${result.quantity}`);
    return;
  }

  console.log(`${label} position: blocked ${result.blocker}`);
}

function printBlockers(blockers) {
  for (const blocker of blockers) {
    console.log(`blocker: ${blocker}`);
  }
}

function assertReadbackTransaction(tx) {
  const moveCalls = getMoveCalls(tx);
  const forbidden = moveCalls.filter((call) => {
    const moduleName = String(call.module ?? "");
    const functionName = String(call.function ?? "");
    return moduleName !== "market_key" && !(moduleName === "predict_manager" && functionName === "position");
  });

  if (forbidden.length > 0) {
    throw new Error(`Binary position readback transaction contains unexpected Move call(s): ${formatMoveCalls(forbidden)}.`);
  }
}

function assertExpectedTwoLegPreflightTransaction(tx) {
  const data = tx.getData();
  const commands = Array.isArray(data.commands) ? data.commands : [];
  const commandKinds = commands.map((command) => command.$kind).filter((kind) => typeof kind === "string");
  const blockedKinds = commandKinds.filter((kind) => forbiddenCommandKinds.includes(kind));

  if (blockedKinds.length > 0) {
    throw new Error(`Two-leg preflight transaction contains forbidden command(s): ${blockedKinds.join(", ")}.`);
  }

  const moveCalls = getMoveCalls(tx);
  const forbidden = moveCalls.filter((call) => {
    const target = `${String(call.module ?? "")}::${String(call.function ?? "")}`;
    return forbiddenPreflightMoveCalls.includes(target);
  });

  if (forbidden.length > 0) {
    throw new Error(`Two-leg preflight transaction contains forbidden Move call(s): ${formatMoveCalls(forbidden)}.`);
  }

  const mintCalls = moveCalls.filter((call) => String(call.module) === "predict" && String(call.function) === "mint");

  if (mintCalls.length !== 2) {
    throw new Error(`Two-leg preflight transaction must contain exactly two predict::mint calls; found ${mintCalls.length}.`);
  }
}

function getMoveCalls(tx) {
  const data = tx.getData();
  const commands = Array.isArray(data.commands) ? data.commands : [];

  return commands
    .map((command) => command.MoveCall)
    .filter(isRecord);
}

function formatMoveCalls(calls) {
  return calls.map((call) => `${String(call.module ?? "unknown")}::${String(call.function ?? "unknown")}`).join(", ");
}

function devInspectStatus(result) {
  if (isRecord(result) && typeof result.error === "string") {
    return "failure";
  }

  const status = isRecord(result) && isRecord(result.effects) && isRecord(result.effects.status)
    ? result.effects.status
    : null;

  return status?.status === "success" ? "success" : "failure";
}

function devInspectError(result) {
  if (isRecord(result) && typeof result.error === "string") {
    return result.error;
  }

  const status = isRecord(result) && isRecord(result.effects) && isRecord(result.effects.status)
    ? result.effects.status
    : null;

  return typeof status?.error === "string" ? status.error : "devInspect did not return success.";
}

async function tryRead(source, read) {
  try {
    return { source, status: "success", value: await read() };
  } catch (error) {
    return { source, status: "error", value: null, error: sanitizeError(error) };
  }
}

function formatReadResult(result) {
  if (result.status === "error") {
    return `error=${result.error}`;
  }

  if (Array.isArray(result.value)) {
    return `success count=${result.value.length}`;
  }

  return "success";
}

function parseMode(options) {
  if (options.read) {
    return "read";
  }

  if (options.preflight) {
    return "preflight";
  }

  if (options.mode === "read" || options.mode === "preflight") {
    return options.mode;
  }

  throw new Error("Usage: node scripts/validate-deepvol-binary-legs.mjs --mode read|preflight [--sender <address>] [--manager <object-id>]");
}

function parseArgs(args) {
  const options = {};

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (!arg.startsWith("--")) {
      continue;
    }

    if (arg.includes("=")) {
      const [key, value] = arg.slice(2).split(/=(.*)/s, 2);
      options[key] = value;
      continue;
    }

    const key = arg.slice(2);
    const value = args[index + 1];

    if (!value || value.startsWith("--")) {
      options[key] = true;
      continue;
    }

    options[key] = value;
    index += 1;
  }

  return options;
}

function assertTestnetConfig() {
  if (config.network !== "testnet" || !config.publicServer.includes("testnet")) {
    throw new Error("DeepVol binary validation is only allowed against Sui Testnet config.");
  }
}

function formatAbort(abort) {
  return `${abort.module ?? "unknown"}::${abort.function ?? "unknown"} code=${abort.code ?? "unknown"} reason=${abort.knownReason ?? "unknown"} message=${abort.message}`;
}

function compareIntegerStrings(left, right) {
  const leftValue = integerStringOrNull(left);
  const rightValue = integerStringOrNull(right);

  if (leftValue === null && rightValue === null) {
    return 0;
  }

  if (leftValue === null) {
    return 1;
  }

  if (rightValue === null) {
    return -1;
  }

  return compareBigInt(BigInt(leftValue), BigInt(rightValue));
}

function compareBigInt(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function integerStringOrNull(value) {
  if (typeof value === "bigint") {
    return value >= 0n ? value.toString() : null;
  }

  if (typeof value === "number") {
    return Number.isSafeInteger(value) && value >= 0 ? String(value) : null;
  }

  if (typeof value === "string" && /^\d+$/.test(value)) {
    return value;
  }

  return null;
}

function stringOrNull(value) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitizeError(error) {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/0x[0-9a-fA-F]{96,}/g, "[REDACTED_LONG_HEX]");
}
