---
Purpose: Track DeepBook Predict integration details that must be confirmed before coding.
Audience: Protocol integrators, transaction-builder authors, frontend developers, and AI agents.
Status: Generated documentation; approved for current main branch.
Source of truth relationship: Checklist derived from local source docs; concrete values must come from official repos, generated bindings, or chain state.
---

# Protocol Integration Notes

All concrete deployment and transaction-building details are currently unknown unless confirmed in code, generated bindings, official deployment data, or chain state.

## Need-to-confirm table

| Topic | Current value | Coding status | Confirmation source needed | Notes |
|---|---|---|---|---|
| Package IDs | TBD | MUST CONFIRM BEFORE CODING | Official deployment data, generated bindings, or chain state | Do not add fake package IDs. |
| Shared object IDs | TBD | MUST CONFIRM BEFORE CODING | Official deployment data or chain state | Includes `Predict` and any registry/config shared objects. |
| Quote asset coin type | TBD | MUST CONFIRM BEFORE CODING | Protocol config object reads, official deployment data, or generated bindings | Product examples mention quote deposits, but coin type is unconfirmed. |
| Quote asset decimals | TBD | MUST CONFIRM BEFORE CODING | Protocol config object reads or official deployment data | Do not assume a concrete deployed asset. |
| Oracle / market / expiry | TBD | MUST CONFIRM BEFORE CODING | Official read model/server, chain state, or deployment data | Primary MVP wants guided SUI range prediction, but active market values are unconfirmed. |
| PredictManager discovery | TBD | MUST CONFIRM BEFORE CODING | Official docs, generated bindings, object ownership pattern, or event schema | Must decide owner query, event lookup, registry, or local post-create storage. |
| Deposit method | TBD | MUST CONFIRM BEFORE CODING | Generated bindings or exact Move source version | Source docs mention `deposit<T>` but exact call path/signature is unconfirmed for target version. |
| `mint_range` params | TBD | MUST CONFIRM BEFORE CODING | Generated bindings or exact Move source version | Do not hand-write target string or params without confirmation. |
| `redeem_range` params | TBD | MUST CONFIRM BEFORE CODING | Generated bindings or exact Move source version | Need live redeem vs settled claim behavior confirmed. |
| Quote preview strategy | TBD | MUST CONFIRM BEFORE CODING | Official read/quote function, read server, generated bindings, or dry-run investigation | Must not implement custom pricing. |
| Portfolio read strategy | TBD | MUST CONFIRM BEFORE CODING | Direct object read layout, official read model/server, events/checkpoints | Wallet-critical state should prefer direct reads where practical. |
| Event fallback | TBD | MUST CONFIRM BEFORE CODING | Event schema from generated bindings or chain inspection | Useful for history and portfolio fallback. |
| Dry-run strategy | TBD | MUST CONFIRM BEFORE CODING | Sui client behavior, transaction builder bindings, official quote availability | Dry-run may help quote preview only if result shape is reliable. |
| Unknown blockers | TBD | MUST CONFIRM BEFORE CODING | Protocol integration spike | Track blockers as discovered; do not silently work around with invented values. |

## Write paths mentioned by source docs

These write paths are mentioned locally but exact signatures are unconfirmed:

| Write path | Product use | Status |
|---|---|---|
| `create_manager` | Create Predict Account | TBD / MUST CONFIRM BEFORE CODING |
| `deposit<T>` | Deposit quote asset into Predict Account | TBD / MUST CONFIRM BEFORE CODING |
| `mint` | Single-leg position, not primary MVP | TBD / MUST CONFIRM BEFORE CODING |
| `redeem` | Single-leg redeem, not primary MVP | TBD / MUST CONFIRM BEFORE CODING |
| `mint_range` | Primary guided range prediction | TBD / MUST CONFIRM BEFORE CODING |
| `redeem_range` | Portfolio close/claim path | TBD / MUST CONFIRM BEFORE CODING |
| `supply` | LP supply to vault | TBD / MUST CONFIRM BEFORE CODING |
| `withdraw` | LP withdraw from vault | TBD / MUST CONFIRM BEFORE CODING |

## Read surfaces

Use a layered read strategy, but confirm each concrete path before implementation.

| Read surface | Intended use | Status |
|---|---|---|
| Official read model/server, if available | Markets, expiries, summaries, quote/read data, history | URL and schema TBD / MUST CONFIRM BEFORE CODING |
| Sui events/checkpoints | History, portfolio fallback, creator stats, oracle freshness stream | Event schema TBD / MUST CONFIRM BEFORE CODING |
| Direct object reads | Wallet-critical state: Predict Account balance, positions, claimability | Layout/read pattern TBD / MUST CONFIRM BEFORE CODING |
| RangePilot cache/API | Product-friendly normalization, creator metadata, optional history cache | Internal design TBD after spike |

## Quote preview policy

Allowed:

- Use official quote/read function if available.
- Use official read model/server if it exposes quote data.
- Use dry-run of official transaction if validated and safe.
- Show quote unavailable with clear UX if no reliable official path exists.

Forbidden:

- Custom SVI pricing.
- Custom vault utilization pricing.
- Custom settlement calculation.
- Custom payout engine.

## Configuration policy

When confirmed, concrete values belong in configuration code or environment-specific config, not scattered across UI components or prose docs.

Keep these out of docs until confirmed and necessary:

- package IDs
- shared object IDs
- coin types
- oracle IDs
- market/expiry IDs or values
- official read server URL

## Integration spike exit report

When Phase 1 completes, update or append findings with:

- Confirmed config keys/locations and confirmation sources for package, object, and protocol values.
- Confirmed entrypoint binding/source references without copying full signatures unless explicitly needed.
- Confirmed read strategy and fallbacks.
- Confirmed quote preview strategy and confirmation method.
- Remaining blockers.
- Any ADR needed for architectural decisions.
