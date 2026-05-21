---
Purpose: Record DeepVol-11 source confirmation and read/preflight validation for guided BTC MOVE redeem.
Audience: Product engineers, protocol integrators, frontend developers, and project planners.
Status: DeepVol-11 source-confirmed redeem preflight artifact; no real redeem executed.
Source of truth relationship: Derived from local DeepBook Predict source snapshot, Sui Testnet read/devInspect evidence, and DeepVol browser buy validation; on-chain state and official source remain authoritative.
---

# DeepVol Redeem Preflight Validation

## Summary

DeepVol-11 source-confirms the DeepBook Predict binary redeem path and adds read-only/devInspect validation for guided BTC MOVE redeem. The validated MVP direction remains guided non-custodial redeem: DeepVol can help users inspect and preflight the underlying UP and DOWN positions, but the positions remain in the user's `PredictManager` and real redeem execution is not enabled in this round.

No real redeem, publish, withdraw, new buy, Move upgrade, or mainnet action was executed.

## Known receipt under test

| Field | Value |
|---|---|
| Network | Sui Testnet |
| Browser buy digest | `A6YB62BqMmWsQeEZUoh4qYAA6n4RMqnih5TtHRdadfGn` |
| Sender / owner | `0x60ce00b02feafce805f1c3c8a7beaf7db8e903d73610fb232ad928d31fcd9349` |
| MoveReceipt | `0xbbc2d18447502830a96602b8f9611e834c509d6fa00abdf2061ecd1addaa35eb` |
| VolSeries | `0x57878763c144cabe06c86d7e02f168d6b42481d779434d8efc8146a10c1ba885` |
| PredictManager | `0xffc0629e53bc703b60d5b135b2def3f6919bb08b5b41c137b5c8563739d6216a` |
| Oracle | `0xc746336e790db7e93a34b684fa3768f43a7c3171d0262d0f2c71dc0a2ab5fe22` |
| Expiry | `1779436800000` |
| UP strike | `76796000000000` |
| DOWN strike | `76696000000000` |
| Receipt quantity | `10000` |
| Receipt premium paid | `9973` atomic DUSDC |
| Receipt Create Fee | `29` atomic DUSDC |

The current `PredictManager` position quantities are manager-level quantities for the known `MarketKey` values. They are not receipt-owned balances because the `MoveReceipt` is non-custodial.

## Source-confirmed entrypoints

From `deepbookv3-predict-testnet-4-16/packages/predict/sources/predict.move`:

```move
public fun get_trade_amounts(
    predict: &Predict,
    oracle: &OracleSVI,
    key: MarketKey,
    quantity: u64,
    clock: &Clock,
): (u64, u64)
```

- Returns `(mint_cost, redeem_payout)`.
- Uses ask price for mint cost and bid price for redeem payout.

```move
public fun redeem<Quote>(
    predict: &mut Predict,
    manager: &mut PredictManager,
    oracle: &OracleSVI,
    key: MarketKey,
    quantity: u64,
    clock: &Clock,
    ctx: &mut TxContext,
)
```

- Owner-only: `ctx.sender() == manager.owner()`.
- Decreases the selected binary position quantity in the `PredictManager`.
- Deposits payout into the same `PredictManager`.
- Emits `PositionRedeemed`.
- This is the DeepVol MVP guided active redeem path.

```move
public fun redeem_permissionless<Quote>(
    predict: &mut Predict,
    manager: &mut PredictManager,
    oracle: &OracleSVI,
    key: MarketKey,
    quantity: u64,
    clock: &Clock,
    ctx: &mut TxContext,
)
```

- Requires `oracle.is_settled()`.
- Does not require the sender to be the manager owner.
- Deposits payout through the permissionless manager deposit path.
- This is not the MVP guided active redeem path.

`redeem_internal` requires positive quantity, matching oracle/key configuration, quoteable oracle state, sufficient position quantity, and vault payout availability. It supports active quoteable oracles and settled oracles. Expired-but-unsettled/pending settlement, inactive, or stale active oracles are blockers.

## Market key derivation

From `deepbookv3-predict-testnet-4-16/packages/predict/sources/market_key/market_key.move`:

```move
public fun up(oracle_id: ID, expiry: u64, strike: u64): MarketKey
public fun down(oracle_id: ID, expiry: u64, strike: u64): MarketKey
```

For the known browser receipt:

| Leg | Constructor | Inputs |
|---|---|---|
| UP | `market_key::up` | oracle `0xc746...fe22`, expiry `1779436800000`, strike `76796000000000` |
| DOWN | `market_key::down` | oracle `0xc746...fe22`, expiry `1779436800000`, strike `76696000000000` |

From `deepbookv3-predict-testnet-4-16/packages/predict/sources/predict_manager.move`:

```move
public fun position(self: &PredictManager, key: MarketKey): u64
```

This read returns the manager's current binary position quantity for the key, or `0` if no position exists.

## Position readback result

Command:

```bash
npm run validate:deepvol-redeem-read
```

Observed result:

| Leg | Strike | Receipt quantity | Direct `predict_manager::position` quantity | Receipt-scoped preflight quantity |
|---|---:|---:|---:|---:|
| UP | `76796000000000` | `10000` | `20000` | `10000` |
| DOWN | `76696000000000` | `10000` | `20000` | `10000` |

The position quantity is `20000` for each leg because this is the current manager-level quantity for those keys. It should not be interpreted as a per-receipt custody balance. DeepVol-11 therefore preflights the receipt-scoped quantity `min(manager position, receipt quantity)` and displays manager quantity separately.

## Payout preview result

Receipt-scoped read mode observed:

| Leg | Receipt-scoped preflight quantity | Redeem payout preview |
|---|---:|---:|
| UP | `10000` | `7700` atomic DUSDC |
| DOWN | `10000` | `1902` atomic DUSDC |

The immediate preflight run observed updated runtime previews:

| Leg | Receipt-scoped preflight quantity | Redeem payout preview |
|---|---:|---:|
| UP | `10000` | `7722` atomic DUSDC |
| DOWN | `10000` | `1904` atomic DUSDC |

These values are runtime-dependent and must be refreshed before any future wallet prompt.

## Preflight result

Command:

```bash
npm run validate:deepvol-redeem-preflight
```

Observed result:

| Leg | Quantity preflighted | Result |
|---|---:|---|
| UP | `10000` | Passed devInspect |
| DOWN | `10000` | Passed devInspect |

The preflight uses `predict::redeem<DUSDC>` in a `devInspectTransactionBlock` path only. It does not sign or execute a transaction. The quantity is receipt-scoped by default, not the aggregate manager-level position quantity.

## PositionRedeemed event shape

Source-confirmed event fields:

```move
public struct PositionRedeemed has copy, drop, store {
    predict_id: ID,
    manager_id: ID,
    owner: address,
    executor: address,
    quote_asset: TypeName,
    oracle_id: ID,
    expiry: u64,
    strike: u64,
    is_up: bool,
    quantity: u64,
    payout: u64,
    bid_price: u64,
    is_settled: bool,
}
```

DeepVol must parse this event and reconcile before/after `PredictManager` position and DUSDC balance readback before treating a future receipt status update as payout evidence.

## Blockers and unknowns

| Topic | Status |
|---|---|
| Source signatures | Source-confirmed for `predict::redeem`, `predict::redeem_permissionless`, `predict::get_trade_amounts`, `predict_manager::position`, and `PositionRedeemed`. |
| Runtime readback | Passed for the known browser receipt's UP/DOWN keys; manager-level quantity is displayed separately from receipt quantity. |
| Runtime payout preview | Passed for receipt-scoped preflight quantity; values are runtime-dependent and must be refreshed at wallet-review time. |
| Runtime redeem preflight | Passed for both receipt-scoped leg quantities by devInspect. |
| Real browser wallet redeem | Not executed in DeepVol-11. Planned for DeepVol-12 only after explicit approval. |
| Per-receipt settlement proof | Not implemented. Requires `PositionRedeemed` event parsing plus before/after position and DUSDC balance reconciliation. |
| Profit Fee | Not enforceable in the non-custodial MVP. |
| General receipt indexing | Not implemented. Portfolio remains known local/reference receipt based. |

## No-real-redeem safety statement

DeepVol-11 executed only object reads and `devInspectTransactionBlock` preflight calls. The validation script has no execute mode and prints `No real redeem executed.` No real redeem, buy, withdraw, publish, upgrade, or mainnet command was run.

## DeepVol-12 next step

DeepVol-12 should run one controlled browser wallet redeem only after approval and after these gates pass in the browser:

1. Read the selected `MoveReceipt`.
2. Read current UP and DOWN `PredictManager` position quantities.
3. Preview redeem payout with `predict::get_trade_amounts`.
4. Run explicit `predict::redeem<DUSDC>` devInspect preflight.
5. Confirm manager DUSDC balance and position quantities before wallet prompt.
6. Execute one approved Testnet redeem through the browser wallet.
7. Parse `PositionRedeemed`.
8. Reconcile payout, manager DUSDC balance delta, and position delta.
9. Only then update local receipt status, clearly labeled as local/indexer-limited until a broader receipt indexer exists.
