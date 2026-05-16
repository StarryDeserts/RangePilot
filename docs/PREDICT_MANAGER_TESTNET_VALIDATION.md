---
Purpose: Record Phase 1B-Verify Testnet validation results for PredictManager creation, manager ID recovery, DUSDC deposit, and balance readback.
Audience: Protocol integrators, SDK implementers, frontend developers, reviewers, and AI agents.
Status: Generated documentation; Phase 1B-Verify automated local signer validation completed on Sui Testnet.
Source of truth relationship: Supplements official contract info, protocol integration notes, PredictManager flow docs, and entrypoint binding docs with public validation artifacts only.
---

# PredictManager Testnet Validation

## Scope

This validation proves the Phase 1B Predict Account path through Sui Testnet using a local signer and a small DUSDC amount. It does not validate range minting, range redemption, vault supply, vault withdrawal, creator strategy flows, or mainnet behavior.

No private key, `.env.local` contents, signature material, mnemonic, token, or local cache contents are documented here.

## Automated local signer validation

| Field | Result |
|---|---|
| Test date | 2026-05-16 |
| Network | Sui Testnet |
| Public test address | `0xc558e37d20405a9751c81124ac8d167e2b2d368b834319adafa549449e0715f5` |
| Public server | `https://predict-server.testnet.mystenlabs.com` |
| Predict package | `0xf5ea2b3749c65d6e56507cc35388719aadb28f9cab873696a2f8687f5c785138` |
| DUSDC coin type | `0xe95040085976bfd54a1a07225cd46c8a2b4e8e2b6732f140a0fc49850ba73e1a::dusdc::DUSDC` |
| Script | `npm run validate:predict-manager` |
| Private key handling | Script loaded `SUI_PRIVATE_KEY` from `.env.local` and printed only `SUI_PRIVATE_KEY loaded: yes`. |

## Results

| Check | Result | Evidence |
|---|---|---|
| SUI gas preflight | Passed | First validation run reported `8344997984` MIST; second cached-manager run reported `8335456428` MIST. |
| DUSDC wallet preflight | Passed | First run reported `550000000` atomic DUSDC before deposit. Second run reported `549000000` atomic DUSDC before deposit. A later read-only balance refresh reported `548000000` atomic DUSDC. |
| `predict::create_manager` | Verified | Transaction digest `DKoSBnKWZGJK6H2RV3yF4pAqSnQ3XncWFfgTsB38pf56`. Explorer: `https://suiexplorer.com/txblock/DKoSBnKWZGJK6H2RV3yF4pAqSnQ3XncWFfgTsB38pf56?network=testnet`. |
| Manager ID recovery | Verified | Recovered `0x6f341e107a87812fd4fddfc4fc50a7e3ab5bc21cabff2cd39dd86b662fa75599` from matching `PredictManagerCreated` event and created object change. Source: `event_and_object_change`. |
| Local public manager cache | Verified as hint only | Second run loaded the cached manager ID and validated it through public server summary before depositing. The cache is `.local/predict-manager-cache.json` and remains ignored. |
| First `deposit<DUSDC>` | Verified | Deposited `1000000` atomic DUSDC. Transaction digest `DeSdTRYKpA1hGEGXSoGGEu4y8nzn8gwcbFjUAs1zRH5M`. Explorer: `https://suiexplorer.com/txblock/DeSdTRYKpA1hGEGXSoGGEu4y8nzn8gwcbFjUAs1zRH5M?network=testnet`. |
| Cached-manager `deposit<DUSDC>` rerun | Verified | Deposited another `1000000` atomic DUSDC. Transaction digest `8pQox3ckxD9uyqaYGgzbKgeUBYMv9CrzzMxEQeKwRS1W`. Explorer: `https://suiexplorer.com/txblock/8pQox3ckxD9uyqaYGgzbKgeUBYMv9CrzzMxEQeKwRS1W?network=testnet`. |
| Manager balance readback | Verified through public server summary | `/managers/:manager_id/summary` returned HTTP 200 with owner `0xc558e37d20405a9751c81124ac8d167e2b2d368b834319adafa549449e0715f5`, `balances[0].balance = 2000000`, `trading_balance = 2000000`, and `account_value = 2000000` after two 1 DUSDC deposits. |

## Observed public server manager summary shape

Read-only request:

```text
GET /managers/0x6f341e107a87812fd4fddfc4fc50a7e3ab5bc21cabff2cd39dd86b662fa75599/summary
```

Observed top-level keys:

```text
manager_id
owner
balances
trading_balance
open_exposure
redeemable_value
realized_pnl
unrealized_pnl
account_value
open_positions
awaiting_settlement_positions
```

Observed DUSDC balance fields after two deposits:

```json
{
  "manager_id": "0x6f341e107a87812fd4fddfc4fc50a7e3ab5bc21cabff2cd39dd86b662fa75599",
  "owner": "0xc558e37d20405a9751c81124ac8d167e2b2d368b834319adafa549449e0715f5",
  "balances": [
    {
      "quote_asset": "e95040085976bfd54a1a07225cd46c8a2b4e8e2b6732f140a0fc49850ba73e1a::dusdc::DUSDC",
      "balance": 2000000
    }
  ],
  "trading_balance": 2000000,
  "account_value": 2000000,
  "open_positions": 0,
  "awaiting_settlement_positions": 0
}
```

## Manager ID recovery behavior

`recoverPredictManagerIdFromCreateResult` accepted only `0x` hex object IDs and recovered the manager when both sources agreed:

1. `PredictManagerCreated` event parsed JSON exposed a manager ID through one of the known public candidate fields.
2. Transaction `objectChanges` included exactly one created object whose `objectType` started with `<PREDICT_PACKAGE>::predict_manager::PredictManager`.
3. The event manager ID and object-change manager ID matched.

If multiple manager object-change candidates are observed in a future run, the helper marks the result ambiguous and the validation script aborts before deposit.

## Known limitations and blockers

- Browser wallet manual validation is still pending; automated local signer validation proves the PTB construction but not the browser approval UX.
- Public server `/managers/:manager_id/summary` is verified for a known manager ID. General owner-based manager discovery through `/managers` remains pending.
- Direct `predict_manager::balance<DUSDC>` devInspect read remains a fallback path and is not the primary confirmed read path in this validation.
- Range quote, strike grid validation, ask-bounds eligibility, and first `mint_range<DUSDC>` remain Phase 1C scope.
- `redeem_range`, `supply`, and `withdraw` remain untested and out of scope.

## Browser wallet manual validation checklist

- [ ] Open `apps/web` locally.
- [ ] Connect browser wallet.
- [ ] Confirm wallet is on Sui Testnet.
- [ ] Confirm connected address matches or differs from the CLI test address.
- [ ] Confirm DUSDC balance displays correctly.
- [ ] Click Create Predict Account.
- [ ] Approve transaction in wallet.
- [ ] Confirm transaction digest appears.
- [ ] Confirm manager ID is recovered.
- [ ] Refresh page and confirm manager ID persists.
- [ ] Enter small DUSDC deposit amount.
- [ ] Approve deposit transaction.
- [ ] Confirm deposit digest appears.
- [ ] Confirm manager balance updates or known readback limitation is shown.
- [ ] Confirm no private key is used by browser app.

## Next steps

1. Update the browser wallet flow to use the verified event/object-change recovery path and keep local manager storage as a hint.
2. Wire public server manager summary display for known manager IDs.
3. Add browser manual validation before claiming the UI flow is fully verified.
4. Start Phase 1C only after the remaining Phase 1B browser/readback discovery blockers are cleared.
