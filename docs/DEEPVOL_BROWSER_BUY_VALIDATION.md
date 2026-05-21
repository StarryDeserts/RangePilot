---
Purpose: Record the manually validated DeepVol browser wallet BTC MOVE receipt purchase.
Audience: Product engineers, protocol integrators, frontend developers, and project planners.
Status: DeepVol-10 browser buy validation recorded.
Source of truth relationship: Complements deployed Route B validation and frontend MVP docs; on-chain details are Sui Testnet evidence from manual browser wallet execution.
---

# DeepVol Browser Buy Validation

## Purpose

This document records the first manually validated DeepVol browser wallet `buy_move_receipt<DUSDC>` flow after DeepVol-9 enabled browser-safe receipt preflight. It preserves the observed Sui Testnet evidence for the full user path:

```text
Run preflight
→ wallet review
→ buy_move_receipt<DUSDC>
→ MoveReceipt created
→ portfolio displays the receipt
```

The validation confirms the buy side of the DeepVol BTC MOVE MVP from the browser. It does not validate redeem, settlement, general receipt indexing, payout/PnL display, expiry handling, or Profit Fee enforcement.

## Validation summary

| Item | Result |
|---|---|
| Network | Sui Testnet |
| Browser receipt preflight | Passed |
| Browser wallet execution | Passed |
| Function called | `receipt::buy_move_receipt<DUSDC>` |
| Receipt created | Passed |
| ProtocolVault Create Fee deposit | Passed |
| Portfolio display | Passed |

DeepVol browser wallet buy_move_receipt<DUSDC> flow is validated on Sui Testnet.

## Network and actors

| Field | Value |
|---|---|
| Network | Sui Testnet |
| Sender / receipt owner | `0x60ce00b02feafce805f1c3c8a7beaf7db8e903d73610fb232ad928d31fcd9349` |
| PredictManager | `0xffc0629e53bc703b60d5b135b2def3f6919bb08b5b41c137b5c8563739d6216a` |
| DeepVol package | `0xe9b45e8d06406bb935bf5e3260ac9b82491ca158775861660be34881e17a4fa0` |
| VolSeries | `0x57878763c144cabe06c86d7e02f168d6b42481d779434d8efc8146a10c1ba885` |
| ProtocolVault<DUSDC> | `0x1b9174645d70ac4caa2cfa0db5df59ac78a3ce0d3cca10f8be37e4c5d84f1a09` |

## Transaction evidence

| Field | Value |
|---|---|
| Transaction digest | `A6YB62BqMmWsQeEZUoh4qYAA6n4RMqnih5TtHRdadfGn` |
| Called function | `receipt::buy_move_receipt<DUSDC>` |
| MoveReceipt created | `0xbbc2d18447502830a96602b8f9611e834c509d6fa00abdf2061ecd1addaa35eb` |
| Quantity | `10000` |
| Actual premium | `9973` atomic DUSDC |
| Create Fee | `29` atomic DUSDC |

`MoveReceiptCreated` evidence:

| Field | Value |
|---|---|
| `receipt_id` | `0xbbc2d18447502830a96602b8f9611e834c509d6fa00abdf2061ecd1addaa35eb` |
| `premium_paid` | `9973` atomic DUSDC |
| `create_fee_paid` | `29` atomic DUSDC |

## Composed BTC MOVE legs

The receipt transaction internally minted the two DeepBook Predict binary legs for BTC MOVE. The legs remain in the user's `PredictManager`; the `MoveReceipt` records the DeepVol metadata and linkage.

| Leg | `is_up` | Strike | Quantity | Cost |
|---|---|---:|---:|---:|
| UP | `true` | `76796000000000` | `10000` | `7476` |
| DOWN | `false` | `76696000000000` | `10000` | `2497` |

The UP and DOWN event costs sum to `9973`, matching the actual premium recorded by `MoveReceiptCreated`.

## Fee evidence

| Event | Field | Value |
|---|---|---:|
| `vault::CreateFeeDeposited` | `amount` | `29` |
| `MoveReceiptCreated` | `create_fee_paid` | `29` |

The Create Fee was deposited into the configured shared `ProtocolVault<DUSDC>`.

## Portfolio validation

After the browser wallet buy succeeded, the portfolio page displayed the created receipt successfully.

The current portfolio surface is still a known-record display model. It can display browser-local receipt references and configured validation artifacts, but it does not yet provide general wallet-wide receipt indexing.

## Post-buy state

After this browser buy, the validated user state consists of:

- `MoveReceipt` object `0xbbc2d18447502830a96602b8f9611e834c509d6fa00abdf2061ecd1addaa35eb`;
- UP binary position in `PredictManager` `0xffc0629e53bc703b60d5b135b2def3f6919bb08b5b41c137b5c8563739d6216a`;
- DOWN binary position in the same `PredictManager`;
- DeepVol Create Fee balance deposited into `ProtocolVault<DUSDC>`;
- browser `localStorage` receipt reference used by `apps/deepvol-web` portfolio display;
- portfolio page display of the created receipt.

## Remaining limitations

This validation does not prove or implement:

- general receipt indexing for every receipt owned by a wallet;
- browser redeem path;
- settlement path;
- receipt status synchronization;
- payout / PnL display;
- claim / expiry handling;
- Profit Fee enforcement;
- secondary market or tradable receipt behavior.

The receipt remains non-custodial. Underlying UP and DOWN positions stay in the user's `PredictManager`, not inside the `MoveReceipt`.

## Conclusion

DeepVol browser wallet buy_move_receipt<DUSDC> flow is validated on Sui Testnet.

The next product and engineering step is to design and implement a guided non-custodial redeem flow so users can understand and exit BTC MOVE positions without misrepresenting the receipt as custody truth.
