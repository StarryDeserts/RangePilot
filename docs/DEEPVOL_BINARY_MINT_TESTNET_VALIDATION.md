---
Purpose: Record the controlled Testnet validation of DeepVol's BTC two-leg binary mint path.
Audience: Move developers, SDK implementers, frontend developers, reviewers, and AI agents.
Status: DeepVol BTC two-leg binary mint validated on Testnet.
---

# DeepVol Binary Mint Testnet Validation

## Scope

This validation targets direct DeepBook Predict two-leg binary minting on Sui Testnet:

```text
Long UP above upper strike
+
Long DOWN below lower strike
=
BTC MOVE base exposure
```

It validates the underlying DeepBook Predict leg path that DeepVol BTC MOVE depends on. It is not a DeepVol `MoveReceipt` implementation, not receipt minting, not binary redeem validation, not wrapper validation, and not Mainnet work.

## Safety constraints

- Testnet only.
- Controlled sender only: `0x4ff903b0dcc52dc8753787baf19b34b7425dfa64d187cc7c726b38413705fa75`.
- Controlled manager only: `0xd59be0646d948c9be6073edc0cfd253ce4cb00f4929f0bae71f451f50e5d1575`.
- No private key was loaded by the script.
- `.env.local` was not read.
- No serialized transaction bytes were printed.
- Mint mode is dry-run-only by default; real submission requires `--execute-real-mint`.
- Exactly one real two-leg binary mint was submitted in this round.
- No retry was attempted.
- No publish, redeem, withdraw, range mint, wrapper follow, or receipt mint was executed.

## Commands

Pre-mint verification commands passed:

```bash
npm run typecheck
npm run build:web
npm run move:build:rangepilot
npm run move:test:rangepilot
npm run validate:deepvol-binary-read
npm run validate:deepvol-binary-preflight -- --sender 0x4ff903b0dcc52dc8753787baf19b34b7425dfa64d187cc7c726b38413705fa75 --manager 0xd59be0646d948c9be6073edc0cfd253ce4cb00f4929f0bae71f451f50e5d1575
```

Diagnostic mint mode was run without real execution:

```bash
npm run validate:deepvol-binary-mint -- --diagnostic-gas-budgets 100000000,200000000,500000000
npm run validate:deepvol-binary-mint -- --gas-budget 200000000 --diagnostic-gas-budgets 100000000,200000000,500000000
```

The single real mint command was then run once:

```bash
node scripts/validate-deepvol-binary-legs.mjs --mode mint --sender 0x4ff903b0dcc52dc8753787baf19b34b7425dfa64d187cc7c726b38413705fa75 --manager 0xd59be0646d948c9be6073edc0cfd253ce4cb00f4929f0bae71f451f50e5d1575 --gas-budget 200000000 --execute-real-mint
```

## Gate results

| Gate | Result |
|---|---|
| Network config | Passed: Testnet config and Testnet public server. |
| Controlled sender | Passed: `0x4ff903b0dcc52dc8753787baf19b34b7425dfa64d187cc7c726b38413705fa75`. |
| Controlled manager | Passed: `0xd59be0646d948c9be6073edc0cfd253ce4cb00f4929f0bae71f451f50e5d1575`. |
| Manager summary owner | Passed: owner matched controlled sender. |
| Manager DUSDC balance | Passed: `999965` atomic DUSDC before execution. |
| Sender SUI gas balance | Passed: `1957057036` MIST before execution. |
| Gas coins | Passed: two SUI gas coins available, largest `1457057036` MIST. |
| Active Sui CLI env | Passed: `testnet`. |
| Active Sui CLI address | Passed: controlled sender. |
| Two-leg PTB shape assertion | Passed before devInspect, SDK dry-run, CLI dry-run, and execution. |
| Two-leg PTB devInspect | Passed. |
| SDK full dry-run | Passed at `200000000` MIST gas budget. |
| CLI `serialized-tx-kind` dry-run | Passed at `200000000` MIST gas budget. |
| Real write submission | Submitted exactly once after all gates passed. |
| Post-state readback | Passed: UP and DOWN positions increased by `1000`; manager balance decreased by `1003`. |

## Gas and command-index diagnosis

The previous blocker was reproduced at the old default gas budget:

```text
SDK dry-run did not succeed: InsufficientGas in command 3
CLI dry-run did not succeed: InsufficientGas in command 3
```

The two-leg PTB command map was:

```text
command[0] / human 1: MoveCall market_key::up
command[1] / human 2: MoveCall predict::mint
command[2] / human 3: MoveCall market_key::down
command[3] / human 4: MoveCall predict::mint
```

The diagnostic interpretation for `command 3` is therefore:

- zero-based: `command[3]`, the second `predict::mint` call for the DOWN leg;
- one-based: `command[2]`, `market_key::down`.

The blocker was resolved by increasing the transaction gas budget from `100000000` to `200000000` MIST. CLI auto gas selection was sufficient; no explicit gas coin was required.

Gas coin summary before execution:

| Gas coin | Balance (MIST) | Version |
|---|---:|---:|
| `0x5a1df07d04eaeb06ff6da1188531e91c3a4221cfd15d0eac57c1a376db5049ba` | `1457057036` | `868270190` |
| `0xa8014fccc3049ae3bb08b7987bb685dc43171cba3e47ab5118914c8f2d43b507` | `500000000` | `698533325` |

Final execution gas:

| Field | Value |
|---|---:|
| Gas budget | `200000000` MIST |
| Gas coin selection | CLI auto-selection |
| Computation cost | `136500000` |
| Storage cost | `336330400` |
| Storage rebate | `328633272` |
| Non-refundable storage fee | `3319528` |

Root cause: the old `100000000` MIST budget was too low for the full two-leg transaction. The failure was not caused by quote selection, MarketKey construction, manager balance, active CLI environment, or gas coin fragmentation.

## Selected BTC MOVE pair

Runtime-selected values from the successful mint-mode run:

| Field | Value |
|---|---|
| Network | Sui Testnet |
| Sender | `0x4ff903b0dcc52dc8753787baf19b34b7425dfa64d187cc7c726b38413705fa75` |
| Manager | `0xd59be0646d948c9be6073edc0cfd253ce4cb00f4929f0bae71f451f50e5d1575` |
| BTC oracle | `0xc746336e790db7e93a34b684fa3768f43a7c3171d0262d0f2c71dc0a2ab5fe22` |
| Expiry | `1779436800000` |
| Lower strike | `76705000000000` |
| Upper strike | `76803000000000` |
| Quantity | `1000` |
| UP MarketKey | `market_key::up(0xc746336e790db7e93a34b684fa3768f43a7c3171d0262d0f2c71dc0a2ab5fe22, 1779436800000, 76803000000000)` |
| DOWN MarketKey | `market_key::down(0xc746336e790db7e93a34b684fa3768f43a7c3171d0262d0f2c71dc0a2ab5fe22, 1779436800000, 76705000000000)` |
| UP quote | `mint=497`, `redeem=477` |
| DOWN quote | `mint=506`, `redeem=486` |
| Total quoted premium | `1003` atomic DUSDC |
| Max premium cap | `10000` atomic DUSDC |

These runtime values are validation evidence only. Future mints must rediscover oracle, expiry, strikes, quotes, balances, gas, and preflight status at runtime.

## Execution result

Outcome: `DeepVol BTC two-leg binary mint validated on Testnet`.

| Field | Value |
|---|---|
| Transaction digest | `4fMQtu8mFB6jLa5gtSWBsDj3gYp8u9AjQw3xs2VcNJoh` |
| Sui Explorer | `https://suiexplorer.com/txblock/4fMQtu8mFB6jLa5gtSWBsDj3gYp8u9AjQw3xs2VcNJoh?network=testnet` |
| SDK dry-run | Passed. |
| CLI dry-run | Passed. |
| CLI execution | Passed. |
| Real mint count | `1` |

## Post-state readback

| Field | Before | After | Delta |
|---|---:|---:|---:|
| UP position | `0` | `1000` | `1000` |
| DOWN position | `0` | `1000` | `1000` |
| Manager DUSDC balance | `999965` | `998962` | `1003` decrease |

The total manager balance delta matched the total pre-mint quote and the total `PositionMinted` event cost.

## Events and transaction diagnostics

Two `PositionMinted` events were emitted.

| Event | Direction | Strike | Quantity | Cost | Ask price |
|---|---|---:|---:|---:|---:|
| `PositionMinted[0]` | UP | `76803000000000` | `1000` | `498` | `498295523` |
| `PositionMinted[1]` | DOWN | `76705000000000` | `1000` | `505` | `505841622` |

Event fields matched the controlled sender, controlled manager, selected oracle, expiry, DUSDC quote asset, and selected UP/DOWN strikes. The source-confirmed mint path recomputes cost after inserting each leg's exposure, so individual leg costs can differ from the pre-mint quote while the observed total remains the validation target.

## Outcome

`DeepVol BTC two-leg binary mint validated on Testnet`.

The gas blocker is resolved for the controlled two-leg path by using a `200000000` MIST gas budget. Future production mints still require fresh quote, manager balance, gas balance, transaction-shape assertion, devInspect, SDK or wallet dry-run, and wallet approval gates.

## Follow-up

- Keep binary redeem validation pending.
- DeepVol-3 adds a local-only `VolSeries` / non-custodial `MoveReceipt` skeleton and does not rerun this successful binary mint.
- DeepVol-3 does not wrap the binary mint on-chain, publish the DeepVol package, create real series/receipts, or submit transactions.
- Implement on-chain DeepVol receipt creation only after preserving the same fresh two-leg mint gates in SDK/UI builders.
- Keep Create Fee routing and receipt minting as a separate future transaction-composition task.
- Preserve the rule that quote success and `devInspect` success alone do not prove executable mint submission.
