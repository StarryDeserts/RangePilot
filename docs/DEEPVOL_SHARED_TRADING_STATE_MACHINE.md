---
Purpose: Document the shared DeepVol trading state-machine package used by verified DeepVol web and Open Design.
Audience: Frontend developers, SDK integrators, product contributors, reviewers, and AI agents.
Status: DeepVol-38 extracts the verified MOVE / UP / DOWN / RANGE trading logic from `apps/deepvol-web/` into `packages/deepvol-trading-react/` so both DeepVol frontends consume one headless execution state layer.
Source of truth relationship: Complements DEEPVOL_FRONTEND_MVP.md and DEEPVOL_OPEN_DESIGN_REWRITE_APP.md; code remains authoritative for hook behavior and gate strings.
---

# DeepVol Shared Trading State Machine

## Package

```text
packages/deepvol-trading-react/
```

Package name:

```text
@rangepilot/deepvol-trading-react
```

This package is the shared React execution state layer for DeepVol trading products. It was extracted from the verified `apps/deepvol-web/` implementation and preserves its mintability, quote, preflight, wallet-gate, storage, PredictManager session, active-market, MOVE series, and portfolio readback behavior.

## Why it exists

`apps/deepvol-web/` is the verified executable trading app. `apps/deepvol-open-design/` is the visual Open Design surface. Before DeepVol-38, Open Design had repeatedly drifted while maintaining separate MOVE / UP / DOWN / RANGE mintability, quote, preflight, and wallet execution logic.

DeepVol-38 removes that split by making both apps consume the same headless package:

- `apps/deepvol-web/` keeps its existing UI behavior through thin compatibility wrappers.
- `apps/deepvol-open-design/` renders shared-machine steps, blockers, diagnostics, and actions as a view layer.
- The DeepVol-37 verified-app handoff remains as a secondary/emergency fallback, not the primary Open Design trade path.

## Public machine hooks

Minimum public product hooks:

```ts
useMoveTradeMachine()
useUpTradeMachine()
useDownTradeMachine()
useRangeTradeMachine()
usePredictManagerSession()
usePortfolioRecords()
```

Each product machine exposes:

```ts
{
  product,
  status,
  steps,
  blockers,
  actions,
  diagnostics,
  result,
}
```

`status` is one of:

```text
idle | blocked | ready | quoting | preflighting | awaiting_wallet | submitted | confirmed | failed
```

Step status is one of:

```text
pending | active | passed | blocked | failed
```

## Required action names

MOVE:

```text
refreshActiveMarket
generateMintableRange
createOrSelectVolSeries
refreshQuote
runPreflight
reviewInWallet
```

UP / DOWN:

```text
refreshActiveMarket
generateMintableStrike
refreshQuote
runPreflight
reviewInWallet
```

RANGE:

```text
refreshActiveMarket
generateMintableInterval
refreshQuote
runPreflight
reviewInWallet
```

The UI must not synthesize pass states. It should render `steps`, `blockers`, `diagnostics`, and action disabled state directly from the machine.

## Preserved safety invariants

The shared package preserves the verified app's execution gates:

- Quote freshness remains 120 seconds.
- Preflight freshness remains 120 seconds.
- Mintability pass TTL remains 5 minutes.
- Active-market expiry remains fail-closed.
- UP/DOWN execution requires primitive mintability validation to pass.
- RANGE execution requires dedicated range mintability validation to pass.
- MOVE VolSeries readiness requires matching active market and recent mintability validation.
- Wallet execution re-runs quote, manager balance, and preflight immediately before wallet review.
- Fresh mint-cost increases beyond the existing verified tolerance remain blocked.
- Dependency keys must match the current quote, preflight, wallet, market, manager, and mintability state.

## App boundaries

### `apps/deepvol-web/`

The verified app remains the execution reference and backwards-compatible UI. Its old hook and lib paths are wrappers or adapters over `@rangepilot/deepvol-trading-react` so existing routes and tests keep working.

### `apps/deepvol-open-design/`

Open Design is a view layer over the shared machines. Product tabs may show direct controls such as `Review in wallet`, but those controls must be wired to shared machine actions and disabled whenever the machine reports blockers or an action-disabled state.

Open Design must not maintain separate MOVE / UP / DOWN / RANGE mintability, quote, preflight, or wallet state machines.

### Verified-app fallback

The DeepVol-37 fallback stays available through `verifiedTradingHref(product)` and optional `VITE_DEEPVOL_VERIFIED_APP_URL`:

| Product | Verified app path |
|---|---|
| MOVE | `/buy/btc-move` |
| UP | `/primitives?type=UP` |
| DOWN | `/primitives?type=DOWN` |
| RANGE | `/primitives?type=RANGE` |

Fallback copy should remain visible near direct controls so users have a clear escape hatch if shared-machine execution is unavailable in the Open Design deployment.

## Verification expectations

Static verification should include:

```bash
npm --workspace packages/deepvol-trading-react run typecheck
npm --workspace packages/deepvol-trading-react run test
npm run typecheck:open-design
npm run build:open-design
npm --workspace apps/deepvol-open-design run test:open-design-ui
npm run typecheck:deepvol-web
npm run build:deepvol-web
```

Old-app source tests should keep proving the shared package preserves verified blocker strings, dependency-key checks, mintability TTLs, and wallet execution re-checks.

Manual browser smoke may load Open Design product routes and verified old-app routes, but automated smoke must not click `Review in wallet`, approve wallet prompts, or execute real transactions. Connected-wallet acceptance for actual trading remains manual.