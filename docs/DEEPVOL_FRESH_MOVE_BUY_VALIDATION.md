---
Purpose: Record the first successful fresh-VolSeries BTC MOVE buy on Sui Testnet.
Audience: Protocol integrators, frontend developers, validation auditors.
Status: DeepVol-20 validation record.
Source of truth relationship: Derived from on-chain transaction; does not override protocol or product specs.
---

# Fresh BTC MOVE Buy Validation

## Summary

This document records the first successful `buy_move_receipt<DUSDC>` transaction using a freshly created VolSeries through the full active-market → mintable-range → create-series → buy flow.

The previous `assert_mintable_ask::7` issue (DeepVol-18-fix-2) was resolved by requiring mintable range validation before Create Series. This buy confirms the fix works end-to-end in a real browser wallet flow.

## Validated flow

```
active BTC market discovery
→ mintable BTC MOVE range generation
→ permissionless create_series (fresh VolSeries)
→ buy_move_receipt<DUSDC>
→ UP leg mint (PositionMinted)
→ DOWN leg mint (PositionMinted)
→ ProtocolVault create fee deposit (CreateFeeDeposited)
→ MoveReceiptCreated
```

## Transaction details

| Field | Value |
|---|---|
| Digest | `6sq8ZydZS3sLXNU6Y31gxSqBniVdf7SEXMwiKzJmjbXg` |
| Status | success |
| Sender | `0x60ce00b02feafce805f1c3c8a7beaf7db8e903d73610fb232ad928d31fcd9349` |
| DeepVol package | `0xe9b45e8d06406bb935bf5e3260ac9b82491ca158775861660be34881e17a4fa0` |
| Function | `receipt::buy_move_receipt<DUSDC>` |
| VolSeries | `0x227c2436f3f111e41a78967faaca9c5e9dc5f3074959b720efc86f70fba7006d` |
| Oracle | `0xd438e7e7ed13061b9df3f2f0e395cd74302306bd9b6f3c759ff0faa4fd26cab8` |
| Predict | `0xc8736204d12f0a7277c86388a68bf8a194b0a14c5538ad13f22cbd8e2a38028a` |
| PredictManager | `0x1d7d4e16415e7811babb27a5311991196fed9c295d0fb4e4468978efe050f010` |
| ProtocolVault\<DUSDC\> | `0x1b9174645d70ac4caa2cfa0db5df59ac78a3ce0d3cca10f8be37e4c5d84f1a09` |
| Quantity | 10000 |
| Max premium paid | 11204 atomic DUSDC |

## Leg details

| Leg | Direction | Strike | Quantity | Cost (atomic DUSDC) |
|---|---|---|---|---|
| UP | up | 76818000000000 | 10000 | 4624 |
| DOWN | down | 76797000000000 | 10000 | 4714 |

| Summary | Value |
|---|---|
| Total premium | 9338 atomic DUSDC |
| Create fee | 28 atomic DUSDC |
| MoveReceipt | `0x85d803ae6b8a66f6d0e0772e8906d8076dea210de3eaa322d712db58eb6ff869` |

## Events (in order)

1. `BalanceEvent` — deposit=false, amount=4624 (UP leg debit from PredictManager)
2. `PositionMinted` — UP leg
3. `BalanceEvent` — deposit=false, amount=4714 (DOWN leg debit from PredictManager)
4. `PositionMinted` — DOWN leg
5. `CreateFeeDeposited` — amount=28
6. `MoveReceiptCreated`

## Portfolio expectation

The Portfolio page reads receipts from **localStorage** via `deepvol:receipts`. When a BTC MOVE buy succeeds through the browser wallet flow, the `BuyMoveReceiptCard` component calls `persistReceipt()` which writes the receipt to localStorage and triggers a `deepvol:receipt-storage-updated` event. The Portfolio page's `useDeepVolPortfolio` hook picks up the event and re-renders.

If the receipt was created in the current browser session, it should appear in Portfolio automatically after the buy transaction confirms. If the user accesses Portfolio from a different browser or after clearing localStorage, the receipt will not appear — general receipt indexing (event-query or on-chain enumeration) is not yet implemented.

The validation reference receipt (`validatedReferenceReceiptId` in config) remains as a fallback display when no local receipts exist.

## What this does NOT validate

- UP/DOWN/RANGE direct primitive trading (separate scope, not yet fixed)
- RANGE execution
- Redeem of this specific receipt (future validation)
- Mainnet readiness
- General receipt indexing / discovery
