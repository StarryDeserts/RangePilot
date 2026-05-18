---
Purpose: Define the first DeepVol BTC MOVE MVP boundary.
Audience: Project maintainers, Move developers, SDK implementers, frontend developers, reviewers, and AI agents.
Status: Foundation MVP scope for the DeepVol refactor.
---

# DeepVol MVP Scope

## MVP thesis

DeepVol MVP should prove one real BTC MOVE path on DeepBook Predict Testnet before expanding markets or fee models.

The first product is:

```text
BTC MOVE Receipt = Long UP above upper strike + Long DOWN below lower strike
```

The user buys exposure to BTC movement rather than choosing direction.

## Included in MVP

The MVP includes:

- BTC MOVE only.
- One active BTC oracle / expiry selected at runtime.
- `VolSeries` object for BTC MOVE series metadata.
- `MoveReceipt` object for non-custodial receipt metadata and Predict position linkage.
- Preview UP leg.
- Preview DOWN leg.
- Atomic PTB to mint both binary legs through DeepBook Predict.
- Mint non-custodial `MoveReceipt` after the binary-leg mint path succeeds.
- Charge Create Fee.
- Deposit Create Fee into `ProtocolVault`.
- Portfolio readback that combines `MoveReceipt` metadata with `PredictManager` binary position readback.
- Guided redeem / settlement path that directs users through the official DeepBook Predict binary redeem flow.

## Explicitly out of MVP

The MVP excludes:

- SUI MOVE.
- DEEP MOVE.
- ETH MOVE.
- Profit fee enforcement.
- Creator marketplace.
- Creator share.
- Listing fee.
- Tradable receipt.
- Custodial receipt.
- Secondary market.
- Pro API.
- Full UI polish.

These can be revisited after BTC MOVE binary mint, receipt creation, fee deposit, portfolio readback, and guided redeem are validated.

## Runtime assumptions

Market availability is a runtime DeepBook Predict condition. The MVP should mark active oracle, expiry, strikes, and quote values as `MUST CONFIRM AT RUNTIME` until discovered from current Testnet state.

The first implementation should prefer runtime discovery over hardcoded market assumptions. If no suitable active BTC binary market exists, the app should report a precise blocker instead of presenting unavailable markets.

## Implementation phases

1. Confirm binary leg entrypoints and source-level semantics.
2. Validate BTC binary quote preview for both UP and DOWN legs.
3. Validate a two-leg binary mint PTB in devInspect and then in a controlled transaction round.
4. Design `VolSeries` and non-custodial `MoveReceipt` Move structs.
5. Add SDK builders and full preflight gates.
6. Add portfolio readback and guided settlement UI.
7. Revisit V2 custodial / escrow receipts and Profit Fee only after the non-custodial MVP is validated.

## Future code organization

This round should not create these modules yet, but the future implementation can use:

```text
move/deepvol/
packages/types/src/deepVol.ts
packages/sdk/src/deepVol/
packages/config/src/deepVolTestnet.ts
apps/web/src/pages/DeepVolMarketsPage.tsx
apps/web/src/pages/DeepVolSeriesPage.tsx
apps/web/src/pages/DeepVolPortfolioPage.tsx
```
