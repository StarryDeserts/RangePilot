---
Purpose: Record the Phase 2A Guided Range Trading MVP browser-wallet scaffold scope, flows, gates, and Phase 2B scan/recovery fixes.
Audience: Frontend developers, SDK implementers, protocol integrators, reviewers, manual testers, and AI agents.
Status: Updated with Phase 2B browser manual validation fixes; not final UI design.
Source of truth relationship: Engineering scaffold guide derived from validated Testnet lifecycle docs; Phase 2B details are supplemented by BROWSER_WALLET_MANUAL_VALIDATION_FIXES.md; official deployment/config docs remain source of truth for static Testnet values.
---

# Guided Range Trading MVP

Phase 2A turns the validated DeepBook Predict Testnet lifecycle into a minimal browser-wallet scaffold. It is intended to be usable for engineering validation, state display, wallet prompting, and real error visibility.

Phase 2B fixes manual browser validation blockers around slow duplicate candidate scans and portfolio RangeKey recovery. See [BROWSER_WALLET_MANUAL_VALIDATION_FIXES.md](./BROWSER_WALLET_MANUAL_VALIDATION_FIXES.md) for the detailed scan/recovery checklist and remaining limitations.

This is not final UI design. It intentionally excludes final brand polish, complex layouts, creator strategy pages, vault/LP dashboards, AI composer flows, leaderboards, social sharing, wrapper Move contracts, binary trading, supply, withdraw, mainnet, and full landing-page work.

## Scope

The scaffold covers two browser routes:

- `/trade`: wallet connection, Testnet guard, DUSDC wallet balance, Predict Account management, bounded/deduped runtime range candidate discovery, quote preview, full mint preflight, Advanced Diagnostics candidate import, and browser-wallet `mint_range<DUSDC>` submission.
- `/portfolio`: manager-scoped known RangeKey recovery, mint digest import, direct `predict_manager::range_position`, redeem quote/preflight, advanced-only manual RangeKey fallback, and browser-wallet `redeem_range<DUSDC>` submission.

Validation scripts remain protocol regression tests. The browser app uses wallet approval only and must not read `.env.local`, `SUI_PRIVATE_KEY`, mnemonics, private keys, raw signatures, or local validation caches.

## `/trade` flow

1. Connect browser wallet.
2. Confirm the app and wallet are on Sui Testnet.
3. Display DUSDC wallet balance from wallet coin objects.
4. Load, create, or manually hint a PredictManager.
5. Display manager DUSDC balance from public server summary when available.
6. Discover active runtime oracles through the public server.
7. Derive source-informed range candidates from runtime strike grid and latest spot/forward anchors.
8. Dedupe quote attempts by `oracleId:expiry:lowerStrike:higherStrike:quantity`.
9. Run bounded official `predict::get_range_trade_amounts` quote attempts with progress and cancellation.
10. Run full `predict::mint_range<DUSDC>` devInspect preflight for bounded positive affordable quote candidates.
11. Early-stop on the first full preflight-passing candidate.
12. Enable mint only when full mint preflight passes for the current manager/range/quantity.
13. Re-run quote and full mint preflight immediately before wallet prompt.
14. Build `mint_range<DUSDC>` and submit through the browser wallet.
15. Parse `RangeMinted`, show digest/explorer link, and persist the known RangeKey under the manager-scoped recovery record.

## `/portfolio` flow

1. Connect browser wallet.
2. Confirm Sui Testnet.
3. Load manager ID from the Predict Account hook.
4. Load manager-scoped known ranges from non-secret browser localStorage.
5. If no local known range exists, optionally recover RangeKey hints from public mint history.
6. Allow mint transaction digest import to parse `RangeMinted` and upsert a known range.
7. Keep raw manual RangeKey entry under `Advanced Debug: Enter RangeKey manually` and require explicit use.
8. Read active quantity through direct `predict_manager::range_position` devInspect for the selected range.
9. Display public server manager summary as diagnostic only.
10. Choose redeem quantity.
11. Run fresh direct readback, official `predict::get_range_trade_amounts`, and full `predict::redeem_range<DUSDC>` devInspect preflight.
12. Enable redeem only when direct readback, positive payout, and full redeem preflight pass for the current manager/range/quantity.
13. Re-run redeem preparation immediately before wallet prompt.
14. Build `redeem_range<DUSDC>` and submit through the browser wallet.
15. Parse `RangeRedeemed`, show digest/explorer link, and refresh direct active quantity.

## SDK lifecycle mapping

- `packages/sdk/src/deepbookPredict/lifecycle.ts`
  - `extractManagerDusdcBalanceAtomic`
  - `loadActiveRangeOracleContexts`
  - `scanMintableRangeCandidates`
  - `prepareRangeMint`
  - `prepareRangeRedeem`
- `packages/sdk/src/deepbookPredict/quote.ts`
  - `deriveCandidateRanges`
  - `deriveSourceInformedRangeCandidates`
  - `rankRangeCandidates`
  - `rangeCandidateKey`
  - `rangeQuoteAttemptKey`
  - `scanRangeQuoteQuantities`
  - `devInspectRangeQuote`
  - `devInspectAskBounds`
- `packages/sdk/src/deepbookPredict/trade.ts`
  - `buildMintRangeTransaction`
  - `devInspectMintRangePreflight`
  - `buildRedeemRangeTransaction`
  - `devInspectRedeemRangePreflight`
- `packages/sdk/src/deepbookPredict/portfolio.ts`
  - `readRangePositionQuantity`
  - public server read helpers for diagnostics/history
- `packages/sdk/src/deepbookPredict/events.ts`
  - `recoverPredictManagerIdFromCreateResult`
  - `parseRangeMintedEvent`
  - `parseRangeRedeemedEvent`

The UI composes these helpers through `useRangeTrading`, `usePortfolioReadback`, `usePredictManager`, and non-secret localStorage persistence.

## Mint gates

Mint is allowed only when all of these pass:

- Browser wallet connected.
- Sui Testnet guard passes.
- PredictManager is available.
- Manager DUSDC balance is visible or a blocker is shown.
- Official `get_range_trade_amounts` quote succeeds.
- Mint cost is positive.
- Full `mint_range<DUSDC>` devInspect preflight passes.
- A fresh final quote and full preflight pass immediately before wallet prompt.
- The transaction is submitted through the browser wallet; no private key path is used.

Quote success alone must not enable mint.

## Redeem gates

Redeem is allowed only when all of these pass:

- Browser wallet connected.
- Sui Testnet guard passes.
- PredictManager is available.
- A valid RangeKey is recovered from known ranges, imported from a mint digest, or explicitly selected from Advanced Debug manual entry.
- Direct `predict_manager::range_position` readback succeeds.
- Requested quantity is greater than zero and no more than active quantity.
- Official `get_range_trade_amounts` quote succeeds.
- Redeem payout is positive by default.
- Full `redeem_range<DUSDC>` devInspect preflight passes.
- A fresh final direct readback, quote, and full preflight pass immediately before wallet prompt.
- The transaction is submitted through the browser wallet; no private key path is used.

## State persistence

The browser may persist only non-secret hints under the manager-scoped key:

```text
rangepilot:range-trading:${network}:${walletAddress}:${managerId}
```

The old wallet-scoped key remains a one-time migration source only.

Allowed fields:

- known RangeKey records
- `oracleObjectId`
- `underlyingAsset`
- optional quantity
- source (`mint_event`, `local_storage`, `digest_import`, `mint_history`, or `manual`)
- mint digest(s)
- last redeem digest
- last direct readback quantity
- status (`unknown`, `active`, or `inactive`)
- `updatedAtMs`

Forbidden fields:

- private keys
- mnemonics
- secrets
- `.env` values
- raw transaction bytes
- signatures
- DUSDC coin object lists

Malformed localStorage records should be ignored without page-level failure.

## Manual browser testing checklist

Trade page:

- [ ] Run web app locally.
- [ ] Connect browser wallet.
- [ ] Confirm wallet is on Sui Testnet.
- [ ] Confirm DUSDC wallet balance displays.
- [ ] Load or create PredictManager.
- [ ] Confirm manager balance displays.
- [ ] Click scan candidate.
- [ ] Confirm progress updates are visible.
- [ ] Confirm duplicate candidates are not repeatedly shown.
- [ ] Confirm scan can be cancelled.
- [ ] If candidate found, run quote/preflight.
- [ ] Confirm Mint button only enables after full preflight success.
- [ ] If no candidate found, confirm UI says candidate scan failed, not transaction failed.
- [ ] Expand Advanced Details and confirm raw diagnostics are available.
- [ ] Expand Advanced Diagnostics, import a candidate, and confirm mint remains gated by full preflight.
- [ ] Approve mint transaction in wallet only after full preflight passes.
- [ ] Confirm digest and explorer link.
- [ ] Confirm known RangeKey is persisted under the active manager.

Portfolio page:

- [ ] Open portfolio page.
- [ ] Confirm manager ID loads.
- [ ] Confirm manual RangeKey fields are not required by default.
- [ ] Confirm last minted range loads from localStorage if available.
- [ ] Confirm direct `range_position` readback runs automatically for selected known range.
- [ ] If no range exists, import from mint transaction digest.
- [ ] Confirm manual RangeKey input is under Advanced Debug only.
- [ ] Confirm zero-quantity ranges are hidden by default or marked inactive.
- [ ] Select redeem quantity.
- [ ] Run redeem preflight.
- [ ] Confirm Redeem button only enables after direct readback, quote, positive payout, and full preflight success.
- [ ] Approve redeem transaction in wallet.
- [ ] Confirm digest and explorer link.
- [ ] Refresh quantity after redeem.
- [ ] Confirm browser app never uses local private key.

## Known limitations

- General portfolio enumeration is not implemented.
- Public server positions/history are diagnostic or recovery hints only until direct `range_position` confirms active quantity.
- Direct manager DUSDC balance remains pending; manager balance currently uses public server summary.
- Settled claim behavior remains pending.
- Mintable candidates still depend on runtime market state and may not exist within browser scan limits.
- Browser wallet approval and live wallet transactions require manual user action and were not automated.
- No creator strategy, vault dashboard, binary trading, supply, withdraw, or mainnet support is included.

## Next phase

After Phase 2B browser manual validation, refine product UX and final visual design around the confirmed scaffold behavior without weakening the quote, direct readback, and full-preflight gates.
