---
Purpose: Record DeepVol-12 controlled browser guided redeem wiring, fresh read/preflight evidence, and the current browser-wallet execution blocker.
Audience: Product engineers, protocol integrators, frontend developers, reviewers, and project planners.
Status: Controlled browser redeem execution wired and gated; real wallet redeem not executed because the validation browser has no wallet extension/account available.
Source of truth relationship: Derived from local DeepVol frontend wiring, Sui Testnet read/devInspect evidence, and browser smoke; on-chain state and official source remain authoritative.
---

# DeepVol Browser Redeem Validation

## Summary

DeepVol-12 wires the Portfolio guided redeem path for the known BTC MOVE receipt behind strict controlled-Testnet gates. The browser UI now requires the exact known receipt, exact owner wallet, Sui Testnet, both receipt-scoped leg preflights, fresh read/preflight immediately before wallet review, and a local one-shot attempt record before it can submit one combined `predict::redeem<DUSDC>` PTB for the UP and DOWN legs.

No real redeem was executed in this validation run. The Playwright validation browser did not have the Slush wallet extension installed or the approved wallet account connected, so the real wallet-approved redeem remained blocked. No script/private-key fallback was used.

## Known controlled receipt

| Field | Value |
|---|---|
| Network | Sui Testnet |
| Browser buy digest | `A6YB62BqMmWsQeEZUoh4qYAA6n4RMqnih5TtHRdadfGn` |
| Owner / approved wallet | `0x60ce00b02feafce805f1c3c8a7beaf7db8e903d73610fb232ad928d31fcd9349` |
| MoveReceipt | `0xbbc2d18447502830a96602b8f9611e834c509d6fa00abdf2061ecd1addaa35eb` |
| VolSeries | `0x57878763c144cabe06c86d7e02f168d6b42481d779434d8efc8146a10c1ba885` |
| PredictManager | `0xffc0629e53bc703b60d5b135b2def3f6919bb08b5b41c137b5c8563739d6216a` |
| Oracle | `0xc746336e790db7e93a34b684fa3768f43a7c3171d0262d0f2c71dc0a2ab5fe22` |
| Expiry | `1779436800000` |
| Receipt quantity | `10000` |
| UP strike | `76796000000000` |
| DOWN strike | `76696000000000` |

## Fresh read result

Command:

```bash
npm run validate:deepvol-redeem-read
```

Observed immediately before browser validation:

| Field | Value |
|---|---|
| Receipt exists | Yes |
| Receipt owner | `0x60ce00b02feafce805f1c3c8a7beaf7db8e903d73610fb232ad928d31fcd9349` |
| Receipt status | `0` / open |
| Receipt quantity | `10000` |
| UP manager position | `20000` |
| DOWN manager position | `20000` |
| UP receipt-scoped quantity | `10000` |
| DOWN receipt-scoped quantity | `10000` |
| UP payout preview | `6431` atomic DUSDC |
| DOWN payout preview | `3111` atomic DUSDC |

Payout previews are runtime-dependent and must be refreshed before any later wallet prompt.

## Fresh preflight result

Command:

```bash
npm run validate:deepvol-redeem-preflight
```

Observed immediately before browser validation:

| Leg | Receipt-scoped quantity | Result | Payout preview |
|---|---:|---|---:|
| UP | `10000` | Passed devInspect | `6519` atomic DUSDC |
| DOWN | `10000` | Passed devInspect | `3019` atomic DUSDC |

The validation script remained read/devInspect-only and printed `No real redeem executed.`

## Browser validation result

| Check | Result |
|---|---|
| `/portfolio` render | Passed after fixing the local storage snapshot loop. |
| Known controlled receipt display | Passed. The Portfolio page displayed receipt `0xbbc2...35eb`, quantity `10000`, UP/DOWN strikes, owner, series, and manager. |
| Disconnected-wallet blockers | Passed. Both `Run redeem preflight` and `Redeem both receipt legs` remained disabled while disconnected. |
| Wallet availability | Blocked. The browser showed Slush as installable, not connected; no wallet extension/account was available in the validation browser. |
| Real wallet redeem | Not executed. |
| Digest | Not available; no transaction submitted. |
| PositionRedeemed events | Not available; no transaction submitted. |
| Manager balance after | Not available; no transaction submitted. |
| UP/DOWN positions after | Not available; no transaction submitted. |
| Portfolio local redeemed status | Not set; no transaction submitted. |

## Implemented controlled execution gates

The browser path now blocks execution unless all of these are true:

1. Wallet is connected.
2. Wallet is on Sui Testnet.
3. Connected address equals the approved owner.
4. Receipt ID, owner, PredictManager, oracle, expiry, strikes, quantity, and open status match the known controlled receipt.
5. Both UP and DOWN preflights pass.
6. Both computed preflight quantities equal the receipt-scoped quantity `10000`.
7. No local one-shot attempt record exists for the receipt.
8. The submit handler re-reads the receipt, manager DUSDC balance, positions, payout previews, and combined two-leg devInspect preflight immediately before wallet review.

The transaction builder creates one PTB with two `predict::redeem<DUSDC>` calls. It does not call DeepVol `receipt::mark_receipt_settled`.

## Current blocker

The real validation requires the approved wallet account to be connected in a browser with a Sui wallet extension. The available Playwright browser did not have the Slush extension installed, and installing/importing a wallet would require private key or seed handling that is explicitly out of scope.

DeepVol-12 therefore stopped before any real redeem execution. No retry, script execution, private-key use, publish, withdraw, buy, mint, Move upgrade, or mainnet action was performed.

## Next step

Run one controlled browser-wallet redeem only in a browser profile where the approved wallet is already installed, unlocked, and connected on Sui Testnet. After wallet approval, parse exactly two `PositionRedeemed` events, verify UP and DOWN positions decrease by `10000`, verify manager DUSDC balance increases by the summed payout, and then persist the local/indexer-limited redeemed status.
