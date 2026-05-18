---
Purpose: Define the proposed DeepVol BTC MOVE data model before implementation.
Audience: Move developers, SDK implementers, frontend developers, reviewers, and AI agents.
Status: Proposed MVP model; not yet implemented.
---

# DeepVol Data Model

## Model boundary

The MVP data model is non-custodial. A `MoveReceipt` records metadata and linkage to DeepBook Predict positions, but the underlying UP and DOWN binary legs remain in the user's `PredictManager`.

Receipt does not own the Predict legs in MVP. It records linkage to positions held in the user's `PredictManager`, supports portfolio aggregation, and records fee-accounting metadata for the BTC MOVE structured product.

## Proposed structs

```move
public struct VolSeries has key { /* fields documented below */ }
public struct MoveReceipt has key, store { /* fields documented below */ }
public struct MoveReceiptCreated has copy, drop { /* fields documented below */ }
public struct MoveReceiptSettled has copy, drop { /* fields documented below */ }
```

The exact field types should be finalized during the Move implementation round after binary mint and readback validation.

## VolSeries

`VolSeries` represents a BTC MOVE product series, not a raw UP, DOWN, or RANGE primitive screen.

MVP fields should include:

| Field | Purpose |
|---|---|
| `id` | Sui object identity. |
| `creator` | Address that created or configured the series. |
| `underlying_symbol` or `oracle_id` | BTC series identifier. Use `oracle_id` when binding to a concrete Predict oracle. |
| `expiry` | Predict expiry timestamp for the selected series. |
| `lower_strike` | Strike for the DOWN leg. |
| `upper_strike` | Strike for the UP leg. |
| `quote_asset` | Quote asset metadata or type witness policy for DUSDC MVP. |
| `active` | Whether new receipts can be created for the series. |
| `metadata_uri` | UI/indexer metadata for the BTC MOVE series. |
| `create_fee_bps` | Create Fee in basis points of premium. Suggested MVP value: 30 bps. |
| `created_at` | Timestamp when the series was created. |

## MoveReceipt

`MoveReceipt` records one user's non-custodial BTC MOVE creation.

MVP fields should include:

| Field | Purpose |
|---|---|
| `id` | Sui object identity. |
| `owner` | Receipt owner. |
| `series_id` | Linked `VolSeries` ID. |
| `predict_manager` | User's `PredictManager` that holds the binary legs. |
| `oracle_id` | DeepBook Predict oracle used for both legs. |
| `expiry` | Expiry used for both legs. |
| `lower_strike` | DOWN leg strike. |
| `upper_strike` | UP leg strike. |
| `up_market_key` | Binary UP `MarketKey` or fields needed to reconstruct it. |
| `down_market_key` | Binary DOWN `MarketKey` or fields needed to reconstruct it. |
| `quantity` or `premium_model` | Chosen sizing representation. Must match the binary mint validation model. |
| `premium_paid` | Total premium paid for both Predict legs. |
| `create_fee_paid` | Create Fee deposited into `ProtocolVault`. |
| `created_at` | Timestamp when the receipt was minted. |
| `settlement_status` | MVP status for portfolio guidance, not payout custody. |

## MoveReceiptCreated

`MoveReceiptCreated` should be emitted after both binary legs and receipt creation succeed.

Suggested fields:

| Field | Purpose |
|---|---|
| `receipt_id` | Created receipt object ID. |
| `series_id` | Linked series ID. |
| `owner` | Receipt owner. |
| `predict_manager` | Manager holding the binary positions. |
| `oracle_id` | Predict oracle. |
| `expiry` | Expiry. |
| `lower_strike` | DOWN leg strike. |
| `upper_strike` | UP leg strike. |
| `quantity` | Mint quantity if the sizing model is quantity-based. |
| `premium_paid` | Total premium paid. |
| `create_fee_paid` | Fee deposited to `ProtocolVault`. |

## MoveReceiptSettled

`MoveReceiptSettled` is for a guided DeepVol-mediated settlement path.

Suggested fields:

| Field | Purpose |
|---|---|
| `receipt_id` | Settled receipt object ID. |
| `owner` | Receipt owner. |
| `series_id` | Linked series ID. |
| `up_quantity_redeemed` | UP leg quantity redeemed through the guided path. |
| `down_quantity_redeemed` | DOWN leg quantity redeemed through the guided path. |
| `payout` | Payout observed through the guided path, if available. |
| `settled_at` | Settlement timestamp. |

Because MVP receipts are non-custodial, this event can only prove guided-path settlement. It cannot prove that the user did not redeem directly through DeepBook Predict.

## Settlement status

MVP settlement status should be treated as UI/indexer guidance, not custody truth. Examples:

- `Open`.
- `SettlementAvailable`.
- `SettledViaDeepVol`.
- `PossiblyRedeemedDirectly`.

The final encoding should be chosen during Move implementation.
