---
Purpose: Record the decision to pivot the primary product direction to DeepVol BTC MOVE.
Audience: Project maintainers, Move developers, SDK implementers, frontend developers, reviewers, and AI agents.
Status: Accepted ADR.
---

# ADR-0003: Pivot to DeepVol BTC MOVE

## Status

Accepted

## Date

2026-05-18

## Context

The project has already validated key DeepBook Predict and RangePilot infrastructure:

- DeepBook Predict range mint/redeem lifecycle.
- Browser wallet mint/redeem flows.
- Route B wrapper contract architecture.
- ProtocolVault fee model.
- Wrapper package publish.
- ProtocolVault<DUSDC> creation.
- First wrapper `follow_strategy_and_mint<DUSDC>` validation.

That work proved wrapper-mediated Predict calls and fee custody are feasible. It also exposed a product weakness in the creator-follow strategy model.

## Problem with creator follow strategy model

A RangePilot Strategy exposes its oracle, expiry, lower strike, higher strike, and quantity on-chain. Users can copy those public parameters and call DeepBook Predict directly, bypassing a high creator follow fee.

The wrapper remains technically valid, but public strategy parameters make creator-follow fees a weak primary business model.

## Options considered

### Continue creator-follow strategy as primary product

Pros:

- Existing wrapper flow is validated.
- Strategy creation and follow events already work.
- ProtocolVault fee custody has been proven.

Cons:

- Public strategy parameters are copyable.
- High creator follow fees are easy to bypass.
- The product story is weaker than a native Predict composability layer.

Rejected as the primary direction.

### Build a frontend-only volatility UI

Pros:

- No new Move package required initially.
- Could quickly demonstrate a paired-leg concept.

Cons:

- No receipt object.
- No protocol-level fee custody.
- Weak portfolio and settlement linkage.

Rejected as the full MVP direction, but useful for early diagnostics.

### Pivot to DeepVol BTC MOVE

Pros:

- Builds a new product abstraction from DeepBook Predict binary primitives.
- Lets users trade movement, not direction.
- Better fits the Predict composability narrative.
- Create Fee can be enforced at receipt creation.
- Existing ProtocolVault and wrapper lessons remain reusable.

Cons:

- Binary mint/redeem must be validated before production coding.
- Non-custodial receipts cannot enforce Profit Fee.
- New docs, SDK builders, and Move design are required.

Accepted.

## Decision: pivot to DeepVol BTC MOVE

Make DeepVol BTC MOVE the new primary product direction.

DeepVol is a Predict-native volatility derivatives layer on Sui. It packages DeepBook Predict binary legs into BTC MOVE receipts. Users trade movement, not direction.

The MVP product is a BTC MOVE Receipt composed from:

```text
Long UP above upper strike
+
Long DOWN below lower strike
```

## Why BTC first

Current DeepBook Predict Testnet active market state is BTC-centered. The MVP should target the market most likely to be exercised against real active protocol objects.

SUI MOVE, DEEP MOVE, ETH MOVE, and other markets remain future scope until active runtime markets are confirmed.

## Why non-custodial receipt MVP

DeepBook Predict positions live in the user's `PredictManager`; they are not standalone NFTs. The MVP should not pretend that a receipt owns positions it does not custody.

The MVP `MoveReceipt` records metadata and linkage:

- user owner;
- series ID;
- PredictManager;
- oracle and expiry;
- UP and DOWN binary keys;
- premium paid;
- Create Fee paid;
- settlement guidance status.

It is not a fully tradable claim token because the underlying Predict positions remain in the user's `PredictManager`.

## Consequences

Positive:

- DeepVol becomes a clearer Predict-native volatility product.
- BTC-only MVP keeps scope tied to current active Testnet market reality.
- Create Fee can be enforced at receipt creation.
- Existing ProtocolVault infrastructure can be reused for fee treasury.
- Existing wrapper validation remains evidence for atomic fee + Predict call composition.

Negative:

- Binary mint/redeem must be validated in a later round.
- Profit Fee is not enforceable in the non-custodial MVP.
- Creator Share must wait for a future VolSeries marketplace.
- New data model, SDK builders, and UI surfaces are needed.

## What happens to existing RangePilot wrapper work

Existing Route B wrapper docs and validation are not deleted. They remain prior validated infrastructure and possible sources for:

- `ProtocolVault` fee treasury design;
- fee split and custody patterns;
- wrapper-mediated DeepBook Predict calls;
- event-linkage and post-state verification patterns;
- Sui package publish and Testnet validation lessons.

The creator-follow strategy wrapper is no longer the primary product direction, but the technical work remains useful for DeepVol.
