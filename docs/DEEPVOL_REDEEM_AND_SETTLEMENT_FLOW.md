---
Purpose: Define DeepVol BTC MOVE post-buy redeem and settlement options after browser buy validation.
Audience: Product engineers, protocol integrators, frontend developers, and project planners.
Status: DeepVol-10 design; implementation pending DeepVol-11.
Source of truth relationship: Builds on browser buy validation, MoveReceipt architecture, DeepVol MVP scope, and DeepBook Predict integration notes; redeem entrypoints remain subject to source and runtime confirmation before coding.
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
- DeepVol-10 performs no redeem execution, settlement execution, withdrawal, publish, upgrade, or mainnet action.
- Predict binary redeem signatures, payout behavior, event parsing, and post-redeem readback must be source-confirmed and runtime-confirmed before coding.
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

## DeepVol-11: Browser Guided Redeem Preflight

DeepVol-11 should implement the first guided exit path without adding Profit Fee, custody, withdraw, mainnet, or automatic execution.

Implementation plan:

1. Locate and source-confirm Predict binary redeem entrypoints.
   - `predict::redeem<DUSDC>` and `predict::redeem_permissionless<DUSDC>` are known protocol concepts, but the exact browser PTB call shape is `MUST CONFIRM BEFORE CODING`.
   - Confirm required `MarketKey`, `PredictManager`, `Predict` object, oracle/expiry/strike, quantity, and signer constraints.

2. Confirm quote and payout preview semantics.
   - Reuse `packages/sdk/src/deepbookPredict/quote.ts` devInspect parsing patterns.
   - Confirm whether `predict::get_trade_amounts` provides the needed binary redeem payout estimate for UP and DOWN legs.
   - Mark market state and payout values `MUST CONFIRM AT RUNTIME`.

3. Build browser-safe position readback.
   - Reuse `packages/sdk/src/deepbookPredict/portfolio.ts` direct `predict_manager::position` patterns.
   - Read UP and DOWN position quantities before enabling redeem.
   - Read positions again after execution for user-visible reconciliation.

4. Build PTB helpers for redeem UP and DOWN.
   - Reuse safety patterns from `packages/sdk/src/deepbookPredict/trade.ts` range redeem helpers and preflight status classification.
   - Support one-leg and both-leg guided redeem if official entrypoints allow it.
   - Keep all builders Testnet/wallet gated.

5. Add browser preflight.
   - Use connected wallet sender.
   - Run quote/payout preview and full redeem `devInspect` before wallet review.
   - Keep wallet execution disabled if preflight is missing, stale, or failed.

6. Update Portfolio UI.
   - Add a selected-receipt detail path.
   - Show UP/DOWN quantities, payout estimate, preflight status, and explicit redeem CTA.
   - Explain non-custodial receipt semantics and local/indexer status limits.

7. Add post-execution reconciliation.
   - Parse official redeem events and payout amounts.
   - Show transaction digest.
   - Read positions before/after.
   - Mark local receipt status only after observed event/readback evidence.

8. Preserve non-actions.
   - No Profit Fee in MVP.
   - No protocol fee withdrawal.
   - No mainnet.
   - No automatic transaction execution.
   - No custody or escrow claim.

## Open confirmations before coding

| Topic | Status |
|---|---|
| Exact binary `predict::redeem<DUSDC>` PTB signature | MUST CONFIRM BEFORE CODING |
| Whether `predict::redeem_permissionless<DUSDC>` is appropriate for guided user redeem | MUST CONFIRM BEFORE CODING |
| Binary redeem event field shape | MUST CONFIRM BEFORE CODING |
| Binary payout estimate source and return shape | MUST CONFIRM BEFORE CODING |
| Claim/expiry-specific behavior for selected BTC markets | MUST CONFIRM AT RUNTIME |
| Wallet-wide receipt indexing strategy | TBD |
| Authoritative on-chain receipt settlement marker | TBD |
