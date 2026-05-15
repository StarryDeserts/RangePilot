---
Purpose: Define authority boundaries for RangePilot source documents.
Audience: Developers, reviewers, and AI agents deciding what can be inferred from local docs.
Status: Generated documentation; approved for current main branch.
Source of truth relationship: Companion guide to the two local source-of-truth docs; does not supersede them.
---

# Source Documents

This project currently has two local source-of-truth documents. Generated docs must cite them by local path and section name, not by external URLs.

## Authority boundaries

| Source document | Can justify | Cannot justify |
|---|---|---|
| [range_pilot_product_architecture_spec.md](./range_pilot_product_architecture_spec.md) | Product identity, business model, UX requirements, MVP priorities, page structure, suggested engineering modules, user flows, demo priorities | Concrete chain deployment values, exact Move signatures, generated TypeScript binding names, object IDs, official read server URL, market availability |
| [deepbook_predict_模块架构解析.md](./deepbook_predict_模块架构解析.md) | DeepBook Predict mental model, object responsibilities, protocol invariants, read/write surface categories, non-ML meaning of `predict`, source-path map from the analyzed upstream code | Current package IDs, current deployed shared object IDs, exact current entrypoint signatures, generated binding APIs, live market/expiry/oracle state, production read server endpoint |

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

## Must confirm from official repos, generated bindings, or chain state

Mark these as `TBD` until confirmed. Mark implementation use as `MUST CONFIRM BEFORE CODING`.

| Detail | Confirmation source needed |
|---|---|
| DeepBook Predict package ID | Official deployment docs, generated bindings, or chain state |
| Shared `Predict` object ID | Official deployment docs or chain state |
| Registry object ID, if used | Official deployment docs or chain state |
| Quote asset coin type and decimals | Official deployment docs, chain state, or protocol config object reads |
| Oracle IDs | Official read model/server or chain state |
| Market and expiry values | Official read model/server or chain state |
| PredictManager discovery method | Official docs, generated bindings, event schema, or chain object ownership pattern |
| `create_manager` signature | Generated bindings or Move source for the exact target version |
| `deposit<T>` signature and call path | Generated bindings or Move source for the exact target version |
| `mint_range` params | Generated bindings or Move source for the exact target version |
| `redeem_range` params | Generated bindings or Move source for the exact target version |
| `supply` / `withdraw` params | Generated bindings or Move source for the exact target version |
| `MarketKey` binary layout | Generated bindings or Move source for the exact target version |
| `RangeKey` binary layout | Generated bindings or Move source for the exact target version |
| Quote preview return shape | Official read model/server docs, generated bindings, or dry-run result analysis |
| Official read server URL | Official deployment docs or project configuration |

## Local citation policy

Use local file references and section names:

- `docs/range_pilot_product_architecture_spec.md`, section `DeepBook Predict Integration Principles`.
- `docs/deepbook_predict_模块架构解析.md`, section `核心抽象与数据流`.

Do not add external URLs or copied citation tokens to generated docs. If an external source is needed during implementation, summarize the confirmed fact in the implementation notes with the local confirmation method and keep concrete values in config, not prose docs.

## Unknowns policy

- Unknown detail: `TBD`.
- Chain/deployment or transaction-building detail: `MUST CONFIRM BEFORE CODING`.
- If a source doc suggests a path but not a confirmed current value, keep it as an assumption to validate.
- If docs conflict with generated bindings or chain state, stop and request confirmation before coding.
