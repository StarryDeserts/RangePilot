---
Purpose: Define the DeepVol web information architecture for Predict primitives UP, DOWN, RANGE, and BTC MOVE.
Audience: Product engineers, frontend developers, SDK implementers, reviewers, and AI agents.
Status: DeepVol-13 frontend scaffold scope; primitive execution remains disabled until future quote, preflight, and wallet gates are implemented.
Source of truth relationship: Extends the DeepVol primitives/receipts model and frontend MVP docs; protocol docs and on-chain state remain authoritative for Predict semantics.
---

# DeepVol Predict Primitives Frontend

## Summary

DeepVol remains a BTC MOVE-first product. BTC MOVE is the supported receipt route: it packages official DeepBook Predict UP and DOWN binary legs into a protocol-enforced, non-custodial `MoveReceipt` so users can trade movement, not direction.

DeepVol-13 introduces UP, DOWN, and RANGE as secondary Predict primitives in the frontend information architecture. They are advanced surfaces for education, diagnostics, and future composer groundwork. They are not the primary product, not the MVP fee surface, and not enabled for direct wallet execution in this round.

## Product model

| Product | Meaning | Wins when |
|---|---|---|
| UP | Buy upside | BTC expires above the selected strike |
| DOWN | Buy downside | BTC expires below the selected strike |
| RANGE | Buy inside range | BTC expires inside the selected lower / upper range |
| MOVE | Buy movement | BTC expires below the lower strike or above the upper strike |

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

DeepVol-13 uses a scaffold-first approach:

| Surface | DeepVol-13 behavior |
|---|---|
| `/markets` | BTC MOVE remains featured first; UP, DOWN, and RANGE appear as advanced primitive cards. |
| `/buy/btc-move` | Existing wallet-gated BTC MOVE receipt transaction workspace remains the enabled route. |
| `/portfolio` | MOVE Receipts remain the active portfolio surface; Primitive Positions appear as placeholder/readback-groundwork cards. |
| Dedicated primitive route | Future work unless the scaffold grows beyond the markets page. |

The primitive cards explain the payoff, risk boundary, and execution status. They must not import transaction builders or submit wallet requests.

## Execution status

Primitive execution is scaffold-only in DeepVol-13.

Allowed:

- Explain UP, DOWN, RANGE, and MOVE payoffs.
- Link users back to the supported BTC MOVE receipt route.
- Reference existing SDK quote/readback capabilities in docs.
- Label direct primitive execution as disabled or future work.
- Prepare UI structure for future quote/preflight panels.

Not allowed in this round:

- Execute a real primitive mint.
- Submit a primitive wallet transaction.
- Add direct UP/DOWN binary mint execution.
- Claim general primitive portfolio indexing exists.
- Charge DeepVol fees on primitive trades.
- Treat primitive trades as `MoveReceipt` creation.

## SDK/helper boundary

Existing SDK and validation work already covers useful foundations:

| Capability | Status |
|---|---|
| Binary UP/DOWN quote | Existing devInspect helper support. |
| Binary UP/DOWN redeem | Existing guarded builder/preflight support for controlled redeem. |
| Binary UP/DOWN mint | Not first-class in the SDK yet; direct binary mint exists only in validation scripts. |
| Range quote | Existing devInspect helper support. |
| Range mint/redeem | Existing SDK builders/preflights from prior RangePilot validation. |
| Binary/range position readback | Existing known-key readback helpers. |

Because the first-class binary mint helper is missing and primitive execution needs complete quote, preflight, wallet, and readback gates, DeepVol-13 keeps the primitives UI non-executing.

## Copy boundaries

Use clear product copy:

```text
BTC MOVE remains the enabled receipt product. Direct primitives are scaffold-only and do not create MoveReceipt.
```

```text
Primitive trades do not create DeepVol MoveReceipt. Only BTC MOVE creates a receipt in this app.
```

The app should continue to emphasize:

```text
Trade movement, not direction.
```
