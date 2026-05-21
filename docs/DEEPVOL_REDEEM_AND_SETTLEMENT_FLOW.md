---
Purpose: Define DeepVol BTC MOVE post-buy redeem and settlement options after browser buy validation.
Audience: Product engineers, protocol integrators, frontend developers, and project planners.
Status: Updated for DeepVol-11 source-confirmed binary redeem read/preflight; no real redeem executed.
Source of truth relationship: Builds on browser buy validation, MoveReceipt architecture, DeepVol MVP scope, DeepBook Predict source confirmation, and read/devInspect validation; on-chain state remains authoritative for runtime payout and redeemability.
---

# DeepVol Redeem and Settlement Flow

## Purpose

DeepVol BTC MOVE now has a validated browser wallet buy path. The next product question is how users exit, redeem, or settle the composed BTC MOVE exposure.

This document defines the post-buy state, analyzes three redeem/settlement models, recommends the MVP direction, and scopes the next implementation round.

## Design constraints

- The current `MoveReceipt` is non-custodial but protocol-enforced metadata.
- The underlying UP and DOWN binary positions remain in the user's DeepBook Predict `PredictManager`.
- `BTC MOVE = UP + DOWN.` The exit path must respect that the product is composed from two official DeepBook Predict binary legs.
- DeepVol Create Fee is validated on Sui Testnet; Profit Fee is not MVP-enforceable in the current non-custodial receipt model.
- DeepVol-11 performs no real redeem execution, settlement execution, withdrawal, publish, upgrade, or mainnet action.
- Predict binary redeem signatures, payout preview, event shape, and binary position readback are source-confirmed for the MVP guided path.
- Runtime payout values and redeemability must still be refreshed by read/preflight immediately before any future wallet prompt.
- Any receipt-settled marker is metadata unless it is reconciled with official Predict redeem events and `PredictManager` readback.

## Current post-buy state

After a successful browser `buy_move_receipt<DUSDC>`, these artifacts exist:

| Artifact | Current meaning |
|---|---|
| `MoveReceipt` object | DeepVol metadata and linkage for the composed BTC MOVE purchase. |
| UP binary position in `PredictManager` | User-owned official DeepBook Predict binary UP leg. |
| DOWN binary position in `PredictManager` | User-owned official DeepBook Predict binary DOWN leg. |
| `ProtocolVault<DUSDC>` fee balance | DeepVol Create Fee custody for protocol/admin withdrawal path, not user payout. |
| Browser `localStorage` receipt reference | Local UX record used by the current portfolio page. |
| Portfolio receipt display | Known receipt/readback presentation, not general wallet-wide receipt indexing. |

Missing capabilities:

| Missing capability | Why it matters |
|---|---|
| General receipt indexing | A new browser or device may not know every receipt owned by the wallet. |
| Redeem path | Users need a wallet-guided way to exit one or both legs. |
| Settlement path | The UI needs to explain expiry/claim states and post-redeem status. |
| Receipt status sync | Receipt status should not rely only on local UI state forever. |
| Payout / PnL display | Users need to understand received value, remaining exposure, and premium outcome. |
| Claim / expiry handling | Redeemability and payout can depend on DeepBook Predict market state. |

## Option A: Guided non-custodial redeem

The frontend builds a PTB that redeems UP and/or DOWN positions directly from the user's `PredictManager` through official DeepBook Predict entrypoints. The wallet owner signs the redeem transaction, and DeepVol provides guided quote, preflight, event parsing, and portfolio state updates.

Candidate UX:

```text
Portfolio
→ select MoveReceipt
→ show UP/DOWN positions
→ show current redeem quote estimate
→ Run redeem preflight
→ Redeem UP/DOWN through wallet
→ show digest
→ mark receipt locally as redeemed/settled
```

Pros:

- Fits the current non-custodial architecture.
- Requires less Move contract complexity.
- Easier MVP because DeepVol does not need to own or escrow the user's positions.
- Users keep direct control of positions in their `PredictManager`.
- Can reuse existing SDK patterns from range redeem helpers, quote/devInspect parsing, and direct position readback.

Cons:

- DeepVol cannot enforce Profit Fee in the MVP.
- Users can bypass DeepVol and redeem directly through official DeepBook Predict paths.
- Receipt settlement status may begin as local/indexer metadata rather than an authoritative on-chain payout proof.
- The frontend must carefully explain that the receipt does not custody the positions.

Option A is the recommended MVP path.

## Option B: DeepVol wrapper-mediated redeem

DeepVol could add a wrapper entrypoint such as `redeem_move_receipt<T>` that accepts the receipt context and internally calls DeepBook Predict redeem for the UP and DOWN legs.

Pros:

- Stronger DeepVol protocol semantics around receipt settlement.
- Could mark receipt settled in the same transaction that performs the guided redeem, if ownership and call rules allow it.
- Creates a cleaner future surface for protocol-level receipt lifecycle events.
- May provide a foundation for future Profit Fee semantics.

Cons:

- Requires new Move integration complexity and likely contract changes.
- Must confirm exact DeepBook Predict binary redeem signatures and ownership requirements.
- May still be limited by the fact that positions are inside the user's `PredictManager` and controlled by the manager owner.
- More risk for MVP because wrapper mediation can fail even when direct user redeem would work.

Option B is a V2 candidate after guided non-custodial redeem is validated.

## Option C: Future custodial / escrow receipt

DeepVol could evolve into a model where DeepVol custodies or manages the underlying positions, making `MoveReceipt` a stronger claim token that can potentially be settled, fee-enforced, or traded.

Pros:

- Strongest settlement semantics.
- Profit Fee can become enforceable at protocol level.
- The receipt may become more suitable for secondary-market or tradable-claim behavior.
- Payout and status accounting can be centralized around the receipt lifecycle.

Cons:

- Much more complex than the MVP.
- Introduces custody, escrow, and user-risk concerns.
- Requires significantly more protocol design and security review.
- Could undermine the simplicity of the validated non-custodial MVP.

Option C should remain V3/future research only if product demand for enforceable settlement, Profit Fee, or tradable receipts justifies the custody burden.

## Recommendation

```text
MVP: Option A guided non-custodial redeem.
V2: Option B wrapper-mediated redeem.
V3: Option C custodial/tradable receipt only if needed.
```

The MVP should prioritize user clarity and safe exit guidance over fee enforcement. The current product promise is that the user can trade movement, not direction, while keeping the underlying positions in their own `PredictManager`.

## MVP redeem UX

The recommended browser UX is:

```text
Portfolio
→ select MoveReceipt
→ show UP/DOWN positions
→ show current redeem quote estimate
→ Run redeem preflight
→ Redeem UP/DOWN through wallet
→ show digest
→ mark receipt locally as redeemed/settled
```

UX requirements:

- Show both UP and DOWN legs derived from the selected receipt's `VolSeries` and receipt fields.
- Read the user's current UP and DOWN quantities from `PredictManager` before enabling redeem.
- Let the user redeem one leg or both legs.
- Show that actual payout depends on DeepBook Predict pricing, vault state, market state, expiry, and settlement rules.
- Run explicit redeem quote/preflight before wallet review.
- Trigger real redeem only after an explicit user click and wallet approval.
- Display digest, event-derived payout, and before/after position readback after execution.
- Store local receipt status only after user-visible evidence.
- Label local receipt status as local/indexer-limited until a broader indexer exists.
- Do not imply that `MoveReceipt` itself owns, escrows, or automatically redeems the UP/DOWN positions.

“Mark receipt locally as redeemed/settled” is UX metadata in the MVP. It is not proof of payout unless reconciled with official DeepBook Predict redeem events and direct `PredictManager` readback.

## DeepVol-11: Source-confirmed browser guided redeem preflight

DeepVol-11 implements the first guided exit scaffold without adding Profit Fee, custody, withdraw, mainnet, or automatic execution.

Source-confirmed binary redeem path:

```move
public fun predict::redeem<Quote>(
    predict: &mut Predict,
    manager: &mut PredictManager,
    oracle: &OracleSVI,
    key: MarketKey,
    quantity: u64,
    clock: &Clock,
    ctx: &mut TxContext,
)
```

`predict::redeem<Quote>` is owner-mediated. It requires `ctx.sender() == manager.owner()`, decreases the selected binary position quantity from `PredictManager`, dispenses the official protocol payout, deposits payout into the same manager, and emits `PositionRedeemed`.

```move
public fun predict::redeem_permissionless<Quote>(
    predict: &mut Predict,
    manager: &mut PredictManager,
    oracle: &OracleSVI,
    key: MarketKey,
    quantity: u64,
    clock: &Clock,
    ctx: &mut TxContext,
)
```

`predict::redeem_permissionless<Quote>` requires `oracle.is_settled()`. It is a settled-oracle path and is not the MVP guided active redeem path.

Payout preview and readback:

- `predict::get_trade_amounts` returns `(mint_cost, redeem_payout)` for the binary `MarketKey` and quantity.
- `market_key::up(oracle_id, expiry, strike)` derives the UP key from the receipt oracle, expiry, and upper/up strike.
- `market_key::down(oracle_id, expiry, strike)` derives the DOWN key from the receipt oracle, expiry, and lower/down strike.
- `predict_manager::position(manager, key)` returns the current manager-level binary position quantity, or `0` if absent.

`PositionRedeemed` fields are source-confirmed as:

```move
public struct PositionRedeemed has copy, drop, store {
    predict_id: ID,
    manager_id: ID,
    owner: address,
    executor: address,
    quote_asset: TypeName,
    oracle_id: ID,
    expiry: u64,
    strike: u64,
    is_up: bool,
    quantity: u64,
    payout: u64,
    bid_price: u64,
    is_settled: bool,
}
```

Runtime behavior:

- Active/fresh quoteable oracles can produce redeem previews and pass owner-guided redeem preflight.
- Settled oracles can use the settled payout path when the vault has settled oracle state.
- Expired-but-unsettled/pending settlement, inactive, and stale active oracles are blockers.
- DeepVol-11 executed no real redeem; it only added read/devInspect helpers, a validation script, and disabled Portfolio UX scaffold.

DeepVol-11 known receipt validation is recorded in [DEEPVOL_REDEEM_PREFLIGHT_VALIDATION.md](./DEEPVOL_REDEEM_PREFLIGHT_VALIDATION.md). The read script observed current manager-level UP and DOWN quantities of `20000`, while the selected receipt quantity is `10000`; DeepVol therefore preflights the receipt-scoped quantity `min(manager position, receipt quantity)` and displays manager quantity separately. DevInspect redeem preflight passed for both receipt-scoped legs. Payout values are runtime-dependent and must be refreshed before any future wallet prompt.

## DeepVol-12 controlled browser redeem plan

DeepVol-12 should execute at most one controlled real Testnet browser redeem only after explicit approval and after all gates pass:

1. Read the selected `MoveReceipt`.
2. Derive UP/DOWN `MarketKey` values from receipt fields.
3. Read current UP/DOWN `PredictManager` position quantities.
4. Preview redeem payout through `predict::get_trade_amounts`.
5. Run explicit `predict::redeem<DUSDC>` devInspect preflight for the intended quantity.
6. Confirm manager DUSDC balance and position quantities before wallet prompt.
7. Prompt the browser wallet for one approved Testnet redeem.
8. Parse `PositionRedeemed`.
9. Reconcile payout, manager DUSDC balance delta, and position delta.
10. Only then update local receipt status, labeled as local/indexer-limited until general receipt indexing exists.

## Remaining confirmations

| Topic | Status |
|---|---|
| Exact binary `predict::redeem<DUSDC>` PTB signature | Source-confirmed and SDK preflight builder added for devInspect; real execution remains disabled pending DeepVol-12 approval. |
| Whether `predict::redeem_permissionless<DUSDC>` is appropriate for guided user redeem | Source-confirmed as settled-only; not the MVP guided active redeem path. |
| Binary redeem event field shape | Source-confirmed as `PositionRedeemed`; production browser reconciliation pending. |
| Binary payout estimate source and return shape | Source-confirmed as `predict::get_trade_amounts` returning `(mint_cost, redeem_payout)`; runtime values are `MUST CONFIRM AT RUNTIME`. |
| Claim/expiry-specific behavior for selected BTC markets | Source-confirmed behavior; selected market state remains `MUST CONFIRM AT RUNTIME`. |
| Wallet-wide receipt indexing strategy | TBD |
| Authoritative receipt settlement marker | TBD until `PositionRedeemed` event/readback reconciliation is implemented. |
