---
Purpose: Specify the planned Route B follow_strategy_and_mint transaction flow for the RangePilot wrapper.
Audience: Move developers, SDK implementers, frontend developers, protocol integrators, reviewers, and AI agents.
Status: Draft transaction-flow reference for Phase 3A/B skeleton; not published or executed.
Source of truth relationship: Supplements wrapper architecture and entrypoint binding docs; official DeepBook Predict docs and local source signatures remain authoritative for protocol entrypoints.
---

# Follow Strategy Transaction Flow

Route B means RangePilot's wrapper is the wallet transaction target and the wrapper internally calls DeepBook Predict `mint_range<DUSDC>`. The wrapper owns strategy validation, fee policy, and attribution events. DeepBook Predict owns the actual range mint.

## Inputs

Planned wrapper transaction inputs:

- `Strategy` object;
- DeepBook Predict `Predict` shared object;
- user's DeepBook Predict `PredictManager` shared object;
- DeepBook Predict `OracleSVI` object;
- fee `Coin<DUSDC>` or generic fee `Coin<T>`;
- explicit fee amount or quantity-based fee inputs;
- follow quantity;
- `Clock`;
- `TxContext`.

The frontend also needs confirmed config values for Testnet:

- Predict package ID;
- Predict shared object ID;
- DUSDC coin type;
- wrapper package ID after future publish;
- Sui Clock object ID `0x6`.

The wrapper package ID is `TBD` until a future explicit publish round.

## Pre-transaction frontend gates

Before wallet approval, the frontend must run the official DeepBook Predict gates:

1. confirm wallet and app are on Sui Testnet;
2. confirm user has a `PredictManager`;
3. confirm manager DUSDC balance can cover DeepBook Predict mint cost;
4. derive RangeKey from Strategy fields;
5. call official `predict::get_range_trade_amounts` for quote preview;
6. require positive mint cost;
7. run full `predict::mint_range<DUSDC>` devInspect preflight;
8. show creator/platform fee separately from mint cost;
9. block follow if full preflight fails.

Quote success alone must not enable follow.

## Wrapper transaction steps

1. Validate `strategy.active == true`.
2. Validate `quantity > 0`.
3. Validate strategy params by deriving the `RangeKey` from stored Strategy fields:

```move
let key = range_key::new(
    strategy.oracle_id,
    strategy.expiry,
    strategy.lower_strike,
    strategy.higher_strike,
);
```

4. Validate the caller owns `PredictManager` if the wrapper can do so directly; otherwise rely on DeepBook Predict `mint_range` owner check. The local source confirms `mint_range` asserts `ctx.sender() == manager.owner()`.
5. Validate creator/platform fee bps or explicit fee amount without computing DeepBook Predict pricing.
6. Split and transfer fee coin if fee routing is implemented in this skeleton.
7. Call DeepBook Predict:

```move
predict::mint_range<T>(
    predict,
    manager,
    oracle,
    key,
    quantity,
    clock,
    ctx,
);
```

8. Emit `StrategyFollowed` only after `mint_range` returns successfully.

## Atomicity

Fee handling and DeepBook Predict minting happen in one Sui transaction. If `mint_range` aborts, the transaction aborts and earlier fee transfers roll back. This avoids partial fee capture for failed mints.

The frontend should still preflight to avoid unnecessary wallet failures, but the on-chain atomicity is the final rollback guarantee.

## Fee flow

Recommended MVP fee flow:

```text
fee Coin<T> passed to wrapper
→ wrapper validates fee_coin.value() >= explicit_fee_amount
→ wrapper splits creator fee and platform fee from the fee coin
→ wrapper transfers split fees to creator and platform recipient
→ wrapper returns any remainder to follower or destroys zero remainder by normal coin flow
→ wrapper calls DeepBook Predict mint_range<T>
```

The fee type may be generic in the skeleton. Product docs expect DUSDC for the Testnet user path, but concrete DUSDC source dependencies may require future compile/publish confirmation.

The wrapper must not compute fee from DeepBook Predict mint cost by reproducing pricing. Use explicit fee amount or a simple quantity-based policy until a safe protocol-exposed basis is confirmed.

## DeepBook Predict mint behavior

The local source confirms `predict::mint_range<Quote>` performs these protocol checks and mutations:

- checks manager ownership;
- checks trading pause;
- checks nonzero quantity;
- checks quote asset is accepted;
- checks RangeKey matches OracleSVI;
- checks oracle is live;
- inserts range exposure into Vault;
- refreshes oracle risk;
- recomputes range ask after the trade is inserted;
- enforces ask bounds;
- withdraws cost from `PredictManager`;
- accepts payment into Vault;
- checks total exposure;
- increases the manager range position;
- emits `RangeMinted`.

RangePilot should not duplicate these checks except for user-facing preflight diagnostics.

## Events in a successful transaction

A successful follow transaction should produce at least:

1. DeepBook Predict `RangeMinted` event from the official protocol.
2. RangePilot `StrategyFollowed` event from the wrapper.

Event order should be wrapper implementation dependent, but the recommended skeleton emits `StrategyFollowed` after `mint_range` succeeds so the event cannot exist without a successful protocol call.

## Public server boundary

The public Predict server is a read model only. It can help render market lists, vault summaries, manager summaries, strategy pages, and history. It must not be treated as a transaction executor or wallet-critical source of active range quantity.

Wallet-critical position checks should use direct `predict_manager::range_position` for a known RangeKey when possible.

## Failure cases

| Failure | Expected behavior |
|---|---|
| Strategy inactive | Wrapper aborts before fee/mint. |
| Quantity zero | Wrapper aborts before fee/mint. |
| Fee below expected amount | Wrapper aborts before mint. |
| Non-owner manager | DeepBook Predict `mint_range` aborts. |
| Oracle/range mismatch | DeepBook Predict `mint_range` aborts. |
| Stale or inactive oracle | DeepBook Predict `mint_range` aborts. |
| Ask bounds or vault risk failure | DeepBook Predict `mint_range` aborts. |
| Insufficient manager balance | DeepBook Predict manager withdraw aborts. |

All failures abort the transaction. Fee transfers do not persist after abort.

## Out of scope

- direct real follow transaction in Phase 3A/B;
- wrapper package publish;
- mainnet;
- custom pricing;
- custom payout;
- custom vault risk;
- position NFTs;
- automated wallet approval.
