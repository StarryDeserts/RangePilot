---
Purpose: Document the DeepVol-28 Open Design frontend rewrite as a standalone app.
Audience: Developers, product contributors, reviewers, and AI agents.
Status: DeepVol-37 makes `apps/deepvol-open-design/` a presentation and verified-app handoff surface. It preserves landing, markets, BTC product explanation/status, and portfolio readback, but executable trading remains in the verified `apps/deepvol-web/` app. Earlier direct-execution parity work is historical context, not the active Open Design execution path.
Source of truth relationship: Companion to DEEPVOL_FRONTEND_MVP.md; records the Open Design rewrite rationale, architecture, and boundaries.
---

# DeepVol Open Design Rewrite App

## Why the rewrite

DeepVol-27 attempted to implement the Open Design UI by modifying `apps/deepvol-web/` — adding new components, routes, and CSS on top of the existing codebase. The result did not visually match the 5 HTML design mockups in `uiux-design/`. The old app's component hierarchy, CSS architecture, and visual language diverged too far from the target design.

DeepVol-28 creates a separate, standalone app that:

1. Uses Tailwind CSS v4 with `@theme` tokens extracted verbatim from the HTML mockups
2. Copies all 25 headless hooks and 9 lib files verbatim (they have zero UI imports)
3. Builds new components from scratch following the mockup HTML structure
4. Never imports from `apps/deepvol-web/src/components/` or `apps/deepvol-web/src/styles.css`

## App path

```
apps/deepvol-open-design/
```

## Source HTML mockups

```
uiux-design/landing-page.html    — Landing / hero / products / how-it-works
uiux-design/markets.html         — Markets overview / featured BTC card / table
uiux-design/market-btc.html      — BTC terminal: 3-column layout, trade tabs
uiux-design/portfolio.html       — Portfolio: summary, receipts, positions
uiux-design/state.html           — Transaction state system reference
```

## Route mapping

| Path | Page | Notes |
|------|------|-------|
| `/` | LandingPage | Hero, products, how-it-works, status strip |
| `/markets` | MarketsPage | Featured BTC card, market table |
| `/markets/btc` | BtcMarketPage | 3-column terminal, product tabs |
| `/markets/btc?product=X` | BtcMarketPage | X = MOVE, UP, DOWN, RANGE |
| `/portfolio` | PortfolioPage | Summary cards, receipts, positions |

Compatibility routes handled by App.tsx `parseRoute`:

| Legacy path | Resolves to |
|-------------|-------------|
| `/buy/btc-move` | BtcMarketPage with product=MOVE |
| `/primitives?type=UP` | BtcMarketPage with product=UP |
| `/primitives?type=DOWN` | BtcMarketPage with product=DOWN |
| `/primitives?type=RANGE` | BtcMarketPage with product=RANGE |

## Tech stack

- Vite 7 + React 19 + TypeScript
- Tailwind CSS 4 via `@tailwindcss/vite` (local, not CDN)
- `@mysten/dapp-kit` + `@mysten/sui` + `@tanstack/react-query`
- SPA client-side routing (no routing library)

## Design system

Tailwind v4 `@theme` tokens extracted from the HTML mockups:

- **Colors**: abyss-900/800/700, navy-600/500, aqua-400, cyanx-500, azure-600, iris-500, seafoam-400, amber-400, coral-400, ink-hi/mid/low
- **Typography**: Inter Tight (display), Inter (body), JetBrains Mono (mono)
- **Component classes**: `.glass`, `.glass-inner`, `.chip`, `.pill-*` (12 variants), `.dot-*` (8 variants), `.gate`/`.gate-icon` (5 variants), `.toast-*` (4 variants), `.step-dot`/`.step-line`, `.skel`, `.spinner`, `.tab`, `.input`, `.label`, `.bg-cta`, `.bg-abyss`, `.grain`, `.featured-accent`, `.nav-link`
- **Animations**: pulse, draw, float, shimmer, skel, spin + `prefers-reduced-motion` support

## Logic reuse boundaries

**Copied verbatim** (zero UI imports, resolved via root tsconfig path aliases):
- `src/hooks/` — 25 headless React hooks
- `src/lib/` — 9 pure utility files

**Allowed runtime dependencies** (shared packages):
- `@rangepilot/sdk/*`
- `@rangepilot/types/*`
- `@rangepilot/config/*`

**Forbidden runtime imports**:
- `apps/deepvol-web/src/components/**`
- `apps/deepvol-web/src/styles.css`
- `apps/deepvol-web/src/App.tsx`
- `apps/deepvol-web/src/routes/**`

## Verified execution handoff

DeepVol-37 stops exposing local Open Design trading execution. `apps/deepvol-web/` is the verified executable trading app for BTC MOVE and primitives. `apps/deepvol-open-design/` keeps product education, market/status context, and portfolio readback presentation, then sends execution-intent CTAs to verified app routes.

`VITE_DEEPVOL_VERIFIED_APP_URL` may point Open Design CTAs at a deployed verified app host. The value is trimmed of a trailing slash before route concatenation. If unset, CTAs use relative paths. Same-origin relative paths assume hosting/routing sends those paths to the verified `apps/deepvol-web/` app; if they resolve inside Open Design, compatibility routes remain non-executing presentation pages.

Verified trading route mapping:

| Product | Verified app path |
|---|---|
| MOVE | `/buy/btc-move` |
| UP | `/primitives?type=UP` |
| DOWN | `/primitives?type=DOWN` |
| RANGE | `/primitives?type=RANGE` |

The BTC market page must state that trading execution is handled by the verified DeepVol app and that no wallet action is initiated from Open Design.

## What the verified app remains for

`apps/deepvol-web/` is preserved as:

- Verified executable trading app and state machine
- Logic reference for hook behavior and SDK integration patterns
- Historical Testnet validation evidence (browser buy, redeem, primitive execution)

It is not the Open Design presentation surface.

## DeepVol-29: Historical execution parity

DeepVol-28 shipped the visual shell with static trade buttons. DeepVol-29 previously wired real chain execution in Open Design:

- **MOVE:** `useActiveBtcMoveSeries` → `useBtcMoveMintableRange` → `useDeepVolQuote` → `useBuyMoveReceipt` → `useSignAndExecuteTransaction` → wallet prompt
- **UP/DOWN:** `usePrimitiveMintableStrike` → `usePrimitiveQuote` → `usePrimitivePreflight` → `usePrimitiveWalletExecution` → wallet prompt
- **RANGE:** `usePrimitiveMintableRange` → `usePrimitiveQuote` → `usePrimitivePreflight` → `usePrimitiveWalletExecution` (submitRange path) → wallet prompt

RANGE is NOT permanently disabled. It uses real gate-based status via `usePrimitiveMintableRange`.

Wallet prompt only appears when all gates pass. No static fake buttons.

Execution panels: `MoveExecutionPanel`, `BinaryPrimitiveExecutionPanel`, `RangeExecutionPanel`, `WalletActionButton` (shared).

DeepVol-37 supersedes this as an active Open Design path: those local execution panels, wallet prompts, PredictManager setup/funding, quote, preflight, VolSeries creation, mint, redeem, deposit, and withdraw controls are historical context for why the handoff boundary exists.

Landing page blank section fixed (`.reveal` CSS default visibility changed from hidden to visible).

## DeepVol-30: Historical PredictManager setup CTA

DeepVol-29 showed blocker text when PredictManager was missing but provided no actionable button. DeepVol-30 previously added local Open Design setup controls as part of the now-superseded direct-execution parity path. Under DeepVol-37, these details are historical only; Open Design no longer exposes PredictManager creation, funding, quote, preflight, wallet execution, or SDK candidate-search controls.

Historical `PredictManagerSetup` statuses:

| Session status | UI |
|---|---|
| `wallet_required` | "Connect wallet" guidance |
| `wrong_network` | "Switch to Sui Testnet" guidance |
| `missing` | **"Create PredictManager" CTA button** (historically called real `signAndExecuteTransaction`; no longer active in Open Design) |
| `loading` | Spinner + "Validating..." |
| `ready` | Hidden (returns null) |
| `invalid` / `error` | Error message + Refresh / Clear + Advanced manual override |

Manual object ID entry remained under collapsed Advanced/Developer section only in the historical implementation.

Passive blocker pills were removed from BtcMarketPage and replaced by an actionable setup card in that superseded path.

## DeepVol-31: Historical connected-wallet UX fixes

Three P0 issues found during connected-wallet testing of the superseded local Open Design execution path:

1. **MOVE active market context:** MoveExecutionPanel now shows the active market status separately from VolSeries status. Users see "Live" market indicator even when VolSeries is "Idle" or "Missing". VolSeries idle message softened from imperative "Discover an active BTC market first" to "Awaiting active BTC market context."

2. **DUSDC deposit flow:** `PredictManagerSetup` no longer returned null when manager status was "ready". In the historical local execution path, if the PredictManager had zero DUSDC balance, it showed `ManagerFundingCard` with wallet DUSDC balance, deposit amount input, and "Deposit DUSDC to PredictManager" CTA wired to real `buildDepositDusdcTransaction` → `signAndExecuteTransaction`. Under DeepVol-37, Open Design no longer exposes this deposit CTA.

3. **Funding vs quote separation:** Deposit status (in PredictManagerSetup area) is visually separate from quote/preflight errors (inside execution panels). "Non-positive mint cost" from quote is not confused with "insufficient DUSDC balance" from funding.

`TransactionStatusStrip` extracted as shared component used by both `PredictManagerSetup` and `ManagerFundingCard`.

## DeepVol-32: Historical product context, mintability gates, and preflight wiring

Five root causes were fixed after connected-wallet testing of the now-superseded Open Design local execution path:

1. **Shared blocker text fixed:** `buildPrimitiveQuoteBlockers()` in `primitiveQuoteGate.ts` used "Configured BTC MOVE VolSeries" text for all products. It was replaced with product-neutral "Configured VolSeries" copy so UP/DOWN no longer showed MOVE-specific error messages.

2. **Preflight gated on mintability:** `buildPrimitivePreflightBlockers()` checked `primitiveMintabilityStatus` (for UP/DOWN) and `rangeMintabilityStatus` (for RANGE). `PrimitiveInputState` was extended with optional mintability status fields to prevent preflight from running when mintability search had failed.

3. **MOVE range band TBD fixed:** The range band fallback chain included `activeMarket?.suggestedLowerStrike` / `suggestedUpperStrike` before falling through to "TBD". When the active market provided suggested strikes, they displayed immediately.

4. **RANGE ARITHMETIC_ERROR prevented:** Consequence of fix #2 — RANGE preflight no longer ran with invalid parameters from failed mintability search, preventing `vault::set_mtm_with_curve ARITHMETIC_ERROR`.

5. **Mintability threading:** `usePrimitivePreflight` hook accepted `primitiveMintabilityStatus` and `rangeMintabilityStatus` params. `BinaryPrimitiveExecutionPanel` and `RangeExecutionPanel` passed their respective mintability statuses through to preflight.

## DeepVol-33: Historical runtime mintability input parity

DeepVol-33 fixed a connected-wallet diagnostic gap in the now-superseded local Open Design execution path: all products could fail mintability search with non-positive mint cost while the UI lacked enough runtime evidence to distinguish input mismatch, quote economics, and funding/preflight failures. Under DeepVol-37, these diagnostics preserve historical parity context and are not active Open Design quote, preflight, or SDK candidate-search controls.

Key historical changes:

1. **Shared runtime input builder:** `buildTradeRuntimeContext()` validated wallet address, Testnet network, PredictManager, live active market, oracle ID, oracle object ID, expiry, normalized quantity, forward/spot anchor, tick size, min strike, and underlying asset before SDK candidate search.

2. **Normalized SDK inputs:** MOVE, UP, DOWN, and RANGE mintability hooks passed `runtimeContext.sdkInput.quantity` and other validated `sdkInput` fields into SDK candidate helpers. Candidate state reset when the runtime dependency key changed, including oracle object, spot/forward, tick grid, quantity, manager, and wallet state.

3. **MOVE quote oracle object fixed:** `useDeepVolQuote()` accepted active market context and used `activeMarket.oracleObjectId` for UP/DOWN leg quotes instead of reusing `series.oracleId` as the OracleSVI object ID. It also blocked stale VolSeries when oracle or expiry differed from the active BTC market.

4. **Shared diagnostics panel:** `TradeRuntimeDiagnostics` rendered in MOVE, UP/DOWN, and RANGE panels. It showed runtime input fields, anchor source, quote/preflight status, candidate counts, dominant failure, raw failure summary, Wallet DUSDC, and PredictManager DUSDC.

5. **Balance vs quote separation:** Wallet DUSDC remained a deposit/create-fee source; PredictManager DUSDC remained mint collateral/premium balance. Non-positive quotes were not labeled as balance failures unless raw diagnostics contained balance/deposit evidence.

In that historical implementation, suggested strikes seeded UI fields only; mintability candidate search used `forward` or `spot` plus the tick grid. See [DEEPVOL_MINTABILITY_RUNTIME_DIAGNOSTICS.md](./DEEPVOL_MINTABILITY_RUNTIME_DIAGNOSTICS.md).

## DeepVol-34: Historical verified state-machine parity

DeepVol-34 stopped treating the Open Design app as an independent trading implementation. The old `apps/deepvol-web` app remained the verified functional state-machine reference, and Open Design was aligned to the same sequence. Under DeepVol-37, this parity history remains useful, but executable trading is delegated to `apps/deepvol-web` routes instead of exposed locally in Open Design.

Canonical orders:

- **MOVE:** `active market -> mintable range -> VolSeries -> quote -> preflight -> wallet`
- **UP/DOWN:** `active market -> mintable strike -> quote -> preflight -> wallet`
- **RANGE:** `active market -> mintable interval -> quote -> preflight -> wallet`

Open Design parity fixes:

1. `MoveExecutionPanel` now wires `useCreateVolSeries` after a passed mintable MOVE range and only passes `moveQuoteSeriesId` to `useDeepVolQuote` when the selected series is ready for the validated range.
2. Binary primitive quote inputs now come from `quoteStrikeInput`, which is populated only after `mintableStrike.status === "passed"`.
3. RANGE quote inputs now come from `quoteLowerStrikeInput` / `quoteUpperStrikeInput`, populated only after `mintableRange.status === "passed"`.
4. Suggested strikes remain visual seed fields only; they no longer become canonical quote/preflight inputs before mintability passes.
5. Product contexts remain isolated, and non-positive quote diagnostics remain distinct from Wallet DUSDC and PredictManager DUSDC funding diagnostics.

See [DEEPVOL_OLD_UI_TRADING_STATE_MACHINE.md](./DEEPVOL_OLD_UI_TRADING_STATE_MACHINE.md). Connected-wallet acceptance is still required; Claude Code did not approve wallet prompts or execute real transactions.

## Verification

| Check | Expected |
|-------|----------|
| `npm run typecheck:open-design` | Pass |
| `npm run build:open-design` | Pass |
| `npm --workspace apps/deepvol-open-design run test:open-design-ui` | Pass, including verified-app handoff boundary assertions |
| Browser smoke (all routes) | Landing, markets, BTC products, and portfolio render without console errors |
| Responsive 375px | Columns stack, no overflow |
| Import isolation | No forbidden imports from `apps/deepvol-web` UI or CSS |
| MOVE verified CTA | Uses `/buy/btc-move`, optionally prefixed by `VITE_DEEPVOL_VERIFIED_APP_URL` |
| UP verified CTA | Uses `/primitives?type=UP`, optionally prefixed by `VITE_DEEPVOL_VERIFIED_APP_URL` |
| DOWN verified CTA | Uses `/primitives?type=DOWN`, optionally prefixed by `VITE_DEEPVOL_VERIFIED_APP_URL` |
| RANGE verified CTA | Uses `/primitives?type=RANGE`, optionally prefixed by `VITE_DEEPVOL_VERIFIED_APP_URL` |
| Open Design wallet boundary | No local wallet prompt, PredictManager setup/funding, quote, preflight, VolSeries creation, mint, redeem, deposit, or withdraw control is exposed |
| BTC market copy | States that trading execution is handled by the verified DeepVol app and no wallet action is initiated from Open Design |
