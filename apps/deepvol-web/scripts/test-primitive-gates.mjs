import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const marketsSource = readFileSync("src/routes/MarketsPage.tsx", "utf8");
const primitiveCardsSource = readFileSync("src/components/PredictPrimitiveCards.tsx", "utf8");
const portfolioSource = readFileSync("src/routes/PortfolioPage.tsx", "utf8");

assert.match(marketsSource, /Trade movement, not direction\./, "Markets must keep BTC MOVE hero copy");
assert.match(marketsSource, /<BtcMoveCard \/>/, "Markets must keep BTC MOVE featured before primitives");
assert.match(marketsSource, /<PredictPrimitiveCards \/>/, "Markets must render primitive cards");

for (const primitive of ["UP", "DOWN", "RANGE"]) {
  assert.match(primitiveCardsSource, new RegExp(`kind: "${primitive}"`), `${primitive} primitive metadata must exist`);
}
assert.match(portfolioSource, /PREDICT_PRIMITIVES\.map/, "Portfolio must render primitive placeholders from primitive metadata");
assert.match(portfolioSource, /\{primitive\.kind\} positions/, "Portfolio must label primitive position placeholders");

assert.match(
  primitiveCardsSource,
  /Direct primitives are scaffold-only and do not create MoveReceipt\./,
  "Primitive scaffold must state direct primitives do not create MoveReceipt",
);
assert.match(
  primitiveCardsSource,
  /disabled>/,
  "Primitive direct execution buttons must stay disabled",
);
assert.match(
  primitiveCardsSource,
  /Trade BTC MOVE receipt/,
  "Primitive cards must link back to the supported BTC MOVE receipt route",
);
assert.match(portfolioSource, /MOVE Receipts/, "Portfolio must separate MOVE Receipts");
assert.match(portfolioSource, /Primitive Positions/, "Portfolio must separate Primitive Positions");
assert.match(
  portfolioSource,
  /Only BTC MOVE creates a receipt in this app\./,
  "Portfolio must state only BTC MOVE creates receipts",
);

console.log("PASS primitive scaffold gating");
console.log(`Loaded ${pathToFileURL("src/components/PredictPrimitiveCards.tsx").href}`);
