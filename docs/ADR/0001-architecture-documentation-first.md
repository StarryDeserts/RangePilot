---
Purpose: Record the decision to establish architecture documentation before implementation.
Audience: Project maintainers, contributors, reviewers, and AI agents.
Status: Accepted ADR.
Source of truth relationship: Decision record derived from local product and protocol source docs; does not replace those source docs.
---

# ADR-0001: Architecture documentation first

## Status

Accepted

## Date

2026-05-15

## Context

RangePilot is a guided prediction terminal and creator strategy layer for DeepBook Predict. The local product source doc defines the product, business, UX, MVP, and engineering direction. The local protocol analysis explains that DeepBook `predict` is an expiry-based prediction market protocol, not ML inference, and maps key objects such as `Predict`, `PredictManager`, `OracleSVI`, `OracleConfig`, `Vault`, `StrikeMatrix`, `MarketKey`, `RangeKey`, and `PLP`.

The project has a high risk of accidental invention because implementation needs concrete chain/deployment and transaction-building details that are not confirmed in local docs:

- package IDs
- shared object IDs
- quote asset coin type
- oracle IDs
- market/expiry values
- PredictManager discovery method
- Move entrypoint signatures
- key binary layouts
- quote preview return shape
- official read server URL

RangePilot must also preserve a strict protocol boundary: it uses official DeepBook Predict pricing, oracle, vault, and settlement logic, and must not reimplement pricing, oracle settlement, vault risk, StrikeMatrix logic, or custom payout rules.

## Decision

Adopt a documentation-first architecture baseline before implementation.

This baseline includes:

- an architecture index
- source document authority boundaries
- DeepBook Predict to RangePilot architecture map
- agent workflow guide
- skill usage guide
- implementation roadmap
- protocol integration notes
- this ADR
- root `CLAUDE.md` guidance

Generated docs must start with metadata identifying purpose, audience, status, and source-of-truth relationship. Unknown details must be marked `TBD`; chain/deployment or transaction-building details must be marked `MUST CONFIRM BEFORE CODING`.

Implementation should proceed only after reading the required docs for the task type and confirming protocol details from official repos, generated bindings, or chain state.

## Alternatives considered

### Direct code-first

Start building the app immediately and discover protocol details while coding.

- Pros: fastest path to visible UI.
- Cons: high risk of fake IDs, wrong Move signatures, custom pricing shortcuts, and protocol misunderstandings.
- Rejected because RangePilot's credibility depends on official DeepBook Predict behavior.

### One big spec

Combine all product, protocol, roadmap, and workflow guidance into a single large architecture document.

- Pros: one file to read.
- Cons: hard to maintain, hard for agents to target, likely to duplicate source docs, and easy to blur authority boundaries.
- Rejected because the project already has two distinct source-of-truth documents with different scopes.

### Documentation system with dual source docs

Keep the existing product source doc and protocol analysis as source-of-truth documents, then add small operational generated docs around them.

- Pros: preserves authority boundaries, avoids source doc rewrites, gives agents clear reading order and anti-invention rules.
- Cons: more files to maintain.
- Accepted because it best reduces protocol integration risk while supporting parallel product and engineering work.

## Consequences

Positive:

- Agents and developers have a clear reading order.
- Protocol assumptions are separated from confirmed facts.
- MVP scope is explicit: primary guided SUI range prediction, secondary creator strategy follow page, tertiary vault/LP dashboard.
- DeepBook Predict invariants are visible before coding.
- Chain/deployment unknowns are tracked rather than invented.

Negative:

- More documentation must be kept current.
- Contributors must spend time reading docs before implementation.
- Some implementation work may pause until official bindings or chain state confirm details.

## Follow-up requirements

- Keep generated docs concise and operational.
- Update `PROTOCOL_INTEGRATION_NOTES.md` after the protocol integration spike confirms concrete values.
- Create a new ADR for major decisions such as read model/indexer strategy, creator strategy storage, fee routing, or transaction builder architecture.
- Do not edit the source-of-truth docs unless explicitly requested.
- Do not add concrete chain details to docs without confirmation.
