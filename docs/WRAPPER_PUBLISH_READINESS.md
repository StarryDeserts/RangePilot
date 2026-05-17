---
Purpose: Track RangePilot wrapper contract readiness before any Testnet publish.
Audience: Move developers, SDK implementers, frontend developers, reviewers, and product leads.
Status: Phase 3C publish-readiness checklist; wrapper package is not published.
Source of truth relationship: Supplements wrapper architecture and protocol integration docs; official DeepBook Predict docs and local Move source remain authoritative for protocol behavior.
---

# Wrapper Publish Readiness

## Current status

The RangePilot wrapper package is a publish-readiness candidate, not a published package. Phase 3C hardens the wrapper skeleton, fee policy, tests, SDK placeholders, and dependency source without executing a real wrapper transaction.

Current verification snapshot:

| Command | Status |
|---|---|
| `npm run typecheck` | Passed. |
| `npm run build:web` | Passed with the existing Vite chunk-size warning. |
| `npm run move:build:rangepilot` | Passed with official DeepBookV3 Git dependencies and Testnet dep-replacements; current Sui CLI accepts `sui move build --path move/rangepilot` and rejects `--environment testnet`. |
| `npm run move:test:rangepilot` | Passed with 11 RangePilot tests. |

## Package and dependency source

| Item | Value |
|---|---|
| Wrapper package path | `move/rangepilot` |
| Wrapper package ID | `TBD` until publish. |
| Formal DeepBook Predict dependency | Official DeepBookV3 Git repo, `packages/predict`, `rev = "predict-testnet-4-16"`. |
| Formal DeepBook dependency | Official DeepBookV3 Git repo, `packages/deepbook`, `rev = "predict-testnet-4-16"`. |
| Testnet binding | `Move.toml` uses `dep-replacements.testnet` for deployed DeepBook Predict and DeepBook package IDs. |
| Local source snapshot | `deepbookv3-predict-testnet-4-16/` is source-level debugging/reference only and must not be committed. |

The wrapper must not switch its formal Move dependency back to `../../deepbookv3-predict-testnet-4-16/packages/predict` or any `deepbookv3-predict-package` path.

## What is ready

- `Strategy` stores creator, range, expiry, default quantity, fee bps, platform recipient, metadata URI, active flag, and creation timestamp.
- `create_strategy` validates nonzero default quantity, nonempty metadata URI, and fee bps bounds.
- `deactivate_strategy` requires creator authorization.
- `follow_strategy_and_mint<T>` checks active strategy, nonzero quantity, nonzero explicit fee amount, fee coin value, and stored fee bps.
- `follow_strategy_and_mint<T>` derives `RangeKey` from stored Strategy fields and internally calls DeepBook Predict `predict::mint_range<T>`.
- `StrategyFollowed` is emitted after `predict::mint_range<T>` returns.
- Fee amount is explicit and separate from DeepBook Predict mint cost.
- SDK transaction builder blocks unless an explicit wrapper package ID and quote/preflight gates are supplied.
- Type/config placeholders keep wrapper package ID and platform recipient unset until publish.

## What is not ready

- Wrapper package is not published.
- No real `follow_strategy_and_mint<T>` transaction has been executed.
- No final creator strategy UI is built.
- No indexer schema links `StrategyFollowed` to DeepBook Predict `RangeMinted` in production.
- No final platform fee recipient is configured.
- No final tokenomics cap below the hard 10,000 bps accounting bound is approved.
- No final metadata URI/hash policy is approved beyond nonempty URI validation.
- No mainnet deployment is in scope.

## Required pre-publish decisions

| Decision | Status |
|---|---|
| Platform fee recipient address | MUST CONFIRM BEFORE PUBLISH. |
| Platform fee bps | MUST CONFIRM BEFORE PUBLISH. |
| Creator fee bps max | MUST CONFIRM BEFORE PUBLISH. |
| Metadata URI/hash policy | MUST CONFIRM BEFORE PUBLISH. Current skeleton only rejects empty URI. |
| Whether Strategy object is shared | Current skeleton shares Strategy; MUST CONFIRM BEFORE PUBLISH. |
| Whether strategy creation is permissionless | Current skeleton is permissionless; MUST CONFIRM BEFORE PUBLISH. |
| Whether package will be immutable or upgraded later | MUST CONFIRM BEFORE PUBLISH. |
| Wrapper package ID config location | Proposed placeholders are in `packages/config/src/deepbookPredictTestnet.ts`; MUST CONFIRM BEFORE PUBLISH. |
| First Testnet `follow_strategy_and_mint` scenario | MUST CONFIRM BEFORE PUBLISH. |

## Publish checklist

- Confirm Sui CLI version and `Move.toml` environment syntax.
- Re-run `npm run move:build:rangepilot`.
- Re-run `npm run move:test:rangepilot`.
- Re-run `npm run typecheck`.
- Re-run `npm run build:web`.
- Confirm `Move.lock` pins DeepBook Predict and DeepBook to Git sources, not local snapshot paths.
- Confirm no `.env*`, `.local/`, `.claude/`, `.traces/`, or DeepBook source snapshot paths are staged.
- Confirm platform fee recipient and fee bps policy.
- Confirm metadata policy and object sharing policy.
- Confirm package upgrade/immutability plan.
- Get explicit publish approval.
- Publish only to Testnet.

## Post-publish config checklist

- Record wrapper package ID.
- Set `RANGEPILOT_WRAPPER_PACKAGE_ID` or the agreed config field.
- Set `RANGEPILOT_PLATFORM_FEE_RECIPIENT` or the agreed config field.
- Update SDK wrapper config while keeping quote/preflight gates required.
- Update docs with publish digest/package ID.
- Add a small post-publish integration checklist entry for first wrapper follow.

## Testnet integration checklist

- Select a live oracle/range at runtime; do not hardcode stale market state.
- Run official `predict::get_range_trade_amounts` quote preview.
- Require positive official mint cost.
- Run full DeepBook Predict `mint_range<DUSDC>` devInspect preflight.
- Build wrapper `follow_strategy_and_mint<DUSDC>` transaction only after quote and full preflight pass.
- Execute one explicit user-approved Testnet follow transaction.
- Confirm DeepBook Predict `RangeMinted` event and RangePilot `StrategyFollowed` event in the same transaction.
- Confirm direct `predict_manager::range_position` readback for the followed RangeKey.

## Rollback and redeploy assumptions

Before publish, rollback is just a git revert or follow-up commit. After Testnet publish, deployed package code cannot be removed from chain. If an issue is found post-publish, the likely path is to publish a corrected package and update config to the new wrapper package ID, subject to the chosen upgrade/immutability policy.

## Security checklist

- Do not print or commit private keys, mnemonics, signatures, or raw transaction bytes.
- Do not read `.env.local` for wrapper readiness work.
- Do not commit `.env*`, `.local/`, `.claude/`, `.traces/`, `deepbookv3-predict-package/`, or `deepbookv3-predict-testnet-4-16/`.
- Do not execute real transactions without explicit approval.
- Do not publish without explicit approval.
- Do not use mainnet.
- Do not reimplement DeepBook Predict pricing, oracle, vault, StrikeMatrix, payout, settlement, or `PredictManager` custody.
- Keep frontend quote and full mint preflight gates before any wrapper wallet prompt.
