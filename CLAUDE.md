---
Purpose: Root guidance for agents working on RangePilot.
Audience: AI agents and contributors using Claude Code.
Status: Generated documentation; approved for current main branch.
Source of truth relationship: Short operational guide; defers to local product and protocol source docs.
---

# RangePilot Agent Guidance

RangePilot is a guided prediction terminal and creator strategy layer for DeepBook Predict.

## Read first

1. `docs/ARCHITECTURE_INDEX.md`
2. `docs/SOURCE_DOCUMENTS.md`
3. `docs/AGENT_WORKFLOW.md`
4. `docs/PROTOCOL_INTEGRATION_NOTES.md` for any DeepBook Predict integration work

## Source of truth docs

- `docs/range_pilot_product_architecture_spec.md` is the product/business/UX/MVP/engineering source of truth.
- `docs/deepbook_predict_模块架构解析.md` is the protocol-understanding source of truth.

Do not edit those source docs unless explicitly requested.

## Unknowns rule

- Mark unknown details `TBD`.
- Mark chain/deployment or transaction-building details `MUST CONFIRM BEFORE CODING`.
- Do not invent package IDs, object IDs, quote asset coin types, oracle IDs, market/expiry values, Move signatures, key layouts, quote preview shapes, or official read server URLs.

## Git and local settings

- Do not run `git add`, `git commit`, or `git push` unless explicitly requested.
- Do not stage `.claude/settings.local.json` unless explicitly requested.
- Do not edit `.claude/settings.local.json` unless explicitly requested.
