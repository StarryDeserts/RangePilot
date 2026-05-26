import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sdkSource = readFileSync("../../packages/sdk/src/deepbookPredict/primitiveMintability.ts", "utf8");
const rangeKeySource = readFileSync("../../packages/sdk/src/deepbookPredict/rangeKey.ts", "utf8");
const quoteSource = readFileSync("../../packages/sdk/src/deepbookPredict/quote.ts", "utf8");
const tradeSource = readFileSync("../../packages/sdk/src/deepbookPredict/trade.ts", "utf8");
const errorsSource = readFileSync("../../packages/sdk/src/deepbookPredict/errors.ts", "utf8");
const typesSource = readFileSync("../../packages/types/src/deepbookPredict.ts", "utf8");
const cacheSource = readFileSync("src/lib/primitiveMintability.ts", "utf8");
const hookSource = readFileSync("src/hooks/usePrimitiveMintableRange.ts", "utf8");
const gateSource = readFileSync("src/hooks/primitiveQuoteGate.ts", "utf8");
const executionSource = readFileSync("src/hooks/usePrimitiveWalletExecution.ts", "utf8");
const routeSource = readFileSync("src/routes/PrimitiveQuotePage.tsx", "utf8");

// --- SDK assertions ---

assert.ok(
  sdkSource.includes("findMintableRangePrimitiveCandidate"),
  "SDK must export findMintableRangePrimitiveCandidate",
);
assert.ok(
  sdkSource.includes("devInspectRangeQuote"),
  "SDK range candidate search must use devInspectRangeQuote",
);
assert.ok(
  sdkSource.includes("devInspectMintRangePreflight"),
  "SDK range candidate search must use devInspectMintRangePreflight",
);
assert.ok(
  sdkSource.includes("roundUpToTick"),
  "SDK must define roundUpToTick for range interval alignment",
);
assert.ok(
  sdkSource.includes('"centered"'),
  'SDK range candidate search must support "centered" strategy',
);
assert.ok(
  sdkSource.includes('"below-anchor"'),
  'SDK range candidate search must support "below-anchor" strategy',
);
assert.ok(
  sdkSource.includes('"above-anchor"'),
  'SDK range candidate search must support "above-anchor" strategy',
);
assert.ok(
  sdkSource.includes('family: "range"'),
  'SDK range candidate search must tag candidateParams with family: "range"',
);

// --- RANGE source confirmation assertions ---

assert.ok(
  rangeKeySource.includes("::range_key::new"),
  "RANGE key builder must call deepbook_predict::range_key::new",
);
assert.ok(
  !rangeKeySource.includes("market_key::range"),
  "RANGE key builder must not use a non-existent market_key::range path",
);
{
  const oracleIndex = rangeKeySource.indexOf("tx.pure.id(normalized.oracleId)");
  const expiryIndex = rangeKeySource.indexOf("tx.pure.u64(normalized.expiry)");
  const lowerIndex = rangeKeySource.indexOf("tx.pure.u64(normalized.lowerStrike)");
  const higherIndex = rangeKeySource.indexOf("tx.pure.u64(normalized.higherStrike)");

  assert.ok(oracleIndex !== -1, "RANGE key builder must pass oracleId first");
  assert.ok(expiryIndex > oracleIndex, "RANGE key builder must pass expiry after oracleId");
  assert.ok(lowerIndex > expiryIndex, "RANGE key builder must pass lowerStrike after expiry");
  assert.ok(higherIndex > lowerIndex, "RANGE key builder must pass higherStrike after lowerStrike");
}
assert.ok(
  quoteSource.includes("::predict::get_range_trade_amounts"),
  "RANGE quote helper must call predict::get_range_trade_amounts",
);
assert.ok(
  tradeSource.includes("::predict::mint_range"),
  "RANGE mint builder must call predict::mint_range",
);
assert.ok(
  tradeSource.includes("::predict::mint`") || tradeSource.includes("::predict::mint"),
  "UP/DOWN mint builder must still call predict::mint",
);
assert.ok(
  tradeSource.includes("allowRealTestnetMint: true"),
  "RANGE preflight path must build mint_range transactions only through explicit Testnet devInspect gating",
);

for (const expected of [
  "buildRangeMintabilitySummary",
  "classifyRangeMintabilityFailure",
  "summarizeRangeMintabilityError",
  "totalCandidates",
  "quotedCandidates",
  "preflightPassedCandidates",
  "failureCountsByFamily",
  "firstFewFailures",
  "lastFailure",
  "quoteStatus",
  "preflightStatus",
  "failureFamily",
  "rawErrorSummary",
]) {
  assert.ok(sdkSource.includes(expected), `SDK must emit RANGE diagnostic field ${expected}`);
}

// --- Error mapping assertions ---

assert.ok(
  errorsSource.includes("RANGE_PRIMITIVE_NOT_MINTABLE_MESSAGE"),
  "errors.ts must define RANGE_PRIMITIVE_NOT_MINTABLE_MESSAGE",
);
assert.ok(
  errorsSource.includes("formatRangePrimitiveMintabilityError"),
  "errors.ts must export formatRangePrimitiveMintabilityError",
);
assert.ok(
  errorsSource.includes('"btc_move" | "primitive" | "range"'),
  "translateDeepBookPredictError must accept context parameter with family including range",
);
assert.ok(
  errorsSource.includes('context?.family === "range"'),
  "translateDeepBookPredictError must check for range family context",
);
assert.ok(
  errorsSource.includes("Selected strike is not mintable"),
  "UP/DOWN primitive mintability message must still exist (regression check)",
);
assert.ok(
  errorsSource.includes("Selected BTC MOVE range is not mintable"),
  "BTC MOVE mintability message must still exist (regression check)",
);
assert.ok(
  errorsSource.includes("RANGE transaction builder could not construct a valid Predict range key."),
  "RANGE key builder failures must have dedicated user-safe copy",
);
assert.ok(
  errorsSource.includes("RANGE quote failed for all candidate intervals."),
  "RANGE all-quote-failed diagnostics must have dedicated user-safe copy",
);

// --- Types assertions ---

assert.ok(
  typesSource.includes("RangePrimitiveMintableCandidate"),
  "types must define RangePrimitiveMintableCandidate",
);
assert.ok(
  typesSource.includes("RangePrimitiveMintabilityBlocker"),
  "types must define RangePrimitiveMintabilityBlocker",
);
assert.ok(
  typesSource.includes("RangePrimitiveMintableAttempt"),
  "types must define RangePrimitiveMintableAttempt",
);
assert.ok(
  typesSource.includes("FindMintableRangePrimitiveCandidateOptions"),
  "types must define FindMintableRangePrimitiveCandidateOptions",
);
assert.ok(
  typesSource.includes("FindMintableRangePrimitiveCandidateResult"),
  "types must define FindMintableRangePrimitiveCandidateResult",
);

for (const expected of [
  "RangePrimitiveMintabilityFailureFamily",
  "RangePrimitiveMintabilityStepStatus",
  "RangePrimitiveMintableCandidateDiagnostic",
  "RangePrimitiveMintabilitySummary",
  "totalCandidates",
  "quotedCandidates",
  "preflightPassedCandidates",
  "failureCountsByFamily",
  "firstFewFailures",
  "lastFailure",
  "quoteStatus",
  "preflightStatus",
  "failureFamily",
  "rawErrorSummary",
  "widthMultiplier",
]) {
  assert.ok(typesSource.includes(expected), `types must define RANGE diagnostic field ${expected}`);
}

// --- Cache assertions ---

assert.ok(
  cacheSource.includes("buildRangePrimitiveMintabilityKey"),
  "cache must export buildRangePrimitiveMintabilityKey",
);
assert.ok(
  cacheSource.includes("classifyRangePrimitiveMintability"),
  "cache must export classifyRangePrimitiveMintability",
);
assert.ok(
  cacheSource.includes("recordRangePrimitiveMintabilityPass"),
  "cache must export recordRangePrimitiveMintabilityPass",
);
assert.ok(
  cacheSource.includes("clearRangePrimitiveMintabilityRecord"),
  "cache must export clearRangePrimitiveMintabilityRecord",
);
assert.ok(
  cacheSource.includes('"RANGE"'),
  'cache RANGE key builder must use "RANGE" prefix',
);

{
  const ttlMatches = cacheSource.match(/5 \* 60 \* 1000/g);
  assert.ok(
    ttlMatches && ttlMatches.length === 1,
    "cache must have exactly one 5-min TTL constant (not duplicated for RANGE)",
  );
}

// --- Hook assertions ---

assert.ok(
  hookSource.includes("usePrimitiveMintableRange"),
  "hook must be named usePrimitiveMintableRange",
);
assert.ok(
  hookSource.includes("findMintableRangePrimitiveCandidate"),
  "hook must call findMintableRangePrimitiveCandidate",
);
assert.ok(
  hookSource.includes("recordRangePrimitiveMintabilityPass"),
  "hook must cache passed results",
);
assert.ok(
  hookSource.includes("clearRangePrimitiveMintabilityRecord"),
  "hook invalidate must clear cache",
);
assert.ok(
  !hookSource.includes("RANGE mintability search is not available yet."),
  "RANGE mintability hook must not contain old blocker message",
);
assert.ok(
  hookSource.includes("diagnosticSummary"),
  "RANGE mintability hook must expose diagnosticSummary",
);
assert.ok(
  hookSource.includes("candidateDiagnostics"),
  "RANGE mintability hook must expose candidateDiagnostics",
);
assert.ok(
  hookSource.includes("resetValidationScopeKey"),
  "RANGE mintability hook must reset stale validation when input scope changes",
);

// --- UI assertions ---

assert.ok(
  routeSource.includes("usePrimitiveMintableRange"),
  "PrimitiveQuotePage must use usePrimitiveMintableRange hook",
);
assert.ok(
  routeSource.includes("Regenerate mintable RANGE interval"),
  "PrimitiveQuotePage must have Regenerate mintable RANGE interval button",
);
assert.ok(
  routeSource.includes("mintableRange.invalidate()"),
  "PrimitiveQuotePage must invalidate RANGE mintability on manual strike edit",
);
assert.ok(
  routeSource.includes("rangeMintabilityStatus: mintableRange.status"),
  "PrimitiveQuotePage must pass rangeMintabilityStatus to execution hook",
);
assert.ok(
  routeSource.includes("does not create a DeepVol MoveReceipt"),
  "RANGE primitive copy must say no MoveReceipt",
);
assert.ok(
  routeSource.includes("wins if BTC expires inside the selected interval"),
  "RANGE primitive copy must describe RANGE win condition",
);
for (const expected of [
  "Tried",
  "quoted successfully",
  "preflight passed",
  "Most common reason",
  "Advanced RANGE diagnostics",
  "candidateDiagnostics",
]) {
  assert.ok(routeSource.includes(expected), `RANGE UI must render diagnostics copy: ${expected}`);
}

// --- Gate assertions ---

assert.ok(
  gateSource.includes("rangeMintabilityStatus"),
  "execution gate must accept rangeMintabilityStatus field",
);
assert.ok(
  gateSource.includes('"Validate a mintable RANGE interval before buying."'),
  "RANGE execution must require interval validation",
);
assert.ok(
  gateSource.includes('Validate a mintable ${input.primitiveKind} strike before buying.'),
  "UP/DOWN execution must require mintability validation (unchanged)",
);

// --- Wallet execution assertions ---

assert.ok(
  executionSource.includes("buildMintRangeTransaction"),
  "RANGE execution path must use buildMintRangeTransaction",
);
assert.ok(
  executionSource.includes("readRangePositionQuantity"),
  "RANGE execution path must verify position via readRangePositionQuantity",
);
assert.ok(
  executionSource.includes("devInspectRangeQuote"),
  "RANGE execution path must run fresh range quote",
);
assert.ok(
  executionSource.includes("devInspectMintRangePreflight"),
  "RANGE execution path must run range mint preflight",
);

{
  const rangeCheckIndex = executionSource.indexOf('quote.primitiveKind === "RANGE"');
  assert.notEqual(rangeCheckIndex, -1, "execution hook must check for RANGE primitiveKind");
  const afterRangeCheck = executionSource.slice(rangeCheckIndex, rangeCheckIndex + 200);
  assert.ok(
    afterRangeCheck.includes("submitRange"),
    "RANGE check must route to submitRange (not hard-block with setTransactionStatus)",
  );
}

console.log("PASS RANGE mintability source checks");
