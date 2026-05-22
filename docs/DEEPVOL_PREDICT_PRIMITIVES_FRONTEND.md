---
Purpose: Define the DeepVol web information architecture for Predict primitives UP, DOWN, RANGE, and BTC MOVE.
Audience: Product engineers, frontend developers, SDK implementers, reviewers, and AI agents.
Status: DeepVol-14 primitive quote/preflight preview scope; primitive wallet execution remains disabled.
Source of truth relationship: Extends the DeepVol primitives/receipts model, primitive quote/preflight contract, and frontend MVP docs; protocol docs and on-chain state remain authoritative for Predict semantics.
---

# DeepVol Predict Primitives Frontend

## Summary

DeepVol remains a BTC MOVE-first product. BTC MOVE is the supported receipt route: it packages official DeepBook Predict UP and DOWN binary legs into a protocol-enforced, non-custodial `MoveReceipt` so users can trade movement, not direction.

DeepVol-14 exposes UP, DOWN, and RANGE as secondary Predict primitive quote/preflight previews. They are advanced surfaces for education, diagnostics, and future composer groundwork. They are not the primary product, not the MVP fee surface, and not enabled for direct wallet execution.

See [DEEPVOL_PRIMITIVE_QUOTE_PREFLIGHT.md](./DEEPVOL_PRIMITIVE_QUOTE_PREFLIGHT.md) for the quote/preflight contract and blocker matrix.

## Product model

| Product | Meaning | Wins when | DeepVol frontend status |
|---|---|---|---|
| UP | Buy upside | BTC expires above the selected strike | Quote/preflight preview only |
| DOWN | Buy downside | BTC expires below the selected strike | Quote/preflight preview only |
| RANGE | Buy inside range | BTC expires inside the selected lower / upper range | Quote/preflight preview only |
| MOVE | Buy movement | BTC expires below the lower strike or above the upper strike | Primary enabled receipt product |

BTC MOVE is the productized DeepVol route:

```text
BTC MOVE = UP above upper strike + DOWN below lower strike
```

Direct primitive trades do not create a DeepVol `MoveReceipt`. Only the BTC MOVE receipt route creates a `MoveReceipt` in the DeepVol MVP.

## RANGE and MOVE complementarity

RANGE and MOVE are complementary exposures around a selected interval:

- RANGE wins when BTC stays inside the selected interval.
- MOVE wins when BTC leaves the selected interval.

This relationship is useful for education and future composition, but the MVP should not turn DeepVol into a generic Predict terminal. BTC MOVE remains the supported user-facing product.

## Frontend information architecture

DeepVol-14 uses a preview-only primitive route:

| Surface | DeepVol-14 behavior |
|---|---|
| `/markets` | BTC MOVE remains featured first; UP, DOWN, and RANGE cards link to quote/preflight previews. |
| `/buy/btc-move` | Existing wallet-gated BTC MOVE receipt transaction workspace remains the enabled route. |
| `/primitives` | Defaults to UP and renders primitive quote/preflight controls for the configured BTC MOVE series. |
| `/primitives?type=UP` | Shows UP strike, quantity, quote, mint preflight, diagnostics, and disabled execution. |
| `/primitives?type=DOWN` | Shows DOWN strike, quantity, quote, mint preflight, diagnostics, and disabled execution. |
| `/primitives?type=RANGE` | Shows lower/upper strikes, quantity, range quote, range mint preflight, diagnostics, and disabled execution. |
| `/portfolio` | Separates MOVE Receipts from Primitive Positions and supports known-key primitive readback for a manually entered PredictManager ID. |

The primitive cards and route explain payoff, risk boundary, quote/preflight status, and disabled execution. They must not import signing hooks or real primitive execution builders.

## Execution status

Primitive wallet execution is disabled in DeepVol-14.

Allowed:

- Explain UP, DOWN, RANGE, and MOVE payoffs.
- Link users back to the supported BTC MOVE receipt route.
- Use browser-safe devInspect quote helpers for UP, DOWN, and RANGE.
- Use devInspect-only mint preflight helpers for UP, DOWN, and RANGE.
- Show preflight pass/fail diagnostics without enabling wallet execution.
- Read known primitive keys for a manually entered PredictManager ID.
- Label direct primitive execution as disabled.

Not allowed:

- Execute a real primitive mint.
- Submit a primitive wallet transaction.
- Import wallet signing hooks into `/primitives` route or primitive quote panel code.
- Export a real binary primitive mint transaction builder.
- Claim general primitive portfolio indexing exists.
- Charge DeepVol fees on primitive trades.
- Treat primitive trades as `MoveReceipt` creation.

## SDK/helper boundary

Existing SDK and validation work covers the current preview surface:

| Capability | Status |
|---|---|
| Binary UP/DOWN quote | Browser-safe `devInspectBinaryQuote` support. |
| Binary UP/DOWN mint preflight | DeepVol-14 `devInspectMintBinaryPreflight` support; internal builder only. |
| Binary UP/DOWN mint execution | Not exposed in the DeepVol app. |
| Binary UP/DOWN redeem | Existing guarded builder/preflight support for controlled BTC MOVE receipt redeem. |
| Range quote | Browser-safe `devInspectRangeQuote` support. |
| Range mint preflight | Existing `devInspectMintRangePreflight` support. |
| Range mint execution | Existing SDK capability from prior RangePilot validation, but not enabled from DeepVol primitives UI. |
| Binary/range position readback | Existing known-key readback helpers; no general enumeration. |

Because primitive execution still needs product, risk, wallet, fee, portfolio, and review decisions, DeepVol-14 keeps the primitives UI non-executing even when quote and preflight pass.

## Copy boundaries

Use clear product copy:

```text
BTC MOVE remains the enabled receipt product. Direct primitives open quote/preflight preview only and do not create MoveReceipt.
```

```text
Primitive wallet execution is disabled in DeepVol-14.
```

```text
Primitive trades do not create DeepVol MoveReceipt. Only BTC MOVE creates a receipt in this app.
```

```text
Known selected key readback is supported first. General primitive position indexing is future work.
```

The app should continue to emphasize:

```text
Trade movement, not direction.
```
