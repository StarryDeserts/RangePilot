---
Purpose: Record the DeepBook Predict binary-leg entrypoints DeepVol depends on.
Audience: Move developers, SDK implementers, frontend developers, reviewers, and AI agents.
Status: Source-confirmed entrypoints; binary mint/redeem still require dedicated Testnet validation before production coding.
---

# DeepVol Binary Leg Integration

## Why this matters

DeepVol BTC MOVE depends on composing two DeepBook Predict binary legs:

```text
Long UP above upper strike
+
Long DOWN below lower strike
=
BTC MOVE exposure
```

Range mint has been validated end-to-end through the existing RangePilot wrapper work. Binary mint is now DeepVol-critical and still needs a dedicated validation round before production DeepVol coding.

## Source-confirmed binary key construction

`MarketKey` identifies a binary option position with:

- `oracle_id`;
- `expiry`;
- `strike`;
- `direction`.

Source-confirmed constructors:

| Function | Purpose |
|---|---|
| `market_key::up(oracle_id, expiry, strike)` | Construct an UP binary key. |
| `market_key::down(oracle_id, expiry, strike)` | Construct a DOWN binary key. |
| `market_key::new(oracle_id, expiry, strike, is_up)` | Construct UP when `is_up = true`; DOWN when `is_up = false`. |

Source-confirmed direction constants are `DIRECTION_UP = 0` and `DIRECTION_DOWN = 1`. DeepVol SDK and Move code should prefer constructors instead of hardcoded direction values where possible.

## UP / DOWN semantics for BTC MOVE

- UP leg: long above the upper strike.
- DOWN leg: long below the lower strike.

A BTC MOVE Receipt should record both keys or the fields needed to reconstruct them.

## Quote preview method

Binary quote preview is source-confirmed as:

```move
predict::get_trade_amounts(
    predict: &Predict,
    oracle: &OracleSVI,
    key: MarketKey,
    quantity: u64,
    clock: &Clock,
): (u64, u64)
```

The return values are the mint cost and redeem payout for the binary market at the requested quantity.

DeepVol should preview both legs before mint:

1. `market_key::up(oracle_id, expiry, upper_strike)`.
2. `predict::get_trade_amounts` for the UP key.
3. `market_key::down(oracle_id, expiry, lower_strike)`.
4. `predict::get_trade_amounts` for the DOWN key.

## Binary mint entrypoint

Binary mint is source-confirmed as:

```move
predict::mint<Quote>(
    predict: &mut Predict,
    manager: &mut PredictManager,
    oracle: &OracleSVI,
    key: MarketKey,
    quantity: u64,
    clock: &Clock,
    ctx: &mut TxContext,
)
```

Required objects and type parameters:

| Item | Role |
|---|---|
| `Predict` | Shared DeepBook Predict trading object. |
| `PredictManager` | User manager that pays premium and receives binary position quantity. |
| `OracleSVI` | Oracle object for the selected BTC market. |
| `MarketKey` | UP or DOWN binary key. |
| `Clock` | Sui clock object. |
| `Quote` | Quote asset type parameter, DUSDC for current Testnet integration. |

The mint entrypoint checks manager ownership, trading pause state, positive quantity, quote asset, oracle/key match, live oracle state, mintable ask, manager balance, and vault exposure limits. DeepVol must not duplicate that pricing/risk logic.

## Binary redeem entrypoints

Source-confirmed binary redeem functions:

```move
predict::redeem<Quote>(
    predict: &mut Predict,
    manager: &mut PredictManager,
    oracle: &OracleSVI,
    key: MarketKey,
    quantity: u64,
    clock: &Clock,
    ctx: &mut TxContext,
)
```

```move
predict::redeem_permissionless<Quote>(
    predict: &mut Predict,
    manager: &mut PredictManager,
    oracle: &OracleSVI,
    key: MarketKey,
    quantity: u64,
    clock: &Clock,
    ctx: &mut TxContext,
)
```

`redeem` is owner-mediated. `redeem_permissionless` requires the oracle to be settled and deposits through the permissionless manager path.

DeepVol MVP can guide redeem, but non-custodial receipts cannot force users to redeem through DeepVol.

## Manager readback

Binary position readback is source-confirmed as:

```move
predict_manager::position(self: &PredictManager, key: MarketKey): u64
```

DeepVol portfolio should read both:

- UP key quantity.
- DOWN key quantity.

The `MoveReceipt` should not be treated as authoritative for current binary balances because the underlying legs remain in the user's `PredictManager`.

## Events

Source-confirmed binary lifecycle events:

| Event | Meaning |
|---|---|
| `PositionMinted` | Binary position minted for a manager. |
| `PositionRedeemed` | Binary position redeemed for a manager. |

A later SDK implementation should normalize these events and link them with DeepVol receipt events by transaction digest and fields.

## Preflight gates for later implementation

Before any production DeepVol mint flow:

1. Confirm active BTC oracle and expiry at runtime.
2. Construct UP key from upper strike.
3. Construct DOWN key from lower strike.
4. Preview UP leg with `predict::get_trade_amounts`.
5. Preview DOWN leg with `predict::get_trade_amounts`.
6. Ensure both mint costs are nonzero.
7. Ensure manager DUSDC balance covers total premium.
8. Ensure fee coin covers Create Fee.
9. DevInspect the full two-leg PTB before wallet approval.
10. After mint, read back both quantities through `predict_manager::position`.
11. Verify expected `PositionMinted` events or direct position increases.

## Comparison with validated range flow

Validated prior work:

- Range quote and range mint preflight.
- Range wrapper follow transaction.
- `StrategyFollowed`, `PlatformFeeDeposited`, and DeepBook `RangeMinted` event evidence.
- Direct `predict_manager::range_position` readback.

DeepVol-specific remaining work:

- Binary mint PTB validation.
- Binary redeem validation.
- Binary event parsing in SDK.
- Binary direct readback helper in SDK.
- Non-custodial receipt creation around the two-leg mint path.

## Open blockers

- Active BTC oracle, expiry, and strikes are `MUST CONFIRM AT RUNTIME`.
- Full two-leg binary mint PTB is `MUST CONFIRM BEFORE CODING` production DeepVol flows.
- Binary redeem path and post-settlement behavior are `MUST CONFIRM BEFORE CODING` guided settlement UX.
- Final `MoveReceipt` field types are `MUST CONFIRM BEFORE CODING` after the binary validation harness is designed.
