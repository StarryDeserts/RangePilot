---
Purpose: Document RANGE primitive mintability diagnostics, source-confirmed entrypoints, failure taxonomy, and safety boundaries.
Audience: Frontend developers, SDK implementers, protocol integrators, reviewers, and AI agents.
Status: DeepVol-24-fix adds structured RANGE candidate diagnostics. Real RANGE primitive wallet mint is still NOT validated on Testnet.
Source of truth relationship: Derived from SDK/frontend implementation and source inspection; runtime market state remains authoritative.
---

# RANGE Mintability Diagnostics

## Observed browser failure

The DeepVol-23 RANGE primitive route could reach an active BTC market but fail during mintable interval search with:

```text
No mintable RANGE interval was found for the current market.
Try refreshing the active BTC market or adjusting the interval.
```

This means the route had enough active-market context to attempt RANGE candidate discovery, but no candidate reached a passing quote plus mint preflight. Before DeepVol-24-fix, the UI did not show whether candidates failed quote construction, quote pricing, mintability assertions, stale oracle checks, or local interval validation.

## Source confirmation

Source inspection confirms the current RANGE primitive path is structurally different from UP/DOWN binary primitives:

| Surface | Confirmed RANGE path |
|---|---|
| Key builder | `deepbook_predict::range_key::new` |
| Key args | `oracle_id`, `expiry`, `lower_strike`, `higher_strike` |
| Quote helper | `predict::get_range_trade_amounts` with `RangeKey` |
| Mint/preflight helper | `predict::mint_range<Quote>` with `RangeKey` |
| Wallet builder | Uses the same SDK RANGE transaction builder as preflight |
| UP/DOWN contrast | UP/DOWN use `market_key::up` / `market_key::down` and `predict::mint<Quote>` |

No RANGE key-construction, argument-order, quote-helper, or mint-helper source bug was confirmed from inspection. Runtime failure class must still be read from candidate diagnostics for the active market at the time of validation.

## Candidate search scope

DeepVol-24-fix does not broaden RANGE candidate generation. The current search remains:

- anchor: `forward ?? spot`;
- strategies: `centered`, `below-anchor`, `above-anchor`;
- width multipliers in ticks: `[10, 20, 50, 100, 200, 500]`;
- per-candidate checks: quote, positive mint cost, mint-range devInspect preflight.

Ask-bounds data is not yet used to generate candidates in the frontend flow. If diagnostics show mostly `assert_mintable_ask`, a future task should prefer ask-bounds-aware candidate construction instead of blindly adding wider multipliers.

## Diagnostic fields

Each candidate diagnostic records:

```text
strategy
widthMultiplier
widthTicks
lowerStrike
higherStrike
quoteStatus: skipped | passed | failed
quoteCostAtomic
preflightStatus: skipped | passed | failed
failureFamily
message
rawErrorSummary
```

The summary records:

```text
totalCandidates
quotedCandidates
preflightPassedCandidates
failureCountsByFamily
firstFewFailures
lastFailure
```

`rawErrorSummary` is shortened and reserved for advanced diagnostics. The main UI should show safe summary copy, not a full VM error dump.

## Failure taxonomy and interpretation

| Failure family | Meaning | Typical next step |
|---|---|---|
| `invalid_bounds` | Candidate interval was rejected before quote/preflight. | Check tick alignment, lower/upper ordering, and strike-grid assumptions. |
| `quote_failed` | RANGE quote failed for candidate intervals. | Reconfirm active market data and quote helper inputs. |
| `non_positive_quote` | Quote path succeeded but returned non-positive mint cost. | Treat as not mintable for execution; inspect quantity and pricing context. |
| `preflight_failed` | Quote passed but `predict::mint_range<Quote>` devInspect failed. | Inspect advanced diagnostics before changing search. |
| `assert_mintable_ask` | Current market did not expose a mintable RANGE ask for attempted intervals. | Prefer ask-bounds-aware candidate strategy or wait for a different live market. |
| `assert_live_oracle` | Active market may be stale or no longer live. | Refresh active BTC market and do not execute against stale oracle data. |
| `key_builder_failed` | SDK could not construct a valid Predict `RangeKey`. | Fix builder/input normalization before enabling execution. |
| `unknown` | Failure did not match a known class. | Inspect advanced diagnostics and source-confirm before changing behavior. |

Interpret common summaries as follows:

- all `quote_failed`: quote/key/helper issue or market data issue;
- mostly `assert_mintable_ask`: attempted intervals do not match mintable ask availability;
- any `assert_live_oracle`: market freshness is suspect;
- many `invalid_bounds`: candidate generation produced rejected intervals;
- `non_positive_quote`: quote path works, but the economics/amount are not executable;
- `preflight_failed` or `unknown`: inspect advanced details before broadening search.

## UI behavior

When RANGE mintability search fails, `/primitives?type=RANGE` now keeps the generic failure callout and adds a safe diagnostic summary:

```text
Tried N candidates.
M quoted successfully.
P preflight passed.
Most common reason: <failure family> (<count>).
```

The advanced section lists representative candidate rows with strategy, width multiplier, lower/upper strikes, quote status, quote cost when available, preflight status, failure family, and shortened raw error summary.

## Execution gate

RANGE wallet execution remains conservative:

- no wallet prompt unless RANGE mintability status is `passed`;
- quote and mint preflight must pass for the selected interval;
- stale validation is reset when wallet, network, PredictManager, quantity, active oracle, expiry, or market status changes;
- manual interval edits invalidate the previous validation.

A passing diagnostic means quote plus devInspect preflight passed for the current market. It does not prove that a real RANGE mint has executed.

## Safety and validation status

DeepVol-24-fix diagnostics use source inspection, quote devInspect, and mint-range devInspect preflight only.

This work did not execute:

- real RANGE mint;
- UP/DOWN mint;
- BTC MOVE buy;
- BTC MOVE redeem;
- `create_series`;
- publish or upgrade;
- withdraw;
- mainnet transaction.

**Real RANGE primitive wallet mint remains NOT validated on Testnet** until an explicit user-approved wallet transaction succeeds and digest/event/readback evidence is recorded.
