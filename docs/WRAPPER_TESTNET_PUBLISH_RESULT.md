---
Purpose: Record the RangePilot wrapper Testnet publish and ProtocolVault setup result.
Audience: Move developers, SDK implementers, frontend developers, reviewers, and product leads.
Status: Phase 3F record; wrapper package, ProtocolVault<DUSDC>, first Strategy creation, and first wrapper follow are validated on Testnet.
Source of truth relationship: Records observed Testnet publish and setup facts; Move source, Sui CLI output, and Sui object reads remain authoritative for on-chain state.
---

# Wrapper Testnet Publish Result

## Summary

The RangePilot wrapper package was manually published to Sui Testnet on 2026-05-18 after the earlier controlled publish path was blocked by dependency publication metadata. Post-publish setup created the first shared `ProtocolVault<DUSDC>` using the published wrapper package and confirmed `AdminCap`.

Phase 3F then created the first shared Strategy and executed the first real `follow_strategy_and_mint<DUSDC>` through the RangePilot wrapper. The wrapper follow succeeded with `StrategyFollowed`, `PlatformFeeDeposited`, and DeepBook Predict `RangeMinted` events in the same transaction. No direct top-level DeepBook Predict `mint_range`, DeepBook Predict `redeem_range`, `predict::supply`, `withdraw_platform_fees`, publish, or mainnet transaction was executed during Phase 3F.

## Network and publisher

| Item | Value |
|---|---|
| Network | Testnet |
| Active environment before vault creation | `testnet` |
| Publisher / AdminCap owner | `0xc558e37d20405a9751c81124ac8d167e2b2d368b834319adafa549449e0715f5` |
| Published modules | `errors`, `fees`, `strategy` |
| DUSDC type | `0xe95040085976bfd54a1a07225cd46c8a2b4e8e2b6732f140a0fc49850ba73e1a::dusdc::DUSDC` |

## Publish result

| Item | Value |
|---|---|
| Publish date | 2026-05-18 |
| Publish digest | `7kSkeGzzTo3BcVCwC3qZdLh2bZdBpDP2hvMxkG8oB7TV` |
| Wrapper package ID | `0xe0b877a06541d184b8c3bec46b81ccca2de38495979c25a658f98923407bf697` |
| AdminCap object ID | `0xbd825bd9f0ea1846314a02977430e691054e56752d8cf30b483cf211fec880f7` |
| AdminCap owner | `0xc558e37d20405a9751c81124ac8d167e2b2d368b834319adafa549449e0715f5` |
| UpgradeCap object ID | `0xd313b4281ea0a9a0918ab7f35651fe8915477d748ec123cb0950197e34c2a741` |
| UpgradeCap owner | `0xc558e37d20405a9751c81124ac8d167e2b2d368b834319adafa549449e0715f5` |
| Package object read | Exists on Testnet as immutable package object. |
| AdminCap object read | Exists on Testnet and is address-owned by the publisher/admin address. |
| UpgradeCap object read | Exists on Testnet and is address-owned by the publisher/admin address. |

## ProtocolVault<DUSDC> setup

| Item | Value |
|---|---|
| ProtocolVault creation executed | Yes |
| ProtocolVault creation digest | `5d8W8RtVWHxVjEhpjf6t3qfKzEFuDMdxHGXGJiR6DBe5` |
| ProtocolVault<DUSDC> object ID | `0x9430cc42b879c8f70a855230aecf7042e3efcadb41924cb6ff6c66c8e167d992` |
| ProtocolVault owner | Shared object on Testnet. |
| Initial fee balance | Zero immediately after creation. |

## Phase 3F first wrapper follow validation

| Item | Value |
|---|---|
| Validation report | [WRAPPER_FOLLOW_TESTNET_VALIDATION.md](./WRAPPER_FOLLOW_TESTNET_VALIDATION.md) |
| Creator/admin | `0xc558e37d20405a9751c81124ac8d167e2b2d368b834319adafa549449e0715f5` |
| Follower | `0x4ff903b0dcc52dc8753787baf19b34b7425dfa64d187cc7c726b38413705fa75` |
| Follower PredictManager | `0xd59be0646d948c9be6073edc0cfd253ce4cb00f4929f0bae71f451f50e5d1575` |
| Follower setup | `create_manager` digest `GyeLQTjezd1i4QPNremwKG2eoFVkgTBH2qJAgq4Peobx`; 1 DUSDC deposit digest `9anrncc2RuWhs5e2BBcaWbU1cXAw8EJp4y85USmKVxW3` |
| Strategy create digest | `8yrzb1mfWUdrJZXBKvGC6Y8xFkppDTUmFuA4Gg979zJV` |
| Strategy object ID | `0x8402c9475b75beddc0328ac60e0ac743f8e36223ab8fa066800f9b7317cac30a` |
| Strategy range | Oracle `0xb79524498a9947307e192d8045772150dc47aade4f9e09bd4b6fe3236b9e3125`, expiry `1780646400000`, lower `76708000000000`, higher `77208000000000` |
| Quantity | `1000` |
| Official quote | Mint cost `35`, redeem value `25` atomic DUSDC |
| Full DeepBook mint preflight | Passed before wrapper follow |
| Wrapper follow preflight | Passed before submission |
| Wrapper follow digest | `997Yu78xbiM57fbJUsVk1eKURcbt8SXdi7Ypb1H74HEB` |
| Events observed | `StrategyFollowed`, `PlatformFeeDeposited`, `RangeMinted` |
| ProtocolVault balance | `0` → `1000` atomic DUSDC |
| Creator DUSDC balance | `500000000` → `500010000` atomic DUSDC |
| Follower manager DUSDC balance | `1000000` → `999965` atomic DUSDC |
| Follower direct range_position | `0` → `1000` |

## Config updates

`packages/config/src/rangePilotTestnet.ts` records the post-publish setup values:

- `RANGEPILOT_WRAPPER_PACKAGE_ID = "0xe0b877a06541d184b8c3bec46b81ccca2de38495979c25a658f98923407bf697"`
- `RANGEPILOT_PROTOCOL_VAULT_ID = "0x9430cc42b879c8f70a855230aecf7042e3efcadb41924cb6ff6c66c8e167d992"`
- `RANGEPILOT_ADMIN_CAP_ID = "0xbd825bd9f0ea1846314a02977430e691054e56752d8cf30b483cf211fec880f7"`

`AdminCap` and `UpgradeCap` are admin-only operational objects. Normal follower `follow_strategy_and_mint` transaction builders must not require `AdminCap` or `UpgradeCap`.

## Commands used

Safe setup commands included object reads, the approved Testnet `create_protocol_vault<DUSDC>` call, repository verification, and git guardrails. The only write transaction in this setup round was:

```text
0xe0b877a06541d184b8c3bec46b81ccca2de38495979c25a658f98923407bf697::strategy::create_protocol_vault<0xe95040085976bfd54a1a07225cd46c8a2b4e8e2b6732f140a0fc49850ba73e1a::dusdc::DUSDC>
```

## Verification status

Repository verification for the Phase 3F config/docs/script update must be rerun before final commit:

- `npm run typecheck`
- `npm run build:web`
- `npm run move:build:rangepilot`
- `npm run move:test:rangepilot`

Object checks confirmed the wrapper package, AdminCap, UpgradeCap, and ProtocolVault objects exist on Testnet. Phase 3F validation confirmed the first Strategy object is shared and that the wrapper follow moved fees and minted the DeepBook Predict range position.

## Security and non-actions

- No wallet recovery phrases, private keys, signatures, or raw transaction bytes were printed or committed.
- `.env.local`, `.env*`, `.local/`, `.claude/`, `.trace/`, `.traces/`, `deepbookv3-predict-package/`, and `deepbookv3-predict-testnet-4-16/` were not read or staged.
- No `sui client publish` command was run in this post-publish setup round.
- Phase 3F executed exactly one approved wrapper `follow_strategy_and_mint<DUSDC>` transaction.
- No direct top-level DeepBook Predict `mint_range`, `redeem_range`, or `supply` transaction was executed.
- No `withdraw_platform_fees` transaction was executed.
- No mainnet transaction was executed.

## Next step

Build the creator/follower UI around the validated wrapper path: create or select a shared Strategy, run fresh official quote preview and full DeepBook Predict `mint_range<DUSDC>` preflight, build the wrapper `follow_strategy_and_mint<DUSDC>` transaction only after gates pass, and verify RangePilot plus DeepBook Predict events after wallet execution.
