---
Purpose: Define RangePilot ProtocolVault and AdminCap fee custody for the creator strategy wrapper.
Audience: Move developers, SDK implementers, frontend developers, reviewers, and product leads.
Status: Phase 3F record; ProtocolVault<DUSDC> is created on Sui Testnet and received the first wrapper follow platform fee.
Source of truth relationship: Supplements wrapper architecture and publish readiness docs; Move source remains authoritative for implemented entrypoints.
---

# ProtocolVault Design

## Current status after DeepVol pivot

`ProtocolVault<T>` is reusable fee treasury infrastructure for DeepVol Create Fee. The validated RangePilot wrapper follow proved the vault can receive protocol fees atomically with an official DeepBook Predict call, but the creator-follow strategy model is no longer the primary product direction.

For DeepVol MVP, `ProtocolVault` should receive the BTC MOVE Create Fee. It should not custody DeepBook Predict binary legs or payouts.

## Role

`ProtocolVault<T>` is a RangePilot wrapper object, not the DeepBook Predict Vault. DeepBook Predict still owns pricing, liquidity, exposure, payout, settlement, and `PredictManager` range-position accounting.

RangePilot `ProtocolVault<T>` only holds the platform split of the explicit RangePilot follow fee. It does not custody follower DeepBook Predict positions or DeepBook mint cost.

## Confirmed fee policy

Phase 3D confirms this Testnet/hackathon policy:

- platform fees deposit into `ProtocolVault<T>`;
- `AdminCap` controls withdrawals;
- no direct platform recipient is chosen at follow time;
- `platform_fee_bps = 10`, which is `0.1%`;
- `MAX_CREATOR_FEE_BPS = 3000`, which is `30%`;
- `300 bps` would be `3%`;
- metadata policy is `metadata_uri` only;
- Strategy objects are shared;
- strategy creation is permissionless;
- the wrapper is upgradeable for the Testnet/hackathon stage, and upgrade authority must be disclosed before publish.

The explicit RangePilot fee base remains separate from the DeepBook Predict mint cost. The wrapper must not compute fee amounts by reimplementing DeepBook Predict pricing.

## Follow transaction fee movement

The validated wrapper follow transaction uses this fee path:

```text
fee Coin<T> passed to wrapper
→ wrapper validates explicit fee_amount > 0
→ wrapper validates fee_coin.value() >= fee_amount
→ wrapper splits fee_amount by creator_fee_bps and fixed platform_fee_bps = 10
→ creator fee transfers to Strategy creator
→ platform fee deposits into ProtocolVault<T>
→ any fee coin remainder returns to the follower
→ wrapper calls DeepBook Predict mint_range<T>
→ wrapper emits StrategyFollowed after mint_range<T> succeeds
```

If DeepBook Predict `mint_range<T>` aborts, the Sui transaction aborts and the creator transfer plus `ProtocolVault<T>` deposit roll back.

## Admin authority

The package initializer mints `AdminCap` to the publisher / transaction sender. Admin operations use `AdminCap`; normal follower transactions do not need it.

Admin-controlled operations:

- create `ProtocolVault<T>` after wrapper publish;
- withdraw platform fees from `ProtocolVault<T>` to a recipient chosen by the admin operation.

The publisher/AdminCap owner address is `0xc558e37d20405a9751c81124ac8d167e2b2d368b834319adafa549449e0715f5`. The AdminCap object is `0xbd825bd9f0ea1846314a02977430e691054e56752d8cf30b483cf211fec880f7`; the UpgradeCap object is `0xd313b4281ea0a9a0918ab7f35651fe8915477d748ec123cb0950197e34c2a741`. AdminCap is a post-publish operational value, not a frontend follower-flow input unless a future explicit admin workflow requires it.

## Current deployment state and non-goals

The wrapper package is published on Sui Testnet at `0xe0b877a06541d184b8c3bec46b81ccca2de38495979c25a658f98923407bf697`. The first shared `ProtocolVault<DUSDC>` object is `0x9430cc42b879c8f70a855230aecf7042e3efcadb41924cb6ff6c66c8e167d992`, created by transaction `5d8W8RtVWHxVjEhpjf6t3qfKzEFuDMdxHGXGJiR6DBe5`. Its initial balance was zero immediately after creation, and Phase 3F wrapper follow digest `997Yu78xbiM57fbJUsVk1eKURcbt8SXdi7Ypb1H74HEB` increased the balance to `1000` atomic DUSDC.

Current non-goals:

- execute unapproved additional `follow_strategy_and_mint<DUSDC>` transactions;
- execute direct top-level DeepBook Predict `mint_range`, `redeem_range`, or `supply`;
- execute `withdraw_platform_fees`;
- use mainnet;
- choose a final platform withdrawal recipient;
- build a vault dashboard;
- implement DeepBook Predict pricing, oracle settlement, vault risk, StrikeMatrix, payout, settlement, or `PredictManager` custody.

## First Testnet follow result

Phase 3F validated the first ProtocolVault deposit through the wrapper follow path:

| Evidence | Result |
|---|---|
| Validation report | [WRAPPER_FOLLOW_TESTNET_VALIDATION.md](./WRAPPER_FOLLOW_TESTNET_VALIDATION.md) |
| Strategy object ID | `0x8402c9475b75beddc0328ac60e0ac743f8e36223ab8fa066800f9b7317cac30a` |
| Strategy create digest | `8yrzb1mfWUdrJZXBKvGC6Y8xFkppDTUmFuA4Gg979zJV` |
| Wrapper follow digest | `997Yu78xbiM57fbJUsVk1eKURcbt8SXdi7Ypb1H74HEB` |
| Creator fee | `10000` atomic DUSDC transferred to creator |
| Platform fee | `1000` atomic DUSDC deposited into `ProtocolVault<DUSDC>` |
| ProtocolVault balance | `0` → `1000` atomic DUSDC |
| DeepBook mint cost | `35` atomic DUSDC withdrawn from follower `PredictManager` |
| Follower range position | `0` → `1000` |
| Events observed | `PlatformFeeDeposited`, `RangeMinted`, `StrategyFollowed` |

Remaining forbidden actions after Phase 3F:

- do not execute unapproved additional `follow_strategy_and_mint` transactions;
- do not execute direct top-level DeepBook Predict `mint_range`, `redeem_range`, or `supply` during wrapper work;
- do not execute `withdraw_platform_fees` without explicit approval;
- do not use mainnet;
- do not run validation scripts that submit non-approved transactions.
