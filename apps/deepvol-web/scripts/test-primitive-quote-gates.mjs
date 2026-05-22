import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const gateSource = readFileSync("src/hooks/primitiveQuoteGate.ts", "utf8");
const packageSource = readFileSync("package.json", "utf8");
const plannedRoutePath = "src/routes/PrimitiveQuotePage.tsx";
const plannedPanelPath = "src/components/PrimitiveQuotePanel.tsx";

for (const expected of [
  "Connect a Sui wallet before refreshing primitive quotes.",
  "Switch the connected wallet to Sui Testnet before refreshing primitive quotes.",
  "Configured BTC MOVE VolSeries must be loaded before primitive quotes.",
  "Configured BTC MOVE VolSeries is inactive.",
  "Enter a positive integer quantity for primitive quote.",
  "Enter a positive strike for UP/DOWN primitive quote.",
  "Enter positive lower and upper strikes for RANGE primitive quote.",
  "RANGE lower strike must be below upper strike.",
  "Enter a PredictManager ID before running primitive mint preflight.",
  "Refresh a fresh primitive quote before running mint preflight.",
  "Primitive wallet execution is disabled in DeepVol-14.",
]) {
  assert.ok(gateSource.includes(expected), `missing primitive gate copy: ${expected}`);
}

for (const expected of [
  "buildPrimitiveQuoteBlockers",
  "buildPrimitivePreflightBlockers",
  "buildPrimitiveExecutionBlockers",
  "buildPrimitiveQuoteDependencyKey",
  "buildPrimitivePreflightDependencyKey",
]) {
  assert.match(gateSource, new RegExp(`export function ${expected}`), `${expected} must be exported`);
}

assert.match(packageSource, /"test:primitive-quote-gates"/, "primitive quote gate test script must be wired");

const forbiddenPatterns = [
  "useSignAndExecuteTransaction",
  "useBuyMoveReceipt",
  "buildMintRangeTransaction",
  "buildBuyMoveReceiptTransaction",
  "buildRedeemBinaryPositionTransaction",
  "withdraw_protocol_fees",
];

for (const filePath of [plannedRoutePath, plannedPanelPath]) {
  if (!existsSync(filePath)) {
    continue;
  }

  const source = readFileSync(filePath, "utf8");
  for (const forbidden of forbiddenPatterns) {
    assert.ok(!source.includes(forbidden), `${filePath} must not import or reference ${forbidden}`);
  }
}

console.log("PASS primitive quote/preflight gate source checks");
