---
Purpose: Define the DeepVol BTC MOVE business model and fee enforceability boundary.
Audience: Project maintainers, business reviewers, Move developers, SDK implementers, frontend developers, and AI agents.
Status: DeepVol-3B Route B business model reference.
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

The premium basis is the actual quote-asset balance delta from the user's `PredictManager` across both binary mints:

```text
premium = manager balance before UP/DOWN mints - manager balance after UP/DOWN mints
```

DeepVol-3B still calls `predict::get_trade_amounts` immediately before the two internal `predict::mint<Quote>` calls as an early cap and fee-coin coverage check. The receipt, final `max_premium_paid` cap, and final Create Fee basis use the actual manager balance delta.

Tiny premiums can calculate a zero Create Fee because Move integer division truncates:

```text
premium * create_fee_bps / 10000
```

DeepVol-3B accepts zero-fee rounding and does not add a minimum fee policy.

## ProtocolVault destination

DeepVol-3B defines its own fee treasury in `deepvol::vault`:

- `AdminCap` is minted to the publisher during package init.
- `ProtocolVault<Quote>` is created by the admin after publish.
- `receipt::buy_move_receipt<Quote>` deposits Create Fee into `ProtocolVault<Quote>`.
- `vault::withdraw_protocol_fees<Quote>` lets the admin withdraw protocol fees.

The vault does not custody DeepBook Predict positions or payouts. It only holds DeepVol protocol fees.

DeepVol Testnet config keeps these values as `null` until manual publish/setup:

- `packageId`;
- `protocolVaultId`;
- `adminCapId`.

## Predict premium vs DeepVol Create Fee

The Predict mint premium and DeepVol Create Fee are separate flows:

| Flow | Paid from | Controlled by | Destination |
|---|---|---|---|
| Predict UP/DOWN mint premium | User's `PredictManager` quote-asset balance | DeepBook Predict | DeepBook Predict accounting/vaults |
| DeepVol Create Fee | Separate `fee_coin<Quote>` passed to DeepVol | DeepVol `receipt::buy_move_receipt<Quote>` | DeepVol `ProtocolVault<Quote>` |

A DeepBook Predict abort rolls back the DeepVol fee deposit and receipt creation because both mints and the fee deposit run in one transaction.

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
3. DeepVol calls one protocol-enforced receipt path that internally mints both legs.
4. DeepVol mints a non-custodial receipt for portfolio and settlement guidance.
5. DeepVol collects a Create Fee into its own `ProtocolVault<Quote>`.
