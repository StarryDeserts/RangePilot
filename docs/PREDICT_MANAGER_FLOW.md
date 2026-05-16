---
Purpose: Define the Phase 1B wallet, PredictManager, and DUSDC deposit flow for RangePilot.
Audience: Frontend developers, SDK implementers, protocol integrators, reviewers, and AI agents.
Status: Generated documentation; Phase 1B-Verify local signer validation completed for create_manager, deposit<DUSDC>, manager ID recovery, and public-server balance readback.
Source of truth relationship: Supplements official contract info, protocol integration notes, entrypoint binding docs, and the Phase 1B-Verify validation report; range minting remains future work.
---

# PredictManager Flow

Phase 1B adds a minimal browser-wallet scaffold for creating or loading a DeepBook Predict `PredictManager` and preparing DUSDC deposits. Phase 1B-Verify validated the core PTB path with a local Sui Testnet signer, but browser wallet manual validation remains separate. This is not a range trading flow and must not call `mint_range` or `redeem_range`.

## Product meaning

RangePilot should present `PredictManager` as a user-facing **Predict Account**.

| Protocol term | RangePilot term | Meaning |
|---|---|---|
| `PredictManager` | Predict Account | User-owned protocol account for deposited quote balance and positions. |
| `predict_manager::balance<DUSDC>` | Predict Account DUSDC balance | Deposited DUSDC available for future DeepBook Predict trades. |
| wallet `Coin<DUSDC>` objects | Wallet DUSDC | DUSDC still in the connected wallet, before deposit. |

Positions and range positions are internal manager state, not standalone NFTs.

## `create_manager` flow

1. User connects a browser wallet.
2. App requires Sui Testnet context.
3. App checks for a locally stored manager ID hint for the connected wallet and network.
4. If no usable hint exists, UI offers **Create Predict Account**.
5. Button click builds a transaction targeting `<PREDICT_PACKAGE>::predict::create_manager`.
6. The browser wallet prompts the user to confirm.
7. After success, RangePilot recovers the manager ID from `PredictManagerCreated` event data and transaction object changes.
8. If recovery succeeds, store the manager ID as a local hint keyed by wallet address and network.
9. If recovery is missing or ambiguous, show the digest and block deposit until a manager ID is confirmed.

Verified local signer status:

- `buildCreateManagerTransaction` builds the no-argument `predict::create_manager` move call using confirmed Testnet package config.
- Sui Testnet transaction `DKoSBnKWZGJK6H2RV3yF4pAqSnQ3XncWFfgTsB38pf56` created manager `0x6f341e107a87812fd4fddfc4fc50a7e3ab5bc21cabff2cd39dd86b662fa75599`.
- `recoverPredictManagerIdFromCreateResult` recovered the manager ID from matching `PredictManagerCreated` event data and a created object change.
- The validation script writes only a public local cache hint under `.local/predict-manager-cache.json`; `.local/` remains ignored.

## Layered manager discovery strategy

1. **Local storage/cache hint**: if a manager ID is stored for `testnet + wallet address`, load it as a non-authoritative hint.
2. **Known-manager public server validation**: for a known manager ID, `/managers/:manager_id/summary` can validate owner and deposited DUSDC summary fields.
3. **Fresh create transaction capture**: parse `PredictManagerCreated` event data and created `PredictManager` object changes immediately after `create_manager`.
4. **Future public server `/managers` owner discovery**: use only after owner filtering, pagination, and response schema are confirmed.
5. **Future event scan**: use only after event query filters and historical lookup behavior are confirmed.

Local storage is never the only source of truth; it is only a UX hint until the app can validate it through public server, object read, or event history.

Still pending:

- `/managers` owner discovery is `MUST CONFIRM BEFORE CODING`.
- Event scan query filters for historical manager discovery are `MUST CONFIRM BEFORE CODING`.
- Browser local-storage owner validation must be wired from the verified public server summary or a direct read before claiming full UI discovery.

## DUSDC deposit flow

1. Query connected wallet DUSDC coins by the confirmed Testnet DUSDC coin type.
2. Sum balances with `bigint` and display both atomic units and 6-decimal DUSDC.
3. User enters a small deposit amount in atomic units or DUSDC display units.
4. SDK selects enough wallet DUSDC coin objects; it must not assume a single coin object.
5. Deposit PTB merges selected coins into the destination coin when multiple coins are needed.
6. If selected total is greater than the requested amount, PTB splits the exact deposit coin.
7. PTB passes `&mut PredictManager` and `Coin<DUSDC>` into `predict_manager::deposit<DUSDC>`.
8. Browser wallet prompts the user to confirm.
9. After success, refresh wallet DUSDC balance and manager balance.

Verified local signer status:

- `getDusdcCoins` paginates Sui wallet coin results for the configured DUSDC coin type.
- `getDusdcBalance` sums wallet DUSDC with `bigint` and returns string atomic totals.
- `selectDusdcCoinsForAmount` selects enough coin objects and throws on insufficient balance.
- `buildDepositDusdcTransaction` remains blocked by default and only builds the real Testnet PTB when `allowRealTestnetDeposit === true`.
- First validation deposit succeeded for `1000000` atomic DUSDC in transaction `DeSdTRYKpA1hGEGXSoGGEu4y8nzn8gwcbFjUAs1zRH5M`.
- A cached-manager rerun deposited another `1000000` atomic DUSDC in transaction `8pQox3ckxD9uyqaYGgzbKgeUBYMv9CrzzMxEQeKwRS1W`.

## DUSDC coin selection strategy

- Treat all balances as integer atomic units.
- Use DUSDC decimals `6` only for display conversion.
- Exclude zero-balance coins from selected deposit inputs.
- Select multiple coin objects if one coin cannot cover the requested amount.
- Throw a user-safe insufficient-balance error when selected total is below the requested amount.
- Do not use JavaScript `number` for core deposit amounts.
- Keep the browser UI guarded until the verified Testnet PTB path is deliberately exposed through wallet actions.

## Manager balance read strategy

Preferred order after deposit:

1. Public server manager summary for known manager IDs, now verified for deposited DUSDC summary display.
2. Direct read or devInspect of `predict_manager::balance<DUSDC>` for wallet-critical confirmation after the direct shape is confirmed.
3. Public server positions summary for portfolio/positions display where needed.
4. Event/checkpoint fallback for history or delayed server indexing.

Verified local signer status:

- `/managers/:manager_id/summary` returned HTTP 200 for manager `0x6f341e107a87812fd4fddfc4fc50a7e3ab5bc21cabff2cd39dd86b662fa75599`.
- Summary owner matched `0xc558e37d20405a9751c81124ac8d167e2b2d368b834319adafa549449e0715f5`.
- After two 1 DUSDC deposits, summary reported `balances[0].balance = 2000000`, `trading_balance = 2000000`, and `account_value = 2000000`.
- `getManagerBalance` remains conservative until a reusable direct/devInspect helper is confirmed and wired.
- The UI must not fake a manager balance.

## Event fallback strategy

Use events for manager creation and future portfolio history only after field shapes are confirmed.

Confirmed event type:

```text
<PREDICT_PACKAGE>::predict_manager::PredictManagerCreated
```

Current parser behavior:

- Matches the confirmed package ID and event type suffix.
- Checks public candidate ID fields: `manager_id`, `managerId`, `manager`, `predict_manager`, `predictManager`, `id`, `object_id`, and `objectId`.
- Accepts only `0x` hex object-ID-shaped strings.
- Cross-checks parsed event manager ID against created `PredictManager` object changes.
- Returns an ambiguous result if multiple created `PredictManager` object candidates exist.

## Automated local signer validation

See [PREDICT_MANAGER_TESTNET_VALIDATION.md](./PREDICT_MANAGER_TESTNET_VALIDATION.md) for public validation artifacts, digests, explorer links, manager summary fields, and security notes.

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

## Remaining Phase 1B issues

- Browser wallet manual validation is pending.
- Public server `/managers` owner discovery is `MUST CONFIRM BEFORE CODING`.
- Historical event-scan manager discovery is `MUST CONFIRM BEFORE CODING`.
- Direct `predict_manager::balance<DUSDC>` devInspect/read helper remains pending; public server summary is the verified known-manager read path.
- Phase 1C must confirm active market, strike grid, ask bounds, quote preview, and first `mint_range<DUSDC>` only after remaining Phase 1B browser/readback blockers are resolved.
