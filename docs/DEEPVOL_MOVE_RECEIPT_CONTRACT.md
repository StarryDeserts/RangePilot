---
Purpose: Document the local-only DeepVol Route B VolSeries, ProtocolVault, and MoveReceipt contract.
Audience: Move developers, SDK implementers, protocol integrators, reviewers, and AI agents.
Status: DeepVol-3B local Route B reference; not published.
---

# DeepVol MoveReceipt Contract

## Scope

DeepVol-3B upgrades `move/deepvol` from a metadata-only receipt skeleton to a local-only Route B contract model:

```text
VolSeries-defined BTC MOVE series
+ DeepVol-internal Predict UP mint at upper strike
+ DeepVol-internal Predict DOWN mint at lower strike
+ DeepVol Create Fee deposit
+ owned MoveReceipt
```

The receipt remains non-custodial because the underlying DeepBook Predict positions stay in the user's `PredictManager`. It is protocol-enforced because the public receipt creation path now mints both Predict legs inside `receipt::buy_move_receipt<Quote>` before the receipt is created.

This round does not publish the package and does not submit any chain transaction. The user will manually review publish configuration, publish later, create the quote-asset vault, and provide real deployment values afterward.

## Package boundary

The package is intentionally independent:

- depends on DeepBook Predict and DeepBook packages directly;
- does not depend on `move/rangepilot` or RangePilot Move modules;
- owns DeepVol `errors`, `fees`, `series`, `receipt`, and `vault` modules;
- owns its own `AdminCap` and `ProtocolVault<Quote>` for Create Fee custody;
- does not accept caller-supplied UP/DOWN leg metadata.

DeepVol derives UP from `VolSeries.upper_strike` and DOWN from `VolSeries.lower_strike`. The public SDK builder composes only the DeepVol Route B call; it does not discover quotes, select fee coins, sign, execute, publish, or bypass fresh preflight gates.

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

## ProtocolVault

`deepvol::vault` defines DeepVol-owned fee custody:

| Type | Meaning |
|---|---|
| `AdminCap` | Package admin capability minted to the publisher during package init. |
| `ProtocolVault<Quote>` | Shared quote-asset fee vault that stores Create Fee balances. |

Entrypoints and package functions:

| Function | Behavior |
|---|---|
| `vault::create_protocol_vault<Quote>` | Admin-only creation of a shared `ProtocolVault<Quote>`. |
| `vault::deposit_create_fee<Quote>` | Package-callable deposit used by `receipt::buy_move_receipt<Quote>`. |
| `vault::withdraw_protocol_fees<Quote>` | Admin-only withdrawal from the DeepVol fee vault. |
| `vault::protocol_vault_balance<Quote>` | Read helper returning the current vault balance. |

The vault holds only DeepVol Create Fees. It does not custody Predict positions, Predict payouts, or user manager balances.

## Route B receipt creation

The unsafe public metadata-only `receipt::create_move_receipt` product path is removed. The product path is now:

```move
public entry fun buy_move_receipt<Quote>(
    series: &VolSeries,
    predict: &mut Predict,
    manager: &mut PredictManager,
    oracle: &OracleSVI,
    fee_coin: Coin<Quote>,
    protocol_vault: &mut ProtocolVault<Quote>,
    quantity: u64,
    max_premium_paid: u64,
    clock: &Clock,
    ctx: &mut TxContext,
)
```

The entrypoint enforces this sequence:

1. require active `VolSeries`;
2. require nonzero quantity and nonzero `max_premium_paid`;
3. require `predict_manager::owner(manager) == ctx.sender()`;
4. require the supplied oracle object ID matches `series.oracle_id`;
5. derive UP key with `market_key::up(series.oracle_id, series.expiry, series.upper_strike)`;
6. derive DOWN key with `market_key::down(series.oracle_id, series.expiry, series.lower_strike)`;
7. quote both legs through `predict::get_trade_amounts` immediately before mint and require the quote is within `max_premium_paid`;
8. require the separate `fee_coin<Quote>` covers the Create Fee implied by the quote;
9. read the manager's quote-asset balance before minting;
10. call `predict::mint<Quote>` for the UP leg;
11. call `predict::mint<Quote>` for the DOWN leg;
12. derive `premium_paid` from the manager balance delta and require the actual delta is within `max_premium_paid`;
13. calculate Create Fee from the actual `premium_paid`, deposit it into `ProtocolVault<Quote>`, and return any fee coin remainder;
14. create `MoveReceipt`, emit `MoveReceiptCreated`, and transfer it to the sender.

If either Predict mint or the fee deposit aborts, Sui transaction atomicity prevents the receipt and fee side effects from persisting.

## MoveReceipt

`MoveReceipt` is an owned metadata/linkage object transferred to the buyer. It does not custody or control the underlying DeepBook Predict binary positions.

Fields:

| Field | Meaning |
|---|---|
| `id` | Sui object identity. |
| `owner` | Receipt owner. |
| `series_id` | Linked `VolSeries` ID. |
| `predict_manager_id` | User `PredictManager` that receives the UP/DOWN legs. |
| `oracle_id` | Copied from the series. |
| `expiry` | Copied from the series. |
| `lower_strike` | Copied from the series. |
| `upper_strike` | Copied from the series. |
| `up_strike` | Derived from `upper_strike`. |
| `down_strike` | Derived from `lower_strike`. |
| `quantity` | Quantity minted for each binary leg. |
| `premium_paid` | Actual quote-asset balance delta from the user's `PredictManager` across the two internal Predict mints. |
| `create_fee_paid` | Create Fee deposited into the DeepVol vault. |
| `created_at_ms` | Receipt creation timestamp. |
| `status` | Receipt-local lifecycle status. |

`predict::mint<Quote>` does not return the charged cost, so DeepVol records the actual quote-asset balance delta from `predict_manager::balance<Quote>` before and after the two mints. The immediate quote remains a preflight and early fee-coin coverage check; the receipt, final max-premium cap, and final Create Fee use the actual manager balance delta.

Status constants:

| Status | Value | Meaning |
|---|---:|---|
| `STATUS_ACTIVE` | `0` | Receipt is active/open from DeepVol's metadata perspective. |
| `STATUS_SETTLED` | `1` | Owner marked the receipt settled through DeepVol metadata. |
| `STATUS_CANCELLED` | `2` | Reserved for future lifecycle work. |

Entrypoints:

| Entrypoint | Behavior |
|---|---|
| `receipt::buy_move_receipt<Quote>` | Protocol-enforced receipt creation that internally mints both Predict binary legs, deposits Create Fee, emits `MoveReceiptCreated`, and transfers the receipt to the sender. |
| `receipt::mark_receipt_settled` | Owner-only metadata status update from active to settled; emits `MoveReceiptMarkedSettled`. |

`mark_receipt_settled` is not proof of binary redeem or payout. It is only a receipt-local marker.

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

Integer division means tiny premiums can calculate a zero fee. DeepVol-3B accepts this and does not add a minimum-fee policy.

Predict mint costs are paid from the user's `PredictManager` balance by DeepBook Predict. DeepVol Create Fee is paid separately through `fee_coin<Quote>` and deposited into `ProtocolVault<Quote>`.

## Publish and deployment status

DeepVol-3B writes local code and tests only:

- DeepVol package ID: `null` in config.
- DeepVol protocol vault ID: `null` in config.
- DeepVol admin cap ID: `null` in config.
- no package publish;
- no real `VolSeries` creation;
- no real `MoveReceipt` creation;
- no real DeepVol Route B transaction;
- no real Predict mint in this phase;
- no real ProtocolVault deposit in this phase.

Final publish configuration and deployment object IDs are manual future work. Do not invent package IDs or deployment object IDs.
