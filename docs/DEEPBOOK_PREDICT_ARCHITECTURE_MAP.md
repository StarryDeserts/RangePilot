---
Purpose: Map DeepBook Predict protocol concepts to RangePilot product and engineering concepts.
Audience: Product engineers, protocol integrators, frontend developers, and AI agents.
Status: Generated documentation; approved for current main branch.
Source of truth relationship: Derived from local product/protocol source docs and official-derived integration references; exact coding details defer to confirmed bindings, live server data, and chain state.
---

# DeepBook Predict Architecture Map

RangePilot must make DeepBook Predict usable without rewriting it. This map preserves protocol responsibilities while defining product-facing names.

## Protocol meaning

DeepBook `predict` means an expiry-based prediction market protocol on Sui. It does not mean ML inference, model serving, or AI prediction.

## Confirmed Testnet reference boundary

Static Testnet deployment/config values are confirmed in [DEEPBOOK_PREDICT_OFFICIAL_CONTRACT_INFO.md](./DEEPBOOK_PREDICT_OFFICIAL_CONTRACT_INFO.md) and summarized in [PROTOCOL_INTEGRATION_NOTES.md](./PROTOCOL_INTEGRATION_NOTES.md). Runtime market state, response schemas, and exact generated-binding/PTB call shapes remain pending.

## Object responsibility table

| Object | Protocol responsibility | RangePilot interpretation | Implementation caution |
|---|---|---|---|
| `Predict` | Protocol root object containing vault, configuration, oracle config, PLP treasury, withdrawal limiter, and trading state | Market/protocol root used by transaction builder and read layer | Testnet object ID is confirmed in official contract info; exact PTB call shapes are still `MUST CONFIRM BEFORE CODING` |
| `PredictManager` | User account object holding quote balance and internal `positions` / `range_positions` tables | Predict Account | Discovery method is `TBD`; positions are not independent objects or NFTs |
| `OracleSVI` | Per-underlying/per-expiry oracle and fair-price state | Market oracle state and settlement source | Active oracle IDs, expiry values, and freshness rules are runtime-confirmed values |
| `OracleConfig` | Predict-specific oracle usage rules: grid, liveness/freshness, curve builder, ask bounds | Market constraints and validation source | Do not duplicate grid/freshness/ask-bound logic beyond UI prevalidation |
| `Vault` | Funds and aggregate risk state machine | Liquidity and LP risk backing predictions | Do not reimplement vault risk or exposure logic |
| `StrikeMatrix` | Discrete risk surface for MTM and max payout calculations | Internal protocol risk surface | Do not decode or reproduce unless official bindings/read surfaces require it |
| `MarketKey` | Key for single-leg position data | Single-leg market identifier, not primary MVP focus | Binary or constructed layout is `TBD` and `MUST CONFIRM BEFORE CODING` |
| `RangeKey` | Key for range position data with lower/higher strikes | Range prediction input identifier | Exact constructed/PTB layout is `TBD`; lower < higher; settlement uses `(lower, upper]` |
| `PLP` | Liquidity provider share token | LP share shown in vault dashboard | Testnet PLP coin type is confirmed; supply/withdraw PTB shapes remain pending |

## RangePilot mapping table

| DeepBook Predict concept | RangePilot product surface | User-facing language | Notes |
|---|---|---|---|
| `PredictManager` | Predict Account | “Your Predict Account holds funds and prediction positions for DeepBook Predict.” | Quote balance plus internal position/range-position tables; not position NFTs |
| `RangeKey` | Range prediction input | “SUI settles above lower and at or below upper.” | Use explicit `(lower, upper]` boundary copy |
| Post-trade quote | Quote Preview | “This quote uses post-trade pricing and may include vault utilization impact.” | Mint inserts before pricing; redeem removes before pricing |
| `Vault` metrics | LP dashboard | Vault balance, MTM, max payout, utilization, PLP supply | Display official or read-derived metrics only |
| Events/read model | Portfolio, history, creator stats, indexer | Activity, status, history | Official public server URL and endpoint paths are confirmed; response schemas remain pending |
| Direct object reads | Wallet-critical state | Account balance, positions, claimability | Use direct reads where user funds or actions depend on correctness |
| `OracleSVI` / `OracleConfig` | Market status and validation | Active, stale, pending settlement, settled | Do not invent oracle fallback for payout |
| `PLP` | LP position | Liquidity provider share | Tertiary MVP; supply/withdraw must be confirmed before implementation |

## Required protocol invariants

- `PredictManager` is a user account, not a position object.
- Positions and range positions live inside `PredictManager` tables and are not NFTs.
- Range settlement uses `(lower, upper]`.
- Range input requires lower < higher.
- Mint pricing is post-trade: the new position is inserted before pricing.
- Redeem pricing is post-removal: the position is removed before pricing.
- Official DeepBook Predict pricing, oracle, vault, and settlement logic are authoritative.

## Forbidden rewrites

RangePilot must not implement or substitute:

| Forbidden rewrite | Why forbidden | Allowed alternative |
|---|---|---|
| Custom SVI pricing | Pricing belongs to DeepBook Predict | Call official quote/read/entrypoint path or dry-run official transaction |
| Custom oracle settlement | Settlement belongs to DeepBook Predict oracle lifecycle | Display official oracle and settlement state |
| Custom vault risk engine | Vault/StrikeMatrix logic is protocol responsibility | Read official metrics or show unavailable/TBD |
| Custom `StrikeMatrix` logic | It is an internal protocol risk data structure | Use official read model or confirmed object reads |
| Custom payout rules | Payout must follow protocol settlement | Explain `(lower, upper]` and official settlement source |
| Custom prediction market protocol | RangePilot is a product layer | Build UX, transaction builder, read normalization, and creator surfaces |

## Confirmation table

| Detail | Status | Required confirmation |
|---|---|---|
| Testnet package ID | Confirmed | Official contract info / protocol integration notes |
| Testnet `Predict` object ID | Confirmed | Official contract info / protocol integration notes |
| Testnet registry object ID | Confirmed | Official contract info / protocol integration notes |
| Testnet DUSDC coin type and currency ID | Confirmed | Official contract info / protocol integration notes |
| Testnet DUSDC decimals | Confirmed | Official contract info / protocol integration notes |
| Testnet PLP coin type | Confirmed | Official contract info / protocol integration notes |
| Testnet public server URL | Confirmed | Official contract info / protocol integration notes; server is read model only |
| Active oracle IDs | TBD | MUST CONFIRM BEFORE CODING from public server or chain state |
| Active underlying assets | TBD | MUST CONFIRM BEFORE CODING from public server or chain state |
| Active SUI market/expiry values | TBD | MUST CONFIRM BEFORE CODING from public server or chain state |
| Strike grid | TBD | MUST CONFIRM BEFORE CODING from public server, `OracleConfig`, generated bindings, or chain state |
| Oracle freshness | TBD | MUST CONFIRM BEFORE CODING from public server, events/checkpoints, direct reads, or generated bindings |
| Ask bounds | TBD | MUST CONFIRM BEFORE CODING from public server or direct reads |
| PredictManager discovery method | TBD | MUST CONFIRM BEFORE CODING |
| Public server response schemas | TBD | MUST CONFIRM BEFORE CODING from live server responses |
| `create_manager` exact generated binding/PTB shape | TBD | MUST CONFIRM BEFORE CODING from generated bindings, source branch, devInspect, or transaction attempt |
| `deposit<T>` exact generated binding/PTB shape | TBD | MUST CONFIRM BEFORE CODING from generated bindings, source branch, devInspect, or transaction attempt |
| `mint_range` exact generated binding/PTB shape | TBD | MUST CONFIRM BEFORE CODING from generated bindings, source branch, devInspect, or transaction attempt |
| `redeem_range` exact generated binding/PTB shape | TBD | MUST CONFIRM BEFORE CODING from generated bindings, source branch, devInspect, or transaction attempt |
| `supply` / `withdraw` exact generated binding/PTB shape | TBD | MUST CONFIRM BEFORE CODING from generated bindings, source branch, devInspect, or transaction attempt |
| `RangeKey` binary or constructed layout | TBD | MUST CONFIRM BEFORE CODING from generated bindings or Move source for the exact target version |
| `MarketKey` binary or constructed layout | TBD | MUST CONFIRM BEFORE CODING from generated bindings or Move source for the exact target version |
| Quote preview return shape | TBD | MUST CONFIRM BEFORE CODING from public server, generated bindings, devInspect, or dry-run result analysis |

## Engineering mapping

| RangePilot module | Reads/writes | Source docs to check |
|---|---|---|
| Manager module | Create/load PredictManager, display quote balance, deposit | Product spec `Treat PredictManager as User Account`; official contract info; entrypoint bindings plan |
| Range builder | Lower/upper validation, win condition, RangeKey construction | Product spec `Range Prediction Flow`; protocol analysis `核心抽象与数据流`; entrypoint bindings plan |
| Quote module | Quote preview and warnings | Product spec `Respect Post-Trade Pricing`; protocol analysis `主流程与调用链`; official contract info |
| Trade module | Mint/redeem transaction building | Product spec `Transaction Flows`; protocol analysis `主流程与调用链`; official contract info; entrypoint bindings plan |
| Portfolio module | Active/settled positions, redeem/claim | Product spec `Portfolio Flow`; protocol analysis `PredictManager` notes; protocol integration notes |
| Vault module | LP metrics and optional supply/withdraw | Product spec `LP Flow`; protocol analysis `Vault` / `StrikeMatrix` notes; official contract info |
| Read API/indexer | Markets, expiries, oracle status, history, creator stats | Product spec `Read API / Indexer Architecture`; protocol analysis `配置、依赖与可观测性`; official public server endpoints |
