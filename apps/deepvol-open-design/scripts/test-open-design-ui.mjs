/**
 * test-open-design-ui.mjs — structural and isolation tests for DeepVol Open Design app
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const SRC = join(ROOT, "src");

let pass = 0;
let fail = 0;

function assert(label, ok) {
  if (ok) {
    pass++;
  } else {
    fail++;
    console.error(`  FAIL  ${label}`);
  }
}

function fileExists(rel) {
  return existsSync(join(SRC, rel));
}

function fileContent(rel) {
  return readFileSync(join(SRC, rel), "utf-8");
}

function allTsFiles(dir, results = []) {
  const abs = join(SRC, dir);
  if (!existsSync(abs)) return results;
  for (const entry of readdirSync(abs, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      allTsFiles(join(dir, entry.name), results);
    } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
      results.push(join(dir, entry.name));
    }
  }
  return results;
}

console.log("test:open-design-ui\n");

// ── Route existence ──
console.log("Route files:");
assert("LandingPage exists", fileExists("routes/LandingPage.tsx"));
assert("MarketsPage exists", fileExists("routes/MarketsPage.tsx"));
assert("BtcMarketPage exists", fileExists("routes/BtcMarketPage.tsx"));
assert("PortfolioPage exists", fileExists("routes/PortfolioPage.tsx"));

// ── Router handles compat routes ──
console.log("\nRouter compat routes:");
const appContent = fileContent("App.tsx");
assert("App.tsx references /markets/btc", appContent.includes("/markets/btc"));
assert("App.tsx references /portfolio", appContent.includes("/portfolio"));

// ── Component structure ──
console.log("\nComponent structure:");
assert("TradeTabs exists", fileExists("components/trade/TradeTabs.tsx"));
assert("MoveTradePanel exists", fileExists("components/trade/MoveTradePanel.tsx"));
assert("PrimitiveTradePanel exists", fileExists("components/trade/PrimitiveTradePanel.tsx"));

const tradeTabs = fileContent("components/trade/TradeTabs.tsx");
assert("TradeTabs has MOVE tab", tradeTabs.includes("MOVE"));
assert("TradeTabs has UP tab", tradeTabs.includes("UP"));
assert("TradeTabs has DOWN tab", tradeTabs.includes("DOWN"));
assert("TradeTabs has RANGE tab", tradeTabs.includes("RANGE"));

// ── PredictManager not in main flow ──
console.log("\nPredictManager UX:");
const btcMarket = fileContent("routes/BtcMarketPage.tsx");
assert(
  "BtcMarketPage uses usePredictManagerSession (auto-discovery)",
  btcMarket.includes("usePredictManagerSession"),
);
assert(
  "PredictManager manual ID not in main trade flow",
  !btcMarket.includes("Enter PredictManager ID") &&
    !btcMarket.includes("Manual manager ID"),
);

// ── PredictManager setup CTA ──
console.log("\nPredictManager setup CTA:");
assert("PredictManagerSetup exists", fileExists("components/trade/PredictManagerSetup.tsx"));
const pmSetup = fileContent("components/trade/PredictManagerSetup.tsx");
assert("PredictManagerSetup imports PredictManagerSession type", pmSetup.includes("PredictManagerSession"));
assert("PredictManagerSetup calls createManager", pmSetup.includes("createManager"));
assert("PredictManagerSetup handles wallet_required", pmSetup.includes("wallet_required"));
assert("PredictManagerSetup handles wrong_network", pmSetup.includes("wrong_network"));
assert("PredictManagerSetup handles missing status", pmSetup.includes('"missing"'));
assert("PredictManagerSetup handles loading status", pmSetup.includes('"loading"'));
assert("PredictManagerSetup handles invalid status", pmSetup.includes('"invalid"'));
assert("PredictManagerSetup handles error status", pmSetup.includes('"error"'));
assert("PredictManagerSetup handles ready status with funding check", pmSetup.includes('"ready"') && pmSetup.includes("ManagerFundingCard"));
assert("PredictManagerSetup has manual override under details", pmSetup.includes("<details") && pmSetup.includes("setManualManager"));
assert("BtcMarketPage imports PredictManagerSetup", btcMarket.includes("PredictManagerSetup"));
assert("BtcMarketPage renders PredictManagerSetup", btcMarket.includes("<PredictManagerSetup"));
assert("BtcMarketPage no longer has passive blocker pills", !btcMarket.includes('pill pill-warn text-[10px]'));

// ── TransactionStatusStrip ──
console.log("\nTransactionStatusStrip:");
assert("TransactionStatusStrip exists", fileExists("components/trade/TransactionStatusStrip.tsx"));
const txStrip = fileContent("components/trade/TransactionStatusStrip.tsx");
assert("TransactionStatusStrip handles idle state", txStrip.includes('"idle"'));
assert("TransactionStatusStrip handles success state", txStrip.includes("toast-pass"));
assert("TransactionStatusStrip handles failed state", txStrip.includes("toast-fail"));

// ── ManagerFundingCard ──
console.log("\nManagerFundingCard:");
assert("ManagerFundingCard exists", fileExists("components/trade/ManagerFundingCard.tsx"));
const fundingCard = fileContent("components/trade/ManagerFundingCard.tsx");
assert("ManagerFundingCard calls buildDepositDusdcTransaction", fundingCard.includes("buildDepositDusdcTransaction"));
assert("ManagerFundingCard calls selectDusdcCoinsForAmount", fundingCard.includes("selectDusdcCoinsForAmount"));
assert("ManagerFundingCard uses useDeepVolDusdcBalance", fundingCard.includes("useDeepVolDusdcBalance"));
assert("ManagerFundingCard uses translateDeepBookPredictError", fundingCard.includes("translateDeepBookPredictError"));
assert("ManagerFundingCard has deposit CTA", fundingCard.includes("Deposit DUSDC"));
assert("ManagerFundingCard is wired to action handler", fundingCard.includes("depositDusdc"));

// ── PredictManagerSetup funding integration ──
console.log("\nPredictManagerSetup funding:");
assert("PredictManagerSetup no longer returns null when ready", !pmSetup.includes('if (status === "ready") return null'));
assert("PredictManagerSetup imports ManagerFundingCard", pmSetup.includes("ManagerFundingCard"));
assert("PredictManagerSetup checks balance for funding state", pmSetup.includes("isFunded"));

// ── AdvancedDetails exists ──
assert("AdvancedDetails exists", fileExists("components/organisms/AdvancedDetails.tsx"));
const advDetails = fileContent("components/organisms/AdvancedDetails.tsx");
assert("AdvancedDetails uses <details> element", advDetails.includes("<details"));

// ── Portfolio sections ──
console.log("\nPortfolio:");
const portfolio = fileContent("routes/PortfolioPage.tsx");
assert("Portfolio references MOVE Receipts", portfolio.includes("Receipt") || portfolio.includes("receipt"));
assert(
  "Portfolio references Primitive Positions",
  portfolio.includes("Primitive") || portfolio.includes("primitive"),
);

// ── RANGE diagnostics ──
console.log("\nRANGE support:");
assert(
  "BtcMarketPage handles RANGE product tab",
  btcMarket.includes("RANGE"),
);
assert(
  "BtcMarketPage imports RangeExecutionPanel",
  btcMarket.includes("RangeExecutionPanel"),
);
assert(
  "RANGE panel is NOT hardcoded disabled in BtcMarketPage",
  !btcMarket.includes("Mint disabled") && !btcMarket.includes("Execution disabled"),
);

// ── State system components ──
console.log("\nState system:");
assert("QuotePanel exists", fileExists("components/organisms/QuotePanel.tsx"));
assert("PreflightPanel exists", fileExists("components/organisms/PreflightPanel.tsx"));
assert("WalletActionBar exists", fileExists("components/organisms/WalletActionBar.tsx"));

// ── Execution wiring ──
console.log("\nExecution wiring:");
const movePanel = fileContent("components/trade/MoveExecutionPanel.tsx");
assert("MoveExecutionPanel imports useBuyMoveReceipt", movePanel.includes("useBuyMoveReceipt"));
assert("MoveExecutionPanel imports useDeepVolQuote", movePanel.includes("useDeepVolQuote"));
assert("MoveExecutionPanel imports useActiveBtcMoveSeries", movePanel.includes("useActiveBtcMoveSeries"));
assert("MoveExecutionPanel has submit handler", movePanel.includes(".submit") || movePanel.includes("onSubmit"));

// ── MOVE active market context ──
console.log("\nMOVE active market context:");
assert("MoveExecutionPanel shows active market section", movePanel.includes("Active market"));
assert("MoveExecutionPanel imports formatTimestampMs", movePanel.includes("formatTimestampMs"));
assert("MoveExecutionPanel shows market help for idle series", movePanel.includes("BTC market discovered"));

assert("BinaryPrimitiveExecutionPanel exists", fileExists("components/trade/BinaryPrimitiveExecutionPanel.tsx"));
const binaryPanel = fileContent("components/trade/BinaryPrimitiveExecutionPanel.tsx");
assert("BinaryPrimitiveExecutionPanel imports usePrimitiveWalletExecution", binaryPanel.includes("usePrimitiveWalletExecution"));
assert("BinaryPrimitiveExecutionPanel imports usePrimitiveQuote", binaryPanel.includes("usePrimitiveQuote"));
assert("BinaryPrimitiveExecutionPanel imports usePrimitivePreflight", binaryPanel.includes("usePrimitivePreflight"));
assert("BinaryPrimitiveExecutionPanel has submit handler", binaryPanel.includes(".submit") || binaryPanel.includes("onSubmit"));

assert("RangeExecutionPanel exists", fileExists("components/trade/RangeExecutionPanel.tsx"));
const rangePanel = fileContent("components/trade/RangeExecutionPanel.tsx");
assert("RangeExecutionPanel imports usePrimitiveWalletExecution", rangePanel.includes("usePrimitiveWalletExecution"));
assert("RangeExecutionPanel imports usePrimitiveMintableRange", rangePanel.includes("usePrimitiveMintableRange"));
assert("RangeExecutionPanel has submit handler", rangePanel.includes(".submit") || rangePanel.includes("onSubmit"));
assert("RANGE is NOT hardcoded permanently disabled", !rangePanel.includes("Execution disabled") && !rangePanel.includes("Mint disabled"));

// ── Button UX ──
console.log("\nButton UX:");
assert("WalletActionButton exists", fileExists("components/trade/WalletActionButton.tsx"));
const actionButton = fileContent("components/trade/WalletActionButton.tsx");
assert("WalletActionButton shows blockers", actionButton.includes("blockers"));
assert("WalletActionButton handles transactionStatus", actionButton.includes("transactionStatus"));

// ── BtcMarketPage wiring ──
console.log("\nBtcMarketPage wiring:");
assert("BtcMarketPage imports MoveExecutionPanel", btcMarket.includes("MoveExecutionPanel"));
assert("BtcMarketPage imports BinaryPrimitiveExecutionPanel", btcMarket.includes("BinaryPrimitiveExecutionPanel"));
assert("BtcMarketPage imports RangeExecutionPanel", btcMarket.includes("RangeExecutionPanel"));

// ── Import isolation ──
console.log("\nImport isolation:");
const allFiles = allTsFiles(".");
let isolationClean = true;
for (const f of allFiles) {
  const content = fileContent(f);
  if (content.includes("deepvol-web/src/components")) {
    console.error(`  FAIL  ${f} imports from deepvol-web/src/components`);
    isolationClean = false;
    fail++;
  }
  if (content.includes("deepvol-web/src/styles")) {
    console.error(`  FAIL  ${f} imports from deepvol-web/src/styles`);
    isolationClean = false;
    fail++;
  }
}
if (isolationClean) {
  pass++;
  // Count as one passing assertion
}
assert(
  "No runtime import from apps/deepvol-web UI",
  isolationClean,
);

// ── DeepVol-32: Product context isolation ──
console.log("\nProduct context isolation (DeepVol-32):");
const gateFile = fileContent("hooks/primitiveQuoteGate.ts");
assert(
  "primitiveQuoteGate does not use MOVE-specific VolSeries text",
  !gateFile.includes("BTC MOVE VolSeries"),
);
assert(
  "primitiveQuoteGate buildPrimitivePreflightBlockers checks mintability",
  gateFile.includes("primitiveMintabilityStatus") && gateFile.includes("rangeMintabilityStatus"),
);
assert(
  "PrimitiveInputState has primitiveMintabilityStatus field",
  gateFile.includes("primitiveMintabilityStatus?:"),
);
assert(
  "PrimitiveInputState has rangeMintabilityStatus field",
  gateFile.includes("rangeMintabilityStatus?:"),
);

console.log("\nPreflight mintability threading:");
const preflightHook = fileContent("hooks/usePrimitivePreflight.ts");
assert(
  "usePrimitivePreflight accepts primitiveMintabilityStatus param",
  preflightHook.includes("primitiveMintabilityStatus"),
);
assert(
  "usePrimitivePreflight accepts rangeMintabilityStatus param",
  preflightHook.includes("rangeMintabilityStatus"),
);

console.log("\nCaller wiring:");
assert(
  "BinaryPrimitiveExecutionPanel passes primitiveMintabilityStatus to preflight",
  binaryPanel.includes("primitiveMintabilityStatus: mintableStrike.status") ||
    (binaryPanel.includes("primitiveMintabilityStatus") && binaryPanel.includes("mintableStrike.status")),
);
assert(
  "RangeExecutionPanel passes rangeMintabilityStatus to preflight",
  rangePanel.includes("rangeMintabilityStatus: mintableRange.status") ||
    (rangePanel.includes("rangeMintabilityStatus") && rangePanel.includes("mintableRange.status")),
);

console.log("\nMOVE range band fallback:");
assert(
  "MoveExecutionPanel uses suggestedLowerStrike fallback",
  movePanel.includes("suggestedLowerStrike"),
);
assert(
  "MoveExecutionPanel uses suggestedUpperStrike fallback",
  movePanel.includes("suggestedUpperStrike"),
);

console.log("\nBinary panel does not use MOVE copy:");
assert(
  "BinaryPrimitiveExecutionPanel has no BTC MOVE range text",
  !binaryPanel.includes("BTC MOVE range"),
);
assert(
  "RangeExecutionPanel has no BTC MOVE range text",
  !rangePanel.includes("BTC MOVE range"),
);

// ── Summary ──
console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) {
  console.error("\nFAIL open-design-ui tests");
  process.exit(1);
} else {
  console.log("\nPASS open-design-ui tests");
}
