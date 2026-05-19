---
Purpose: Record DeepVol-3 local contract build and validation scope.
Audience: Move developers, SDK implementers, reviewers, and AI agents.
Status: DeepVol-3 local validation checklist.
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

This validation is local-only:

- Sui Move build for `move/deepvol`.
- Sui Move tests for `move/deepvol`.
- TypeScript typecheck for the workspace.
- Web app build regression check.
- Existing RangePilot Move build/test regression checks.

## Explicit non-actions

DeepVol-3 does not perform any chain write:

- no package was published;
- no real `VolSeries` object was created;
- no real `MoveReceipt` object was minted;
- no real transaction was submitted;
- no DeepBook Predict binary mint was rerun;
- no binary redeem was executed;
- no RangePilot wrapper follow was executed;
- no ProtocolVault withdrawal or supply action was executed.

## Prior binary primitive evidence

The previous controlled Testnet binary mint digest remains the evidence for the BTC MOVE primitive:

```text
4fMQtu8mFB6jLa5gtSWBsDj3gYp8u9AjQw3xs2VcNJoh
```

That transaction validated:

- UP binary leg quantity `1000`;
- DOWN binary leg quantity `1000`;
- total quoted premium `1003` atomic DUSDC;
- direct `predict_manager::position` readback for both legs;
- manager DUSDC balance delta matching the total premium.

The `200000000` MIST gas finding from DeepVol-2-fix is relevant for future atomic PTBs that compose both binary mints, fee routing, and receipt creation. It is not used by local Move tests.

## Expected result

Success means the local contract skeleton compiles, tests pass, TypeScript exports resolve, and existing RangePilot regressions remain green. It does not mean the DeepVol package has been deployed or that receipt creation has been validated on-chain.
