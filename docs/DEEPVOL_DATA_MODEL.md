---
Purpose: Define the DeepVol BTC MOVE data model and Route B receipt fields.
Audience: Move developers, SDK implementers, frontend developers, reviewers, and AI agents.
Status: Aligned with DeepVol-3B local Route B code.
---

# DeepVol Data Model

## Model boundary

The MVP data model is non-custodial but protocol-enforced. A `MoveReceipt` records metadata and linkage to DeepBook Predict positions, while the underlying UP and DOWN binary legs remain in the user's `PredictManager`.

The receipt does not own Predict legs in MVP. It is created only after `receipt::buy_move_receipt<Quote>` internally calls DeepBook Predict mint for both series-derived binary legs in the same transaction.

## Local Route B structs

```move
public struct VolSeries has key { /* fields documented below */ }
public struct MoveReceipt has key { /* fields documented below */ }
public struct AdminCap has key, store { /* DeepVol fee admin */ }
public struct ProtocolVault<phantom T> has key { /* DeepVol Create Fee vault */ }
public struct MoveReceiptCreated has copy, drop { /* fields documented below */ }
public struct MoveReceiptMarkedSettled has copy, drop { /* fields documented below */ }
```

DeepVol-3B implements these fields in `move/deepvol` for local build/test only. The package has not been published and the config keeps deployment IDs null.

## VolSeries

`VolSeries` represents a BTC MOVE product series, not a raw UP, DOWN, or RANGE primitive screen.

Fields:

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

`VolSeries` is the source of truth for receipt leg metadata. DeepVol derives UP from `upper_strike` and DOWN from `lower_strike`.

## ProtocolVault

`deepvol::vault` owns the MVP fee destination.

| Field / type | Purpose |
|---|---|
| `AdminCap` | Publisher/admin capability used to create vaults and withdraw protocol fees. |
| `ProtocolVault<Quote>.id` | Sui object identity for the shared fee vault. |
| `ProtocolVault<Quote>.balance` | DeepVol Create Fee balance for the quote asset. |

`ProtocolVault<Quote>` stores only DeepVol Create Fees. It does not store user Predict positions or Predict payouts.

## MoveReceipt

`MoveReceipt` records one user's protocol-enforced BTC MOVE creation.

Fields:

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
| `quantity` | Quantity minted for each binary leg. |
| `premium_paid` | Actual quote-asset balance delta from the user's `PredictManager` across both internal Predict mints. |
| `create_fee_paid` | Create Fee deposited into DeepVol `ProtocolVault<Quote>`. |
| `created_at_ms` | Timestamp when the receipt was minted. |
| `status` | Local receipt status: `0` active, `1` settled, `2` cancelled/reserved. |

`premium_paid` is not caller-supplied. The entrypoint quotes both legs before minting, then computes final `premium_paid` from `predict_manager::balance<Quote>` before and after the two internal mints. This lets `max_premium_paid`, Create Fee, and the receipt reflect the actual manager balance delta.

## MoveReceiptCreated

`MoveReceiptCreated` is emitted after both binary mints, Create Fee deposit, and receipt construction succeed.

Fields:

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
| `quantity` | Minted quantity for each leg. |
| `premium_paid` | Actual manager balance delta used by the entrypoint. |
| `create_fee_paid` | Fee deposited into DeepVol vault. |
| `timestamp_ms` | Creation timestamp. |

## MoveReceiptMarkedSettled

`MoveReceiptMarkedSettled` is an owner-only status marker. It is not proof of binary redeem or payout.

Fields:

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

The current Move encoding is `0` active, `1` settled, and `2` cancelled/reserved.
