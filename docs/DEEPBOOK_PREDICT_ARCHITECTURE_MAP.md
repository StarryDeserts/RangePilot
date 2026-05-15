---
Purpose: Map DeepBook Predict protocol concepts to RangePilot product and engineering concepts.
Audience: Product engineers, protocol integrators, frontend developers, and AI agents.
Status: Generated documentation; approved for current main branch.
Source of truth relationship: Derived from local product and protocol source docs; protocol facts defer to source docs and confirmed bindings/chain state.
---

# DeepBook Predict Architecture Map

RangePilot must make DeepBook Predict usable without rewriting it. This map preserves protocol responsibilities while defining product-facing names.

## Protocol meaning

DeepBook `predict` means an expiry-based prediction market protocol on Sui. It does not mean ML inference, model serving, or AI prediction.

## Object responsibility table

| Object | Protocol responsibility | RangePilot interpretation | Implementation caution |
|---|---|---|---|
| `Predict` | Protocol root object containing vault, configuration, oracle config, PLP treasury, withdrawal limiter, and trading state | Market/protocol root used by transaction builder and read layer | Shared object ID is `TBD` and `MUST CONFIRM BEFORE CODING` |
| `PredictManager` | User account object holding quote balance and internal `positions` / `range_positions` tables | Predict Account | Discovery method is `TBD`; positions are not independent objects |
| `OracleSVI` | Per-underlying/per-expiry oracle and fair-price state | Market oracle state and settlement source | Oracle IDs, expiry values, and freshness rules are `TBD` for deployment |
| `OracleConfig` | Predict-specific oracle usage rules: grid, liveness/freshness, curve builder, ask bounds | Market constraints and validation source | Do not duplicate grid/freshness logic beyond UI prevalidation |
| `Vault` | Funds and aggregate risk state machine | Liquidity and LP risk backing predictions | Do not reimplement vault risk or exposure logic |
| `StrikeMatrix` | Discrete risk surface for MTM and max payout calculations | Internal protocol risk surface | Do not decode or reproduce unless official bindings/read surfaces require it |
| `MarketKey` | Key for single-leg position data | Single-leg market identifier, not primary MVP focus | Binary layout is `TBD` and `MUST CONFIRM BEFORE CODING` |
| `RangeKey` | Key for range position data with lower/higher strikes | Range prediction input identifier | Binary layout is `TBD`; lower < higher; settlement uses `(lower, upper]` |
| `PLP` | Liquidity provider share token | LP share shown in vault dashboard | Supply/withdraw signatures and PLP config are `TBD` |

## RangePilot mapping table

| DeepBook Predict concept | RangePilot product surface | User-facing language | Notes |
|---|---|---|---|
| `PredictManager` | Predict Account | “Your Predict Account holds funds and prediction positions for DeepBook Predict.” | Quote balance plus internal position/range-position tables |
| `RangeKey` | Range prediction input | “SUI settles above lower and at or below upper.” | Use explicit `(lower, upper]` boundary copy |
| Post-trade quote | Quote Preview | “This quote uses post-trade pricing and may include vault utilization impact.” | Mint inserts before pricing; redeem removes before pricing |
| `Vault` metrics | LP dashboard | Vault balance, MTM, max payout, utilization, PLP supply | Display official or read-derived metrics only |
| Events/read model | Portfolio, history, creator stats, indexer | Activity, status, history | Prefer official read model/server if available; fallback to Sui events/checkpoints |
| Direct object reads | Wallet-critical state | Account balance, positions, claimability | Use direct reads where user funds or actions depend on correctness |
| `OracleSVI` / `OracleConfig` | Market status and validation | Active, stale, pending settlement, settled | Do not invent oracle fallback for payout |
| `PLP` | LP position | Liquidity provider share | Tertiary MVP; must be confirmed before implementing supply/withdraw |

## Required protocol invariants

- `PredictManager` is a user account, not a position object.
- Positions and range positions live inside `PredictManager` tables.
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

## Unknowns table

| Unknown | Status | Required confirmation |
|---|---|---|
| Package IDs | TBD | MUST CONFIRM BEFORE CODING from official deployment source or chain state |
| Shared object IDs | TBD | MUST CONFIRM BEFORE CODING |
| Quote asset coin type | TBD | MUST CONFIRM BEFORE CODING |
| Quote asset decimals for active deployment | TBD | MUST CONFIRM BEFORE CODING |
| Oracle IDs | TBD | MUST CONFIRM BEFORE CODING |
| Active SUI market/expiry values | TBD | MUST CONFIRM BEFORE CODING |
| PredictManager discovery method | TBD | MUST CONFIRM BEFORE CODING |
| `create_manager` exact signature | TBD | MUST CONFIRM BEFORE CODING |
| `deposit<T>` exact signature and module path | TBD | MUST CONFIRM BEFORE CODING |
| `mint_range` exact params | TBD | MUST CONFIRM BEFORE CODING |
| `redeem_range` exact params | TBD | MUST CONFIRM BEFORE CODING |
| `supply` / `withdraw` exact params | TBD | MUST CONFIRM BEFORE CODING |
| `RangeKey` binary layout | TBD | MUST CONFIRM BEFORE CODING |
| `MarketKey` binary layout | TBD | MUST CONFIRM BEFORE CODING |
| Quote preview return shape | TBD | MUST CONFIRM BEFORE CODING |
| Official read server URL | TBD | MUST CONFIRM BEFORE CODING |

## Engineering mapping

| RangePilot module | Reads/writes | Source docs to check |
|---|---|---|
| Manager module | Create/load PredictManager, display quote balance, deposit | Product spec `Treat PredictManager as User Account`; protocol analysis `核心抽象与数据流` |
| Range builder | Lower/upper validation, win condition, RangeKey construction | Product spec `Range Prediction Flow`; protocol analysis `核心抽象与数据流` |
| Quote module | Quote preview and warnings | Product spec `Respect Post-Trade Pricing`; protocol analysis `主流程与调用链` |
| Trade module | Mint/redeem transaction building | Product spec `Transaction Flows`; protocol analysis `主流程与调用链` |
| Portfolio module | Active/settled positions, redeem/claim | Product spec `Portfolio Flow`; protocol analysis `PredictManager` notes |
| Vault module | LP metrics and optional supply/withdraw | Product spec `LP Flow`; protocol analysis `Vault` / `StrikeMatrix` notes |
| Read API/indexer | Markets, expiries, oracle status, history, creator stats | Product spec `Read API / Indexer Architecture`; protocol analysis `配置、依赖与可观测性` |
