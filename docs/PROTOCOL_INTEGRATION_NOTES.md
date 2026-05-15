---
Purpose: Track confirmed DeepBook Predict integration values and remaining runtime details for RangePilot.
Audience: Protocol integrators, transaction-builder authors, frontend developers, and AI agents.
Status: Updated with confirmed official DeepBook Predict Testnet values.
Source of truth relationship: Deployment values in this file are confirmed for the official Testnet setup and source branch listed below; runtime market state, response schemas, and exact generated-binding call shapes still require confirmation.
---

# Protocol Integration Notes

This document records the DeepBook Predict Testnet configuration RangePilot should use for the first protocol integration spike. Confirmed deployment/config values may be copied into environment-specific config code. Runtime market state, server response schemas, and transaction behavior still require live validation before user-facing trading is considered complete.

For the detailed official-derived reference, see [DEEPBOOK_PREDICT_OFFICIAL_CONTRACT_INFO.md](./DEEPBOOK_PREDICT_OFFICIAL_CONTRACT_INFO.md). For SDK/PTB entrypoint tracking, see [ENTRYPOINT_BINDINGS_PLAN.md](./ENTRYPOINT_BINDINGS_PLAN.md).

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

## Runtime-confirmation table

These items remain `TBD` because they depend on live server data, chain state, object layout, generated bindings, event schemas, or a real transaction attempt.

| Topic | Current value | Coding status | Confirmation source needed | Notes |
|---|---|---|---|---|
| Active oracle IDs | TBD | MUST CONFIRM BEFORE CODING | Public server, chain state, or generated bindings | Required before selecting the first market. |
| Active underlying assets | TBD | MUST CONFIRM BEFORE CODING | Public server or chain state | Do not hardcode until confirmed for the active Testnet deployment. |
| Expiry list | TBD | MUST CONFIRM BEFORE CODING | Public server or chain state | Do not hardcode until confirmed for the active Testnet deployment. |
| Strike grid | TBD | MUST CONFIRM BEFORE CODING | Public server, `OracleConfig`, generated bindings, or chain state | Required for range input validation. |
| Oracle freshness | TBD | MUST CONFIRM BEFORE CODING | Public server, events/checkpoints, direct object reads, or generated bindings | Required before mint eligibility and stale-market UX. |
| Ask bounds | TBD | MUST CONFIRM BEFORE CODING | Public server `/oracles/:oracle_id/ask-bounds`, direct object reads, or generated bindings | Required before quote warning and mint eligibility. |
| Public server response schemas | TBD | MUST CONFIRM BEFORE CODING | Live server responses and schema capture | Do not write final TypeScript response types until captured. |
| PredictManager discovery strategy | TBD | MUST CONFIRM BEFORE CODING | Generated bindings, object ownership pattern, event schema, public server support, or local post-create storage | Must decide owner query, event lookup, registry pattern, or local post-create storage. |
| Portfolio direct read strategy | TBD | MUST CONFIRM BEFORE CODING | Direct object read layout, dynamic field/table reads, public server, or events/checkpoints | Wallet-critical state should prefer direct reads where practical. |
| Exact generated-binding/PTB call shapes | TBD | MUST CONFIRM BEFORE CODING | Pinned source branch, generated bindings, devInspect, and real Testnet transaction attempts | Required before SDK/PTB implementation. |
| First real `mint_range<DUSDC>` transaction validation | TBD | MUST CONFIRM BEFORE CODING | Testnet transaction execution and post-transaction readback | Must prove the end-to-end flow before broader MVP work. |

## Confirmed entrypoint plan

Use the official Testnet package/config above and confirm exact generated binding call shapes from source branch `predict-testnet-4-16` before wiring code. Do not hand-write unverified Move signatures. Detailed argument tracking lives in [ENTRYPOINT_BINDINGS_PLAN.md](./ENTRYPOINT_BINDINGS_PLAN.md).

| Order | Entrypoint / helper | Product purpose | Status |
|---:|---|---|---|
| 1 | `create_manager` | Create the user-facing Predict Account | Confirmed entrypoint role; exact transaction builder call shape must use confirmed bindings |
| 2 | `predict_manager::deposit<DUSDC>` | Deposit DUSDC into the Predict Account | Confirmed entrypoint role; coin selection/splitting must be validated in the transaction builder |
| 3 | `predict_manager::balance<DUSDC>` | Read deposited DUSDC balance | Confirmed read-helper role; direct read/devInspect strategy must be validated |
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
