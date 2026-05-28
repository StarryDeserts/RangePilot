import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const src = join(root, "src");

function read(relativePath) {
  return readFileSync(join(root, relativePath), "utf8");
}

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

function assert(label, condition) {
  if (!condition) {
    console.error(`✗ ${label}`);
    process.exitCode = 1;
    return;
  }

  console.log(`✓ ${label}`);
}

const index = read("src/index.ts");
const source = walk(src)
  .filter((path) => path.endsWith(".ts"))
  .map((path) => `// ${relative(root, path)}\n${readFileSync(path, "utf8")}`)
  .join("\n\n");

for (const expected of [
  "DeepVolTradeMachine",
  "DeepVolTradingEnvironment",
  "useMoveTradeMachine",
  "useUpTradeMachine",
  "useDownTradeMachine",
  "useRangeTradeMachine",
  "usePredictManagerSession",
  "usePortfolioRecords",
]) {
  assert(`package exports ${expected}`, index.includes(expected));
}

for (const expected of [
  "DEEPVOL_QUOTE_FRESHNESS_MS",
  "DEEPVOL_PREFLIGHT_FRESHNESS_MS",
  "DEEPVOL_MINTABILITY_PASS_TTL_MS",
  "buy_move_receipt<DUSDC> preflight must pass before wallet prompt.",
  "Validate a mintable RANGE interval before buying.",
  "Validate a mintable ${input.primitiveKind} strike before buying.",
  "Fresh primitive mint cost",
]) {
  assert(`package preserves verified gate source: ${expected}`, source.includes(expected));
}

assert("package contains MOVE machine action", source.includes("generateMintableRange"));
assert("package contains UP/DOWN machine action", source.includes("generateMintableStrike"));
assert("package contains RANGE machine action", source.includes("generateMintableInterval"));
assert("package contains wallet review action", source.includes("reviewInWallet"));
assert("package does not import apps/deepvol-web", !source.includes("apps/deepvol-web"));
assert("package does not import apps/deepvol-open-design", !source.includes("apps/deepvol-open-design"));

if (process.exitCode) {
  process.exit(process.exitCode);
}
