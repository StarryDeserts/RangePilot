---
Purpose: Record the DeepVol Testnet publish and ProtocolVault setup result.
Audience: Move developers, SDK implementers, frontend developers, reviewers, and product leads.
Status: DeepVol-4 record; package and ProtocolVault<DUSDC> are published/configured on Testnet. DeepVol-5 receipt validation is recorded separately.
Source of truth relationship: Records observed Testnet publish and setup facts; Move source, Sui CLI output, and Sui object reads remain authoritative for on-chain state.
---

# DeepVol Testnet Publish Result

## Summary

The DeepVol Route B package was manually published to Sui Testnet on 2026-05-19. DeepVol-4 verified the published package, AdminCap, and UpgradeCap, then created exactly one shared `ProtocolVault<DUSDC>` using the published `deepvol::vault::create_protocol_vault<DUSDC>` entrypoint.

This setup records deployment IDs for the non-custodial but protocol-enforced BTC MOVE receipt path. No `buy_move_receipt`, Predict mint/redeem, withdraw, publish, mainnet, or UI transaction was executed in DeepVol-4.

DeepVol-5 later validated the first deployed `buy_move_receipt<DUSDC>` path with fresh BTC market selection, VolSeries digest `JCHonGTMEikMBtxWkZpUbhDWNZjMCoSDJNbRuVBHTLUk`, buy digest `GVyMBH9kB6nTSuWoULFZ5ir3yhFnRC8LNoRz9EEDQXbd`, receipt `0x6eac478ef6300281093a2301a52b4ee7b272d6b1a76be9e16e63fa43171f6a0f`, and ProtocolVault balance delta `30`; see [DEEPVOL_BUY_MOVE_RECEIPT_TESTNET_VALIDATION.md](./DEEPVOL_BUY_MOVE_RECEIPT_TESTNET_VALIDATION.md).

## Network and publisher

| Item | Value |
|---|---|
| Network | Testnet |
| Active environment before vault creation | `testnet` |
| Publisher / AdminCap owner | `0x4ff903b0dcc52dc8753787baf19b34b7425dfa64d187cc7c726b38413705fa75` |
| Published modules | `errors`, `fees`, `receipt`, `series`, `vault` |
| DUSDC type | `0xe95040085976bfd54a1a07225cd46c8a2b4e8e2b6732f140a0fc49850ba73e1a::dusdc::DUSDC` |

## Publish result

| Item | Value |
|---|---|
| Publish date | 2026-05-19 |
| Publish digest | `3HZ88SZZsUpmgJqxCAqzKxi6ceeD1pkrKXnprDS36DFi` |
| DeepVol package ID | `0xe9b45e8d06406bb935bf5e3260ac9b82491ca158775861660be34881e17a4fa0` |
| AdminCap object ID | `0xa0f062e01af265137324eb26489de788fee443e49376725bed84a877c99318b1` |
| AdminCap owner | `0x4ff903b0dcc52dc8753787baf19b34b7425dfa64d187cc7c726b38413705fa75` |
| UpgradeCap object ID | `0x2b5224c317e2d517bbc7abb47740cce86234399e818077ac50e63e79b0298fc4` |
| UpgradeCap owner | `0x4ff903b0dcc52dc8753787baf19b34b7425dfa64d187cc7c726b38413705fa75` |
| Package object read | Exists on Testnet as an immutable package object. |
| AdminCap object read | Exists on Testnet and is address-owned by the publisher/admin address. |
| UpgradeCap object read | Exists on Testnet, references the DeepVol package, and is address-owned by the publisher/admin address. |

## ProtocolVault<DUSDC> setup

| Item | Value |
|---|---|
| ProtocolVault creation executed | Yes |
| Dry-run digest | `CJpfSyTytkcJLHAiScgazueLJ9h8SpiWPhhEhVZyMbFr` |
| ProtocolVault creation digest | `BXMAz5vN2QUjEkvPANELhLQg7gieUWU2DJKzuXajaAZK` |
| ProtocolVault<DUSDC> object ID | `0x1b9174645d70ac4caa2cfa0db5df59ac78a3ce0d3cca10f8be37e4c5d84f1a09` |
| ProtocolVault type | `0xe9b45e8d06406bb935bf5e3260ac9b82491ca158775861660be34881e17a4fa0::vault::ProtocolVault<0xe95040085976bfd54a1a07225cd46c8a2b4e8e2b6732f140a0fc49850ba73e1a::dusdc::DUSDC>` |
| ProtocolVault owner | Shared object on Testnet. |
| Initial fee balance | Zero immediately after creation. |

## Config updates

`packages/config/src/deepVolTestnet.ts` records the post-publish setup values:

- `DEEPVOL_PACKAGE_ID = "0xe9b45e8d06406bb935bf5e3260ac9b82491ca158775861660be34881e17a4fa0"`
- `DEEPVOL_PROTOCOL_VAULT_ID = "0x1b9174645d70ac4caa2cfa0db5df59ac78a3ce0d3cca10f8be37e4c5d84f1a09"`
- `DEEPVOL_ADMIN_CAP_ID = "0xa0f062e01af265137324eb26489de788fee443e49376725bed84a877c99318b1"`
- `DEEPVOL_UPGRADE_CAP_ID = "0x2b5224c317e2d517bbc7abb47740cce86234399e818077ac50e63e79b0298fc4"`
- `DEEPVOL_PUBLISHER_ADDRESS = "0x4ff903b0dcc52dc8753787baf19b34b7425dfa64d187cc7c726b38413705fa75"`

`AdminCap` and `UpgradeCap` are admin-only deployment/operations objects. Normal user `buy_move_receipt` transaction builders must not require `AdminCap` or `UpgradeCap`.

## Commands used

Safe setup commands included Sui environment/address checks, object reads, the approved dry-run, exactly one Testnet `create_protocol_vault<DUSDC>` write call, repository verification, and git guardrails. The only write transaction in DeepVol-4 was:

```text
0xe9b45e8d06406bb935bf5e3260ac9b82491ca158775861660be34881e17a4fa0::vault::create_protocol_vault<0xe95040085976bfd54a1a07225cd46c8a2b4e8e2b6732f140a0fc49850ba73e1a::dusdc::DUSDC>
```

## Verification status

Object checks confirmed the DeepVol package, AdminCap, UpgradeCap, and `ProtocolVault<DUSDC>` objects exist on Testnet. The `ProtocolVault<DUSDC>` object is shared and has zero initial fee balance.

Repository verification for this config/docs update must pass before final commit:

- `npm run typecheck`
- `npm run build:web`
- `npm run move:build:rangepilot`
- `npm run move:test:rangepilot`
- `npm run move:build:deepvol`
- `npm run move:test:deepvol`

## Security and non-actions

- No wallet recovery phrases, private keys, signatures, or raw transaction bytes were printed or committed.
- `.env.local`, `.env*`, `.local/`, `.claude/`, `.trace/`, `.traces/`, `deepbookv3-predict-package/`, and `deepbookv3-predict-testnet-4-16/` were not read or staged.
- No `sui client publish` command was run in DeepVol-4.
- No `receipt::buy_move_receipt` transaction was executed.
- No DeepBook Predict binary mint or redeem transaction was executed.
- No RangePilot wrapper follow transaction was executed.
- No `withdraw_protocol_fees` transaction was executed.
- No mainnet transaction was executed.
- `move/deepvol/Move.toml` was not modified, restored, or staged.

## DeepVol-5 follow-up

The first deployed `buy_move_receipt<DUSDC>` path has now been validated in [DEEPVOL_BUY_MOVE_RECEIPT_TESTNET_VALIDATION.md](./DEEPVOL_BUY_MOVE_RECEIPT_TESTNET_VALIDATION.md). The validation created VolSeries `0x57878763c144cabe06c86d7e02f168d6b42481d779434d8efc8146a10c1ba885`, minted receipt `0x6eac478ef6300281093a2301a52b4ee7b272d6b1a76be9e16e63fa43171f6a0f`, increased UP and DOWN binary positions by `10000`, recorded actual premium `10029`, and deposited Create Fee `30` into the configured `ProtocolVault<DUSDC>`.

## Next step

Build the wallet-gated DeepVol receipt UX using the validated deployed path while preserving fresh BTC oracle/expiry/strike discovery, UP and DOWN quote previews, manager balance checks, fee coin preparation, full transaction preflight, wallet approval, post-transaction receipt/position/event/fee-vault verification, and explicit non-custodial receipt copy.
