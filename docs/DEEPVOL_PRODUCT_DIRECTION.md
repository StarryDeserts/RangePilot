---
Purpose: Define DeepVol as the new BTC MOVE product direction for the project.
Audience: Project maintainers, Move developers, SDK implementers, frontend developers, reviewers, and AI agents.
Status: Foundation direction for the DeepVol refactor.
---

# DeepVol Product Direction

## Why pivot from RangePilot follow strategy

RangePilot's creator-follow strategy layer validated that a wrapper can atomically collect fees, call DeepBook Predict, and emit attribution events. That work remains useful infrastructure, but the product model is weak as the primary business direction.

A strategy exposes its oracle, expiry, strikes, and quantity on-chain. A user can copy those public parameters and call DeepBook Predict directly, bypassing a high creator follow fee. The wrapper is technically valid, but public strategy parameters make creator-follow fees a poor moat.

DeepVol moves the product from copying a creator's public range to structuring a new volatility abstraction on top of DeepBook Predict.

## What DeepVol is

DeepVol is a Predict-native structured product layer on Sui. Its primary MVP product is BTC MOVE Receipt, and its advanced primitives are UP, DOWN, and RANGE. See [DEEPVOL_PRIMITIVES_AND_RECEIPTS.md](./DEEPVOL_PRIMITIVES_AND_RECEIPTS.md) for the product-layer model.

DeepVol is not just a Predict frontend. It packages selected official DeepBook Predict primitives into standardized receipt products. Users trade movement, not direction.

The core MVP product is a BTC MOVE Receipt:

```text
Long UP above upper strike
+
Long DOWN below lower strike
=
Long volatility / MOVE exposure
```

The user does not need to choose whether BTC goes up or down. The user chooses whether BTC will move far enough away from the current range before expiry.

## Why BTC MOVE first

The current DeepBook Predict Testnet active market state is BTC-centered. The MVP should optimize for a path that can be verified against real active protocol objects instead of a more generic market name that cannot be exercised.

BTC MOVE gives the product a clear first narrative:

- BTC is the active underlying to validate against.
- Event-driven BTC volatility is easy to explain.
- The receipt can map cleanly to an upper-strike UP leg and a lower-strike DOWN leg.
- A BTC-only MVP keeps binary-leg validation, fee routing, portfolio readback, and settlement guidance focused.

## Why SUI / DEEP / ETH are not MVP markets

SUI MOVE, DEEP MOVE, ETH MOVE, and other underlyings are future scope. They should not be required for the first protocol path because market availability is a runtime DeepBook Predict condition.

Until active SUI, DEEP, or ETH binary markets are confirmed at runtime, docs and code should avoid presenting them as MVP requirements.

## User problem

Directional prediction is hard. Many users have a view that an event will create volatility but do not know whether the final move will be up or down.

DeepVol lets users express:

```text
I think BTC will move meaningfully by expiry.
```

instead of:

```text
I think BTC will finish above this specific strike.
```

or:

```text
I think BTC will finish below this specific strike.
```

## What DeepBook Predict provides

DeepBook Predict remains the source of truth for:

- binary market construction;
- official quotes and mint costs;
- `PredictManager` balances and positions;
- oracle and expiry state;
- mint, redeem, and settlement behavior;
- protocol events for binary position lifecycle.

DeepVol must not duplicate DeepBook Predict pricing, oracle, risk, vault, or payout logic.

## What DeepVol adds

DeepVol adds the product abstraction around the official Predict primitives:

- BTC MOVE series metadata;
- paired UP and DOWN binary leg selection;
- atomic multi-leg PTB construction;
- premium and Create Fee presentation;
- non-custodial `MoveReceipt` minting;
- `ProtocolVault` fee deposit;
- portfolio aggregation around receipts plus `PredictManager` readback;
- guided settlement and redeem UX;
- simpler risk display for a structured product instead of separate raw legs.

## Can users manually buy UP + DOWN?

Yes. Advanced users can manually buy UP + DOWN through DeepBook Predict to create similar exposure.

DeepVol's value is not exclusivity. The value is productization: standardized BTC MOVE series, one-click atomic multi-leg execution, receipt-based portfolio aggregation, fee accounting, guided settlement/redeem, and clearer risk presentation.

Primitive UP, DOWN, and RANGE trades should remain advanced primitives in the MVP. They should not be the primary protocol fee source.

## MVP scope

The MVP is BTC MOVE only. It should select one active BTC oracle and expiry at runtime, preview both binary legs, build an atomic PTB that mints both legs through DeepBook Predict, charge a Create Fee, deposit that fee into `ProtocolVault`, and mint a non-custodial `MoveReceipt` that records linkage to the user's Predict positions.

The MVP does not require a creator marketplace, a tradable receipt, a custodial manager, a secondary market, or profit-fee enforcement.

## Non-custodial receipt limitation

The MVP Receipt is not a fully tradable claim token because underlying Predict positions remain in the user's `PredictManager`.

The receipt proves that the user created a BTC MOVE position through DeepVol and records the two binary leg keys, premium, fee, and series metadata. It can power portfolio display and settlement guidance, but it does not own the underlying Predict legs or custody payout.

Because the user can redeem directly through DeepBook Predict, a non-custodial MVP cannot enforce a Profit Fee at settlement.

## Future custodial / escrow receipt

A V2 design can explore a custodial or escrow MOVE model where a DeepVol-controlled manager, series-level manager, or escrow object holds the binary legs. In that model, the receipt could represent a stronger claim, become more tradable, and support wrapper-mediated settlement fees.

That model adds custody risk, settlement complexity, and stronger protocol responsibilities, so it should not block the BTC MOVE MVP.
