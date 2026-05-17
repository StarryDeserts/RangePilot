---
Purpose: Record Phase 2B browser-wallet manual validation fixes for candidate scanning and portfolio RangeKey recovery.
Audience: Frontend developers, SDK implementers, protocol integrators, reviewers, manual testers, and AI agents.
Status: Draft for Phase 2B-fix implementation; not final UI design.
Source of truth relationship: Supplements the Phase 2A guided range trading scaffold doc with user-reported browser validation findings and fixes; official deployment/config docs remain source of truth for static Testnet values.
---

# Browser Wallet Manual Validation Fixes

Phase 2B fixes the browser-wallet engineering scaffold after manual Testnet validation of the Phase 2A `/trade` and `/portfolio` pages. It is still not final UI design. The goal is to make the browser MVP testable without weakening protocol gates or introducing private-key paths.

## User-reported issues

Manual browser testing confirmed these paths worked through the browser wallet:

- `/trade` and `/portfolio` could create a Predict Account.
- DUSDC deposit worked.
- Wallet-approved Testnet transactions could be submitted from the browser.

The same testing found these blockers:

- `/trade` candidate scan was too slow for normal browser use.
- Candidate/preflight diagnostics repeated the same ranges.
- Two scans found no preflight-passing candidate.
- Positive quotes existed, but full `mint_range<DUSDC>` preflight failed.
- Most raw failures were `predict::assert_mintable_ask::7 (EAskPriceOutOfBounds)`.
- Candidate scan failure was labeled as `Transaction status: failed`, even though no wallet transaction failed.
- `/portfolio` required normal users to manually enter protocol RangeKey fields: oracle ID, expiry, lower strike, and higher strike.

## Candidate scan failure summary

A positive official quote is only a pricing preview. It does not prove that a real mint will satisfy post-trade ask bounds, vault/risk checks, or current runtime state. Phase 2B keeps full `predict::mint_range<DUSDC>` devInspect preflight as the mint gate.

When scans find positive quotes but no preflight-passing candidate, the browser should show a scan result, not a wallet transaction failure:

```text
Candidate scan: no mintable candidate found
No mintable candidate found within browser scan limits. Try again later, refresh market data, or use Advanced Diagnostics.
```

If the dominant preflight abort is `EAskPriceOutOfBounds`, the user-facing summary should explain that the post-trade ask was outside DeepBook Predict's allowed bounds. Raw aborts remain available under Advanced Details.

## Why scan failure is not a transaction failure

Candidate scanning uses public reads, official quote devInspect, and full mint preflight devInspect. It does not ask the wallet to sign, and it does not submit a transaction. Therefore a no-candidate result is a candidate discovery/preflight state. Only wallet-submitted `mint_range<DUSDC>` or `redeem_range<DUSDC>` failures should use transaction failure language.

## Candidate scan improvements

Phase 2B updates the scan path with these browser-safe behaviors:

- Dedupe range candidates by `oracleId:expiry:lowerStrike:higherStrike`.
- Dedupe quote/preflight attempts by `oracleId:expiry:lowerStrike:higherStrike:quantity`.
- Default browser limits:
  - `maxQuoteAttempts = 120`
  - `maxPreflightAttempts = 30`
  - `maxOracleContexts = 4`
- Target runtime-derived candidate families before broad candidates:
  - `forward_centered_target_width`
  - `wide_around_forward`
  - `forward_below_to_above`
  - target fair-price buckets
  - `safe_larger_quantity_probe`
- Filter preflight candidates to official quote successes with positive mint cost and affordable manager DUSDC balance when that balance is available.
- Early-stop on the first full mint preflight success.
- Report progress while scanning:
  - oracle progress
  - quote attempts
  - preflight attempts
  - current candidate
- Allow scan cancellation with `AbortController`.
- Show summarized diagnostics by default and raw aborts under Advanced Details.

Quote success alone still does not enable mint. The browser re-runs quote and full mint preflight for the exact selected range and quantity immediately before wallet approval.

## Advanced candidate import

The `/trade` page includes collapsed Advanced Diagnostics for developer fallback only. A tester may paste:

- oracle ID
- expiry
- lower strike
- higher strike
- quantity

The imported candidate is selected and must pass the normal official quote plus full `mint_range<DUSDC>` preflight before the wallet mint button can enable. Manual import is not the default user path.

## Portfolio RangeKey recovery strategy

Phase 2B changes `/portfolio` from manual RangeKey-first to recovered RangeKey-first.

Recovery order:

1. Parse `RangeMinted` after browser mint success and persist the event-derived RangeKey.
2. Load manager-scoped browser localStorage known ranges for the connected wallet, network, and manager ID.
3. Let users import a mint transaction digest and parse `RangeMinted` from `client.getTransactionBlock`.
4. Use public `/ranges/minted` history only as a diagnostic/recovery hint when local ranges are empty.
5. Keep manual RangeKey entry under `Advanced Debug: Enter RangeKey manually` and require an explicit `Use manual RangeKey` action.

Direct `predict_manager::range_position` remains the wallet-critical active quantity source. Public server history can help recover candidate RangeKey fields, but it does not authorize redeem.

## Persistence rules

Browser localStorage may persist only non-secret recovery hints keyed by network, wallet address, and manager ID:

```text
rangepilot:range-trading:${network}:${walletAddress}:${managerId}
```

Allowed fields:

- manager-scoped known RangeKeys
- oracle object ID
- underlying asset label when present
- optional quantity
- source (`mint_event`, `local_storage`, `digest_import`, `mint_history`, or `manual`)
- mint digest(s)
- last redeem digest
- last direct readback quantity
- active/inactive/unknown status
- timestamps

Forbidden fields:

- private keys
- mnemonics
- secrets
- `.env` values
- raw transaction bytes
- signatures
- DUSDC coin object lists
- validation-script local caches

Malformed localStorage is ignored without crashing the page.

## Redeem gates

Redeem remains blocked unless all wallet-critical gates pass for the exact selected range and quantity:

- connected browser wallet
- Sui Testnet
- active Predict Account manager ID
- direct `predict_manager::range_position` readback
- requested quantity available in the active range
- official range quote
- positive redeem payout by default
- full `redeem_range<DUSDC>` devInspect preflight
- fresh final direct readback, quote, and full preflight immediately before wallet prompt

## Manual testing checklist

Trade page:

- [ ] Open `/trade`.
- [ ] Connect wallet.
- [ ] Confirm Sui Testnet.
- [ ] Confirm DUSDC balance.
- [ ] Confirm manager ID and manager balance.
- [ ] Click scan candidate.
- [ ] Confirm progress updates are visible.
- [ ] Confirm duplicate candidates are not repeatedly shown.
- [ ] Confirm scan can be cancelled.
- [ ] If candidate found, run quote/preflight.
- [ ] Confirm Mint button only enables after full preflight success.
- [ ] If no candidate found, confirm UI says candidate scan failed, not transaction failed.
- [ ] Expand Advanced Details and confirm raw diagnostics are available.
- [ ] Expand Advanced Diagnostics, import a candidate, and confirm mint remains gated by full preflight.

Portfolio page:

- [ ] Open `/portfolio`.
- [ ] Confirm manual RangeKey fields are not required by default.
- [ ] Confirm last minted range loads from localStorage if available.
- [ ] Confirm direct `range_position` readback runs automatically for selected known range.
- [ ] If no range exists, import from mint transaction digest.
- [ ] Confirm manual RangeKey input is under Advanced Debug only.
- [ ] Confirm zero-quantity ranges are hidden by default or marked inactive.
- [ ] Confirm redeem preflight remains gated by direct readback, quote, positive payout, and full redeem preflight.

## Remaining limitations

- This is still scaffold UX, not final UI design.
- General portfolio enumeration is not implemented.
- Public server positions/history are diagnostic/recovery only until direct `range_position` confirms active quantity.
- Mintable candidates depend on runtime market state and may not exist within browser scan limits.
- Direct manager DUSDC balance remains pending beyond the public server summary diagnostic path.
- Creator strategy, vault dashboard, wrapper Move contracts, AI composer, leaderboard, binary trading, supply, withdraw, mainnet, and settled-claim UX remain out of scope.
- Browser wallet approval and live wallet transactions still require manual user action; the app must not automate approvals.
