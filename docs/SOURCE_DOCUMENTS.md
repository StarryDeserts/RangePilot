---
Purpose: Define authority boundaries for RangePilot source documents and official-derived integration references.
Audience: Developers, reviewers, and AI agents deciding what can be inferred from local docs.
Status: Generated documentation; approved for current main branch.
Source of truth relationship: Companion guide to local source-of-truth docs and official-derived references; does not supersede them.
---

# Source Documents

RangePilot uses separate product, protocol-analysis, and official-derived integration references. Generated docs should cite local paths and section names; official URLs are centralized in `docs/DEEPBOOK_PREDICT_OFFICIAL_CONTRACT_INFO.md`.

## Authority boundaries

| Document | Can justify | Cannot justify |
|---|---|---|
| [range_pilot_product_architecture_spec.md](./range_pilot_product_architecture_spec.md) | Product identity, business model, UX requirements, MVP priorities, page structure, suggested engineering modules, user flows, demo priorities | Concrete chain deployment values, exact Move signatures, generated TypeScript binding names, object IDs, official read server URL, market availability |
| [deepbook_predict_模块架构解析.md](./deepbook_predict_模块架构解析.md) | DeepBook Predict mental model, object responsibilities, protocol invariants, read/write surface categories, non-ML meaning of `predict`, source-path map from the analyzed upstream code | Current package IDs, current deployed shared object IDs, exact current entrypoint signatures, generated binding APIs, live market/expiry/oracle state, production read server endpoint |
| [DEEPBOOK_PREDICT_OFFICIAL_CONTRACT_INFO.md](./DEEPBOOK_PREDICT_OFFICIAL_CONTRACT_INFO.md) | Official-derived Testnet package/config/object values, public server endpoint paths, entrypoint roles, source branch reference, and integration guardrails | Active runtime oracle IDs, market/expiry/strike availability, public server response schemas, exact generated binding/PTB call shapes, production/Mainnet values |
| [ENTRYPOINT_BINDINGS_PLAN.md](./ENTRYPOINT_BINDINGS_PLAN.md) | SDK/PTB entrypoint inspection checklist and planned binding targets | Final Move signatures, generated TypeScript APIs, confirmed PTB argument order, event field schemas, or validated transaction behavior |

## Product source of truth

`docs/range_pilot_product_architecture_spec.md` is authoritative for:

- RangePilot positioning: guided prediction terminal and creator strategy layer for DeepBook Predict.
- Primary MVP: guided SUI range prediction.
- Secondary MVP: creator strategy follow page.
- Tertiary MVP: vault / LP dashboard.
- UX principle: hide protocol complexity, not protocol truth.
- Engineering principle: isolate transaction construction in an SDK layer.
- Read strategy: combine official read model/server if available, Sui events/checkpoints, and direct object reads for wallet-critical state.
- Non-goals: no custom pricing engine, custom oracle, custom vault, or custom prediction protocol.

It cannot confirm deployment or transaction-building details. Treat examples in the product spec as product examples unless independently confirmed.

## Protocol-understanding source of truth

`docs/deepbook_predict_模块架构解析.md` is authoritative for:

- DeepBook `predict` means an expiry-based prediction market protocol, not ML inference.
- Core objects and responsibilities: `Predict`, `PredictManager`, `OracleSVI`, `OracleConfig`, `Vault`, `StrikeMatrix`, `MarketKey`, `RangeKey`, `PLP`.
- `PredictManager` is the user-facing Predict Account: quote balance plus internal position/range-position tables.
- Positions and range positions are not independent objects.
- Range settlement uses `(lower, upper]` and requires lower < higher.
- Post-trade pricing invariant: mint inserts before pricing; redeem removes before pricing.
- Read surfaces: official read model/server if available, Sui events/checkpoints, direct object reads for wallet-critical state.

It cannot confirm current on-chain deployment facts or exact generated bindings for this repository.

## Official-derived contract/config reference

`docs/DEEPBOOK_PREDICT_OFFICIAL_CONTRACT_INFO.md` is the local official-derived integration reference for the current DeepBook Predict Testnet setup. Use it for:

- Testnet network and public server URL.
- Predict package, registry, and object IDs.
- DUSDC coin type, currency ID, and decimals.
- PLP coin type.
- Public server endpoint paths.
- Source branch `predict-testnet-4-16`.
- Entry point roles that must be bound or inspected.

If the official-derived contract info conflicts with older local protocol analysis on current Testnet config or entrypoint reference, prefer the official-derived contract info. If generated bindings, pinned source inspection, devInspect, or real Testnet transaction results conflict with either doc, stop and reconcile before coding.

## Must confirm from generated bindings, live server, or chain state

Static Testnet deployment values are confirmed in `docs/DEEPBOOK_PREDICT_OFFICIAL_CONTRACT_INFO.md` and `docs/PROTOCOL_INTEGRATION_NOTES.md`. The following remain `TBD` or `MUST CONFIRM BEFORE CODING` until validated from the listed sources.

| Detail | Confirmation source needed |
|---|---|
| Active oracle IDs | Official public server or chain state |
| Active underlying assets | Official public server or chain state |
| Expiry values | Official public server or chain state |
| Strike grid | Official public server, `OracleConfig`, generated bindings, or chain state |
| Oracle freshness rules and current freshness | Official public server, events/checkpoints, or direct object reads |
| Ask bounds | Official public server or direct object reads |
| PredictManager discovery method | Official docs, generated bindings, event schema, public server behavior, local post-create storage, or chain object ownership pattern |
| Public server response schemas | Live server calls and schema capture |
| `create_manager` exact generated binding/PTB shape | Generated bindings, Move source for the exact target version, or devInspect |
| `deposit<T>` exact generated binding/PTB shape | Generated bindings, Move source for the exact target version, or devInspect |
| `balance<T>` exact read/devInspect shape | Generated bindings, Move source for the exact target version, or devInspect |
| `mint_range` params and PTB construction | Generated bindings, Move source for the exact target version, devInspect, and real Testnet transaction |
| `redeem_range` params and PTB construction | Generated bindings, Move source for the exact target version, devInspect, and real Testnet transaction |
| `supply` / `withdraw` params and PTB construction | Generated bindings, Move source for the exact target version, devInspect, and real Testnet transaction |
| `MarketKey` binary or constructed layout | Generated bindings or Move source for the exact target version |
| `RangeKey` binary or constructed layout | Generated bindings or Move source for the exact target version |
| Quote preview return shape | Official read model/server docs, generated bindings, devInspect, or dry-run result analysis |

## Local citation policy

Use local file references and section names in generated docs:

- `docs/range_pilot_product_architecture_spec.md`, section `DeepBook Predict Integration Principles`.
- `docs/deepbook_predict_模块架构解析.md`, section `核心抽象与数据流`.
- `docs/DEEPBOOK_PREDICT_OFFICIAL_CONTRACT_INFO.md`, section `Confirmed Testnet Deployment Values`.
- `docs/ENTRYPOINT_BINDINGS_PLAN.md`, section `Entrypoint Bindings Plan`.

Do not scatter external URLs across generated docs. Keep primary official links in `docs/DEEPBOOK_PREDICT_OFFICIAL_CONTRACT_INFO.md` and cite that local file elsewhere.

## Unknowns policy

- Unknown detail: `TBD`.
- Runtime market state detail: `MUST CONFIRM AT RUNTIME` where no coding decision depends on it yet.
- Chain/deployment or transaction-building detail used by code: `MUST CONFIRM BEFORE CODING`.
- If a source doc suggests a path but not a confirmed current value, keep it as an assumption to validate.
- If docs conflict with generated bindings or chain state, stop and request confirmation before coding.
