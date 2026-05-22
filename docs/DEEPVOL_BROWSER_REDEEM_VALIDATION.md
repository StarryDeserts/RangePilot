---
Purpose: Record DeepVol-13 controlled browser guided redeem validation for the known BTC MOVE receipt.
Audience: Product engineers, protocol integrators, frontend developers, reviewers, and project planners.
Status: Browser guided redeem validated on Sui Testnet for the known controlled receipt.
Source of truth relationship: Derived from local DeepVol frontend wiring, Sui Testnet read/devInspect evidence, user-confirmed browser wallet execution, and post-redeem position readback; on-chain state and official source remain authoritative.
---

# DeepVol Browser Redeem Validation

## Summary

DeepVol-13 records one successful browser-wallet guided redeem for the known BTC MOVE receipt on Sui Testnet. The browser path used the DeepVol-12 controlled gates: exact known receipt, exact owner wallet, Sui Testnet, both receipt-scoped leg preflights, fresh read/preflight immediately before wallet review, and a local one-shot attempt record before submitting one combined `predict::redeem<DUSDC>` PTB for the UP and DOWN legs.

The wallet-approved redeem succeeded with digest `HeHNeZ95oymZzmA2ZpdjkvJgCaA9s5DzL7qs6aCgbJbJ`. It redeemed the receipt-scoped `10000` UP quantity and `10000` DOWN quantity. The remaining `10000` per leg is manager-level aggregate position quantity for the same MarketKeys, not unreconciled receipt quantity and not a failed receipt redeem.

No additional buy, additional redeem, primitive mint, publish, upgrade, ProtocolVault withdraw, script/private-key fallback, or mainnet action was performed in DeepVol-13.

## Known controlled receipt

| Field | Value |
|---|---|
| Network | Sui Testnet |
| Browser buy digest | `A6YB62BqMmWsQeEZUoh4qYAA6n4RMqnih5TtHRdadfGn` |
| Browser redeem digest | `HeHNeZ95oymZzmA2ZpdjkvJgCaA9s5DzL7qs6aCgbJbJ` |
| Owner / approved wallet | `0x60ce00b02feafce805f1c3c8a7beaf7db8e903d73610fb232ad928d31fcd9349` |
| MoveReceipt | `0xbbc2d18447502830a96602b8f9611e834c509d6fa00abdf2061ecd1addaa35eb` |
| VolSeries | `0x57878763c144cabe06c86d7e02f168d6b42481d779434d8efc8146a10c1ba885` |
| PredictManager | `0xffc0629e53bc703b60d5b135b2def3f6919bb08b5b41c137b5c8563739d6216a` |
| Oracle | `0xc746336e790db7e93a34b684fa3768f43a7c3171d0262d0f2c71dc0a2ab5fe22` |
| Expiry | `1779436800000` |
| Receipt quantity | `10000` |
| UP strike | `76796000000000` |
| DOWN strike | `76696000000000` |

## Successful browser redeem result

| Field | Value |
|---|---|
| Digest | `HeHNeZ95oymZzmA2ZpdjkvJgCaA9s5DzL7qs6aCgbJbJ` |
| UP quantity | `10000` |
| UP payout | `9727` atomic DUSDC |
| DOWN quantity | `10000` |
| DOWN payout | `47` atomic DUSDC |
| Total payout | `9774` atomic DUSDC |
| UP position | `20000 -> 10000` |
| DOWN position | `20000 -> 10000` |

The payout values above are execution evidence for this transaction. Earlier payout previews from DeepVol-11 and DeepVol-12 were runtime-dependent read/devInspect estimates and must not be treated as final payout proof.

## Receipt-scoped interpretation

The known `MoveReceipt` quantity is `10000`, while the controlled wallet had manager-level UP and DOWN quantities of `20000` before redeem. DeepVol redeems the receipt-scoped quantity:

```text
receipt-scoped redeem quantity = min(manager position, receipt quantity)
```

Therefore the successful position deltas are interpreted as:

| Leg | Manager position before | Receipt-scoped redeem quantity | Manager position after | Interpretation |
|---|---:|---:|---:|---|
| UP | `20000` | `10000` | `10000` | Known receipt UP leg redeemed. |
| DOWN | `20000` | `10000` | `10000` | Known receipt DOWN leg redeemed. |

The remaining `10000` UP and `10000` DOWN quantities belong to the wallet's aggregate manager-level position for the same MarketKeys. They are not evidence that the known receipt failed to redeem.

## Controlled execution gates used

The browser path blocks execution unless all of these are true:

1. Wallet is connected.
2. Wallet is on Sui Testnet.
3. Connected address equals the approved owner.
4. Receipt ID, owner, PredictManager, oracle, expiry, strikes, quantity, and open status match the known controlled receipt.
5. Both UP and DOWN preflights pass.
6. Both computed preflight quantities equal the receipt-scoped quantity `10000`.
7. No local one-shot attempt record exists for the receipt.
8. The submit handler re-reads the receipt, manager DUSDC balance, positions, payout previews, and combined two-leg devInspect preflight immediately before wallet review.

The transaction builder creates one PTB with two `predict::redeem<DUSDC>` calls. It does not call DeepVol `receipt::mark_receipt_settled`.

## MVP boundary after validation

This validation proves the controlled browser guided redeem path for the known Sui Testnet receipt. It does not prove general wallet-wide receipt indexing, automatic settlement, Profit Fee enforcement, custodial receipt semantics, mainnet readiness, or generic primitive trading.

Future guided redeems must still use fresh runtime gates: exact receipt/owner validation, current `PredictManager` position readback, fresh payout preview, full redeem preflight, wallet approval, `PositionRedeemed` event parsing, and before/after balance and position reconciliation.
