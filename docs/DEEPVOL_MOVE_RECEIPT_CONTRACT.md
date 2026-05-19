---
Purpose: Document the local-only DeepVol VolSeries and MoveReceipt contract skeleton.
Audience: Move developers, SDK implementers, protocol integrators, reviewers, and AI agents.
Status: DeepVol-3 local skeleton reference; not published.
---

# DeepVol MoveReceipt Contract

## Scope

DeepVol-3 adds a local-only Sui Move package at `move/deepvol` for the first DeepVol protocol skeleton. It defines `VolSeries`, non-custodial `MoveReceipt`, receipt lifecycle events, and Create Fee accounting metadata.

This round does not publish the package and does not submit any chain transaction. The user will manually review and configure the final publish `Move.toml`, publish the package in a later phase, and provide real deployment values afterward.

## Package boundary

The package is intentionally independent in this round:

- no DeepBook Predict dependency;
- no RangePilot wrapper dependency;
- no ProtocolVault dependency;
- no coin transfer or vault deposit;
- no `predict::mint`, `predict::redeem`, `predict_manager::position`, `market_key::up`, or `market_key::down` call.

DeepVol-4 is expected to compose the already validated binary-leg mint path, Create Fee routing, and receipt creation into an atomic PTB or wrapper-mediated flow.

## VolSeries

`VolSeries` is a shared object describing one BTC MOVE product series.

Fields:

| Field | Meaning |
|---|---|
| `id` | Sui object identity. |
| `creator` | Address that created the series. |
| `oracle_id` | DeepBook Predict oracle ID this series refers to. |
| `expiry` | Expiry timestamp in milliseconds. |
| `lower_strike` | DOWN leg strike. |
| `upper_strike` | UP leg strike. |
| `metadata_uri` | Nonempty metadata URI bytes for UI/indexer data. |
| `create_fee_bps` | Create Fee basis points for this series. |
| `active` | Whether new receipts can be created. |
| `created_at_ms` | Creation timestamp from `Clock`. |

Validation rules:

- `metadata_uri` must be nonempty.
- `lower_strike < upper_strike`.
- `expiry > Clock.timestamp_ms()`.
- `create_fee_bps <= 100` through `deepvol::fees`.
- only the creator can deactivate the series.

Entrypoints:

| Entrypoint | Behavior |
|---|---|
| `series::create_series` | Creates and shares a validated `VolSeries`, then emits `VolSeriesCreated`. |
| `series::deactivate_series` | Creator-only state update that sets `active = false` and emits `VolSeriesDeactivated`. |

Events:

- `VolSeriesCreated`: `series_id`, `creator`, `oracle_id`, `expiry`, `lower_strike`, `upper_strike`, `metadata_uri`, `create_fee_bps`, `created_at_ms`.
- `VolSeriesDeactivated`: `series_id`, `creator`, `timestamp_ms`.

## MoveReceipt

`MoveReceipt` is an owned metadata object transferred to the creator of the receipt. It does not custody or control the underlying DeepBook Predict binary positions.

Fields:

| Field | Meaning |
|---|---|
| `id` | Sui object identity. |
| `owner` | Receipt owner. |
| `series_id` | Linked `VolSeries` ID. |
| `predict_manager_id` | User `PredictManager` expected to hold the UP/DOWN legs. |
| `oracle_id` | Copied from the series. |
| `expiry` | Copied from the series. |
| `lower_strike` | Copied from the series. |
| `upper_strike` | Copied from the series. |
| `up_strike` | Derived from `upper_strike`. |
| `down_strike` | Derived from `lower_strike`. |
| `quantity` | Quantity recorded for both binary legs. |
| `premium_paid` | Total premium recorded for the UP + DOWN mint. |
| `create_fee_paid` | Create Fee calculated from `premium_paid` and the series fee bps. |
| `created_at_ms` | Receipt creation timestamp. |
| `status` | Receipt-local lifecycle status. |

Status constants:

| Status | Value | Meaning |
|---|---:|---|
| `STATUS_ACTIVE` | `0` | Receipt is active/open from DeepVol's metadata perspective. |
| `STATUS_SETTLED` | `1` | Owner marked the receipt settled through the local skeleton path. |
| `STATUS_CANCELLED` | `2` | Reserved for future lifecycle work. |

Entrypoints:

| Entrypoint | Behavior |
|---|---|
| `receipt::create_move_receipt` | Requires an active series, nonzero quantity, and nonzero premium; calculates Create Fee; emits `MoveReceiptCreated`; transfers the receipt to the sender. |
| `receipt::mark_receipt_settled` | Owner-only skeleton status update from active to settled; emits `MoveReceiptMarkedSettled`. |

Events:

- `MoveReceiptCreated`: `receipt_id`, `owner`, `series_id`, `predict_manager_id`, `oracle_id`, `expiry`, `lower_strike`, `upper_strike`, `up_strike`, `down_strike`, `quantity`, `premium_paid`, `create_fee_paid`, `timestamp_ms`.
- `MoveReceiptMarkedSettled`: `receipt_id`, `owner`, `timestamp_ms`.

## Non-custodial boundary

The receipt is not a tradable claim token in the MVP. The user's DeepBook Predict UP and DOWN positions remain in the user's `PredictManager`.

Portfolio and settlement UX must still read current binary quantities from `predict_manager::position` using `MarketKey` values for:

- UP: `market_key::up(oracle_id, expiry, upper_strike)`;
- DOWN: `market_key::down(oracle_id, expiry, lower_strike)`.

A receipt can record the intended linkage and premium, but it cannot prove current quantity after a user redeems directly through DeepBook Predict.

## Create Fee

`deepvol::fees` defines:

| Constant | Value |
|---|---:|
| `BPS_DENOMINATOR` | `10000` |
| `DEFAULT_CREATE_FEE_BPS` | `30` |
| `MAX_CREATE_FEE_BPS` | `100` |

`calculate_create_fee(premium_paid, create_fee_bps)` requires `premium_paid > 0`, enforces the max fee bps, and returns:

```text
premium_paid * create_fee_bps / 10000
```

Integer division means tiny premiums can calculate a zero fee. DeepVol-3 records the calculated value only; actual ProtocolVault deposit, fee coin handling, and any minimum-fee policy are future transaction-composition work.

## Publish and deployment status

DeepVol-3 writes local code and tests only:

- DeepVol package ID: `null` in config.
- DeepVol protocol vault ID: `null` in config.
- no package publish;
- no real `VolSeries` creation;
- no real `MoveReceipt` creation;
- no DeepBook Predict mint/redeem call;
- no ProtocolVault deposit.

Final publish configuration is manual future work. Do not invent package IDs or deployment object IDs.
