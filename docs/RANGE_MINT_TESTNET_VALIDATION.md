---
Purpose: Record Phase 1C range quote and mint_range Testnet validation artifacts.
Audience: Protocol integrators, transaction-builder authors, frontend developers, reviewers, and AI agents.
Status: Quote-only validation completed on 2026-05-16; mint_range blocked by safety gates.
Source of truth relationship: Supplements official contract info, protocol notes, and entrypoint binding docs; runtime market state remains subject to live confirmation.
---

# Range Mint Testnet Validation

Phase 1C attempted the official DeepBook Predict range quote path through a local signer validation script. The run discovered an active oracle at runtime, derived a candidate range from public server oracle metadata, attempted `predict::get_range_trade_amounts` through devInspect, and correctly blocked before `predict::mint_range<DUSDC>` because mint safety gates did not pass.

No private key, `.env.local` contents, or `.local/` cache contents are documented here.

## Automated local signer validation

| Field | Value |
|---|---|
| Test date | 2026-05-16 |
| Network | Sui Testnet |
| Mode | Quote-only validation; no mint submitted |
| Signer public address | `0xc558e37d20405a9751c81124ac8d167e2b2d368b834319adafa549449e0715f5` |
| Manager ID | `0x6f341e107a87812fd4fddfc4fc50a7e3ab5bc21cabff2cd39dd86b662fa75599` |
| Manager owner source | Public server `/managers/:manager_id/summary` |
| Manager owner | `0xc558e37d20405a9751c81124ac8d167e2b2d368b834319adafa549449e0715f5` |
| Manager DUSDC balance | `2000000` atomic DUSDC |
| Manager summary keys | `manager_id`, `owner`, `balances`, `trading_balance`, `open_exposure`, `redeemable_value`, `realized_pnl`, `unrealized_pnl`, `account_value`, `open_positions`, `awaiting_settlement_positions` |

## Runtime market selection

| Field | Runtime value |
|---|---|
| Active oracle selected | `0x7f6af68a95f01b1c2153edcb7c96475935e8b2d796a8c04f32d57e5d0a83289d` |
| Oracle object candidate | `0x7f6af68a95f01b1c2153edcb7c96475935e8b2d796a8c04f32d57e5d0a83289d` |
| Underlying | `BTC` |
| Oracle status | `active` |
| Expiry | `1778918400000` |
| Strike grid source | Public server oracle metadata |
| Minimum strike | `50000000000000` |
| Tick size | `1000000000` |
| Candidate lower strike | `50001000000000` |
| Candidate higher strike | `50002000000000` |
| Range win condition | `(lower, higher]` |
| Quantity | `1` |
| Ask bounds | `null` from `/oracles/:oracle_id/ask-bounds` |

The selected oracle and strikes are runtime validation artifacts. They must not be copied into static config.

## Quote preview result

`predict::get_range_trade_amounts` was attempted through devInspect using the runtime oracle candidate and derived `RangeKey`.

| Field | Result |
|---|---|
| Quote preview | Blocked |
| Mint cost | Not available |
| Redeem payout | Not available |
| DevInspect result | Move abort in `pricing_config::quote_spread_from_fair_price` |
| Abort code | `1` |
| Abort location | `0xf5ea2b3749c65d6e56507cc35388719aadb28f9cab873696a2f8687f5c785138::pricing_config::quote_spread_from_fair_price` at offset `17` |

This confirms the script can reach the official quote path, but the selected range is not quoteable under the current runtime pricing/ask-bound state. The quote return tuple mapping remains unverified because no successful quote returned two decoded `u64` values.

## Mint safety gate result

| Gate | Result |
|---|---|
| Runtime active oracle selected | Passed |
| Oracle status active/live | Passed (`active`) |
| Expiry from oracle state/metadata | Passed |
| Strike metadata available | Passed for `min_strike` and `tick_size`; full eligibility still constrained by quote result |
| `lowerStrike < higherStrike` | Passed |
| Win condition displayed as `(lower, higher]` | Passed |
| `get_range_trade_amounts` preview succeeds | Failed |
| Mint cost readable | Failed |
| Mint cost `<= 5 DUSDC` | Not evaluated because quote failed |
| Manager balance `>= mint cost` | Not evaluated because quote failed |
| Verified manager ID and owner | Passed |
| Sui Testnet only | Passed |
| Warning before real mint | Not reached |
| No private key output | Passed |
| Forbidden actions blocked | Passed |

Safety gate status: blocked. No `mint_range<DUSDC>` transaction was submitted.

## Mint validation

| Field | Result |
|---|---|
| Executed | No |
| Digest | N/A |
| Explorer URL | N/A |
| `RangeMinted` event | N/A |
| Manager/positions readback after mint | N/A |

## Public server observations

- `/managers/:manager_id/summary` validates the known manager owner and reports `2000000` atomic DUSDC.
- `/oracles/:oracle_id/ask-bounds` returned `null` for the selected active oracle.
- The selected oracle record exposed `min_strike` and `tick_size`, which are sufficient for a candidate range but not sufficient to prove mint eligibility.

## Current blockers

- Ask bounds are `null`; this must not be treated as mint eligibility.
- `predict::get_range_trade_amounts` aborts in `pricing_config::quote_spread_from_fair_price` for the selected candidate range.
- Successful quote return mapping for `(mint_cost, redeem_payout)` remains unverified.
- First real `predict::mint_range<DUSDC>` remains unexecuted.
- `RangeMinted` event shape and portfolio/positions readback after mint remain unverified.

## Browser wallet manual validation checklist

Browser validation remains pending and should wait until quote safety gates pass in the automated local signer path.

- [ ] Open `apps/web` locally.
- [ ] Connect browser wallet.
- [ ] Confirm Testnet.
- [ ] Confirm manager ID is loaded or entered.
- [ ] Confirm manager DUSDC balance.
- [ ] Select active discovered market.
- [ ] Confirm range bounds and win condition.
- [ ] Run quote preview.
- [ ] Confirm cost is small.
- [ ] Approve `mint_range` in wallet.
- [ ] Confirm transaction digest.
- [ ] Confirm `RangeMinted` / portfolio update.

## Next steps

1. Confirm a quoteable range selection strategy from official source or runtime data instead of deriving only from `min_strike` and `tick_size`.
2. Re-run `npm run validate:range-quote` after ask bounds or quoteable range data is available.
3. Only run `npm run validate:range-mint` after all safety gates pass.
4. Update this document with the first successful quote and mint digest, or with the next precise blocker.
