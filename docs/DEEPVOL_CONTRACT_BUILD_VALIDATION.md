---
Purpose: Record DeepVol Route B contract build and deployment validation scope.
Audience: Move developers, SDK implementers, reviewers, and AI agents.
Status: DeepVol-5 validation checklist; package, DUSDC ProtocolVault, first BTC VolSeries, and first buy_move_receipt<DUSDC> are validated.
---

# DeepVol Contract Build Validation

## Validation commands

Run the local DeepVol contract and workspace checks with:

```bash
npm run move:build:deepvol
npm run move:test:deepvol
npm run typecheck
npm run build:web
npm run move:build:rangepilot
npm run move:test:rangepilot
```

## Scope

This validation covers local contract checks plus the DeepVol-4 post-publish setup state and DeepVol-5 first receipt validation state:

- Sui Move build for `move/deepvol` with DeepBook Predict dependencies.
- Sui Move tests for `move/deepvol` fee, series, vault, and receipt helper behavior.
- TypeScript typecheck for the workspace.
- Web app build regression check.
- Existing RangePilot Move build/test regression checks.
- Sui Testnet object checks for the published DeepVol package, AdminCap, UpgradeCap, and shared `ProtocolVault<DUSDC>`.
- Sui Testnet validation of the first deployed BTC VolSeries and `buy_move_receipt<DUSDC>` transaction.

`npm run move:build:deepvol` typechecks the real `receipt::buy_move_receipt<Quote>` entrypoint against the source-confirmed DeepBook Predict signatures. Local unit tests do not instantiate real DeepBook Predict `Predict`, `PredictManager`, or `OracleSVI` fixtures. DeepVol-4 deployment details are recorded in [DEEPVOL_TESTNET_PUBLISH_RESULT.md](./DEEPVOL_TESTNET_PUBLISH_RESULT.md), and the first deployed receipt execution is recorded in [DEEPVOL_BUY_MOVE_RECEIPT_TESTNET_VALIDATION.md](./DEEPVOL_BUY_MOVE_RECEIPT_TESTNET_VALIDATION.md).

## Explicit non-actions

DeepVol-4 executed only the approved `vault::create_protocol_vault<DUSDC>` setup transaction after Testnet environment/address guardrails and a successful dry-run. It did not execute the receipt or Predict trading paths:

- no `sui client publish` command was run in DeepVol-4;
- no real `VolSeries` object was created in DeepVol-4;
- no real `MoveReceipt` object was minted in DeepVol-4;
- no deployed `receipt::buy_move_receipt<DUSDC>` transaction was executed in DeepVol-4;
- no DeepBook Predict binary mint was rerun in DeepVol-4;
- no binary redeem was executed;
- no RangePilot wrapper follow was executed;
- no ProtocolVault withdrawal or supply action was executed;
- no mainnet transaction was executed.

DeepVol-5 then validated the deployed receipt path with VolSeries digest `JCHonGTMEikMBtxWkZpUbhDWNZjMCoSDJNbRuVBHTLUk` and buy digest `GVyMBH9kB6nTSuWoULFZ5ir3yhFnRC8LNoRz9EEDQXbd`. That round executed one `series::create_series` transaction and one `receipt::buy_move_receipt<DUSDC>` transaction, and it did not execute publish, upgrade, withdrawal, redeem, old RangePilot follow, or mainnet paths.

## Prior binary primitive evidence

The previous controlled Testnet binary mint digest remains evidence for the BTC MOVE primitive only:

```text
4fMQtu8mFB6jLa5gtSWBsDj3gYp8u9AjQw3xs2VcNJoh
```

That transaction validated direct DeepBook Predict UP + DOWN binary minting for one runtime-selected BTC pair. It did not execute DeepVol `buy_move_receipt<Quote>`, did not create a DeepVol receipt, and did not deposit a DeepVol Create Fee.

The `200000000` MIST gas finding from DeepVol-2-fix is relevant for future wallet simulations involving two binary mints plus receipt and fee routing. It is not used by local Move tests.

## Local Route B coverage

Local tests cover:

- Create Fee calculation and max fee bps validation;
- `VolSeries` field storage and validation;
- DeepVol-owned `ProtocolVault<Quote>` creation, deposit, withdrawal, and insufficient-balance aborts;
- `MoveReceipt` storage through a test-only constructor;
- series-derived `up_strike` and `down_strike` metadata;
- receipt status transitions and owner-only settlement marker.

Build coverage confirms the production entrypoint imports and calls:

- `market_key::up`;
- `market_key::down`;
- `predict::get_trade_amounts`;
- `predict::mint<Quote>`;
- `predict_manager::owner`;
- `vault::deposit_create_fee`.

## Expected result

Success means the local Route B contract compiles, tests pass, TypeScript exports resolve, existing RangePilot regressions remain green, the DeepVol-4 Testnet package/AdminCap/UpgradeCap/ProtocolVault object checks pass, and the DeepVol-5 deployed receipt path remains documented with post-state evidence. First deployed `buy_move_receipt<DUSDC>` validation is complete for one runtime-selected BTC series; future buys still require fresh quote, manager balance, fee coin, gas, devInspect, dry-run, and post-state gates.
