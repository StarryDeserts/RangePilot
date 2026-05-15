---
Purpose: Define the Phase 1B wallet, PredictManager, and DUSDC deposit scaffold for RangePilot.
Audience: Frontend developers, SDK implementers, protocol integrators, reviewers, and AI agents.
Status: Generated documentation; Phase 1B scaffold reference with unresolved binding blockers.
Source of truth relationship: Supplements official contract info, protocol integration notes, and entrypoint binding docs; exact PTB/read/event shapes remain source-branch or runtime confirmation items.
---

# PredictManager Flow

Phase 1B adds a minimal browser-wallet scaffold for creating or loading a DeepBook Predict `PredictManager` and preparing DUSDC deposits. It is not a range trading flow and must not call `mint_range` or `redeem_range`.

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
7. After success, RangePilot attempts to recover the manager ID from `PredictManagerCreated` event data or transaction details.
8. If recovery succeeds, store the manager ID as a local hint keyed by wallet address and network.
9. If recovery remains unconfirmed, show the digest and require manual manager ID capture after event fields are confirmed.

Current scaffold status:

- `buildCreateManagerTransaction` builds the no-argument `predict::create_manager` move call using confirmed Testnet package config.
- Event parsing matches the confirmed `predict_manager::PredictManagerCreated` event type suffix but does not invent parsed field names.
- Manager ID extraction from the event is `MUST CONFIRM BEFORE CODING`.

## Layered manager discovery strategy

1. **Local storage hint**: if a manager ID is stored for `testnet + wallet address`, load it as a non-authoritative hint.
2. **Public server `/managers`**: use only after owner filtering, pagination, and response schema are confirmed.
3. **`PredictManagerCreated` event scan**: use only after event fields and event query filters are confirmed.
4. **Create new manager**: offer `create_manager` when discovery cannot find a manager.
5. **Post-create capture**: parse event/transaction effects and store the confirmed manager ID as a new local hint.

Local storage is never the only source of truth; it is only a UX hint until direct owner validation is confirmed.

Unresolved:

- `/managers` owner discovery is `MUST CONFIRM BEFORE CODING`.
- Event scan query and `PredictManagerCreated` parsed fields are `MUST CONFIRM BEFORE CODING`.
- Direct owner validation for a locally stored manager ID is `MUST CONFIRM BEFORE CODING`.

## DUSDC deposit flow

1. Query connected wallet DUSDC coins by the confirmed Testnet DUSDC coin type.
2. Sum balances with `bigint` and display both atomic units and 6-decimal DUSDC.
3. User enters a deposit amount in atomic units.
4. SDK selects enough wallet DUSDC coin objects; it must not assume a single coin object.
5. Deposit PTB should merge/split coins as needed.
6. PTB passes `&mut PredictManager` and `Coin<DUSDC>` into `predict_manager::deposit<DUSDC>`.
7. Browser wallet prompts the user to confirm.
8. After success, refresh wallet DUSDC balance and manager balance.

Current scaffold status:

- `getDusdcCoins` paginates Sui wallet coin results for the configured DUSDC coin type.
- `getDusdcBalance` sums wallet DUSDC with `bigint` and returns string atomic totals.
- `selectDusdcCoinsForAmount` selects enough coin objects and throws on insufficient balance.
- `buildDepositDusdcTransaction` intentionally blocks with `MUST CONFIRM BEFORE REAL DEPOSIT` until exact coin merge/split and `deposit<DUSDC>` PTB construction are validated.

## DUSDC coin selection strategy

- Treat all balances as integer atomic units.
- Use DUSDC decimals `6` only for display conversion.
- Exclude zero-balance coins from selected deposit inputs.
- Select multiple coin objects if one coin cannot cover the requested amount.
- Throw a user-safe insufficient-balance error when selected total is below the requested amount.
- Do not use JavaScript `number` for core deposit amounts.

## Manager balance read strategy

Preferred order after deposit:

1. Direct read or devInspect of `predict_manager::balance<DUSDC>` for wallet-critical confirmation.
2. Public server manager summary only after `/managers/:manager_id/summary` response fields are confirmed.
3. Event/checkpoint fallback for history or delayed server indexing.

Current scaffold status:

- `getManagerBalance` is blocked with `MUST CONFIRM BEFORE CODING`.
- The UI does not fake a manager balance.

## Event fallback strategy

Use events for manager creation and future portfolio history only after field shapes are confirmed.

Confirmed event type to inspect:

```text
<PREDICT_PACKAGE>::predict_manager::PredictManagerCreated
```

Current parser behavior:

- Matches the confirmed package ID and event type suffix.
- Returns raw candidate event data.
- Returns `managerId: null` until the manager ID field is confirmed.

## Manual test checklist

- [ ] Connect wallet on Sui Testnet
- [ ] Confirm wallet address
- [ ] Confirm DUSDC coin type balance
- [ ] Create PredictManager
- [ ] Capture manager ID
- [ ] Refresh page and recover manager ID
- [ ] Deposit small DUSDC amount
- [ ] Confirm manager balance changed
- [ ] Confirm explorer transaction digest
- [ ] Confirm no private key or secret is used

## Unresolved issues

- `PredictManagerCreated` manager ID field is `MUST CONFIRM BEFORE CODING`.
- Public server `/managers` owner discovery is `MUST CONFIRM BEFORE CODING`.
- Local manager hint owner validation is `MUST CONFIRM BEFORE CODING`.
- `predict_manager::deposit<DUSDC>` coin split/merge PTB construction is `MUST CONFIRM BEFORE REAL DEPOSIT`.
- `predict_manager::balance<DUSDC>` readback strategy is `MUST CONFIRM BEFORE CODING`.
- DUSDC faucet/funding path is required for real deposit testing.
- Phase 1C must confirm active market, strike grid, ask bounds, quote preview, and first `mint_range<DUSDC>` only after Phase 1B blockers are resolved.
