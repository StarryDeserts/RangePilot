---
Purpose: Define the RangePilot Strategy data model for the Phase 3A/B Route B wrapper skeleton.
Audience: Move developers, SDK implementers, frontend developers, indexer authors, reviewers, and AI agents.
Status: Draft data-model reference for wrapper skeleton; not final schema or UI design.
Source of truth relationship: Supplements wrapper architecture and product flow docs; official DeepBook Predict docs remain source of truth for protocol position state.
---

# Strategy Data Model

RangePilot Strategy data links creator intent to an official DeepBook Predict range mint. It must be compact enough for on-chain validation and event attribution while leaving presentation-heavy metadata to off-chain systems.

## Core objects and events

The Phase 3A/B Move skeleton should define:

```move
public struct Strategy has key
public struct StrategyCreated has copy, drop
public struct StrategyFollowed has copy, drop
public struct StrategyDeactivated has copy, drop
```

## Strategy

Recommended on-chain fields:

| Field | Move type | TypeScript type | Purpose |
|---|---|---|---|
| `id` / `strategy_id` | `UID` / `ID` | `string` | Sui object identity. |
| `creator` | `address` | `string` | Creator who can deactivate the strategy. |
| `oracle_id` | `ID` | `string` | DeepBook Predict OracleSVI ID. |
| `expiry` | `u64` | decimal string | Range expiry timestamp from DeepBook Predict oracle. |
| `lower_strike` | `u64` | decimal string | Lower exclusive bound of `(lower, higher]`. |
| `higher_strike` | `u64` | decimal string | Higher inclusive bound of `(lower, higher]`. |
| `default_quantity` | `u64` | decimal string | Suggested follow quantity. |
| `creator_fee_bps` | `u64` | decimal string or number | Creator share of explicit fee amount. |
| `platform_fee_bps` | `u64` | decimal string or number | Platform share of explicit fee amount. |
| `platform_recipient` | `address` | `string` | Address receiving the platform fee split. |
| `metadata_uri` | `vector<u8>` | `string` | Off-chain strategy metadata pointer. |
| `active` | `bool` | `boolean` | Follow gating. |
| `created_at_ms` | `u64` | decimal string | Creation timestamp from Clock. |

The wrapper derives `RangeKey` from `oracle_id`, `expiry`, `lower_strike`, and `higher_strike`. Followers should not provide arbitrary RangeKey fields to `follow_strategy_and_mint`.

## StrategyCreated

Recommended event fields:

| Field | Purpose |
|---|---|
| `strategy_id` | Links event to Strategy object. |
| `creator` | Creator address. |
| `oracle_id` | DeepBook Predict oracle target. |
| `expiry` | Expiry timestamp. |
| `lower_strike` | Lower range bound. |
| `higher_strike` | Higher range bound. |
| `default_quantity` | Suggested follow size. |
| `creator_fee_bps` | Creator fee share. |
| `platform_fee_bps` | Platform fee share. |
| `platform_recipient` | Platform fee recipient address. |
| `metadata_uri` | Off-chain metadata pointer. |
| `created_at_ms` | Creation timestamp. |

## StrategyFollowed

Recommended event fields:

| Field | Purpose |
|---|---|
| `strategy_id` | Strategy followed. |
| `creator` | Creator receiving attribution. |
| `follower` | Transaction sender / user. |
| `manager_id` | User's DeepBook Predict manager. |
| `oracle_id` | DeepBook Predict oracle target. |
| `expiry` | Expiry timestamp. |
| `lower_strike` | Lower range bound. |
| `higher_strike` | Higher range bound. |
| `quantity` | Minted range quantity. |
| `fee_amount` | Explicit fee amount provided to wrapper. |
| `creator_fee` | Fee amount transferred or attributed to creator. |
| `platform_fee` | Fee amount transferred or attributed to platform. |
| `timestamp_ms` | Follow timestamp. |

The official DeepBook Predict `RangeMinted` event remains the protocol source of truth for successful mint details. Indexers should link `StrategyFollowed` and `RangeMinted` in the same transaction.

## StrategyDeactivated

Recommended event fields:

| Field | Purpose |
|---|---|
| `strategy_id` | Strategy deactivated. |
| `creator` | Authorized creator. |
| `timestamp_ms` | Deactivation timestamp. |

Deactivation prevents new follows. It does not affect already minted positions because those positions live inside follower `PredictManager` objects under DeepBook Predict.

## Metadata location

Use an on-chain URI/hash pointer for MVP. Keep long-form strategy content off-chain:

- title;
- thesis;
- markdown body;
- image/social preview;
- tags;
- creator profile information;
- external links;
- version history.

`metadata_uri` is easier for hackathon/product iteration. `metadata_hash` gives stronger immutability guarantees. A future version may store both.

## Fee bps upper bound

The wrapper should enforce a maximum combined fee bps. Recommended skeleton default:

```text
MAX_TOTAL_FEE_BPS = 10_000
```

That maximum means creator + platform split cannot exceed 100% of the explicit fee amount. Product policy should likely set a lower default before publish, but Phase 3A/B should only enforce the hard accounting bound.

## Strategy active/deactivated state

`active: bool` is the MVP lifecycle gate:

- `true`: strategy may be followed if frontend quote/preflight and wrapper checks pass;
- `false`: wrapper aborts follow attempts.

Only the creator should be able to deactivate in the minimal skeleton. Admin moderation or platform pause can be designed later if needed.

## Strategy-to-position mapping

RangePilot should not create a separate position object. Mapping is event/indexer-based:

1. `StrategyFollowed` identifies strategy, follower, manager, range, and quantity.
2. DeepBook Predict `RangeMinted` confirms protocol mint details in the same transaction.
3. Direct `predict_manager::range_position` confirms active quantity for wallet-critical reads.
4. DeepBook Predict `RangeRedeemed` and direct reads update later lifecycle state.

This preserves the official model: positions and range positions are internal quantities in `PredictManager`, not standalone NFTs.

## TypeScript representation

TypeScript APIs should keep protocol integers as decimal strings:

```ts
export type RangePilotStrategy = {
  strategyId: string;
  creator: string;
  oracleId: string;
  expiry: string;
  lowerStrike: string;
  higherStrike: string;
  defaultQuantity: string;
  creatorFeeBps: number;
  platformFeeBps: number;
  platformRecipient: string;
  metadataUri: string;
  active: boolean;
  createdAtMs: string;
};
```

SDK transaction builders must remain guarded until wrapper package ID is published and confirmed.

## Open questions

- Final platform recipient address: `TBD`.
- Final fee bps product cap below 100%: `TBD`.
- Metadata URI scheme and content hash policy: `TBD`.
- Indexer schema for linking RangePilot and DeepBook Predict events: `TBD`.
- Wrapper package ID: `TBD` until future publish.
