---
Purpose: Define the DeepVol wallet-gated frontend MVP scaffold and UX boundaries.
Audience: Frontend developers, SDK implementers, product contributors, reviewers, and AI agents.
Status: DeepVol-6 frontend scaffold plan and implementation record.
Source of truth relationship: Derived from DeepVol foundation docs, deployed receipt validation, and local frontend implementation; protocol docs and on-chain state remain authoritative for transaction semantics.
---

# DeepVol Frontend MVP

## Summary

DeepVol-6 adds a new DeepVol-first frontend scaffold under `apps/deepvol-web/`. The app focuses on the validated BTC MOVE receipt path while preserving strict wallet, Testnet, quote, fee coin, and preflight gates before any wallet prompt can submit `receipt::buy_move_receipt<DUSDC>`.

This scaffold is not the final visual design. It establishes the product structure, safety copy, route map, wallet-gated transaction card, and portfolio/readback boundaries for future polishing.

## New app path

```text
apps/deepvol-web/
```

`apps/deepvol-web/` is the current DeepVol-first frontend scaffold. It is separate from `apps/web/`, which remains the prior RangePilot/browser validation UI and should not become the primary DeepVol UX through incremental patches.

The new app reuses existing packages for config, types, and transaction construction:

```text
packages/config/src/deepVolTestnet.ts
packages/config/src/deepbookPredictTestnet.ts
packages/types/src/deepVol.ts
packages/sdk/src/deepVol/
packages/sdk/src/deepbookPredict/
```

## Balancer reference source

The Balancer v3 frontend source is present locally as UI/UX reference only:

```text
frontend-monorepo/
```

It may inform app-shell structure, route separation, transaction card rhythm, portfolio layout, advanced details, risk panels, and state presentation. It must not be copied wholesale into DeepVol code and must not be staged or committed.

## Why `frontend-monorepo/` is ignored

`frontend-monorepo/` is third-party reference source, not RangePilot or DeepVol project source. It is ignored so local reference material, generated files, package lock churn, or unrelated upstream source cannot enter this repository's review or commit surface.

## Blue theme direction

The DeepVol scaffold uses a dark DeFi app shell with blue primary accents, rounded cards, high-contrast status states, and monospace object IDs. The theme direction should support:

- clear wallet and network state;
- quote/preflight readiness;
- explicit blockers;
- success and error transaction states;
- advanced details without crowding the primary buy flow.

## Page map

| Route | Purpose |
|---|---|
| `/` | Alias to the markets page. |
| `/markets` | Shows the BTC MOVE market card and the core message: `BTC MOVE = UP + DOWN` and `Trade movement, not direction.` |
| `/buy/btc-move` | Shows configured VolSeries details, quantity input, PredictManager input, quote/preflight status, buy gating, and advanced config references. |
| `/portfolio` | Shows locally stored receipt records or the DeepVol-5 validated receipt as a labeled reference artifact. |

## Wallet and Testnet guard

The app uses Sui dApp Kit with Testnet as the default network. The shell shows wallet connection state, connected address, active network, and whether the wallet supports `sui:testnet`.

Buy execution must remain disabled unless:

- a wallet is connected;
- the active dApp Kit network is Testnet;
- the connected account supports `sui:testnet`;
- all quote, fee coin, and preflight gates pass.

No browser code uses local private keys, mnemonics, `.env.local`, CLI signing, or mainnet paths.

## BTC MOVE buy flow gates

The primary flow is:

```text
Connect wallet
→ Testnet guard
→ load configured BTC VolSeries
→ quote UP
→ quote DOWN
→ compute expected premium
→ compute Create Fee
→ select sender-owned Coin<DUSDC> for Create Fee
→ run full binary mint preflight
→ run buy_move_receipt<DUSDC> preflight
→ enable explicit wallet approval
→ persist successful digest and receipt ID locally
```

The scaffold reads the configured validated VolSeries and attempts browser-safe quote helpers. Historical DeepVol-5 quote values are not treated as live offers. Fresh quote, premium, fee, and fee coin values are runtime state.

The current scaffold intentionally keeps submission blocked when full browser preflight is unavailable. In that state, the UI must show the exact blockers instead of prompting the wallet.

## Portfolio and readback limitations

The portfolio page reads locally stored successful buy records from browser storage. If no local receipt exists, it shows the DeepVol-5 validated receipt as reference evidence only.

General receipt enumeration is not implemented in the scaffold. A future indexer or event-query layer is needed to discover all receipts for a wallet without local storage.

Receipt object readback is best-effort and displays only fields that can be parsed from the Move object. Wallet-critical underlying position quantities still require direct `PredictManager` binary position readback for the known UP and DOWN MarketKeys.

## Non-custodial receipt copy

The MVP receipt is non-custodial. The user's underlying DeepBook Predict UP and DOWN positions remain in the user's `PredictManager`; the `MoveReceipt` records protocol-enforced metadata and linkage after the DeepVol entrypoint mints both legs.

The UI must not imply that the receipt escrows, owns, redeems, or transfers the underlying Predict positions.

## Explicit non-actions

The DeepVol-6 frontend scaffold does not:

- publish or upgrade Move packages;
- modify `move/deepvol/Move.toml`;
- run `series::create_series`;
- run `buy_move_receipt<DUSDC>` from CLI or scripts;
- execute wallet transactions automatically;
- withdraw protocol fees;
- redeem binary positions;
- implement Profit Fee;
- implement creator marketplace or secondary market flows;
- use mainnet;
- import validation scripts into browser code;
- claim full portfolio enumeration or indexer support.

## Verification commands

Run these before treating the scaffold as ready for review:

```bash
npm run typecheck:deepvol-web
npm run typecheck
npm run build:web
npm run build:deepvol-web
npm run move:build:deepvol
npm run move:test:deepvol
```

Manual browser checks should cover `/markets`, `/buy/btc-move`, `/portfolio`, disconnected wallet gating, wrong-network gating, explicit BTC MOVE copy, non-custodial receipt copy, and absence of historical validation quote values as live quotes.
