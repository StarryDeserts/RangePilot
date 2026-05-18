---
Purpose: Track RangePilot wrapper contract readiness and Testnet post-publish setup.
Audience: Move developers, SDK implementers, frontend developers, reviewers, and product leads.
Status: Phase 3F record; wrapper package, ProtocolVault<DUSDC>, and first wrapper follow are validated on Testnet.
Source of truth relationship: Supplements wrapper architecture and protocol integration docs; official DeepBook Predict docs and local Move source remain authoritative for protocol behavior.
---

# Wrapper Publish Readiness

## Current status

The RangePilot wrapper package is published on Sui Testnet, post-publish setup created the first shared `ProtocolVault<DUSDC>`, and Phase 3F validated the first real `follow_strategy_and_mint<DUSDC>` transaction after fresh official quote preview and full DeepBook Predict mint preflight. Phase 3D replaced the direct platform-recipient fee model with `ProtocolVault<T>` + `AdminCap`, fixed platform fee policy at 10 bps, capped creator fees at 3000 bps, kept shared permissionless Strategies, and preserved Route B internal DeepBook Predict minting.

Current verification snapshot:

| Command | Status |
|---|---|
| `npm run typecheck` | Passed after SDK/config/type updates. |
| `npm run build:web` | Passed at Phase 3E pre-publish gate; existing Vite chunk-size warning is acceptable if unchanged. |
| `npm run move:build:rangepilot` | Passed with official DeepBookV3 Git dependencies and Testnet dep-replacements. |
| `npm run move:test:rangepilot` | Passed with 18 RangePilot tests. |

## Package and dependency source

| Item | Value |
|---|---|
| Wrapper package path | `move/rangepilot` |
| Wrapper package ID | `0xe0b877a06541d184b8c3bec46b81ccca2de38495979c25a658f98923407bf697` |
| ProtocolVault<DUSDC> object ID | `0x9430cc42b879c8f70a855230aecf7042e3efcadb41924cb6ff6c66c8e167d992` |
| Publisher / AdminCap owner | `0xc558e37d20405a9751c81124ac8d167e2b2d368b834319adafa549449e0715f5` |
| AdminCap object ID | `0xbd825bd9f0ea1846314a02977430e691054e56752d8cf30b483cf211fec880f7` |
| UpgradeCap object ID | `0xd313b4281ea0a9a0918ab7f35651fe8915477d748ec123cb0950197e34c2a741` |
| Publish digest | `7kSkeGzzTo3BcVCwC3qZdLh2bZdBpDP2hvMxkG8oB7TV` |
| ProtocolVault creation digest | `5d8W8RtVWHxVjEhpjf6t3qfKzEFuDMdxHGXGJiR6DBe5` |
| Formal DeepBook Predict dependency | Keep local third-party snapshots ignored and uncommitted; dependency source state is governed by `move/rangepilot/Move.toml` and `Move.lock`. |
| Formal DeepBook dependency | Keep local third-party snapshots ignored and uncommitted; dependency source state is governed by `move/rangepilot/Move.toml` and `Move.lock`. |
| Testnet binding | Wrapper package and `ProtocolVault<DUSDC>` are now configured in `packages/config/src/rangePilotTestnet.ts`; published package metadata is recorded in `move/rangepilot/Published.toml`. |
| Local source snapshot | `deepbookv3-predict-testnet-4-16/` is source-level debugging/reference only and must not be committed. |

The wrapper must not switch its formal Move dependency back to `../../deepbookv3-predict-testnet-4-16/packages/predict` or any `deepbookv3-predict-package` path.

## What is ready

- `Strategy` stores creator, range, expiry, default quantity, creator fee bps, protocol-set platform fee bps, metadata URI, active flag, and creation timestamp.
- Strategy creation is permissionless and shares the Strategy object.
- `create_strategy` validates nonzero default quantity, lower strike below higher strike, nonempty metadata URI, and creator fee bps bounds.
- `deactivate_strategy` requires creator authorization.
- `AdminCap` is minted at package init to the publisher / transaction sender.
- `create_protocol_vault<T>` requires `&AdminCap` and shares a `ProtocolVault<T>` object.
- `ProtocolVault<T>` holds platform fee balances for the fee coin type.
- `withdraw_platform_fees<T>` requires `&AdminCap` and rejects overdraw.
- `follow_strategy_and_mint<T>` checks active strategy, nonzero quantity, nonzero explicit fee amount, fee coin value, and stored creator fee bps.
- `follow_strategy_and_mint<T>` splits the explicit fee base using creator fee bps plus fixed `platform_fee_bps = 10`.
- Creator fee transfers to the creator.
- Platform fee deposits into `ProtocolVault<T>`.
- Any fee coin remainder returns to the follower.
- `follow_strategy_and_mint<T>` derives `RangeKey` from stored Strategy fields and internally calls DeepBook Predict `predict::mint_range<T>`.
- `StrategyFollowed` is emitted after `predict::mint_range<T>` returns.
- SDK transaction builder blocks unless explicit wrapper package ID, protocol vault ID, quote-preview gate, and full mint-preflight gate are supplied.
- `packages/config/src/rangePilotTestnet.ts` records the wrapper package ID, shared `ProtocolVault<DUSDC>` object ID, and admin-only `AdminCap` ID.

## What is not ready

- No final creator strategy UI is built.
- No indexer schema links `StrategyFollowed` to DeepBook Predict `RangeMinted` in production.
- No final platform withdrawal recipient policy is approved.
- No mainnet deployment is in scope.

## Confirmed decisions

| Decision | Status |
|---|---|
| Platform fee recipient model | Confirmed: platform fee deposits into RangePilot `ProtocolVault<T>`, not a direct recipient address. |
| Platform fee bps | Confirmed: `10` bps = `0.1%`. |
| Creator fee bps max | Confirmed: `3000` bps = `30%`; `300` bps would be `3%`. |
| Metadata policy | Confirmed: `metadata_uri` only for MVP; nonempty URI validation. |
| Whether Strategy object is shared | Confirmed: Strategy is shared so multiple followers can use it. |
| Whether strategy creation is permissionless | Confirmed: anyone can create a Strategy; curation is off-chain/frontend/indexer. |
| Upgrade policy | Confirmed: Testnet/hackathon wrapper is upgradeable; upgrade authority must be disclosed. |
| Wrapper package/vault config location | Confirmed: `packages/config/src/rangePilotTestnet.ts`. |
| First Testnet `follow_strategy_and_mint` scenario | Validated in Phase 3F with digest `997Yu78xbiM57fbJUsVk1eKURcbt8SXdi7Ypb1H74HEB` after quote and full mint preflight passed. |

## Recorded publish/post-publish values

| Item | Status |
|---|---|
| Actual wrapper package ID | `0xe0b877a06541d184b8c3bec46b81ccca2de38495979c25a658f98923407bf697` |
| Actual ProtocolVault<DUSDC> object ID | `0x9430cc42b879c8f70a855230aecf7042e3efcadb41924cb6ff6c66c8e167d992` |
| Publisher / AdminCap owner | `0xc558e37d20405a9751c81124ac8d167e2b2d368b834319adafa549449e0715f5` |
| AdminCap object ID | `0xbd825bd9f0ea1846314a02977430e691054e56752d8cf30b483cf211fec880f7` |
| UpgradeCap object ID | `0xd313b4281ea0a9a0918ab7f35651fe8915477d748ec123cb0950197e34c2a741` |
| Actual first Testnet follow transaction | `997Yu78xbiM57fbJUsVk1eKURcbt8SXdi7Ypb1H74HEB` |

## Post-publish config status

- Wrapper package ID is recorded in `packages/config/src/rangePilotTestnet.ts`.
- `ProtocolVault<DUSDC>` object ID is recorded in `packages/config/src/rangePilotTestnet.ts`.
- AdminCap object ID is recorded for admin operations; normal follower flows must not require AdminCap or UpgradeCap.
- SDK wrapper config still keeps quote/preflight gates required.
- Publish digest, package ID, cap IDs, vault creation digest, and ProtocolVault object ID are recorded in docs.
- The first wrapper follow validation is recorded in `docs/WRAPPER_FOLLOW_TESTNET_VALIDATION.md`.

## Testnet integration checklist

Completed in Phase 3F:

- Selected a live oracle/range at runtime; no stale market state was hardcoded.
- Ran official `predict::get_range_trade_amounts` quote preview.
- Required positive official mint cost.
- Ran full DeepBook Predict `mint_range<DUSDC>` devInspect preflight.
- Built wrapper `follow_strategy_and_mint<DUSDC>` only after quote and full preflight passed.
- Included shared `ProtocolVault<DUSDC>` object as a wrapper input.
- Executed one explicit user-approved Testnet follow transaction.
- Confirmed DeepBook Predict `RangeMinted` event and RangePilot `StrategyFollowed` event in the same transaction.
- Confirmed direct `predict_manager::range_position` readback for the followed RangeKey.
- Confirmed platform fee deposited into `ProtocolVault<DUSDC>`.
- Confirmed creator fee transferred to creator.

Still required for future failure-path hardening:

- Confirm a failing DeepBook mint abort rolls back creator transfer and ProtocolVault deposit.

## First Testnet follow result

| Item | Value |
|---|---|
| Validation report | [WRAPPER_FOLLOW_TESTNET_VALIDATION.md](./WRAPPER_FOLLOW_TESTNET_VALIDATION.md) |
| Strategy create digest | `8yrzb1mfWUdrJZXBKvGC6Y8xFkppDTUmFuA4Gg979zJV` |
| Strategy object ID | `0x8402c9475b75beddc0328ac60e0ac743f8e36223ab8fa066800f9b7317cac30a` |
| Creator/admin | `0xc558e37d20405a9751c81124ac8d167e2b2d368b834319adafa549449e0715f5` |
| Follower | `0x4ff903b0dcc52dc8753787baf19b34b7425dfa64d187cc7c726b38413705fa75` |
| Follower PredictManager | `0xd59be0646d948c9be6073edc0cfd253ce4cb00f4929f0bae71f451f50e5d1575` |
| Range | Oracle `0xb79524498a9947307e192d8045772150dc47aade4f9e09bd4b6fe3236b9e3125`, expiry `1780646400000`, lower `76708000000000`, higher `77208000000000` |
| Quantity | `1000` |
| Quote | Mint cost `35`, redeem value `25` atomic DUSDC |
| Wrapper follow digest | `997Yu78xbiM57fbJUsVk1eKURcbt8SXdi7Ypb1H74HEB` |
| Events | `StrategyFollowed`, `PlatformFeeDeposited`, `RangeMinted` |
| ProtocolVault balance | `0` → `1000` atomic DUSDC |
| Creator DUSDC balance | `500000000` → `500010000` atomic DUSDC |
| Follower range_position | `0` → `1000` |

Phase 3F authorization and remaining forbidden actions:

- Manual `sui client publish` was completed outside this session and recorded here.
- The approved `create_protocol_vault<DUSDC>` setup transaction executed once and succeeded.
- The approved first `follow_strategy_and_mint<DUSDC>` transaction executed once and succeeded.
- Do not call additional `follow_strategy_and_mint` transactions without explicit approval and fresh gates.
- Do not call direct top-level DeepBook Predict `mint_range`, `redeem_range`, or `supply` during wrapper work.
- Do not call `withdraw_platform_fees` without explicit approval.
- Do not use mainnet.
- Do not run validation scripts that submit non-approved transactions.

## Rollback and redeploy assumptions

Before publish, rollback is just a git revert or follow-up commit. After Testnet publish, deployed package code cannot be removed from chain. If an issue is found post-publish, the likely path is to publish a corrected package and update config to the new wrapper package ID, subject to the Testnet/hackathon upgradeability policy.

## Security checklist

- Do not print or commit wallet recovery phrases, private keys, signatures, or raw transaction bytes.
- Do not read `.env.local` for wrapper readiness work.
- Do not commit `.env*`, `.local/`, `.claude/`, `.traces/`, `deepbookv3-predict-package/`, or `deepbookv3-predict-testnet-4-16/`.
- Do not execute real transactions without explicit approval.
- Do not publish without explicit approval.
- Do not use mainnet.
- Do not reimplement DeepBook Predict pricing, oracle, vault, StrikeMatrix, payout, settlement, or `PredictManager` custody.
- Keep frontend quote and full mint preflight gates before any wrapper wallet prompt.
