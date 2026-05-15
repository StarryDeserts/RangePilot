---
Purpose: Navigation index for RangePilot architecture documentation.
Audience: Developers, product contributors, reviewers, and AI agents.
Status: Generated documentation; approved for current main branch.
Source of truth relationship: Indexes local source-of-truth documents and generated companion docs; does not replace source docs.
---

# Architecture Index

RangePilot is a guided prediction terminal and creator strategy layer for DeepBook Predict. This index tells contributors which documents to read, what each document is allowed to justify, and which rules apply before implementation.

## Source-of-truth documents

| Document | Authority | Use when |
|---|---|---|
| [range_pilot_product_architecture_spec.md](./range_pilot_product_architecture_spec.md) | Product, business, UX, MVP scope, engineering intent | Defining user flows, MVP priorities, product positioning, page structure, transaction lifecycle expectations |
| [deepbook_predict_模块架构解析.md](./deepbook_predict_模块架构解析.md) | Protocol understanding and DeepBook Predict mental model | Mapping protocol objects, preserving pricing/oracle/vault/settlement invariants, understanding read/write surfaces |

Do not edit these source docs for normal implementation tasks unless the user explicitly requests source-doc maintenance.

## Generated documentation set

| Document | Purpose | Category |
|---|---|---|
| [ARCHITECTURE_INDEX.md](./ARCHITECTURE_INDEX.md) | Entry point, reading order, doc map, global rules | Engineering / agent workflow |
| [SOURCE_DOCUMENTS.md](./SOURCE_DOCUMENTS.md) | Authority boundaries and local citation policy | Engineering / protocol |
| [DEEPBOOK_PREDICT_ARCHITECTURE_MAP.md](./DEEPBOOK_PREDICT_ARCHITECTURE_MAP.md) | Protocol object map and RangePilot product mapping | Protocol / product |
| [AGENT_WORKFLOW.md](./AGENT_WORKFLOW.md) | Per-round workflow, Plan Mode, git, uncertainty, ADR rules | Agent workflow |
| [SKILL_USAGE_GUIDE.md](./SKILL_USAGE_GUIDE.md) | Skill selection guide and found/not-found skill inventory | Agent workflow |
| [IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md) | Phased implementation plan from docs to demo polish | Product / engineering |
| [PROTOCOL_INTEGRATION_NOTES.md](./PROTOCOL_INTEGRATION_NOTES.md) | Need-to-confirm protocol integration checklist | Protocol / engineering |
| [ADR/0001-architecture-documentation-first.md](./ADR/0001-architecture-documentation-first.md) | Decision record for documentation-first architecture | ADR |
| [../CLAUDE.md](../CLAUDE.md) | Root guidance for agents working in this repo | Agent workflow |

## Recommended reading order

### First 15 minutes

1. [../CLAUDE.md](../CLAUDE.md)
2. [ARCHITECTURE_INDEX.md](./ARCHITECTURE_INDEX.md)
3. [SOURCE_DOCUMENTS.md](./SOURCE_DOCUMENTS.md)
4. Product spec sections: `Executive Summary`, `Goals and Non-Goals`, `Recommended MVP Decision`, `Final Positioning`

### Before DeepBook Predict work

1. [range_pilot_product_architecture_spec.md](./range_pilot_product_architecture_spec.md)
2. [deepbook_predict_模块架构解析.md](./deepbook_predict_模块架构解析.md)
3. [DEEPBOOK_PREDICT_ARCHITECTURE_MAP.md](./DEEPBOOK_PREDICT_ARCHITECTURE_MAP.md)
4. [PROTOCOL_INTEGRATION_NOTES.md](./PROTOCOL_INTEGRATION_NOTES.md)

### Before UI/product work

1. Product spec sections: `Core User Flows`, `UX Design Principles`, `Page Information Architecture`, `Component Specification`
2. [DEEPBOOK_PREDICT_ARCHITECTURE_MAP.md](./DEEPBOOK_PREDICT_ARCHITECTURE_MAP.md) for protocol naming and boundaries
3. [IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md) for phase scope

### Before agent-led implementation rounds

1. [AGENT_WORKFLOW.md](./AGENT_WORKFLOW.md)
2. [SKILL_USAGE_GUIDE.md](./SKILL_USAGE_GUIDE.md)
3. [PROTOCOL_INTEGRATION_NOTES.md](./PROTOCOL_INTEGRATION_NOTES.md) for any transaction or chain detail

## Documentation categories

| Category | Primary docs |
|---|---|
| Product | Product spec, architecture map, implementation roadmap |
| Protocol | Protocol analysis, source documents, architecture map, protocol integration notes |
| Engineering | Product spec implementation sections, architecture map, implementation roadmap, protocol integration notes |
| Agent workflow | Root `CLAUDE.md`, agent workflow, skill usage guide, source documents |
| ADR | `docs/ADR/0001-architecture-documentation-first.md` |

## Task-to-required-doc map

| Task type | Required docs before work |
|---|---|
| Guided SUI range prediction UI | Product spec, architecture map, implementation roadmap |
| DeepBook Predict transaction builder | Product spec, protocol analysis, architecture map, protocol integration notes |
| PredictManager load/create/deposit | Product spec, protocol analysis, architecture map, protocol integration notes |
| Quote preview | Product spec, protocol analysis, architecture map, protocol integration notes |
| Portfolio/redeem/claim | Product spec, protocol analysis, architecture map, protocol integration notes |
| Creator strategy pages | Product spec, architecture map, implementation roadmap |
| Vault / LP dashboard | Product spec, protocol analysis, architecture map, protocol integration notes |
| New ADR | Agent workflow, source documents, existing ADRs |
| Agent skill selection | Skill usage guide, agent workflow |
| Any git operation | Agent workflow, root `CLAUDE.md` |

## Global anti-invention rules

- Mark unknown details as `TBD`.
- Mark chain/deployment or transaction-building details as `MUST CONFIRM BEFORE CODING`.
- Do not invent package IDs, shared object IDs, quote asset coin type, oracle IDs, market/expiry values, PredictManager discovery method, Move entrypoint signatures, RangeKey/MarketKey binary layout, quote preview return shape, or official read server URL.
- Use local file references and section names only.
- Do not include external URLs or copied web citation tokens in project docs.

## Global no-rewrite rules

RangePilot must use official DeepBook Predict pricing, oracle, vault, and settlement logic.

Do not reimplement:

- pricing or SVI pricing
- oracle settlement
- vault risk logic
- StrikeMatrix logic
- custom payout rules
- custom prediction market protocol behavior

RangePilot may build UX, transaction construction, read normalization, portfolio visualization, creator strategy surfaces, and risk explanations around the official protocol.
