---
Purpose: Guide skill selection for RangePilot agent tasks.
Audience: AI agents operating in Claude Code and reviewers checking workflow choices.
Status: Generated documentation; approved for current main branch.
Source of truth relationship: Records discovered local skill inventory for workflow use; does not define product or protocol facts.
---

# Skill Usage Guide

Use skills when they match the task. Skills do not override project source docs, protocol confirmation requirements, or user instructions.

## Priority rules

1. User instructions always win.
2. Root `CLAUDE.md` and workflow docs define project behavior.
3. Product/protocol source docs define architecture boundaries.
4. Skills provide execution patterns only.
5. If a skill suggests inventing protocol details, do not follow that part.

## Found skills

| Skill | Purpose | Trigger | Priority | Phase |
|---|---|---|---|---|
| `sui-dev-skills` | Full-stack Sui development routing skill | General Sui app, Move, SDK, or frontend work | High | 1-6 |
| `sui-dev-skills/sui-ts-sdk` | Sui TypeScript SDK usage | SDK reads/writes, client setup, transaction results | High | 1-4 |
| `sui-dev-skills/move` | Move smart contract guidance | Optional RangePilot Move layer or reading Move patterns | Medium | 1, 4-5 |
| `sui-dev-skills/sui-frontend` | Sui frontend dApp patterns | Wallet connection, dApp Kit, frontend protocol UX | High | 2-6 |
| `deepbook-trading` | DeepBook trading workflows | DeepBook protocol integration context | Medium | 1-4 |
| `deepbook-margin-trading-skill` | DeepBook margin trading context | Margin-specific DeepBook work | Low unless task explicitly involves margin | TBD |
| `sui-transaction-building` | Transaction construction | Building create/deposit/mint/redeem/supply/withdraw transactions | High | 1-4 |
| `sui-client` | Sui client reads and RPC | Direct object reads, checkpoints, events, RPC queries | High | 1-6 |
| `sui-bcs` | BCS serialization | Confirmed key/layout serialization work | High only after layout confirmed | 1-4 |
| `sui-keypair-cryptography` | Sui keypair and cryptography | Wallet/key handling, signing-related tasks | Medium | 1-6 |
| `cetus-aggregator` | Cetus aggregator ecosystem work | Swap/aggregator integration tasks | Low | Future only |
| `cetus-dlmm-interface` | Cetus DLMM integration | Cetus DLMM tasks | Low | Future only |
| `ferra-dlmm` | Ferra DLMM integration | Ferra liquidity tasks | Low | Future only |
| `claude-plugins-official/superpowers` | Planning, TDD, review, verification workflows | Multi-step implementation, review, verification | Medium | 0-6 |
| `addyosmani/agent-skills` | Planning, documentation, frontend, security, quality workflows | Agent workflow, docs, product engineering, review | Medium | 0-6 |
| Context7 plugin | Current library/framework documentation | Questions about current library APIs or SDK docs | High when external library docs are needed | 1-6 |

## Not found / unavailable items

| Item | Status | Implication |
|---|---|---|
| Project `.claude/skills/` | Not found in this round | No project-local custom skills were available to rely on |
| Root `CLAUDE.md` before this round | Not found before generation | This task creates the first root guidance file |
| Metadata for `intellectronica/agent-skills` | Not found | Do not cite or depend on it |
| Metadata for `obra/superpowers` | Not found | Do not cite or depend on it |
| Metadata for `RandyPen/sui-eco-skills` | Not found | Do not cite or depend on it |

## Phase-based recommendations

| Phase | Recommended skills | Notes |
|---|---|---|
| 0. Documentation and workflow setup | `agent-skills:documentation-and-adrs`, `superpowers:writing-plans` | Keep docs local, concise, and source-bounded |
| 1. Protocol integration spike | `sui-dev-skills`, `sui-transaction-building`, `sui-client`, `sui-bcs`, Context7 plugin | Confirm all transaction details before coding |
| 2. Guided range trading MVP | `sui-dev-skills/sui-frontend`, `sui-transaction-building`, `sui-client`, Context7 plugin | Preserve post-trade quote and `(lower, upper]` copy |
| 3. Portfolio and redeem/claim | `sui-client`, `sui-transaction-building`, `sui-bcs` | Direct object reads for wallet-critical state where possible |
| 4. Creator strategy pages | `sui-dev-skills/sui-frontend`, frontend/UI skills if available, `agent-skills:api-and-interface-design` | Keep strategy metadata off-chain unless confirmed otherwise |
| 5. Vault / LP dashboard | `sui-client`, `deepbook-trading`, `sui-dev-skills` | Do not reimplement vault risk; show only confirmed metrics |
| 6. Demo polish | `agent-skills:frontend-ui-engineering`, `agent-skills:shipping-and-launch`, verification skills | Use demo labels for unconfirmed or simulated values |

## Usage checklist

Before invoking a skill:

- Confirm the skill exists in the available skill list.
- Confirm it matches the task phase.
- Read required project docs first if the task touches DeepBook Predict.
- Record `TBD` / `MUST CONFIRM BEFORE CODING` details rather than resolving them by assumption.

After using a skill:

- Apply only the parts consistent with RangePilot docs.
- Do not let generic skill templates create fake IDs, URLs, signatures, or package names.
- Report which files changed and whether any uncertainty remains.
