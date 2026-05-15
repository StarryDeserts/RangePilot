---
Purpose: Root guidance for agents working on RangePilot.
Audience: AI agents and contributors using Claude Code.
Status: Generated documentation; approved for current main branch.
Source of truth relationship: Short operational guide; defers to local product/protocol source docs and official-derived integration references.
---

# RangePilot Agent Guidance

RangePilot is a guided prediction terminal and creator strategy layer for DeepBook Predict.

## Read first

1. `docs/ARCHITECTURE_INDEX.md`
2. `docs/SOURCE_DOCUMENTS.md`
3. `docs/AGENT_WORKFLOW.md`
4. `docs/PROTOCOL_INTEGRATION_NOTES.md` for any DeepBook Predict integration work
5. `docs/DEEPBOOK_PREDICT_OFFICIAL_CONTRACT_INFO.md` and `docs/ENTRYPOINT_BINDINGS_PLAN.md` for DeepBook Predict SDK/PTB work

## Source of truth docs

- `docs/range_pilot_product_architecture_spec.md` is the product/business/UX/MVP/engineering source of truth.
- `docs/deepbook_predict_模块架构解析.md` is the protocol-understanding source of truth.
- `docs/DEEPBOOK_PREDICT_OFFICIAL_CONTRACT_INFO.md` is the official-derived Testnet contract/config/endpoint/entrypoint integration reference.

Do not edit the product or protocol-analysis source docs unless explicitly requested.

## Unknowns rule

- Mark unknown details `TBD`.
- Mark runtime market state `MUST CONFIRM AT RUNTIME` when no coding decision depends on it yet.
- Mark chain/deployment or transaction-building details `MUST CONFIRM BEFORE CODING`.
- Do not invent package IDs, object IDs, quote asset coin types, oracle IDs, market/expiry values, Move signatures, key layouts, quote preview shapes, public server response schemas, or official read server URLs.

## Git and local settings

- Do not run `git add`, `git commit`, or `git push` unless explicitly requested.
- Do not stage `.claude/settings.local.json` unless explicitly requested.
- Do not edit `.claude/settings.local.json` unless explicitly requested.
