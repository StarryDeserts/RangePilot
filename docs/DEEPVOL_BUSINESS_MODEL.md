---
Purpose: Define the DeepVol BTC MOVE business model and fee enforceability boundary.
Audience: Project maintainers, business reviewers, Move developers, SDK implementers, frontend developers, and AI agents.
Status: Foundation business model for the DeepVol refactor.
---

# DeepVol Business Model

## Why not the original high creator follow fee

Public onchain strategy params can be copied. Therefore upfront creator follow fee should not be the primary commercial model. DeepVol charges for structuring volatility receipts instead.

The RangePilot wrapper proved fee collection and wrapper-mediated Predict calls are technically possible, but it does not prevent a user from copying public Strategy parameters and directly minting against DeepBook Predict.

DeepVol's model is stronger because it sells a product abstraction: BTC MOVE exposure packaged from Predict binary legs, with receipt metadata, portfolio aggregation, fee accounting, risk display, and settlement guidance.

Advanced users can manually buy UP + DOWN through DeepBook Predict. DeepVol does not monetize exclusive access to an uncopyable payoff; it monetizes standardized receipt creation and productized multi-leg execution.

## MVP fee: Create Fee

Create Fee is the MVP enforceable fee. Primitive UP, DOWN, and RANGE trades are not the primary MVP monetization surface; they should have no DeepVol protocol fee in MVP or remain advanced/debug-only.

Suggested MVP value:

```text
Create Fee = 0.30% of premium
```

The premium is the total official DeepBook Predict mint cost for both binary legs:

```text
premium = UP leg mint cost + DOWN leg mint cost
```

The Create Fee should be charged during the future wrapper-mediated or atomic receipt creation path and deposited into `ProtocolVault` or a DeepVol vault equivalent. DeepVol-3 only calculates and records the fee value in the local receipt skeleton; it does not transfer coins or deposit into a vault.

## ProtocolVault destination

`ProtocolVault` is reusable fee treasury infrastructure from the RangePilot wrapper work. In DeepVol MVP, it receives Create Fee deposits.

The vault does not custody DeepBook Predict positions or payouts. It only holds DeepVol protocol fees. DeepVol-3 keeps `protocolVaultId` as `null` in config until manual publish and future fee-routing work provide real deployment values.

## Profit Fee is V2 only

Profit Fee is a V2 feature unless settlement is wrapper-mediated or receipt becomes custodial.

The DeepVol concept can target a future model such as:

```text
Profit Fee = 5% of net profit
```

However, the MVP receipt is non-custodial. The underlying Predict legs remain in the user's `PredictManager`, and the user can redeem directly through DeepBook Predict. That means DeepVol cannot enforce a Profit Fee in the MVP.

Profit Fee becomes enforceable only if:

- settlement is wrapper-mediated and users choose or must use the wrapper path; or
- a custodial / escrow receipt design holds the underlying legs and controls settlement.

## Creator Share is future scope

A future VolSeries marketplace can explore:

```text
Creator Share = 20%
```

That is not part of the MVP. Creator economics should wait until third-party VolSeries creation has a credible distribution and enforcement model.

## Other future revenue lines

Future-only revenue lines:

- Listing Fee.
- Pro API.
- Advanced analytics.
- Creator marketplace fees.
- Custodial / escrow settlement fees.

These should not block BTC MOVE MVP validation.

## MVP commercial thesis

The MVP monetizes structure and UX rather than copyable creator parameters:

1. DeepVol discovers and presents a BTC MOVE series.
2. DeepVol previews both Predict binary legs.
3. DeepVol builds the atomic two-leg mint path.
4. DeepVol mints a non-custodial receipt for portfolio and settlement guidance.
5. DeepVol collects a Create Fee into `ProtocolVault`.
