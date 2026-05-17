---
Purpose: Define the RangePilot Route B wrapper contract boundary for creator strategies that internally mint DeepBook Predict ranges.
Audience: Move developers, SDK implementers, frontend developers, protocol integrators, reviewers, product leads, and AI agents.
Status: Draft for Phase 3A/B wrapper skeleton; not published and not final UI design.
Source of truth relationship: Supplements official Sui DeepBook Predict docs, local validated entrypoint bindings, and RangePilot product docs; official docs and local source signatures remain authoritative for DeepBook Predict behavior.
---

# Wrapper Contract Architecture

RangePilot wrapper internally calls DeepBook Predict mint_range<DUSDC>.

The wrapper is a thin creator-strategy layer above DeepBook Predict. It owns RangePilot strategy metadata, follow attribution, and fee policy validation. DeepBook Predict remains the only authority for prediction-market pricing, oracle lifecycle, vault risk, range position accounting, payout, and settlement.

## Official DeepBook Predict boundary

Official Sui DeepBook Predict docs and the local `predict-testnet-4-16` source snapshot define these boundaries:

| Module / object | Protocol role | RangePilot wrapper stance |
|---|---|---|
| `Predict` | Main shared trading and LP entrypoint surface. `mint_range` buys vertical range positions. | Call it; do not replace it. |
| `PredictManager` | Per-user account boundary with quote balances, binary positions, and range positions. | Pass the user's manager into DeepBook Predict; do not custody positions. |
| `RangeKey` | Vertical range identifier: oracle ID, expiry, lower strike, higher strike. Settlement pays inside `(lower, higher]`. | Derive from Strategy fields, then pass to DeepBook Predict. |
| `OracleSVI` | Market/pricing state: spot, forward, SVI params, activation, expiry, settlement. | Pass as official market input; do not compute SVI pricing. |
| `Vault` | Liquidity, exposure, MTM liability, max payout, PLP accounting, and risk state. | Leave all risk and payout logic to DeepBook Predict. |
| `Registry` | Deployment, oracle cap, quote asset, pricing/risk config, pause, and governance/admin functions. | Not part of normal user follow flow. |
| Public Predict server | Read model for markets, summaries, vault, portfolio, and history. | Use for display and recovery hints only; not a write path. |

## Why a wrapper is needed

The direct browser flow proves users can mint and redeem ranges through official DeepBook Predict entrypoints. RangePilot now needs product-owned strategy behavior that DeepBook Predict does not provide:

- creator strategy objects;
- strategy active/deactivated lifecycle;
- creator/platform fee policy;
- `StrategyCreated`, `StrategyFollowed`, and `StrategyDeactivated` attribution events;
- atomic follow+mint UX in a future wallet flow;
- indexer-friendly link between strategy metadata and the official DeepBook Predict `RangeMinted` outcome.

## Why Route B

Route B means the user calls RangePilot's wrapper, and the wrapper internally calls DeepBook Predict `mint_range<DUSDC>`.

Route B was chosen because it gives RangePilot one atomic transaction for strategy validation, fee handling, and official range mint. It avoids a two-step fee/mint process and avoids treating RangePilot as only an off-chain event recorder. It also preserves DeepBook Predict's protocol authority because the wrapper composes the official entrypoint instead of rebuilding protocol internals.

## What the wrapper owns

The wrapper owns only RangePilot product state and attribution:

- `Strategy` object fields;
- creator address;
- oracle ID / expiry / lower strike / higher strike strategy target;
- default quantity;
- creator/platform fee bps or explicit fee policy;
- metadata URI or metadata hash;
- active/deactivated state;
- wrapper-specific fee validation;
- `StrategyCreated`, `StrategyFollowed`, and `StrategyDeactivated` events.

## What the wrapper does not own

The wrapper must not implement or replace:

- pricing;
- oracle settlement;
- oracle lifecycle;
- vault risk;
- vault exposure accounting;
- MTM or max payout logic;
- StrikeMatrix;
- payout;
- `PredictManager` replacement;
- position custody;
- direct table manipulation inside `PredictManager`;
- public server write execution;
- custom prediction market behavior.

## DeepBook Predict dependency boundary

Local source snapshot used for wrapper build/debug:

```text
deepbookv3-predict-testnet-4-16/packages/predict
```

The full local third-party snapshot root is `deepbookv3-predict-testnet-4-16/`. Official docs remain the deployment/config source of truth, and the local snapshot is not vendored into or committed to the repository.

Confirmed local source signature:

```move
public fun mint_range<Quote>(
    predict: &mut Predict,
    manager: &mut PredictManager,
    oracle: &OracleSVI,
    key: RangeKey,
    quantity: u64,
    clock: &Clock,
    ctx: &mut TxContext,
)
```

Relevant internal checks performed by DeepBook Predict:

- transaction sender must equal `manager.owner()`;
- trading must not be paused;
- quantity must be greater than zero;
- quote asset type must be accepted;
- range key must match the oracle;
- oracle must be live for minting;
- vault range exposure is inserted;
- oracle risk is refreshed;
- post-trade ask is checked against ask bounds;
- mint cost is withdrawn from `PredictManager` balance;
- vault exposure limits are enforced;
- range position is increased in `PredictManager`;
- `RangeMinted` is emitted.

## Strategy object model

The wrapper skeleton should define:

```move
public struct Strategy has key
public struct StrategyCreated has copy, drop
public struct StrategyFollowed has copy, drop
public struct StrategyDeactivated has copy, drop
```

Recommended Strategy fields:

- `id: UID`
- `creator: address`
- `oracle_id: ID`
- `expiry: u64`
- `lower_strike: u64`
- `higher_strike: u64`
- `default_quantity: u64`
- `creator_fee_bps: u64`
- `platform_fee_bps: u64`
- `platform_recipient: address`
- `metadata_uri: vector<u8>` or `metadata_hash: vector<u8>`
- `active: bool`
- `created_at_ms: u64`

## Fee model

MVP fees are separate from DeepBook Predict mint cost.

- DeepBook Predict mint cost is paid from the user's `PredictManager` balance.
- RangePilot creator/platform fee should be passed as a separate fee `Coin<T>`.
- The wrapper validates fee bps and explicit fee amount.
- The wrapper may split fee coin into creator/platform amounts and transfer them.
- If `predict::mint_range<T>` aborts, the entire transaction aborts and fee transfers roll back.

The wrapper must not compute fee from DeepBook Predict mint cost by reimplementing pricing. Phase 3A/B uses explicit fee amount validation in the skeleton.

## Follow strategy flow

1. Follower previews strategy in the frontend.
2. Frontend runs official quote and full `mint_range<DUSDC>` preflight against DeepBook Predict.
3. Follower approves wrapper transaction.
4. Wrapper checks `strategy.active`.
5. Wrapper checks `quantity > 0`.
6. Wrapper validates fee bps and fee coin value.
7. Wrapper builds `RangeKey` from Strategy fields.
8. Wrapper calls DeepBook Predict `predict::mint_range<T>`.
9. Wrapper emits `StrategyFollowed` after the protocol call succeeds.

## Entry points

Planned wrapper surface:

- `create_strategy(...)`
  - creates and shares/stores a Strategy object;
  - emits `StrategyCreated`.
- `deactivate_strategy(strategy, ctx)`
  - requires creator authorization;
  - marks strategy inactive;
  - emits `StrategyDeactivated`.
- `follow_strategy_and_mint<T>(...)`
  - validates strategy and fee policy;
  - calls DeepBook Predict `mint_range<T>`;
  - emits `StrategyFollowed`.

The local skeleton entrypoints compile against the full local DeepBookV3 snapshot. Concrete published package IDs, final fee token policy, and deployment-specific DUSDC examples remain `MUST CONFIRM BEFORE CODING` before publish.

## Events

Events should be indexer-friendly and compact:

- `StrategyCreated`
  - strategy ID, creator, oracle ID, expiry, strikes, default quantity, fee bps, metadata reference, created time.
- `StrategyFollowed`
  - strategy ID, follower, manager ID, oracle ID, expiry, strikes, quantity, fee amount, creator fee, platform fee, timestamp.
- `StrategyDeactivated`
  - strategy ID, creator, timestamp.

DeepBook Predict still emits `RangeMinted` for the protocol position update. Indexers link the RangePilot `StrategyFollowed` event and DeepBook Predict `RangeMinted` event in the same transaction.

## Error codes

Wrapper-specific errors should cover only wrapper policy:

| Error | Meaning |
|---|---|
| `EInactiveStrategy` | Strategy cannot be followed. |
| `EZeroQuantity` | Follow quantity is zero. |
| `EFeeBpsTooHigh` | Creator + platform fee bps exceeds wrapper max. |
| `EInsufficientFee` | Provided fee coin is below explicit fee amount. |
| `EUnauthorized` | Non-creator tried to deactivate a strategy. |

Do not mirror DeepBook Predict pricing, oracle, or vault errors in wrapper code. Surface those from transaction effects or preflight diagnostics.

## Security assumptions

- The follower is the Sui transaction sender.
- DeepBook Predict validates `ctx.sender() == manager.owner()` inside `mint_range`.
- Strategy RangeKey is derived from stored Strategy fields, not arbitrary follower input.
- Fee coin is separate from `PredictManager` balance.
- Frontend preflight is advisory safety UX; on-chain checks remain authoritative.
- No private keys, signatures, raw transaction bytes, or local validation caches are stored by the wrapper or browser app.

## Upgrade and deployment assumptions

- The wrapper package is not published in Phase 3A/B.
- Wrapper package ID is `TBD` until an explicit future Testnet publish round.
- SDK builders must block by default without a wrapper package ID.
- Mainnet is out of scope.
- `deepbookv3-predict-testnet-4-16/` is local third-party source for build/debug only and must not be committed.

## Open follow-ups

| Follow-up | Status | Handling |
|---|---|---|
| Full local DeepBookV3 snapshot | Resolved for local build: `move/rangepilot/Move.toml` depends on `../../deepbookv3-predict-testnet-4-16/packages/predict`, whose sibling `packages/deepbook` dependency resolves. The DeepBook package still pins `token` from the upstream DeepBookV3 git dependency, and `Move.lock` records that resolved dependency. | Keep `deepbookv3-predict-testnet-4-16/` ignored and uncommitted. Do not edit third-party source for wrapper fixes. |
| DUSDC source dependency for published examples | `mint_range<T>` remains generic in the skeleton; concrete DUSDC publish examples still require final package/source confirmation. | Keep skeleton generic and docs Testnet-specific. Confirm before publish. |
| Wrapper package ID | `TBD` until publish. | SDK stubs must block without explicit package ID. |
| Final fee policy | Explicit fee amount and bps split are MVP skeleton policy, not final tokenomics. | Revisit before publish and audits. |

## Verification status

Current Phase 3B-fix verification:

- `npm run typecheck`: passed.
- `npm run build:web`: passed with the existing Vite chunk-size warning.
- `npm run move:build:rangepilot`: passed against `deepbookv3-predict-testnet-4-16/packages/predict`.
- `npm run move:test:rangepilot`: passed with 2 tests.
