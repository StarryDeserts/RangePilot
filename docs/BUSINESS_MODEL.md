---
Purpose: Define the current product business model after the DeepVol BTC MOVE pivot.
Audience: Product leads, frontend developers, SDK implementers, Move developers, protocol integrators, reviewers, and AI agents.
Status: Updated for DeepVol foundation; prior RangePilot creator-follow model is preserved as validated historical work.
Source of truth relationship: Supplements DeepVol foundation docs and official DeepBook Predict integration docs; official Sui docs, local validated entrypoint bindings, and Move source remain source of truth for protocol behavior.
---

# Business Model

DeepVol BTC MOVE is the current primary business direction. DeepVol monetizes structured volatility exposure on DeepBook Predict by packaging binary UP and DOWN legs into a BTC MOVE Receipt and charging an enforceable Create Fee.

The previous RangePilot creator-follow strategy wrapper remains technically validated, but it is no longer the primary commercial model. Public on-chain strategy parameters can be copied, which lets users bypass high creator follow fees by minting directly through DeepBook Predict.

For the detailed DeepVol fee model, see [DEEPVOL_BUSINESS_MODEL.md](./DEEPVOL_BUSINESS_MODEL.md).

## Current primary model: DeepVol BTC MOVE

```text
User selects BTC MOVE series
→ DeepVol previews UP binary leg above upper strike
→ DeepVol previews DOWN binary leg below lower strike
→ user pays DeepBook Predict premium from PredictManager balance
→ DeepVol charges Create Fee as a separate fee payment
→ Create Fee deposits into ProtocolVault
→ user receives non-custodial MoveReceipt metadata
→ DeepBook Predict stores binary legs in the user's PredictManager
```

DeepBook Predict remains the prediction-market protocol. DeepVol does not price binary legs, settle oracles, custody positions in MVP, run vault risk, reproduce StrikeMatrix logic, or calculate payout. The business layer is built on top of the official protocol's `Predict`, `PredictManager`, `MarketKey`, `OracleSVI`, and Vault behavior.

## MVP fee model

DeepVol MVP uses one enforceable fee:

| Fee | Paid by | Paid to | Stage | Status |
|---|---|---|---|---|
| DeepBook Predict premium | user | DeepBook Predict Vault | binary mint | official protocol cost |
| Create Fee | user | `ProtocolVault` | receipt creation | MVP enforceable |
| Profit Fee | user | protocol / creator split | settlement | V2 only |
| Creator Share | protocol | VolSeries creator | marketplace | future only |

Suggested MVP Create Fee:

```text
Create Fee = 0.30% of premium
```

The premium is the sum of the official UP and DOWN binary mint costs. The Create Fee should be charged during wrapper-mediated receipt creation and deposited into `ProtocolVault`.

## Profit Fee boundary

Profit Fee is a V2 feature unless settlement is wrapper-mediated or receipt becomes custodial.

In the MVP, the underlying Predict positions remain in the user's `PredictManager`. The user can redeem directly through DeepBook Predict, so DeepVol cannot enforce a Profit Fee while the receipt is non-custodial.

## Future revenue lines

Future-only revenue lines include:

- Creator Share after third-party VolSeries marketplace.
- Listing Fee.
- Pro API.
- Custodial / escrow settlement fees.
- Advanced analytics.

These should not block the BTC MOVE MVP.

## Preserved prior model: RangePilot creator-follow strategy

The validated RangePilot wrapper flow was:

```text
User follows creator strategy
→ user pays DeepBook Predict mint cost from PredictManager balance
→ user separately provides creator/platform fee as Coin<DUSDC>
→ RangePilot wrapper validates strategy and fee policy
→ wrapper transfers creator fee to creator
→ wrapper deposits platform fee into ProtocolVault<DUSDC>
→ wrapper calls DeepBook Predict mint_range<DUSDC>
→ wrapper emits StrategyFollowed for attribution
→ DeepBook Predict stores the range position in the user's PredictManager
```

This work proved useful infrastructure:

- wrapper-mediated official Predict calls;
- atomic fee movement and protocol call rollback;
- ProtocolVault fee custody;
- event linkage between wrapper events and DeepBook Predict events;
- preflight requirements before wallet approval.

The model is deprecated as the primary product direction because the Strategy's oracle, expiry, strikes, and quantity are public and copyable.

## ProtocolVault and AdminCap

`ProtocolVault<T>` is reusable fee treasury infrastructure, not the DeepBook Predict Vault. It holds protocol fees only. `AdminCap` controls vault creation and withdrawals. Normal user transactions should not require `AdminCap`.

For DeepVol MVP, `ProtocolVault` should receive Create Fee deposits. It should not custody Predict positions or payouts.

## DeepBook Predict dependency boundary

DeepVol's business model works because DeepBook Predict already owns the market protocol:

- `Predict` is the official trading entrypoint.
- `PredictManager` is the per-user account and position boundary.
- `MarketKey` identifies binary positions.
- `OracleSVI` supplies live or settled market state.
- `Vault` enforces liquidity, exposure, MTM, max payout, and risk constraints.
- `predict::mint<DUSDC>` and binary redeem entrypoints compute and enforce official behavior.

DeepVol monetizes volatility receipt structuring and guidance while preserving this protocol boundary.
