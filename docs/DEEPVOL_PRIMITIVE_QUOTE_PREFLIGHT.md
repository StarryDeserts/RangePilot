---
Purpose: Define the DeepVol-14 primitive quote and preflight UX contract for UP, DOWN, and RANGE.
Audience: Frontend developers, SDK implementers, product maintainers, reviewers, and AI agents.
Status: DeepVol-14 quote/preflight preview scope; primitive wallet execution remains disabled.
Source of truth relationship: Extends the DeepVol primitives/receipts, frontend MVP, protocol integration, and binary leg integration docs; on-chain protocol behavior remains authoritative.
---

# DeepVol Primitive Quote and Preflight

## Scope

DeepVol-14 advances UP, DOWN, and RANGE from static education cards to a preview-only primitive quote/preflight route under `apps/deepvol-web/`.

The route is diagnostic and educational:

```text
select primitive type
→ use the configured BTC MOVE VolSeries oracle/expiry
→ input strike or lower/upper range
→ input quantity
→ Refresh quote
→ show mint cost / redeem payout preview
→ Run preflight
→ show preflight diagnostics
→ keep real primitive Buy/Mint disabled
```

BTC MOVE remains the primary enabled DeepVol product. Direct primitive trades do not create DeepVol `MoveReceipt` objects, do not deposit a DeepVol Create Fee, and do not become the MVP monetization surface. Only `/buy/btc-move` creates a DeepVol receipt in this app.

## Product semantics

| Primitive | Meaning | Wins when | DeepVol-14 status |
|---|---|---|---|
| UP | Buy upside | BTC expires above the selected strike | Quote/preflight preview only |
| DOWN | Buy downside | BTC expires below the selected strike | Quote/preflight preview only |
| RANGE | Buy inside-range exposure | BTC expires inside the selected lower / upper range | Quote/preflight preview only |
| BTC MOVE | Buy movement | BTC expires below the lower strike or above the upper strike | Primary enabled receipt product |

DeepVol uses the configured BTC MOVE `VolSeries` as the known oracle/expiry context for primitive previews. Arbitrary oracle discovery and generic Predict trading are future work.

## Quote sources

UP and DOWN quote preview uses the official binary quote path:

```move
predict::get_trade_amounts(
    &Predict,
    &OracleSVI,
    MarketKey,
    quantity,
    &Clock,
): (u64, u64)
```

The browser calls the SDK `devInspectBinaryQuote` helper with `market_key::up` or `market_key::down` semantics, the selected strike, selected quantity, configured oracle, configured expiry, and DUSDC Testnet config.

RANGE quote preview uses the official range quote path:

```move
predict::get_range_trade_amounts(
    &Predict,
    &OracleSVI,
    RangeKey,
    quantity,
    &Clock,
): (u64, u64)
```

The browser calls the SDK `devInspectRangeQuote` helper with the selected lower/upper strikes, selected quantity, configured oracle, configured expiry, and DUSDC Testnet config.

Quote success is not mintability proof. Runtime market state, ask bounds, vault exposure, manager balance, oracle freshness, and preflight can still block.

## Preflight sources

UP and DOWN mint preflight builds `predict::mint<DUSDC>` with an internally constructed binary `MarketKey` and runs `devInspectTransactionBlock` only:

```move
predict::mint<DUSDC>(
    &mut Predict,
    &mut PredictManager,
    &OracleSVI,
    MarketKey,
    quantity,
    &Clock,
)
```

DeepVol-14 adds the SDK helper `devInspectMintBinaryPreflight(...)` for this purpose. The binary mint transaction builder remains internal and unexported; the browser route does not expose or import a real primitive execution path.

RANGE mint preflight reuses `devInspectMintRangePreflight(...)` and the official `predict::mint_range<DUSDC>` route for devInspect-only diagnostics.

All primitive preflight results are diagnostic. A passed preflight does not unlock primitive wallet execution in DeepVol-14.

## Blocker matrix

| Gate | Quote | Preflight | Execution |
|---|---:|---:|---:|
| Connected wallet | Required | Required | Permanently blocked |
| Sui Testnet | Required | Required | Permanently blocked |
| Configured VolSeries loaded | Required | Required | Permanently blocked |
| Active VolSeries | Required | Required | Permanently blocked |
| Valid quantity | Required | Required | Permanently blocked |
| Valid UP/DOWN strike | Required for UP/DOWN | Required for UP/DOWN | Permanently blocked |
| Valid RANGE lower/upper strikes | Required for RANGE | Required for RANGE | Permanently blocked |
| PredictManager ID | Not required | Required | Permanently blocked |
| Fresh quote | Not required | Required | Permanently blocked |
| Fresh preflight after dependency changes | Not required | Required for diagnostics | Permanently blocked |

Permanent execution blocker:

```text
Primitive wallet execution is disabled in DeepVol-14.
```

## Portfolio readback boundary

DeepVol-14 adds known-key primitive position readback groundwork. Portfolio can read configured UP, DOWN, and RANGE keys for a manually entered `PredictManager` ID when the wallet, Sui Testnet, and configured series are available.

This is not general indexing. The app must continue to say:

```text
Known selected key readback is supported first. General primitive position indexing is future work.
```

## Non-actions

DeepVol-14 does not:

- execute a real primitive mint;
- submit a primitive wallet transaction;
- create a DeepVol `MoveReceipt` from a direct primitive;
- charge a DeepVol Create Fee for direct primitive previews;
- modify Move contracts;
- publish or upgrade packages;
- withdraw protocol fees;
- use mainnet;
- read private keys, `.env.local`, `.trace/`, or `.traces/`;
- turn DeepVol into a generic Predict terminal.

## Verification

Before treating the primitive preview route as ready, run:

```bash
npm run typecheck:deepvol-web
npm run build:deepvol-web
npm run typecheck
npm run build:web
npm --workspace apps/deepvol-web run test:buy-gate
npm --workspace apps/deepvol-web run test:primitive-gates
npm --workspace apps/deepvol-web run test:primitive-quote-gates
```

Browser smoke must cover `/markets`, `/primitives?type=UP`, `/primitives?type=DOWN`, `/primitives?type=RANGE`, `/buy/btc-move`, and `/portfolio`. Confirm BTC MOVE remains featured, primitive quote/preflight controls render, direct primitive Buy/Mint remains disabled, Portfolio shows known-key readback or precise blockers, and no wallet prompt occurs from `/primitives`.
