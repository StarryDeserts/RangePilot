---
Purpose: Track RangePilot wrapper contract readiness and Testnet post-publish setup.
Audience: Move developers, SDK implementers, frontend developers, reviewers, and product leads.
Status: Phase 3E-postpublish record; wrapper package is published on Testnet and ProtocolVault<DUSDC> is created.
Source of truth relationship: Supplements wrapper architecture and protocol integration docs; official DeepBook Predict docs and local Move source remain authoritative for protocol behavior.
---

# Wrapper Publish Readiness

## Current status

The RangePilot wrapper package is published on Sui Testnet, and post-publish setup created the first shared `ProtocolVault<DUSDC>`. Phase 3D replaced the direct platform-recipient fee model with `ProtocolVault<T>` + `AdminCap`, fixed platform fee policy at 10 bps, capped creator fees at 3000 bps, kept shared permissionless Strategies, and preserved Route B internal DeepBook Predict minting. The first real `follow_strategy_and_mint<DUSDC>` transaction remains pending for a future approved validation round with fresh official quote preview and full DeepBook Predict mint preflight.

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

- No real `follow_strategy_and_mint<T>` transaction has been executed.
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
| First Testnet `follow_strategy_and_mint` scenario | Confirmed as design-only in Phase 3D; actual execution remains future approval. |

## Recorded publish/post-publish values

| Item | Status |
|---|---|
| Actual wrapper package ID | `0xe0b877a06541d184b8c3bec46b81ccca2de38495979c25a658f98923407bf697` |
| Actual ProtocolVault<DUSDC> object ID | `0x9430cc42b879c8f70a855230aecf7042e3efcadb41924cb6ff6c66c8e167d992` |
| Publisher / AdminCap owner | `0xc558e37d20405a9751c81124ac8d167e2b2d368b834319adafa549449e0715f5` |
| AdminCap object ID | `0xbd825bd9f0ea1846314a02977430e691054e56752d8cf30b483cf211fec880f7` |
| UpgradeCap object ID | `0xd313b4281ea0a9a0918ab7f35651fe8915477d748ec123cb0950197e34c2a741` |
| Actual first Testnet follow transaction | `TBD`; do not execute until a fresh quote/full preflight passes in a future approved round. |

## Post-publish config status

- Wrapper package ID is recorded in `packages/config/src/rangePilotTestnet.ts`.
- `ProtocolVault<DUSDC>` object ID is recorded in `packages/config/src/rangePilotTestnet.ts`.
- AdminCap object ID is recorded for admin operations; normal follower flows must not require AdminCap or UpgradeCap.
- SDK wrapper config still keeps quote/preflight gates required.
- Publish digest, package ID, cap IDs, vault creation digest, and ProtocolVault object ID are recorded in docs.
- The next integration checklist entry is first wrapper follow validation.

## Testnet integration checklist

- Select a live oracle/range at runtime; do not hardcode stale market state.
- Run official `predict::get_range_trade_amounts` quote preview.
- Require positive official mint cost.
- Run full DeepBook Predict `mint_range<DUSDC>` devInspect preflight.
- Build wrapper `follow_strategy_and_mint<DUSDC>` transaction only after quote and full preflight pass.
- Include shared `ProtocolVault<DUSDC>` object as a wrapper input.
- Execute one explicit user-approved Testnet follow transaction in a future round.
- Confirm DeepBook Predict `RangeMinted` event and RangePilot `StrategyFollowed` event in the same transaction.
- Confirm direct `predict_manager::range_position` readback for the followed RangeKey.
- Confirm platform fee deposited into `ProtocolVault<DUSDC>`.
- Confirm creator fee transferred to creator.
- Confirm a failing DeepBook mint abort rolls back creator transfer and ProtocolVault deposit.

## First Testnet follow scenario, design-only

1. Wrapper package is published to Sui Testnet with upgradeability retained for the hackathon/Testnet stage.
2. Wrapper package ID is recorded in `packages/config/src/rangePilotTestnet.ts`.
3. Publisher received AdminCap; AdminCap owner/publish address is disclosed.
4. Admin created `ProtocolVault<DUSDC>`; ProtocolVault object ID is recorded in RangePilot config.
5. Creator creates a shared permissionless Strategy with `creator_fee_bps <= 3000` and `metadata_uri`.
6. Follower has a `PredictManager`.
7. Follower manager has DUSDC balance for DeepBook Predict mint cost.
8. Follower wallet has a separate DUSDC fee coin for RangePilot creator/platform fee base.
9. Frontend/SDK runs official `get_range_trade_amounts` quote preview.
10. Frontend/SDK runs full DeepBook Predict `mint_range<DUSDC>` preflight.
11. SDK builds wrapper `follow_strategy_and_mint<DUSDC>` only after quote/preflight gates pass.
12. Future explicit approval executes the wrapper follow transaction.
14. Verify RangePilot `StrategyFollowed` event.
15. Verify DeepBook Predict `RangeMinted` event in the same transaction.
16. Verify follower `predict_manager::range_position` increased.
17. Verify platform fee deposited into `ProtocolVault<DUSDC>`.
18. Verify creator fee transferred to creator.
19. Verify a failing DeepBook mint abort rolls back creator transfer and ProtocolVault deposit.

Phase 3E-postpublish authorization and remaining forbidden actions:

- Manual `sui client publish` was completed outside this session and recorded here.
- The approved `create_protocol_vault<DUSDC>` setup transaction executed once and succeeded.
- Do not call `follow_strategy_and_mint` until a future approved first-follow validation round.
- Do not call DeepBook Predict `mint_range`, `redeem_range`, or `supply` during wrapper setup.
- Do not call `withdraw_platform_fees` during wrapper setup.
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
