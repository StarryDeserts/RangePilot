---
Purpose: Define RangePilot's creator strategy business model on top of DeepBook Predict.
Audience: Product leads, frontend developers, SDK implementers, Move developers, protocol integrators, reviewers, and AI agents.
Status: Draft for Phase 3A/B Route B wrapper architecture; not final tokenomics or UI design.
Source of truth relationship: Supplements the product architecture and official DeepBook Predict integration docs; official Sui docs and local validated entrypoint bindings remain source of truth for protocol behavior.
---

# Business Model

RangePilot monetizes guided DeepBook Predict strategy discovery and execution. Creators publish range strategies with a thesis, target range, expiry, default quantity, and fee policy. Users follow those strategies through a RangePilot wrapper transaction that validates RangePilot strategy state, handles creator/platform attribution, and internally calls DeepBook Predict `mint_range<DUSDC>`.

DeepBook Predict remains the prediction-market protocol. RangePilot does not price ranges, settle oracles, custody positions, run vault risk, reproduce StrikeMatrix logic, or calculate payout. The business layer is built on top of the official protocol's `Predict`, `PredictManager`, `RangeKey`, `OracleSVI`, and Vault behavior.

## Core model

```text
User follows creator strategy
→ user pays DeepBook Predict mint cost from PredictManager balance
→ user separately provides creator/platform fee as Coin<DUSDC>
→ RangePilot wrapper validates strategy and fee policy
→ wrapper splits/transfers fee
→ wrapper calls DeepBook Predict mint_range<DUSDC>
→ wrapper emits StrategyFollowed for attribution
→ DeepBook Predict stores the range position in the user's PredictManager
```

The mint cost and RangePilot fee are separate payment surfaces:

- DeepBook Predict mint cost is withdrawn from the user's `PredictManager` balance by `predict::mint_range`.
- Creator/platform fee should be paid with a separate fee coin passed to the RangePilot wrapper.
- The wrapper should not forcibly deduct creator/platform fee from `PredictManager` because `PredictManager` is the protocol account boundary for official quote assets and positions.
- If DeepBook Predict `mint_range` aborts, the Sui transaction aborts and fee transfers in the same transaction roll back.

## Why creators publish strategies

Creators get a strategy distribution surface without building their own protocol integration. RangePilot can attribute followers, volume, and fee revenue to a creator's strategy through `StrategyCreated`, `StrategyFollowed`, and later analytics/indexing.

Creator incentives:

- build a public track record around range theses;
- earn creator fee share when followers execute a strategy;
- publish reusable strategy metadata and updates;
- receive distribution through RangePilot discovery surfaces;
- avoid owning protocol pricing, vault risk, or settlement logic.

## Why users follow strategies

Users get a simplified decision path for DeepBook Predict ranges. Instead of manually discovering active oracles, expiry, strike grid, candidate ranges, and mintability gates, users can inspect a creator's thesis and preview a preconfigured range.

User value:

- strategy context before wallet approval;
- official quote and full preflight before following;
- clearer `(lower, higher]` range semantics;
- portfolio linkage between the DeepBook Predict position and the RangePilot strategy event;
- creator attribution without moving custody away from the user's `PredictManager`.

## Fee model

MVP fee policy should be explicit and protocol-bounded:

| Fee | Paid by | Paid to | Stage | Source |
|---|---|---|---|---|
| DeepBook Predict mint cost | follower | DeepBook Predict Vault | `mint_range<DUSDC>` | withdrawn from `PredictManager` by protocol |
| Creator fee | follower | strategy creator | wrapper follow transaction | separate fee `Coin<DUSDC>` or generic `Coin<T>` |
| Platform fee | follower | RangePilot platform address | wrapper follow transaction | separate fee `Coin<DUSDC>` or generic `Coin<T>` |

The wrapper must not compute fees from DeepBook Predict mint cost unless the protocol exposes that cost directly to the wrapper without reproducing pricing. Phase 3C MVP policy is explicit fee amount only:

1. frontend/SDK passes nonzero `fee_amount` explicitly;
2. wrapper validates `fee_coin.value() >= fee_amount`;
3. wrapper splits `fee_amount` by creator/platform bps;
4. wrapper returns any unused fee coin remainder to the follower.

The hard Phase 3C accounting bound is `10_000` bps for total, creator, and platform fee bps. Final product caps and platform recipient remain `MUST CONFIRM BEFORE PUBLISH`.

## Failure and rollback behavior

The desired Route B follow is one Sui transaction. Fee movement and DeepBook Predict mint happen atomically. If the wrapper transfers fees before calling `predict::mint_range<DUSDC>` and `mint_range` aborts, Sui abort semantics roll back the entire transaction, including fee transfers.

This is why Route B can support paid strategy execution without a separate refund path for failed mints. The frontend must still run official quote + full mint preflight first to avoid avoidable wallet failures.

## MVP on-chain surface

Required on-chain MVP pieces:

- `Strategy` object with creator, range, expiry, quantity, fee policy, metadata pointer, active flag, and creation time.
- `StrategyCreated` event.
- `StrategyFollowed` event emitted after successful wrapper call to DeepBook Predict `mint_range`.
- `StrategyDeactivated` event.
- wrapper-specific fee validation and active-strategy checks.

The wrapper should keep on-chain metadata compact. Long thesis/title/description, images, comments, rankings, and performance dashboards can live in off-chain metadata/indexer systems referenced by URI or hash.

## Later off-chain and analytics surface

These do not need to be on-chain in the MVP:

- creator ranking;
- follower counts;
- total volume;
- strategy PnL aggregation;
- long thesis content;
- screenshots, thumbnails, and social previews;
- creator dashboard analytics;
- strategy search and tags;
- historical performance charts.

These can be derived from RangePilot events, DeepBook Predict `RangeMinted` / `RangeRedeemed` events, public server read models, and direct onchain reads where wallet-critical state is required.

## DeepBook Predict dependency boundary

RangePilot's business model works because DeepBook Predict already owns the market protocol:

- `Predict` is the official trading entrypoint.
- `PredictManager` is the per-user account and position boundary.
- `RangeKey` identifies the vertical range.
- `OracleSVI` supplies live or settled market state.
- `Vault` enforces liquidity, exposure, MTM, max payout, and risk constraints.
- `predict::mint_range<DUSDC>` computes and enforces the official mint path.

RangePilot should monetize strategy routing and creator attribution while preserving this protocol boundary.
