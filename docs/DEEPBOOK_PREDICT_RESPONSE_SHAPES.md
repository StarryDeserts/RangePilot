---
Purpose: Summarize observed DeepBook Predict public server response shapes for RangePilot.
Audience: Protocol integrators, SDK implementers, frontend developers, reviewers, and AI agents.
Status: Generated documentation; Phase 1A Testnet response-shape snapshot.
Source of truth relationship: Derived from live read-only public server responses; schemas are snapshots and may change, so runtime validation remains required.
---

# DeepBook Predict Response Shapes

These shapes summarize observed Testnet public server responses from RangePilot Phase 1A discovery. They intentionally omit large raw JSON payloads and mark uncertain or unstable fields as `unknown`.

## `GET /status`

Observed HTTP status: 200.

```ts
type StatusResponse = {
  status?: string;
  latest_onchain_checkpoint?: number | string;
  current_time_ms?: number | string;
  earliest_checkpoint?: number | string;
  max_lag_pipeline?: string;
  max_checkpoint_lag?: number | string;
  max_time_lag_seconds?: number | string;
  pipelines?: unknown[];
  [key: string]: unknown;
};
```

## `GET /predicts/:predict_id/state`

Observed HTTP status: 200.

```ts
type PredictStateResponse = {
  predict_id: string;
  pricing: Record<string, unknown> | null;
  risk: Record<string, unknown> | null;
  trading_paused: boolean | null;
  quote_assets: string[];
  [key: string]: unknown;
};
```

## `GET /predicts/:predict_id/oracles`

Observed HTTP status: 200. The snapshot returned 2310 records: 2305 settled and 5 active.

```ts
type OracleRecord = {
  predict_id: string;
  oracle_id: string;
  oracle_cap_id: string;
  underlying_asset: string;
  expiry: number | string;
  min_strike: number | string;
  tick_size: number | string;
  status: "active" | "settled" | string;
  activated_at: number | string | null;
  settlement_price: number | string | null;
  settled_at: number | string | null;
  created_checkpoint: number | string;
  [key: string]: unknown;
};

type OraclesResponse = OracleRecord[];
```

## `GET /predicts/:predict_id/quote-assets`

Observed HTTP status: 200. The snapshot returned DUSDC only.

```ts
type QuoteAssetsResponse = string[];
```

## `GET /predicts/:predict_id/vault/summary`

Observed HTTP status: 200.

```ts
type VaultSummaryResponse = {
  predict_id: string;
  quote_assets: string[];
  vault_balance: number | string;
  vault_value: number | string;
  total_mtm: number | string;
  total_max_payout: number | string;
  available_liquidity: number | string;
  available_withdrawal: number | string;
  plp_total_supply: number | string;
  plp_share_price: number | string;
  utilization: number | string;
  max_payout_utilization: number | string;
  net_deposits: number | string;
  total_supplied: number | string;
  total_withdrawn: number | string;
  [key: string]: unknown;
};
```

## `GET /oracles/:oracle_id/state`

Observed HTTP status: 200 for the selected active BTC oracle. The selected oracle's `ask_bounds` was `null`.

```ts
type OracleStateResponse = {
  oracle: OracleRecord;
  latest_price: OraclePriceUpdate | null;
  latest_svi: OracleSviUpdate | null;
  ask_bounds: Record<string, unknown> | null;
  [key: string]: unknown;
};
```

## `GET /oracles/:oracle_id/ask-bounds`

Observed HTTP status: 200 for the selected active BTC oracle. The response body was `null`.

```ts
type AskBoundsResponse = Record<string, unknown> | null;
```

A `null` response must not be interpreted as mint eligibility. Usable ask bounds remain `MUST CONFIRM AT RUNTIME` and `MUST CONFIRM BEFORE CODING` for trading UX.

## `GET /oracles/:oracle_id/prices/latest`

Observed HTTP status: 200.

```ts
type OraclePriceUpdate = {
  event_digest: string;
  digest: string;
  sender: string;
  checkpoint: number | string;
  checkpoint_timestamp_ms: number | string;
  tx_index: number | string;
  event_index: number | string;
  package: string;
  oracle_id: string;
  spot: number | string;
  forward: number | string;
  onchain_timestamp: number | string;
  [key: string]: unknown;
};
```

## `GET /oracles/:oracle_id/svi/latest`

Observed HTTP status: 200.

```ts
type OracleSviUpdate = {
  event_digest: string;
  digest: string;
  sender: string;
  checkpoint: number | string;
  checkpoint_timestamp_ms: number | string;
  tx_index: number | string;
  event_index: number | string;
  package: string;
  oracle_id: string;
  a: number | string;
  b: number | string;
  rho: number | string;
  rho_negative: boolean;
  m: number | string;
  m_negative: boolean;
  sigma: number | string;
  onchain_timestamp: number | string;
  [key: string]: unknown;
};
```

## `GET /trades/:oracle_id`

Observed HTTP status: 200 for the Phase 1A selected active BTC oracle. The Phase 1A snapshot returned an empty array. Phase 1D-1 later read the known minted BTC oracle and returned `count=24`, but the compact validation scan did not find the known manager/range mint in those records.

```ts
type TradesResponse = Record<string, unknown>[];
```

## `GET /managers/:manager_id/summary`

Observed HTTP status: 200 for the validated manager after Phase 1D-1.

```ts
type ManagerSummaryResponse = {
  manager_id?: string;
  owner?: string;
  balances?: unknown[];
  trading_balance?: number | string;
  open_exposure?: number | string;
  redeemable_value?: number | string;
  realized_pnl?: number | string;
  unrealized_pnl?: number | string;
  account_value?: number | string;
  open_positions?: unknown;
  awaiting_settlement_positions?: unknown;
  [key: string]: unknown;
};
```

## `GET /managers/:manager_id/positions/summary`

Observed HTTP status: 200 for the validated manager after Phase 1D-1. The response was an empty array for the known active minted range, so this endpoint is diagnostic only until broader indexing semantics are confirmed.

```ts
type ManagerPositionsSummaryResponse = Record<string, unknown>[] | Record<string, unknown>;
```

## `GET /managers/:manager_id/pnl?range=ALL`

Observed HTTP status: 200 for the validated manager after Phase 1D-1.

```ts
type ManagerPnlResponse = {
  manager_id?: string;
  range?: string;
  series_type?: string;
  points?: unknown[];
  current_unrealized_pnl?: number | string;
  current_total_pnl?: number | string;
  [key: string]: unknown;
};
```

## `GET /ranges/minted`

Observed HTTP status: 200 for Phase 1D-1 with `manager_id` and `oracle_id` query params. The response was an array with one compact-match record for the known mint.

```ts
type RangeMintsResponse = Record<string, unknown>[];
```

## Still-pending runtime and transaction items

- Public server response schemas must be reconfirmed before user-facing trading.
- Active oracle IDs, market underlyings, and expiries are runtime snapshots, not permanent config.
- Full strike-grid validation remains `MUST CONFIRM BEFORE CODING`.
- Non-null ask-bounds semantics remain `MUST CONFIRM BEFORE CODING` for mint eligibility.
- Quote preview mapping remains `MUST CONFIRM BEFORE CODING` from official call, public server output, devInspect, or dry-run analysis.
- PredictManager discovery, direct `balance<DUSDC>`, exact unvalidated PTB call shapes, position enumeration, and `redeem_range<DUSDC>` validation remain pending.
