---
Purpose: Record the first RangePilot wrapper follow_strategy_and_mint<DUSDC> Testnet validation.
Audience: Move developers, SDK implementers, frontend developers, protocol integrators, reviewers, product leads, and AI agents.
Status: Phase 3F validation record; first shared Strategy and first wrapper follow succeeded on Sui Testnet.
Source of truth relationship: Records observed Testnet transaction results; Move source, Sui transaction effects, Sui object reads, and direct readback remain authoritative for on-chain state.
---

# Wrapper Follow Testnet Validation

## Current status after DeepVol pivot

This document is preserved as historical validation evidence. It proves the RangePilot wrapper can atomically collect fees, deposit into `ProtocolVault`, call DeepBook Predict, and link product events with protocol events.

It is not the new primary product direction. ADR-0003 pivots the project to DeepVol BTC MOVE because public creator Strategy parameters are copyable and high follow fees are easy to bypass.

## Summary

Phase 3F validated the first real RangePilot Route B wrapper follow on Sui Testnet. The admin/creator created a shared Strategy, the follower address executed `follow_strategy_and_mint<DUSDC>` through the RangePilot wrapper after fresh official quote and full DeepBook Predict mint preflight gates, and post-state confirmed RangePilot fee custody plus DeepBook Predict position ownership.

The successful wrapper follow emitted RangePilot `PlatformFeeDeposited`, DeepBook Predict `RangeMinted`, and RangePilot `StrategyFollowed` in the same transaction. Direct readback confirmed the follower `PredictManager` range position increased from `0` to `1000`, the shared `ProtocolVault<DUSDC>` balance increased from `0` to `1000` atomic DUSDC, and the creator DUSDC balance increased by `10000` atomic DUSDC.

## Network and deployment values

| Item | Value |
|---|---|
| Network | Sui Testnet |
| Wrapper package ID | `0xe0b877a06541d184b8c3bec46b81ccca2de38495979c25a658f98923407bf697` |
| Publish digest | `7kSkeGzzTo3BcVCwC3qZdLh2bZdBpDP2hvMxkG8oB7TV` |
| ProtocolVault<DUSDC> object ID | `0x9430cc42b879c8f70a855230aecf7042e3efcadb41924cb6ff6c66c8e167d992` |
| ProtocolVault creation digest | `5d8W8RtVWHxVjEhpjf6t3qfKzEFuDMdxHGXGJiR6DBe5` |
| Predict package ID | `0xf5ea2b3749c65d6e56507cc35388719aadb28f9cab873696a2f8687f5c785138` |
| Predict object ID | `0xc8736204d12f0a7277c86388a68bf8a194b0a14c5538ad13f22cbd8e2a38028a` |
| DUSDC type | `0xe95040085976bfd54a1a07225cd46c8a2b4e8e2b6732f140a0fc49850ba73e1a::dusdc::DUSDC` |
| Sui Clock | `0x6` |

## Participants

| Role | Address / object |
|---|---|
| Creator/admin address | `0xc558e37d20405a9751c81124ac8d167e2b2d368b834319adafa549449e0715f5` |
| AdminCap | `0xbd825bd9f0ea1846314a02977430e691054e56752d8cf30b483cf211fec880f7` |
| UpgradeCap | `0xd313b4281ea0a9a0918ab7f35651fe8915477d748ec123cb0950197e34c2a741` |
| Follower address | `0x4ff903b0dcc52dc8753787baf19b34b7425dfa64d187cc7c726b38413705fa75` |
| Follower PredictManager | `0xd59be0646d948c9be6073edc0cfd253ce4cb00f4929f0bae71f451f50e5d1575` |

## Workspace source-state handling

The round began with unstaged `move/rangepilot/Move.toml` and `move/rangepilot/Move.lock` changes left from the publish setup. The diff replaced the committed official DeepBookV3 Git/Testnet dep-replacement configuration with local `../predict` / `../deepbook` style dependency state, while publish metadata was already preserved in `move/rangepilot/Published.toml` and deployment docs.

Those two files were classified as local publish-workaround residue and restored with a targeted restore of only `move/rangepilot/Move.toml` and `move/rangepilot/Move.lock`. No blanket reset, force cleanup, or forbidden local path staging was used.

Baseline verification after this cleanup passed:

| Command | Result |
|---|---|
| `npm run typecheck` | Passed |
| `npm run build:web` | Passed with the existing acceptable Vite chunk-size warning |
| `npm run move:build:rangepilot` | Passed |
| `npm run move:test:rangepilot` | Passed with 18 tests |

## Follower manager and DUSDC readiness

The follower initially had wallet DUSDC and SUI gas but no discovered `PredictManager`. The approved minimal setup actions were executed as the follower on Testnet:

| Setup action | Result |
|---|---|
| `predict::create_manager` | Digest `GyeLQTjezd1i4QPNremwKG2eoFVkgTBH2qJAgq4Peobx` |
| Created PredictManager | `0xd59be0646d948c9be6073edc0cfd253ce4cb00f4929f0bae71f451f50e5d1575` |
| `predict_manager::deposit<DUSDC>` | Digest `9anrncc2RuWhs5e2BBcaWbU1cXAw8EJp4y85USmKVxW3` |
| Deposited amount | `1000000` atomic DUSDC |
| Manager DUSDC after setup | `1000000` atomic DUSDC |

No direct `predict::mint_range`, `predict::redeem_range`, `predict::supply`, `withdraw_platform_fees`, publish, or mainnet transaction was executed during setup.

## Strategy creation result

| Item | Value |
|---|---|
| Creator | `0xc558e37d20405a9751c81124ac8d167e2b2d368b834319adafa549449e0715f5` |
| Transaction target | `0xe0b877a06541d184b8c3bec46b81ccca2de38495979c25a658f98923407bf697::strategy::create_strategy` |
| Create digest | `8yrzb1mfWUdrJZXBKvGC6Y8xFkppDTUmFuA4Gg979zJV` |
| Strategy object ID | `0x8402c9475b75beddc0328ac60e0ac743f8e36223ab8fa066800f9b7317cac30a` |
| Strategy ownership | Shared object |
| Creator fee bps | `100` |
| Platform fee bps | `10` |
| Default quantity | `1000` |
| Metadata URI | `https://rangepilot.local/strategy/testnet/btc-range-demo-1` |
| StrategyCreated event | Found |

Strategy range fields:

| Field | Value |
|---|---|
| Oracle object ID | `0xb79524498a9947307e192d8045772150dc47aade4f9e09bd4b6fe3236b9e3125` |
| Expiry | `1780646400000` |
| Lower strike | `76708000000000` |
| Higher strike | `77208000000000` |

## Quote and full mint preflight result

The final follow gates were rerun against the created Strategy object before the wrapper write transaction.

| Gate | Result |
|---|---|
| Active environment | `testnet` |
| Active follower signer | `0x4ff903b0dcc52dc8753787baf19b34b7425dfa64d187cc7c726b38413705fa75` |
| Official range quote | Passed |
| Quote mint cost | `35` atomic DUSDC |
| Quote redeem value | `25` atomic DUSDC |
| Full DeepBook `mint_range<DUSDC>` devInspect preflight | Passed |
| Wrapper `follow_strategy_and_mint<DUSDC>` devInspect preflight | Passed |
| Follower manager DUSDC before follow | `1000000` atomic DUSDC |
| Fee coin coverage | Passed |
| ProtocolVault object read | Passed |
| Selected quantity | `1000` |
| Explicit RangePilot fee amount | `1000000` atomic DUSDC |
| Expected creator fee | `10000` atomic DUSDC |
| Expected platform fee | `1000` atomic DUSDC |

## Wrapper follow execution result

| Item | Value |
|---|---|
| Executed | Yes |
| Follower signer | `0x4ff903b0dcc52dc8753787baf19b34b7425dfa64d187cc7c726b38413705fa75` |
| Transaction target | `0xe0b877a06541d184b8c3bec46b81ccca2de38495979c25a658f98923407bf697::strategy::follow_strategy_and_mint` |
| Type argument | `0xe95040085976bfd54a1a07225cd46c8a2b4e8e2b6732f140a0fc49850ba73e1a::dusdc::DUSDC` |
| Follow digest | `997Yu78xbiM57fbJUsVk1eKURcbt8SXdi7Ypb1H74HEB` |
| StrategyFollowed event | Found |
| PlatformFeeDeposited event | Found |
| DeepBook Predict RangeMinted event | Found |
| Abort | None |

## Event verification

| Evidence | Expected | Observed |
|---|---|---|
| `StrategyFollowed.strategy_id` | `0x8402c9475b75beddc0328ac60e0ac743f8e36223ab8fa066800f9b7317cac30a` | Matched |
| `StrategyFollowed.follower` | `0x4ff903b0dcc52dc8753787baf19b34b7425dfa64d187cc7c726b38413705fa75` | Matched |
| `StrategyFollowed.manager_id` | `0xd59be0646d948c9be6073edc0cfd253ce4cb00f4929f0bae71f451f50e5d1575` | Matched |
| `StrategyFollowed.quantity` | `1000` | Matched |
| `StrategyFollowed.fee_amount` | `1000000` | Matched |
| `StrategyFollowed.creator_fee` | `10000` | Matched |
| `StrategyFollowed.platform_fee` | `1000` | Matched |
| `PlatformFeeDeposited.amount` | `1000` | Matched |
| `RangeMinted.quantity` | `1000` | Matched |
| `RangeMinted.cost` | `35` | Matched quote/preflight cost |

## Before and after state

| State | Before follow | After follow | Delta |
|---|---:|---:|---:|
| ProtocolVault<DUSDC> balance | `0` | `1000` | `+1000` |
| Creator DUSDC wallet balance | `500000000` | `500010000` | `+10000` |
| Follower manager DUSDC balance | `1000000` | `999965` | `-35` |
| Follower direct `range_position` | `0` | `1000` | `+1000` |

The ProtocolVault post-state object read exposed `content.balance = "1000"`, confirming the platform fee deposit persisted in the shared RangePilot vault.

## SDK and script support added

Phase 3F added the guarded wrapper validation harness and create-Strategy builder support:

- `packages/types/src/rangePilotStrategy.ts` defines `CreateStrategyTransactionOptions`.
- `packages/sdk/src/rangePilotStrategy/transactions.ts` exports `buildCreateStrategyTransaction`.
- `scripts/validate-wrapper-follow-flow.mjs` supports guarded prepare, create, follow, and digest-summary modes.
- `package.json` exposes `validate:wrapper-follow-preflight`, `validate:wrapper-follow-create-strategy`, and `validate:wrapper-follow` scripts.

The follow transaction builder still refuses to build unless explicit quote-preview and full-mint-preflight gate flags are supplied.

## Security and non-actions

- No private keys, wallet recovery phrases, signatures, or raw transaction bytes were printed or committed.
- `.env.local`, `.env*`, `.local/`, `.claude/`, `.trace/`, `.traces/`, `deepbookv3-predict-package/`, and `deepbookv3-predict-testnet-4-16/` were not read or staged.
- No wrapper publish was executed in Phase 3F.
- No `withdraw_platform_fees` transaction was executed.
- No direct top-level DeepBook Predict `mint_range` transaction was executed.
- No DeepBook Predict `redeem_range` transaction was executed.
- No DeepBook Predict `supply` transaction was executed.
- No mainnet transaction was executed.

## Status and next step

Route B is validated on Sui Testnet for one real follower flow: the RangePilot wrapper created strategy attribution and fee custody, then internally minted the DeepBook Predict range position. The next recommended task is to wire the guarded wrapper follow path into the creator/follower UI while preserving the same official quote, full mint preflight, and wrapper preflight gates before any wallet prompt.
