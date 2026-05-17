---
Purpose: Record the Phase 2A Guided Range Trading MVP browser-wallet scaffold scope, flows, gates, and manual validation checklist.
Audience: Frontend developers, SDK implementers, protocol integrators, reviewers, and AI agents.
Status: Draft for Phase 2A implementation; not final UI design.
Source of truth relationship: Engineering scaffold guide derived from validated Testnet lifecycle docs; official deployment/config docs remain source of truth for static Testnet values.
---

# Guided Range Trading MVP

Phase 2A turns the validated DeepBook Predict Testnet lifecycle into a minimal browser-wallet scaffold. It is intended to be usable for engineering validation, state display, wallet prompting, and real error visibility.

This is not final UI design. It intentionally excludes final brand polish, complex layouts, creator strategy pages, vault/LP dashboards, AI composer flows, leaderboards, social sharing, wrapper Move contracts, binary trading, supply, withdraw, mainnet, and full landing-page work.

## Scope

The scaffold covers two browser routes:

- `/trade`: wallet connection, Testnet guard, DUSDC wallet balance, Predict Account management, runtime range candidate discovery, quote preview, full mint preflight, and browser-wallet `mint_range<DUSDC>` submission.
- `/portfolio`: known or manually entered RangeKey readback, direct `predict_manager::range_position`, redeem quote/preflight, and browser-wallet `redeem_range<DUSDC>` submission.

Validation scripts remain protocol regression tests. The browser app uses wallet approval only and must not read `.env.local`, `SUI_PRIVATE_KEY`, mnemonics, private keys, raw signatures, or local validation caches.

## `/trade` flow

1. Connect browser wallet.
2. Confirm the app and wallet are on Sui Testnet.
3. Display DUSDC wallet balance from wallet coin objects.
4. Load, create, or manually hint a PredictManager.
5. Display manager DUSDC balance from public server summary when available.
6. Discover active runtime oracles through the public server.
7. Derive range candidates from runtime strike grid and latest spot/forward anchors.
8. Run official `predict::get_range_trade_amounts` quote attempts.
9. Run full `predict::mint_range<DUSDC>` devInspect preflight for bounded positive quote candidates.
10. Enable mint only when full mint preflight passes for the current manager/range/quantity.
11. Re-run quote and full mint preflight immediately before wallet prompt.
12. Build `mint_range<DUSDC>` and submit through the browser wallet.
13. Parse `RangeMinted`, show digest/explorer link, and persist the last RangeKey.

## `/portfolio` flow

1. Connect browser wallet.
2. Confirm Sui Testnet.
3. Load manager ID from the Predict Account hook or persisted non-secret range state.
4. Load persisted last RangeKey or allow manual entry of oracle ID, oracle object ID, expiry, lower strike, and higher strike.
5. Read active quantity through direct `predict_manager::range_position` devInspect.
6. Display public server manager summary as diagnostic only.
7. Choose redeem quantity.
8. Run fresh direct readback, official `predict::get_range_trade_amounts`, and full `predict::redeem_range<DUSDC>` devInspect preflight.
9. Enable redeem only when direct readback, positive payout, and full redeem preflight pass for the current manager/range/quantity.
10. Re-run redeem preparation immediately before wallet prompt.
11. Build `redeem_range<DUSDC>` and submit through the browser wallet.
12. Parse `RangeRedeemed`, show digest/explorer link, and refresh direct active quantity.

## SDK lifecycle mapping

- `packages/sdk/src/deepbookPredict/lifecycle.ts`
  - `extractManagerDusdcBalanceAtomic`
  - `loadActiveRangeOracleContexts`
  - `scanMintableRangeCandidates`
  - `prepareRangeMint`
  - `prepareRangeRedeem`
- `packages/sdk/src/deepbookPredict/quote.ts`
  - `deriveCandidateRanges`
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
- A valid RangeKey is persisted or manually entered.
- Direct `predict_manager::range_position` readback succeeds.
- Requested quantity is greater than zero and no more than active quantity.
- Official `get_range_trade_amounts` quote succeeds.
- Redeem payout is positive by default.
- Full `redeem_range<DUSDC>` devInspect preflight passes.
- A fresh final direct readback, quote, and full preflight pass immediately before wallet prompt.
- The transaction is submitted through the browser wallet; no private key path is used.

## State persistence

The browser may persist only non-secret hints under:

```text
rangepilot:range-trading:${network}:${walletAddress}
```

Allowed fields:

- `managerId`
- `lastRangeKey.oracleId`
- `lastRangeKey.oracleObjectId`
- `lastRangeKey.underlyingAsset`
- `lastRangeKey.expiry`
- `lastRangeKey.lowerStrike`
- `lastRangeKey.higherStrike`
- optional `lastRangeKey.quantity`
- `lastMintDigest`
- `lastRedeemDigest`
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
- [ ] Discover active market.
- [ ] Find mintable range candidate.
- [ ] Run quote preview.
- [ ] Run mint preflight.
- [ ] Confirm Mint button only enables after preflight success.
- [ ] Approve mint transaction in wallet.
- [ ] Confirm digest and explorer link.
- [ ] Confirm last minted RangeKey is persisted.

Portfolio page:

- [ ] Open portfolio page.
- [ ] Confirm manager ID loads.
- [ ] Confirm last minted range loads.
- [ ] Direct read active range quantity.
- [ ] Select redeem quantity.
- [ ] Run redeem preflight.
- [ ] Confirm Redeem button only enables after preflight success.
- [ ] Approve redeem transaction in wallet.
- [ ] Confirm digest and explorer link.
- [ ] Refresh quantity after redeem.
- [ ] Confirm browser app never uses local private key.

## Known limitations

- General portfolio enumeration is not implemented.
- Public server positions summary is diagnostic only; it returned empty for the known minted range during validation.
- Direct manager DUSDC balance remains pending; manager balance currently uses public server summary.
- Settled claim behavior remains pending.
- Candidate discovery uses existing runtime spot/forward-centered range derivation; richer source-informed search from scripts is not fully ported into the browser scaffold.
- Browser wallet manual validation is pending in this environment.
- No creator strategy, vault dashboard, binary trading, supply, withdraw, or mainnet support is included.

## Next phase

After Phase 2A browser manual validation, refine product UX and final visual design around the confirmed scaffold behavior without weakening the quote, direct readback, and full-preflight gates.
