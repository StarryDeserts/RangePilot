---
Purpose: Specify the planned Route B follow_strategy_and_mint transaction flow for the RangePilot wrapper.
Audience: Move developers, SDK implementers, frontend developers, protocol integrators, reviewers, and AI agents.
Status: Phase 3F record; wrapper package, ProtocolVault<DUSDC>, and first wrapper follow are validated on Testnet.
Source of truth relationship: Supplements wrapper architecture and entrypoint binding docs; official DeepBook Predict docs and local source signatures remain authoritative for protocol entrypoints.
---

# Follow Strategy Transaction Flow

Route B means RangePilot's wrapper is the wallet transaction target and the wrapper internally calls DeepBook Predict `mint_range<DUSDC>`. The wrapper owns strategy validation, creator fee transfer, ProtocolVault platform fee deposit, and attribution events. DeepBook Predict owns the actual range mint.

## Inputs

Planned wrapper transaction inputs:

- shared `Strategy` object;
- DeepBook Predict `Predict` shared object;
- user's DeepBook Predict `PredictManager` shared object;
- DeepBook Predict `OracleSVI` object;
- fee `Coin<DUSDC>` or generic fee `Coin<T>`;
- shared RangePilot `ProtocolVault<T>` object for the same fee coin type;
- explicit nonzero fee amount;
- follow quantity;
- `Clock`;
- `TxContext`.

The frontend also needs confirmed config values for Testnet:

- Predict package ID;
- Predict shared object ID;
- DUSDC coin type;
- wrapper package ID `0xe0b877a06541d184b8c3bec46b81ccca2de38495979c25a658f98923407bf697`;
- ProtocolVault<DUSDC> object ID `0x9430cc42b879c8f70a855230aecf7042e3efcadb41924cb6ff6c66c8e167d992`;
- Sui Clock object ID `0x6`.

The wrapper package ID and `ProtocolVault<DUSDC>` object ID are configured in `packages/config/src/rangePilotTestnet.ts`. The package was manually published on Testnet with digest `7kSkeGzzTo3BcVCwC3qZdLh2bZdBpDP2hvMxkG8oB7TV`; the ProtocolVault was created with digest `5d8W8RtVWHxVjEhpjf6t3qfKzEFuDMdxHGXGJiR6DBe5`.

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
9. confirm wrapper package ID and ProtocolVault object ID are configured;
10. block follow if full preflight fails.

Quote success alone must not enable follow.

## Wrapper transaction steps

1. Validate `strategy.active == true`.
2. Validate `quantity > 0`.
3. Validate nonzero explicit `fee_amount`.
4. Validate `fee_coin.value() >= fee_amount`.
5. Validate stored `creator_fee_bps <= 3000`; platform fee bps is protocol-set to `10`.
6. Split the explicit fee base into creator fee and platform fee.
7. Transfer creator fee to `strategy.creator`.
8. Deposit platform fee into `ProtocolVault<T>`.
9. Return any fee coin remainder to the follower.
10. Derive the `RangeKey` from stored Strategy fields:

```move
let key = range_key::new(
    strategy.oracle_id,
    strategy.expiry,
    strategy.lower_strike,
    strategy.higher_strike,
);
```

11. Rely on DeepBook Predict `mint_range` for manager ownership; the local source confirms `mint_range` asserts `ctx.sender() == manager.owner()`.
12. Call DeepBook Predict:

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

13. Emit `StrategyFollowed` only after `mint_range` returns successfully, including `protocol_vault_id`.

## Atomicity

Fee handling and DeepBook Predict minting happen in one Sui transaction. If `mint_range` aborts, the transaction aborts and earlier creator transfer plus ProtocolVault deposit roll back. This avoids partial fee capture for failed mints.

The frontend should still preflight to avoid unnecessary wallet failures, but on-chain atomicity is the final rollback guarantee.

## Fee flow

MVP fee flow:

```text
fee Coin<T> passed to wrapper
→ wrapper validates explicit_fee_amount > 0
→ wrapper validates fee_coin.value() >= explicit_fee_amount
→ wrapper splits explicit_fee_amount using creator_fee_bps and fixed platform_fee_bps = 10
→ wrapper transfers creator fee to creator
→ wrapper deposits platform fee into ProtocolVault<T>
→ wrapper returns any fee coin remainder to follower
→ wrapper calls DeepBook Predict mint_range<T>
```

The wrapper entrypoint remains generic over the fee coin type, and Phase 3F validated the Testnet user path with DUSDC.

The wrapper must not compute fee from DeepBook Predict mint cost by reproducing pricing. The wrapper uses explicit fee amount only; quantity-based tokenomics remain a future product decision.

## Admin operations

`AdminCap` is not part of the follower follow transaction. It is used for admin operations:

- `create_protocol_vault<T>` after wrapper publish;
- `withdraw_platform_fees<T>` for later platform fee withdrawal.

The AdminCap owner / publish address is `0xc558e37d20405a9751c81124ac8d167e2b2d368b834319adafa549449e0715f5`. The AdminCap object is `0xbd825bd9f0ea1846314a02977430e691054e56752d8cf30b483cf211fec880f7`; the UpgradeCap object is `0xd313b4281ea0a9a0918ab7f35651fe8915477d748ec123cb0950197e34c2a741`. These are admin-only objects and are not inputs to a normal follower follow transaction.

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

1. `PlatformFeeDeposited` from RangePilot if the computed platform split is positive.
2. DeepBook Predict `RangeMinted` event from the official protocol.
3. RangePilot `StrategyFollowed` event from the wrapper.

The recommended skeleton emits `StrategyFollowed` after `mint_range` succeeds so the event cannot exist without a successful protocol call.

## First Testnet follow validation

Phase 3F completed the first wrapper follow after wrapper publish and `ProtocolVault<DUSDC>` setup:

| Evidence | Result |
|---|---|
| Validation report | [WRAPPER_FOLLOW_TESTNET_VALIDATION.md](./WRAPPER_FOLLOW_TESTNET_VALIDATION.md) |
| Strategy create digest | `8yrzb1mfWUdrJZXBKvGC6Y8xFkppDTUmFuA4Gg979zJV` |
| Strategy object ID | `0x8402c9475b75beddc0328ac60e0ac743f8e36223ab8fa066800f9b7317cac30a` |
| Follower | `0x4ff903b0dcc52dc8753787baf19b34b7425dfa64d187cc7c726b38413705fa75` |
| Follower PredictManager | `0xd59be0646d948c9be6073edc0cfd253ce4cb00f4929f0bae71f451f50e5d1575` |
| Official quote | Mint cost `35`, redeem value `25` atomic DUSDC |
| Full DeepBook mint preflight | Passed before wrapper submission |
| Wrapper follow preflight | Passed before wrapper submission |
| Wrapper follow digest | `997Yu78xbiM57fbJUsVk1eKURcbt8SXdi7Ypb1H74HEB` |
| Events observed | `PlatformFeeDeposited`, `RangeMinted`, `StrategyFollowed` |
| Follower direct `range_position` | `0` → `1000` |
| ProtocolVault<DUSDC> balance | `0` → `1000` atomic DUSDC |
| Creator DUSDC balance | `500000000` → `500010000` atomic DUSDC |
| Follower manager DUSDC balance | `1000000` → `999965` atomic DUSDC |

Further follow transactions still require fresh official quote, full DeepBook mint preflight, wrapper preflight, explicit user approval, Testnet signer checks, and the same forbidden-action guardrails.

## Public server boundary

The public Predict server is a read model only. It can help render market lists, vault summaries, manager summaries, strategy pages, and history. It must not be treated as a transaction executor or wallet-critical source of active range quantity.

Wallet-critical position checks should use direct `predict_manager::range_position` for a known RangeKey when possible.

## Failure cases

| Failure | Expected behavior |
|---|---|
| Strategy inactive | Wrapper aborts before fee/mint. |
| Quantity zero | Wrapper aborts before fee/mint. |
| Fee below expected amount | Wrapper aborts before mint. |
| Missing wrapper package ID in SDK | SDK refuses to build wrapper PTB. |
| Missing ProtocolVault object ID in SDK | SDK refuses to build wrapper PTB. |
| Non-owner manager | DeepBook Predict `mint_range` aborts. |
| Oracle/range mismatch | DeepBook Predict `mint_range` aborts. |
| Stale or inactive oracle | DeepBook Predict `mint_range` aborts. |
| Ask bounds or vault risk failure | DeepBook Predict `mint_range` aborts. |
| Insufficient manager balance | DeepBook Predict manager withdraw aborts. |

All on-chain failures abort the transaction. Fee transfers and ProtocolVault deposits do not persist after abort.

## Out of scope

- direct real follow transaction in Phase 3D;
- wrapper package publish;
- mainnet;
- custom pricing;
- custom payout;
- custom vault risk;
- position NFTs;
- automated wallet approval;
- ProtocolVault dashboard.
