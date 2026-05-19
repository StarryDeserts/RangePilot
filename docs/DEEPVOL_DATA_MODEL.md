---
Purpose: Define the DeepVol BTC MOVE data model and local skeleton fields.
Audience: Move developers, SDK implementers, frontend developers, reviewers, and AI agents.
Status: Aligned with the DeepVol-3 local MoveReceipt skeleton.
---

# DeepVol Data Model

## Model boundary

The MVP data model is non-custodial. A `MoveReceipt` records metadata and linkage to DeepBook Predict positions, but the underlying UP and DOWN binary legs remain in the user's `PredictManager`.

Receipt does not own the Predict legs in MVP. It records linkage to positions held in the user's `PredictManager`, supports portfolio aggregation, and records fee-accounting metadata for the BTC MOVE structured product.

## Local skeleton structs

```move
public struct VolSeries has key { /* fields documented below */ }
public struct MoveReceipt has key { /* fields documented below */ }
public struct MoveReceiptCreated has copy, drop { /* fields documented below */ }
public struct MoveReceiptMarkedSettled has copy, drop { /* fields documented below */ }
```

DeepVol-3 implements these fields in `move/deepvol` for local build/test only. The package has not been published and the config keeps deployment IDs null.

## VolSeries

`VolSeries` represents a BTC MOVE product series, not a raw UP, DOWN, or RANGE primitive screen.

MVP fields should include:

| Field | Purpose |
|---|---|
| `id` | Sui object identity. |
| `creator` | Address that created or configured the series. |
| `oracle_id` | Concrete DeepBook Predict oracle ID. |
| `expiry` | Predict expiry timestamp for the selected series. |
| `lower_strike` | Strike for the DOWN leg. |
| `upper_strike` | Strike for the UP leg. |
| `metadata_uri` | UI/indexer metadata for the BTC MOVE series. |
| `create_fee_bps` | Create Fee in basis points of premium. Default MVP value: 30 bps; max: 100 bps. |
| `active` | Whether new receipts can be created for the series. |
| `created_at_ms` | Timestamp when the series was created. |

## MoveReceipt

`MoveReceipt` records one user's non-custodial BTC MOVE creation.

MVP fields should include:

| Field | Purpose |
|---|---|
| `id` | Sui object identity. |
| `owner` | Receipt owner. |
| `series_id` | Linked `VolSeries` ID. |
| `predict_manager_id` | User's `PredictManager` that holds the binary legs. |
| `oracle_id` | DeepBook Predict oracle used for both legs. |
| `expiry` | Expiry used for both legs. |
| `lower_strike` | DOWN leg strike. |
| `upper_strike` | UP leg strike. |
| `up_strike` | UP leg strike, derived from `upper_strike`. |
| `down_strike` | DOWN leg strike, derived from `lower_strike`. |
| `quantity` | Quantity recorded for both binary legs. |
| `premium_paid` | Total premium paid for both Predict legs. |
| `create_fee_paid` | Create Fee calculated/recorded in DeepVol-3; ProtocolVault deposit is future work. |
| `created_at_ms` | Timestamp when the receipt was minted. |
| `status` | Local receipt status: `0` active, `1` settled, `2` cancelled/reserved. |

## MoveReceiptCreated

`MoveReceiptCreated` should be emitted after both binary legs and receipt creation succeed.

Suggested fields:

| Field | Purpose |
|---|---|
| `receipt_id` | Created receipt object ID. |
| `series_id` | Linked series ID. |
| `owner` | Receipt owner. |
| `predict_manager_id` | Manager holding the binary positions. |
| `oracle_id` | Predict oracle. |
| `expiry` | Expiry. |
| `lower_strike` | DOWN leg strike. |
| `upper_strike` | UP leg strike. |
| `up_strike` | Derived UP leg strike. |
| `down_strike` | Derived DOWN leg strike. |
| `quantity` | Mint quantity if the sizing model is quantity-based. |
| `premium_paid` | Total premium paid. |
| `create_fee_paid` | Fee calculated/recorded for future vault routing. |
| `timestamp_ms` | Creation timestamp. |

## MoveReceiptMarkedSettled

`MoveReceiptMarkedSettled` is the DeepVol-3 local skeleton event for an owner-only status update. It is not proof of binary redeem or payout.

Suggested fields:

| Field | Purpose |
|---|---|
| `receipt_id` | Settled receipt object ID. |
| `owner` | Receipt owner. |
| `timestamp_ms` | Settlement-marker timestamp. |

Because MVP receipts are non-custodial, this event can only prove the local receipt status marker changed. It cannot prove that the user redeemed or did not redeem directly through DeepBook Predict.

## Settlement status

MVP settlement status should be treated as UI/indexer guidance, not custody truth. Examples:

- `Open`.
- `SettlementAvailable`.
- `SettledViaDeepVol`.
- `PossiblyRedeemedDirectly`.

The final encoding should be chosen during Move implementation.
