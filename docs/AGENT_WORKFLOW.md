---
Purpose: Operational workflow for agents working on RangePilot.
Audience: AI agents and human reviewers coordinating agent-led implementation.
Status: Generated documentation; approved for current main branch.
Source of truth relationship: Workflow companion to local source docs and official-derived references; does not replace product or protocol authority.
---

# Agent Workflow

This project is documentation-first and source-bounded. Agents must read the right docs before coding, preserve uncertainty, and avoid unauthorized git operations.

## Per-round read order

### Every new round

1. Read root [CLAUDE.md](../CLAUDE.md).
2. Read [ARCHITECTURE_INDEX.md](./ARCHITECTURE_INDEX.md).
3. Read [SOURCE_DOCUMENTS.md](./SOURCE_DOCUMENTS.md).
4. Check current task scope and user constraints.
5. Check worktree status before editing.

### Product or UX tasks

1. Product spec: `Executive Summary`, `Goals and Non-Goals`, `Core User Flows`, `UX Design Principles`, `Page Information Architecture`.
2. [DEEPBOOK_PREDICT_ARCHITECTURE_MAP.md](./DEEPBOOK_PREDICT_ARCHITECTURE_MAP.md).
3. [IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md).

### DeepBook Predict tasks

DeepBook tasks must read all of:

1. [range_pilot_product_architecture_spec.md](./range_pilot_product_architecture_spec.md).
2. [deepbook_predict_模块架构解析.md](./deepbook_predict_模块架构解析.md).
3. [DEEPBOOK_PREDICT_OFFICIAL_CONTRACT_INFO.md](./DEEPBOOK_PREDICT_OFFICIAL_CONTRACT_INFO.md).
4. [ENTRYPOINT_BINDINGS_PLAN.md](./ENTRYPOINT_BINDINGS_PLAN.md) for SDK/PTB/entrypoint work.
5. [DEEPBOOK_PREDICT_ARCHITECTURE_MAP.md](./DEEPBOOK_PREDICT_ARCHITECTURE_MAP.md).
6. [PROTOCOL_INTEGRATION_NOTES.md](./PROTOCOL_INTEGRATION_NOTES.md).

Do this before changing transaction builders, protocol config, quote logic, portfolio reads, vault reads, or chain integration.

For official Testnet config and entrypoint reference, prefer `docs/DEEPBOOK_PREDICT_OFFICIAL_CONTRACT_INFO.md` over older analysis notes. For protocol mental model and invariants, continue to use `docs/deepbook_predict_模块架构解析.md` and `docs/DEEPBOOK_PREDICT_ARCHITECTURE_MAP.md`.

### Agent workflow tasks

1. [AGENT_WORKFLOW.md](./AGENT_WORKFLOW.md).
2. [SKILL_USAGE_GUIDE.md](./SKILL_USAGE_GUIDE.md).
3. Existing ADRs under [ADR](./ADR/).

## Plan Mode norms

Use Plan Mode or an explicit written plan when:

- The task has 3 or more implementation steps.
- The task touches DeepBook Predict write paths.
- The task changes architecture, data flow, or source-of-truth docs.
- The task introduces new dependencies, config, or protocol assumptions.

A good plan must include:

- Scope and non-goals.
- Files expected to change.
- Docs already read.
- Unknowns and `MUST CONFIRM BEFORE CODING` items.
- Test or verification plan.
- Rollback/fallback approach.

Do not use Plan Mode to invent missing protocol facts. If required facts are unknown, stop at a confirmation checklist.

## Git workflow

### Before edits

- Run status to understand tracked, modified, and untracked files.
- Do not assume a clean worktree.
- Identify user-owned changes and avoid overwriting them.

### During edits

- Edit only files in the approved scope.
- Prefer editing existing files unless the task explicitly requires new files.
- Do not touch `.claude/settings.local.json` unless explicitly requested.
- Do not edit `docs/range_pilot_product_architecture_spec.md` or `docs/deepbook_predict_模块架构解析.md` unless explicitly requested.

### Staging and commits

- Do not run `git add`, `git commit`, or `git push` unless the user explicitly asks.
- When commits are requested, stage specific approved files by path.
- Never stage `.claude/settings.local.json` unless the user explicitly requests that exact file.
- Never push unless explicitly requested.

### Dirty worktree rules

If the worktree is dirty:

- Separate user changes from your changes.
- Do not overwrite unrelated modified files.
- Do not clean, reset, restore, or checkout files without explicit permission.
- If generated docs need updates and existing uncommitted edits exist in the same file, read and preserve them or ask for guidance.

## Uncertainty rules

- Unknown details are `TBD`.
- Runtime market state may be marked `MUST CONFIRM AT RUNTIME` if no code decision depends on it yet.
- Chain/deployment and transaction-building details used by code are `MUST CONFIRM BEFORE CODING`.
- Use confirmed Testnet deployment/config values from `docs/DEEPBOOK_PREDICT_OFFICIAL_CONTRACT_INFO.md` and `docs/PROTOCOL_INTEGRATION_NOTES.md`.
- Do not invent package IDs, object IDs, quote asset coin types, oracle IDs, market/expiry values, PredictManager discovery method, Move signatures, key binary layouts, quote preview shape, public server response schemas, or official read server URLs.
- If code requires a concrete value and the value is unknown, stop and ask for confirmation or create a clearly scoped integration spike.
- Do not use fake concrete IDs as examples.
- Prefer local file references and section names over external references in docs.

## DeepBook Predict implementation guardrails

RangePilot may:

- Build guided UX around official protocol calls.
- Build transaction construction wrappers after signatures are confirmed.
- Display official quote/read outputs.
- Normalize read data for portfolio, strategies, history, and vault dashboard.
- Explain protocol outcomes in user language.

RangePilot must not:

- Reimplement DeepBook Predict pricing.
- Reimplement oracle settlement.
- Reimplement vault risk or StrikeMatrix logic.
- Define custom payout rules.
- Present itself as ML inference or an AI trading bot.
- Treat the public server as a transaction write path.
- Present PredictManager positions or ranges as NFTs.

## ADR conditions

Create or update an ADR when a task decides any of:

- Protocol integration architecture.
- Read model/indexer strategy.
- Transaction builder architecture.
- On-chain vs off-chain creator strategy storage.
- Fee routing approach.
- Dependency or framework selection.
- Any decision expensive to reverse.

Do not create an ADR for obvious implementation details or temporary debugging notes.

ADR requirements:

- Store under `docs/ADR/` with sequential numbering.
- Include Status, Date, Context, Decision, Alternatives, Consequences, and Follow-up requirements.
- Reference local source docs by path and section name.
- Mark unresolved chain details as `TBD` / `MUST CONFIRM BEFORE CODING`.

## Completion report

At the end of a round, report:

- Files changed, with absolute paths.
- What was done.
- Verification performed.
- Remaining concerns or `TBD` items.
- Whether git staging/commit/push was intentionally skipped.
