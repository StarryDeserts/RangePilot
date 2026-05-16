---
Purpose: Track confirmed DeepBook Predict integration values and remaining runtime details for RangePilot.
Audience: Protocol integrators, transaction-builder authors, frontend developers, and AI agents.
Status: Updated with confirmed official DeepBook Predict Testnet values.
Source of truth relationship: Deployment values in this file are confirmed for the official Testnet setup and source branch listed below; runtime market state, response schemas, and exact generated-binding call shapes still require confirmation.
---

# Protocol Integration Notes

This document records the DeepBook Predict Testnet configuration RangePilot should use for the first protocol integration spike. Confirmed deployment/config values may be copied into environment-specific config code. Runtime market state, server response schemas, and transaction behavior still require live validation before user-facing trading is considered complete.

For the detailed official-derived reference, see [DEEPBOOK_PREDICT_OFFICIAL_CONTRACT_INFO.md](./DEEPBOOK_PREDICT_OFFICIAL_CONTRACT_INFO.md). For Phase 1B wallet and Predict Account flow details, see [PREDICT_MANAGER_FLOW.md](./PREDICT_MANAGER_FLOW.md). For the Phase 1B-Verify local signer validation report, see [PREDICT_MANAGER_TESTNET_VALIDATION.md](./PREDICT_MANAGER_TESTNET_VALIDATION.md). For SDK/PTB entrypoint tracking, see [ENTRYPOINT_BINDINGS_PLAN.md](./ENTRYPOINT_BINDINGS_PLAN.md).

## Confirmed official Testnet configuration

| Topic | Confirmed value | Status | Source / notes |
|---|---|---|---|
| Network | Testnet | Confirmed | Official DeepBook Predict Testnet configuration |
| Public server | `https://predict-server.testnet.mystenlabs.com` | Confirmed | Official public read server for Testnet; not a write path |
| Source branch | `predict-testnet-4-16` | Confirmed | Use this branch as the source reference for bindings/signature confirmation |
| Predict package | `0xf5ea2b3749c65d6e56507cc35388719aadb28f9cab873696a2f8687f5c785138` | Confirmed | Store in protocol config, not UI components |
| Predict registry | `0x43af14fed5480c20ff77e2263d5f794c35b9fab7e2212903127062f4fe2a6e64` | Confirmed | Store in protocol config, not UI components |
| Predict object | `0xc8736204d12f0a7277c86388a68bf8a194b0a14c5538ad13f22cbd8e2a38028a` | Confirmed | Store in protocol config, not UI components |
| DUSDC coin type | `0xe95040085976bfd54a1a07225cd46c8a2b4e8e2b6732f140a0fc49850ba73e1a::dusdc::DUSDC` | Confirmed | Quote asset for the Testnet integration spike |
| DUSDC Currency ID | `0xf3000dff421833d4bb8ed58fac146d691a3aaba2785aa1989af65a7089ca3e9c` | Confirmed | Store with quote asset config |
| DUSDC decimals | `6` | Confirmed | Matches protocol quote-asset decimal constraint |
| PLP coin type | `0xf5ea2b3749c65d6e56507cc35388719aadb28f9cab873696a2f8687f5c785138::plp::PLP` | Confirmed | Required for later vault / LP dashboard work |

## Phase 1A public server discovery

RangePilot Phase 1A added centralized static Testnet config in code, a read-only public server client, a repeatable discovery script, and compact response-shape docs. The public server remains a read model only and must not be treated as a transaction write path.

| Topic | Phase 1A finding | Coding status | Notes |
|---|---|---|---|
| Public server availability | Required discovery endpoints returned HTTP 200 during the Phase 1A snapshot. | Confirmed snapshot; reconfirm at runtime | See [DEEPBOOK_PREDICT_PUBLIC_SERVER_DISCOVERY.md](./DEEPBOOK_PREDICT_PUBLIC_SERVER_DISCOVERY.md) and [DEEPBOOK_PREDICT_RESPONSE_SHAPES.md](./DEEPBOOK_PREDICT_RESPONSE_SHAPES.md). |
| Active oracle discovery | 5 active BTC oracles were observed. | MUST CONFIRM AT RUNTIME | Oracle IDs are runtime snapshots and must not be static protocol config. |
| Quote asset endpoint | DUSDC only was observed. | Confirmed snapshot; reconfirm before trading | Static DUSDC config remains the confirmed quote asset for the integration spike. |
| Vault summary endpoint | Balance, value, liquidity, supply, and utilization fields were available. | Confirmed snapshot; do not reimplement vault logic | Display only official/read-derived metrics in later UI. |
| Strike metadata | Oracle records exposed `min_strike` and `tick_size`. | MUST CONFIRM BEFORE CODING | Full strike-grid validation remains pending. |
| Ask bounds | Endpoint returned HTTP 200, but the selected oracle returned `null`. | MUST CONFIRM BEFORE CODING | `null` ask bounds must not be treated as mint eligibility. |
| Manager and portfolio discovery | Not covered by Phase 1A. | MUST CONFIRM BEFORE CODING | Remains in Phase 1B/1D scope. |
| Quote preview and write PTB shapes | Not validated by Phase 1A. | MUST CONFIRM BEFORE CODING | `get_range_trade_amounts`, `mint_range`, `redeem_range`, and first mint validation remain pending. |

## Phase 1B wallet and Predict Account validation

RangePilot Phase 1B adds a minimal Vite React wallet app and conservative SDK helpers for browser-wallet-only Predict Account setup. Phase 1B-Verify validated the core Sui Testnet `create_manager`, manager ID recovery, small `deposit<DUSDC>`, and known-manager public server summary readback path with a local signer. Browser wallet manual validation remains pending.

| Topic | Phase 1B status | Coding status | Notes |
|---|---|---|---|
| Wallet UI scaffold | Minimal Testnet-only dApp Kit UI exists under `apps/web`. | Scaffolded; browser manual validation pending | Browser wallet confirmation remains the product signing path; no private keys, mnemonics, or CLI signing in the browser app. |
| DUSDC wallet read | SDK paginates DUSDC coin objects and sums atomic balances with `bigint`. | Verified by local signer validation | Uses confirmed DUSDC coin type and 6 decimals. Validation address went from 550 DUSDC before first deposit to 548 DUSDC after two 1 DUSDC deposits. |
| DUSDC coin selection | SDK selects enough DUSDC coin objects for an atomic amount. | Verified by local signer validation | Does not assume a single coin object; insufficient balance returns a user-safe error. |
| PredictManager discovery | Local cache manager ID hint exists; fresh create recovery is verified; general owner discovery remains pending. | Partial / verified post-create recovery | Local cache is only a hint. `/managers/:manager_id/summary` can validate a known manager owner; `/managers` owner filtering remains pending. |
| `create_manager` PTB | SDK builds `<PREDICT_PACKAGE>::predict::create_manager` with no args. | Verified on Testnet | Transaction `DKoSBnKWZGJK6H2RV3yF4pAqSnQ3XncWFfgTsB38pf56` created manager `0x6f341e107a87812fd4fddfc4fc50a7e3ab5bc21cabff2cd39dd86b662fa75599`. |
| `PredictManagerCreated` recovery | Event and object-change recovery helper recovers a unique manager ID. | Verified on Testnet | Recovery source was `event_and_object_change`; ambiguous multiple-object cases abort before deposit. |
| `deposit<DUSDC>` PTB | SDK keeps the browser-safe default blocker but can build a gated Testnet deposit PTB with `allowRealTestnetDeposit`. | Verified on Testnet for local signer validation | Deposit transactions `DeSdTRYKpA1hGEGXSoGGEu4y8nzn8gwcbFjUAs1zRH5M` and `8pQox3ckxD9uyqaYGgzbKgeUBYMv9CrzzMxEQeKwRS1W` each deposited 1 DUSDC. |
| Manager balance read | Public server summary for a known manager ID reports owner and DUSDC balance fields. | Verified known-manager public server read path | After two deposits, `/managers/:manager_id/summary` reported `balances[0].balance = 2000000`, `trading_balance = 2000000`, and `account_value = 2000000`. Direct `balance<DUSDC>` devInspect helper remains pending. |
| Range minting | Not implemented. | Out of Phase 1B scope | Next Phase 1C covers range quote and first `mint_range<DUSDC>` after remaining browser/readback blockers clear. |

## Runtime-confirmation table

These items remain `TBD` because they depend on live server data, chain state, object layout, generated bindings, event schemas, or a real transaction attempt.

| Topic | Current value | Coding status | Confirmation source needed | Notes |
|---|---|---|---|---|
| Active oracle IDs | Runtime snapshot observed 5 active BTC oracles | MUST CONFIRM AT RUNTIME / MUST CONFIRM BEFORE CODING | Public server, chain state, or generated bindings | Required before selecting the first market; do not hardcode as static config. |
| Active underlying assets | Runtime snapshot observed BTC only | MUST CONFIRM AT RUNTIME / MUST CONFIRM BEFORE CODING | Public server or chain state | No active SUI market was observed in the Phase 1A snapshot; do not hardcode until confirmed for the active Testnet deployment. |
| Expiry list | Runtime snapshot observed 5 active BTC expiries | MUST CONFIRM AT RUNTIME / MUST CONFIRM BEFORE CODING | Public server or chain state | Do not hardcode until confirmed for the active Testnet deployment. |
| Strike grid | `min_strike` and `tick_size` observed | MUST CONFIRM BEFORE CODING | Public server, `OracleConfig`, generated bindings, or chain state | Required for range input validation; full grid semantics remain pending. |
| Oracle freshness | TBD | MUST CONFIRM BEFORE CODING | Public server, events/checkpoints, direct object reads, or generated bindings | Required before mint eligibility and stale-market UX. |
| Ask bounds | Selected oracle returned `null` | MUST CONFIRM BEFORE CODING | Public server `/oracles/:oracle_id/ask-bounds`, direct object reads, or generated bindings | Endpoint exists, but usable bounds remain pending before quote warning and mint eligibility. |
| Public server response schemas | Phase 1A snapshot documented | MUST CONFIRM AT RUNTIME | Live server responses and schema capture | Conservative TypeScript response types are in `packages/types`; final UI assumptions still require runtime confirmation. |
| PredictManager discovery strategy | Post-create event/object-change recovery is verified; known-manager public server summary validates owner; general owner discovery remains pending | Partial / MUST CONFIRM BEFORE CODING | Public server `/managers`, event scan filters, direct object ownership pattern | Local storage is not authoritative; owner query and historical event lookup remain pending. |
| Portfolio direct read strategy | Known-manager public server summary reports manager owner and DUSDC balances | Partial / direct read still MUST CONFIRM BEFORE CODING | Direct object read layout, dynamic field/table reads, public server, or events/checkpoints | Public server summary can display known manager balance; wallet-critical direct `balance<DUSDC>` helper remains pending. |
| Exact generated-binding/PTB call shapes | `create_manager` and gated `deposit<DUSDC>` PTBs validated on Testnet; range write shapes remain TBD | Partial / MUST CONFIRM BEFORE CODING for range writes | Pinned source branch, generated bindings, devInspect, and real Testnet transaction attempts | Required before Phase 1C mint implementation. |
| First real `mint_range<DUSDC>` transaction validation | TBD | MUST CONFIRM BEFORE CODING | Testnet transaction execution and post-transaction readback | Must prove the end-to-end flow before broader MVP work. |

## Confirmed entrypoint plan

Use the official Testnet package/config above and confirm exact generated binding call shapes from source branch `predict-testnet-4-16` before wiring code. Do not hand-write unverified Move signatures. Detailed argument tracking lives in [ENTRYPOINT_BINDINGS_PLAN.md](./ENTRYPOINT_BINDINGS_PLAN.md).

| Order | Entrypoint / helper | Product purpose | Status |
|---:|---|---|---|
| 1 | `create_manager` | Create the user-facing Predict Account | Verified on Testnet with transaction `DKoSBnKWZGJK6H2RV3yF4pAqSnQ3XncWFfgTsB38pf56`; manager ID recovery source `event_and_object_change` |
| 2 | `predict_manager::deposit<DUSDC>` | Deposit DUSDC into the Predict Account | Verified on Testnet through gated local signer validation; browser builder remains guarded until manual wallet validation |
| 3 | `predict_manager::balance<DUSDC>` | Read deposited DUSDC balance | Public server summary readback verified for known manager IDs; direct read/devInspect strategy still pending |
| 4 | `range_key::new` | Construct the range key for lower/upper strikes | Confirmed helper role; strike units and key construction must follow confirmed bindings |
| 5 | `predict::get_range_trade_amounts` | Preview official range trade amounts | Confirmed entrypoint role; response shape must be confirmed before UI mapping |
| 6 | `predict::mint_range<DUSDC>` | Mint the guided range prediction | Confirmed entrypoint role; first real transaction validation remains TBD |
| 7 | `predict::redeem_range<DUSDC>` | Redeem or claim range position through official protocol path | Confirmed entrypoint role; live vs settled behavior must be validated |
| 8 | `predict::supply<DUSDC>` | Supply DUSDC liquidity to the Predict vault | Confirmed entrypoint role; later vault/LP work, not required for core guided range MVP |
| 9 | `predict::withdraw<DUSDC>` | Withdraw DUSDC liquidity by burning PLP | Confirmed entrypoint role; later vault/LP work, not required for core guided range MVP |

## Read surfaces

Use a layered read strategy, with confirmed Testnet server first for market discovery and summaries, and direct chain reads for wallet-critical state once the object layout is confirmed.

| Read surface | Intended use | Status |
|---|---|---|
| Official public server | Markets, expiries, summaries, quote/read data, history where exposed | Base URL and endpoint paths confirmed; response schemas still need integration validation |
| Sui events/checkpoints | History, portfolio fallback, creator stats, oracle freshness stream | Event schema TBD / MUST CONFIRM BEFORE CODING |
| Direct object reads | Wallet-critical state: Predict Account balance, positions, claimability | Layout/read pattern TBD / MUST CONFIRM BEFORE CODING |
| RangePilot cache/API | Product-friendly normalization, creator metadata, optional history cache | Internal design TBD after spike |

## Quote preview policy

Allowed:

- Use `predict::get_range_trade_amounts` through confirmed bindings.
- Use the official public server if it exposes quote data needed by the UI.
- Use dry-run of official transactions if validated and safe.
- Show quote unavailable with clear UX if no reliable official path exists.

Forbidden:

- Custom SVI pricing.
- Custom vault utilization pricing.
- Custom settlement calculation.
- Custom payout engine.

## Configuration policy

Confirmed values above should be centralized in environment-specific protocol config during implementation. UI components must import config and SDK helpers rather than embedding package IDs, object IDs, coin types, or server URLs directly.

Keep runtime values out of static config until confirmed:

- active oracle IDs
- active underlying assets
- expiry list
- strike grid
- oracle freshness
- ask bounds
- user manager discovery result
- portfolio object/table layout assumptions
- public server response schemas

## Integration spike exit report

When Phase 1 completes, update or append findings with:

- Config keys/locations for the confirmed Testnet deployment values.
- Binding/source references from `predict-testnet-4-16` used for each entrypoint.
- Confirmed public server endpoints and response fields used by the app.
- Confirmed read strategy and fallbacks.
- Confirmed quote preview strategy and response mapping.
- First successful `mint_range<DUSDC>` transaction digest or blocker summary.
- Remaining blockers.
- Any ADR needed for architectural decisions.
