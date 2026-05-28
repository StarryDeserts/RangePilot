---
Purpose: Define the DeepVol wallet-gated frontend MVP scaffold, UI/UX foundation, and safety boundaries.
Audience: Frontend developers, SDK implementers, product contributors, reviewers, and AI agents.
Status: DeepVol-37 clarifies that verified executable trading remains in `apps/deepvol-web/`, while `apps/deepvol-open-design/` is now a presentation and verified-app handoff surface. Earlier Open Design runtime parity and diagnostics work remains historical context; execution gates, wallet prompts, PredictManager setup/funding, quotes, preflights, VolSeries creation, mint, redeem, deposit, and withdraw controls are not active Open Design behavior. See DEEPVOL_OPEN_DESIGN_REWRITE_APP.md, DEEPVOL_ACTIVE_MOVE_SERIES.md, DEEPVOL_MINTABLE_MOVE_RANGE.md, DEEPVOL_PREDICT_MANAGER_UX.md, DEEPVOL_PORTFOLIO_PRIMITIVE_POSITIONS.md, and DEEPVOL_MINTABILITY_RUNTIME_DIAGNOSTICS.md.
Source of truth relationship: Derived from DeepVol foundation docs, deployed receipt validation, and local frontend implementation; protocol docs and on-chain state remain authoritative for transaction semantics.
---

# DeepVol Frontend MVP

## Summary

DeepVol-6 added a DeepVol-first frontend scaffold under `apps/deepvol-web/`. DeepVol-7 redesigns that app into a more professional oceanic DeFi trading experience for the validated BTC MOVE receipt path while preserving strict wallet, Testnet, quote, fee coin, and preflight gates before any wallet prompt can submit `receipt::buy_move_receipt<DUSDC>`.

The redesigned frontend is still an MVP foundation, not a production launch. It improves product clarity, route hierarchy, transaction readiness states, portfolio receipt presentation, accessibility, and responsive layout without adding production chain behavior.

DeepVol-8 repairs the browser interaction flow for brand-new Sui Testnet users. The Buy page exposes the path from wallet connection to PredictManager setup, DUSDC funding visibility, explicit quote refresh, explicit preflight, final buy gating, and portfolio guidance.

DeepVol-9 implements the browser-safe main preflight for `buy_move_receipt<DUSDC>`. The `Run preflight` action now reads the connected wallet's `PredictManager` DUSDC balance with `predict_manager::balance<DUSDC>`, verifies it covers the expected premium, builds the DeepVol receipt transaction in browser, and runs `devInspect` before the final wallet prompt can unlock. Direct two-leg binary mint preflight is diagnostic-only for the composed receipt path; the receipt entrypoint itself is the main gate.

DeepVol-10 records manual browser wallet validation of the full buy path. The validated browser digest is `A6YB62BqMmWsQeEZUoh4qYAA6n4RMqnih5TtHRdadfGn`, the created receipt is `0xbbc2d18447502830a96602b8f9611e834c509d6fa00abdf2061ecd1addaa35eb`, and the portfolio page displayed the receipt successfully.

DeepVol-11 adds guided non-custodial redeem read/preflight scaffolding to Portfolio. Each receipt card can run an explicit redeem preflight that reads UP/DOWN `PredictManager` quantities, previews redeem payout, and devInspects `predict::redeem<DUSDC>`.

DeepVol-12 wires controlled browser-wallet redeem execution for the known BTC MOVE receipt behind exact receipt, owner, Testnet, preflight, fresh submit-time read/preflight, and one-shot attempt gates. DeepVol-13 then validates one browser-wallet guided redeem for that known receipt with digest `HeHNeZ95oymZzmA2ZpdjkvJgCaA9s5DzL7qs6aCgbJbJ`; see [DEEPVOL_BROWSER_REDEEM_VALIDATION.md](./DEEPVOL_BROWSER_REDEEM_VALIDATION.md).

DeepVol-15 expands the Predict primitives information architecture into a guarded primitive terminal. UP and DOWN can open wallet review only after active BTC market discovery, fresh quote, manager balance, and binary mint preflight gates pass; RANGE remains quote/preflight-only until dedicated mintability validation. DeepVol-16 confirmed browser smoke and source/test gate review, then a wallet-enabled preflight exposed a stale/non-live oracle blocker (`oracle_config::assert_live_oracle` abort code `3`). DeepVol-16-fix adds active market refresh, effective status display, manual override diagnostics, stale-oracle copy, and selected oracle object propagation; see [DEEPVOL_PRIMITIVE_ACTIVE_MARKET_DISCOVERY.md](./DEEPVOL_PRIMITIVE_ACTIVE_MARKET_DISCOVERY.md), [DEEPVOL_PRIMITIVE_EXECUTION_VALIDATION.md](./DEEPVOL_PRIMITIVE_EXECUTION_VALIDATION.md), [DEEPVOL_PRIMITIVE_EXECUTION_POLICY.md](./DEEPVOL_PRIMITIVE_EXECUTION_POLICY.md), [DEEPVOL_PREDICT_PRIMITIVES_FRONTEND.md](./DEEPVOL_PREDICT_PRIMITIVES_FRONTEND.md), and [DEEPVOL_PRIMITIVE_QUOTE_PREFLIGHT.md](./DEEPVOL_PRIMITIVE_QUOTE_PREFLIGHT.md). DeepVol-21 adds mintable strike candidate search via `findMintableBinaryPrimitiveCandidate()` for UP/DOWN primitives and requires `primitiveMintabilityStatus === "passed"` before wallet execution can proceed; no real UP/DOWN mint has been executed yet. DeepVol-24-fix adds RANGE candidate diagnostics so failed mintable interval searches show candidate counts, quote/preflight counts, dominant failure family, and advanced candidate rows while keeping RANGE wallet review blocked unless mintability passes. DeepVol-25 adds a shared wallet-scoped PredictManager session for BTC MOVE and primitives, moves manual manager ID entry into Advanced / Developer fallback, and shows primitive local records plus known-key readback separately from MOVE Receipts. DeepVol-27 translated the Open Design HTML into the React app route map, and DeepVol-37 reframes those Open Design BTC product pages as explanatory/presentation pages whose execution-intent CTAs hand off to verified `apps/deepvol-web` routes instead of preserving local hook-derived execution gates. See [DEEPVOL_PREDICT_MANAGER_UX.md](./DEEPVOL_PREDICT_MANAGER_UX.md), [DEEPVOL_PORTFOLIO_PRIMITIVE_POSITIONS.md](./DEEPVOL_PORTFOLIO_PRIMITIVE_POSITIONS.md), [DEEPVOL_PRIMITIVE_DIRECT_TRADING.md](./DEEPVOL_PRIMITIVE_DIRECT_TRADING.md), and [DEEPVOL_RANGE_MINTABILITY_DIAGNOSTICS.md](./DEEPVOL_RANGE_MINTABILITY_DIAGNOSTICS.md). BTC MOVE remains the flagship receipt product.

## App path

```text
apps/deepvol-web/
```

`apps/deepvol-web/` is the verified executable DeepVol frontend. It owns wallet-gated trading execution, PredictManager setup/funding, quote, preflight, VolSeries creation, buy/mint/redeem/deposit/withdraw controls, and the validated trading state machine.

`apps/deepvol-open-design/` is the Open Design presentation and handoff surface. Its BTC product pages explain MOVE, UP, DOWN, and RANGE, show read-only market/status and portfolio context, and send execution-intent CTAs to verified `apps/deepvol-web/` routes. It must not initiate wallet prompts or expose local execution controls.

Both are separate from `apps/web/`, which remains the prior RangePilot/browser validation UI and should not become the primary DeepVol UX through incremental patches.

The verified executable app reuses existing packages for config, types, and transaction construction:

```text
packages/config/src/deepVolTestnet.ts
packages/config/src/deepbookPredictTestnet.ts
packages/types/src/deepVol.ts
packages/sdk/src/deepVol/
packages/sdk/src/deepbookPredict/
```

## DeepVol-7 UI/UX redesign

DeepVol-7 used the local `ui-ux-pro-max` skill during planning and implementation. The applied guidance includes strong dark-mode contrast, visible focus states, 44px touch targets, readable status labels, no emoji-as-icons, 150-300ms interaction transitions, `prefers-reduced-motion`, and responsive checks at mobile, tablet, laptop, and desktop widths.

The visual direction is an oceanic DeFi terminal:

- deep ocean and abyss backgrounds;
- cyan glow for live/action emphasis;
- seafoam and turquoise accents for positive/ready states;
- glassy card surfaces with luminous borders;
- clear warning and danger states for blockers and failures;
- restrained professional layout rather than a game-like neon theme.

## Balancer reference source

The Balancer v3 frontend source is present locally as UI/UX reference only:

```text
frontend-monorepo/
```

DeepVol-7 used it only for interaction and layout patterns: app shell rhythm, focused transaction cards, wallet-gated CTA placement, advanced details accordions, portfolio summary/position cards, semantic tokens, and responsive mobile behavior. It must not be copied wholesale into DeepVol code and must not be staged or committed.

`frontend-monorepo/` is ignored because it is third-party reference source, not RangePilot or DeepVol project source. Local reference material, generated files, package lock churn, or unrelated upstream source must not enter this repository's review or commit surface.

## Page map and interaction model

| Route | Purpose |
|---|---|
| `/` | Open Design landing page explaining BTC MOVE, UP, DOWN, RANGE, Testnet status, and CTAs to markets or verified execution handoff. |
| `/markets` | Open Design market overview with BTC / DUSDC as the active market, BTC MOVE featured first, primitive product entry cards, and verified-app handoff CTAs for execution intent. |
| `/markets/btc?product=MOVE` | Open Design BTC MOVE explanation/status page: read-only active BTC market context, high-level verified flow, and handoff CTA to `/buy/btc-move`; no wallet prompt is initiated here. |
| `/markets/btc?product=UP` | Open Design BTC UP explanation/status page: product context and handoff CTA to `/primitives?type=UP`; no local quote, preflight, or wallet execution. |
| `/markets/btc?product=DOWN` | Open Design BTC DOWN explanation/status page: product context and handoff CTA to `/primitives?type=DOWN`; no local quote, preflight, or wallet execution. |
| `/markets/btc?product=RANGE` | Open Design BTC RANGE explanation/status page: interval concept and handoff CTA to `/primitives?type=RANGE`; no local quote, preflight, or wallet execution. |
| `/portfolio` | Open Design Portfolio presentation with summary cards, MOVE Receipts, Primitive Positions, recent local primitive activity, local/indexer limitations, and readback context. |
| `/buy/btc-move` | Verified executable BTC MOVE route in `apps/deepvol-web`; Open Design CTAs can target this route directly or through `VITE_DEEPVOL_VERIFIED_APP_URL`. |
| `/primitives?type=UP|DOWN|RANGE` | Verified executable primitive routes in `apps/deepvol-web`; Open Design CTAs can target these routes directly or through `VITE_DEEPVOL_VERIFIED_APP_URL`. |

In `apps/deepvol-web`, the redesigned Buy page follows a transaction workspace model: product explanation and payoff zones stay near the guided setup flow, while PredictManager setup, DUSDC funding, quote metrics, explicit preflight, and wallet-gated execution sit in a focused action column. The buy button stays disabled until all hook-derived gates and explicit preflight gates pass.

## Wallet and Testnet guard

The app uses Sui dApp Kit with Testnet as the default network. The shell shows wallet connection state, connected address, active network, wallet name, and whether the wallet supports `sui:testnet`.

Buy execution must remain disabled unless:

- a wallet is connected;
- the active dApp Kit network is Testnet;
- the connected account supports `sui:testnet`;
- all quote, fee coin, and preflight gates pass.

No browser code uses local private keys, mnemonics, `.env.local`, CLI signing, or mainnet paths.

## BTC MOVE buy flow gates

The primary first-time browser flow is:

```text
Connect wallet
→ switch to Sui Testnet
→ check / create PredictManager
→ check wallet DUSDC coins
→ deposit DUSDC to PredictManager if needed
→ discover active BTC market
→ regenerate and validate a mintable BTC MOVE range
→ create or select a matching active BTC MOVE VolSeries with recent mintability validation
→ refresh UP quote
→ refresh DOWN quote
→ compute expected premium
→ compute Create Fee
→ select sender-owned Coin<DUSDC> for Create Fee
→ run explicit browser buy_move_receipt<DUSDC> preflight
→ keep buy disabled unless receipt preflight and all funding gates pass
→ enable explicit wallet approval only after all gates pass
→ persist successful digest and receipt ID locally
```

DeepVol-8 exposes `Create PredictManager`, `Deposit DUSDC to PredictManager`, `Refresh quote`, and `Run preflight` as visible browser actions. DeepVol-25 keeps `Create PredictManager` as an explicit user-click wallet action, restores validated managers from wallet-scoped browser storage, and keeps manual manager ID entry only under Advanced / Developer fallback. `Create PredictManager`, `Deposit DUSDC`, and permissionless `Create BTC MOVE Series` are real Sui Testnet wallet actions guarded by wallet/Testnet checks. DeepVol-18-fix-2 keeps `Create BTC MOVE Series` disabled until `Regenerate mintable range` finds a lower/upper pair whose UP and DOWN legs pass quote and mint devInspect validation. Quote refresh uses browser-safe devInspect helpers only after the selected VolSeries is confirmed ready for the active BTC market.

The app no longer falls back to the historical configured VolSeries for new buys. Historical DeepVol-5 quote values and configured IDs are validation evidence only, not live offers. Fresh active market, mintable range validation, selected VolSeries, quote, premium, fee, and fee coin values are runtime state.

The current frontend keeps final `buy_move_receipt<DUSDC>` submission blocked until receipt preflight succeeds in the browser. DeepVol-9 replaces the old placeholder blocker with real `devInspect`-based receipt preflight and PredictManager DUSDC balance readback. The main gate checks that the manager balance can cover the expected premium and that the wallet has a sender-owned `Coin<DUSDC>` covering the Create Fee; these are separate balances. DeepVol-18-fix-2 also requires a recent mintability validation before a VolSeries can be `ready`; if receipt preflight still hits `predict::assert_mintable_ask::7`, the UI shows friendly non-mintable BTC MOVE copy instead of raw VM output as the primary message.

DeepVol-33 previously added Open Design runtime input parity diagnostics around this same gate discipline as part of the now-superseded local execution parity work. MOVE, UP, DOWN, and RANGE mintability hooks built normalized runtime context before SDK candidate search, reset stale candidates when wallet/manager/market/anchor/grid inputs changed, and exposed collapsed diagnostics with candidate counts, quote/preflight pass counts, dominant failure, raw failure summary, Wallet DUSDC, and PredictManager DUSDC. Under DeepVol-37, those Open Design diagnostics are historical context only; Open Design no longer runs local mintability, quote, preflight, or SDK-facing candidate diagnostics.

DeepVol-10 confirms this flow manually in the browser: `Run preflight` passed, browser wallet `buy_move_receipt<DUSDC>` execution succeeded, receipt `0xbbc2d18447502830a96602b8f9611e834c509d6fa00abdf2061ecd1addaa35eb` was created, and the portfolio displayed it. See [DEEPVOL_BROWSER_BUY_VALIDATION.md](./DEEPVOL_BROWSER_BUY_VALIDATION.md).

## Product clarity requirements

The UI must preserve these core messages:

```text
Trade movement, not direction.
BTC MOVE = UP + DOWN.
```

BTC MOVE means the user buys exposure to BTC leaving the configured range:

- UP leg: BTC above the upper strike;
- DOWN leg: BTC below the lower strike;
- premium risk zone: BTC stays inside the range;
- receipt: non-custodial but protocol-enforced;
- underlying positions: stay in the user's `PredictManager`.

UP, DOWN, and RANGE are raw Predict primitives. MOVE is a DeepVol receipt product built from UP + DOWN. Buying primitives directly does not create a DeepVol `MoveReceipt`; only BTC MOVE creates a receipt in this app.

## Portfolio and readback limitations

The portfolio page reads locally stored successful buy records from browser storage. If no local receipt exists, it shows a labeled validation reference artifact. DeepVol-10 manually validated that the portfolio page displays the browser-created receipt after a successful wallet buy.

General receipt enumeration is not implemented. A future indexer or event-query layer is needed to discover all receipts for a wallet without local storage.

Receipt object readback is best-effort and displays only fields that can be parsed from the Move object. Wallet-critical underlying position quantities still require direct `PredictManager` binary position readback for the known UP and DOWN MarketKeys.

DeepVol-11 adds the first redeem and settlement UX scaffold. DeepVol-12 then wires the controlled browser-wallet execution path for the known receipt while preserving strict no-overclaim behavior when a wallet is unavailable. The recommended MVP path remains guided non-custodial redeem from the portfolio: select a receipt, show UP/DOWN positions, show a redeem estimate, run redeem preflight, redeem both receipt-scoped legs through wallet approval only when exact gates pass, show the digest, and mark local receipt status only after user-visible event/readback evidence.

Current Portfolio behavior:

- Displays a `Guided redeem` section on each receipt card.
- Shows UP and DOWN strikes, receipt quantity, manager-level position quantity after explicit preflight, receipt-scoped preflight quantity, and redeem payout preview when available.
- Uses an explicit `Run redeem preflight` button.
- Shows stale-state copy if wallet/receipt dependencies change after preflight.
- Enables `Redeem both receipt legs` only for the known controlled receipt after exact owner wallet, Sui Testnet, both preflights, receipt-scoped quantities, fresh submit-time read/preflight, and one-shot attempt gates pass.
- Shows transaction digest/reconciliation panels only after wallet-approved execution; DeepVol-13 validated this path for the known receipt.
- States that the receipt is non-custodial and the underlying positions remain in the user's `PredictManager`.
- Separates MOVE Receipts from Primitive Positions.
- States that primitive trades do not create DeepVol `MoveReceipt` objects.
- Labels primitive local records as browser hints only, not wallet-wide indexer truth.
- Reads primitive positions per local record by known key when enough record fields are available, without requiring a default manual manager input.

DeepVol-20 validated a fresh BTC MOVE buy through the browser wallet flow. The resulting MoveReceipt (`0x85d803ae6b8a66f6d0e0772e8906d8076dea210de3eaa322d712db58eb6ff869`) should appear in Portfolio via localStorage persistence when the buy was performed in the same browser session. General receipt indexing across sessions or browsers is not yet available.

General receipt enumeration remains unimplemented. Receipt status cannot be treated as payout proof without `PositionRedeemed` event parsing and before/after `PredictManager` position and DUSDC balance reconciliation. See [DEEPVOL_REDEEM_AND_SETTLEMENT_FLOW.md](./DEEPVOL_REDEEM_AND_SETTLEMENT_FLOW.md) and [DEEPVOL_REDEEM_PREFLIGHT_VALIDATION.md](./DEEPVOL_REDEEM_PREFLIGHT_VALIDATION.md).

## Non-custodial receipt copy

The MVP receipt is non-custodial. The user's underlying DeepBook Predict UP and DOWN positions remain in the user's `PredictManager`; the `MoveReceipt` records protocol-enforced metadata and linkage after the DeepVol entrypoint mints both legs.

The UI must not imply that the receipt escrows, owns, redeems, or transfers the underlying Predict positions.

## Explicit non-actions

The DeepVol frontend does not:

- publish or upgrade Move packages;
- modify `move/deepvol/Move.toml`;
- run `series::create_series`;
- run `buy_move_receipt<DUSDC>` from CLI or scripts;
- execute wallet transactions automatically;
- withdraw protocol fees;
- execute binary position redeem transactions from scripts or automatically from the browser;
- claim RANGE primitive mint has been validated on Testnet before a real RANGE mint succeeds;
- treat stale historical BTC oracle/expiry snapshots as live primitive trading defaults;
- mark receipt settlement as payout proof without Predict redeem event/readback reconciliation;
- implement Profit Fee;
- implement creator marketplace or secondary market flows;
- use mainnet;
- import validation scripts into browser code;
- claim full portfolio enumeration or indexer support.

## Verification commands

Run these before treating the frontend as ready for review:

```bash
npm run typecheck:open-design
npm run build:open-design
npm --workspace apps/deepvol-open-design run test:open-design-ui
npm run typecheck:deepvol-web
npm run build:deepvol-web
npm run typecheck
npm run build:web
npm --workspace apps/deepvol-web run test:buy-gate
npm --workspace apps/deepvol-web run test:primitive-gates
npm --workspace apps/deepvol-web run test:primitive-quote-gates
npm --workspace apps/deepvol-web run test:primitive-execution-gates
npm --workspace apps/deepvol-web run test:primitive-active-market
npm --workspace apps/deepvol-web run test:primitive-mintability
npm --workspace apps/deepvol-web run test:range-mintability
npm --workspace apps/deepvol-web run test:move-series-gates
npm --workspace apps/deepvol-web run test:move-series-mintability
npm --workspace apps/deepvol-web run test:predict-manager-session
npm --workspace apps/deepvol-web run test:portfolio-primitives
```

Manual browser checks for `apps/deepvol-open-design/` should cover `/`, `/markets`, `/markets/btc`, `/markets/btc?product=MOVE`, `/markets/btc?product=UP`, `/markets/btc?product=DOWN`, `/markets/btc?product=RANGE`, `/portfolio`, verified CTA targets for MOVE/UP/DOWN/RANGE, visible handoff copy, visible focus states, responsive layouts at 375/768/1024/1440, no Open Design wallet prompt, no local PredictManager setup/funding, no local quote/preflight, no local VolSeries creation, no local buy/mint/redeem/deposit/withdraw controls, and absence of historical validation quote values as live quotes.

Manual browser checks for verified execution in `apps/deepvol-web/` should cover `/buy/btc-move`, `/primitives?type=UP`, `/primitives?type=DOWN`, `/primitives?type=RANGE`, disconnected wallet gating, wrong-network gating, wallet-scoped PredictManager restore, Create PredictManager CTA when missing, Advanced / Developer manual manager fallback collapsed by default, DUSDC balance/deposit visibility, Regenerate mintable range visibility, Create BTC MOVE Series disabled before mintability validation, validation-required/non-mintable series copy, explicit quote refresh, real receipt preflight pass/fail diagnostics, friendly `assert_mintable_ask::7` copy, explicit BTC MOVE copy, non-custodial receipt copy, disabled buy gating before preflight, enabled wallet review only after receipt preflight passes, UP/DOWN primitive execution gates, and RANGE mintable interval search and execution gates (pending Testnet validation).

DeepVol-33 connected-wallet Runtime diagnostics acceptance was historical Open Design execution-parity verification. Under DeepVol-37, Open Design manual checks should confirm those diagnostics are not exposed as active local mintability, quote, preflight, or wallet-execution controls; verified execution diagnostics belong to `apps/deepvol-web/` checks only. Do not approve transaction prompts during diagnostics-only verification.

DeepVol-11 browser guided redeem preflight verification should cover: portfolio receipt display, UP/DOWN position readback, redeem payout preview, explicit preflight action, local status labeling, and continued no-mainnet/no-withdraw/no-automatic-execution safety checks.

DeepVol-12/13 browser execution verification should cover: controlled receipt display, disconnected/wrong-wallet/wrong-network blockers, wallet-review-only-after-explicit-click, one-shot attempt behavior, digest display after success, `PositionRedeemed` parsing, post-redeem position and DUSDC balance readback, local receipt status update only after reconciliation, and accurate status reporting for the known successful receipt.
