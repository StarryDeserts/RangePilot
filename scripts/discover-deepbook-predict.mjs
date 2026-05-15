const baseUrl = "https://predict-server.testnet.mystenlabs.com";
const predictId = "0xc8736204d12f0a7277c86388a68bf8a194b0a14c5538ad13f22cbd8e2a38028a";

const endpointSpecs = [
  ["status", "/status"],
  ["predictState", `/predicts/${predictId}/state`],
  ["predictOracles", `/predicts/${predictId}/oracles`],
  ["quoteAssets", `/predicts/${predictId}/quote-assets`],
  ["vaultSummary", `/predicts/${predictId}/vault/summary`],
];

function endpointUrl(path) {
  return `${baseUrl}${path}`;
}

function shapeOf(value, depth = 0) {
  if (value === null) return "null";
  if (Array.isArray(value)) {
    return value.length === 0 ? [] : [shapeOf(value[0], depth + 1)];
  }
  if (typeof value !== "object") return typeof value;
  if (depth >= 2) return "object";

  return Object.fromEntries(
    Object.entries(value)
      .slice(0, 24)
      .map(([key, child]) => [key, shapeOf(child, depth + 1)]),
  );
}

function countBy(values, key) {
  return values.reduce((counts, item) => {
    const value = item?.[key] ?? "unknown";
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

async function fetchJson(name, path) {
  const startedAt = Date.now();
  const response = await fetch(endpointUrl(path), {
    headers: { accept: "application/json" },
  });
  const body = await response.text();
  const elapsedMs = Date.now() - startedAt;

  let json = null;
  try {
    json = body === "" ? null : JSON.parse(body);
  } catch (error) {
    json = { parseError: error instanceof Error ? error.message : String(error) };
  }

  return {
    name,
    path,
    status: response.status,
    ok: response.ok,
    elapsedMs,
    contentType: response.headers.get("content-type"),
    shape: shapeOf(json),
    json,
  };
}

function selectDefaultOracle(oracles, nowMs = Date.now()) {
  const active = oracles
    .filter((oracle) => oracle?.status === "active")
    .filter(
      (oracle) =>
        Number.isFinite(Number(oracle.expiry)) && Number(oracle.expiry) > nowMs,
    );

  return (
    [...active].sort(
      (left, right) => Number(left.expiry) - Number(right.expiry),
    )[0] ?? null
  );
}

const results = [];

for (const [name, path] of endpointSpecs) {
  results.push(await fetchJson(name, path));
}

const oracles = results.find((result) => result.name === "predictOracles")?.json;
const oracleSummary = Array.isArray(oracles)
  ? {
      total: oracles.length,
      statusCounts: countBy(oracles, "status"),
      activeCandidates: oracles
        .filter((oracle) => oracle.status === "active")
        .map((oracle) => ({
          oracle_id: oracle.oracle_id,
          underlying_asset: oracle.underlying_asset,
          expiry: oracle.expiry,
          min_strike: oracle.min_strike,
          tick_size: oracle.tick_size,
          status: oracle.status,
        })),
    }
  : { total: 0, statusCounts: {}, activeCandidates: [] };

const selectedOracle = Array.isArray(oracles) ? selectDefaultOracle(oracles) : null;

if (selectedOracle?.oracle_id) {
  for (const [name, path] of [
    ["oracleState", `/oracles/${selectedOracle.oracle_id}/state`],
    ["oracleAskBounds", `/oracles/${selectedOracle.oracle_id}/ask-bounds`],
    ["latestOraclePrice", `/oracles/${selectedOracle.oracle_id}/prices/latest`],
    ["latestOracleSvi", `/oracles/${selectedOracle.oracle_id}/svi/latest`],
    ["oracleTrades", `/trades/${selectedOracle.oracle_id}`],
  ]) {
    results.push(await fetchJson(name, path));
  }
}

const report = {
  baseUrl,
  predictId,
  discoveredAt: new Date().toISOString(),
  readOnly: true,
  oracleSummary,
  selectedOracle: selectedOracle
    ? {
        oracle_id: selectedOracle.oracle_id,
        underlying_asset: selectedOracle.underlying_asset,
        expiry: selectedOracle.expiry,
        min_strike: selectedOracle.min_strike,
        tick_size: selectedOracle.tick_size,
        status: selectedOracle.status,
      }
    : null,
  endpoints: results.map(
    ({ name, path, status, ok, elapsedMs, contentType, shape, json }) => ({
      name,
      path,
      status,
      ok,
      elapsedMs,
      contentType,
      shape,
      size: Array.isArray(json) ? json.length : undefined,
    }),
  ),
  notes: [
    "The public server is a read model, not a transaction write path.",
    "Oracle IDs and active market data are runtime snapshots, not permanent config.",
    "A null ask-bounds response is valid and must not be treated as mint eligibility.",
    "min_strike and tick_size are discovered metadata; full strike-grid validation remains pending.",
  ],
};

console.log(JSON.stringify(report, null, 2));
