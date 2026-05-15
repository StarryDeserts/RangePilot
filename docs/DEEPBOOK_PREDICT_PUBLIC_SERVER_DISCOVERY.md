---
Purpose: Record Phase 1A DeepBook Predict public server discovery results for RangePilot.
Audience: Protocol integrators, SDK implementers, frontend developers, reviewers, and AI agents.
Status: Generated documentation; Phase 1A Testnet discovery snapshot.
Source of truth relationship: Derived from live read-only public server requests; runtime market state must be reconfirmed before trading.
---

# DeepBook Predict Public Server Discovery

This document records a Testnet public server discovery snapshot for RangePilot Phase 1A. The public server is a read model only and is not a transaction write path.

## Request context

| Field | Value |
|---|---|
| Base URL | `https://predict-server.testnet.mystenlabs.com` |
| Predict object | `0xc8736204d12f0a7277c86388a68bf8a194b0a14c5538ad13f22cbd8e2a38028a` |
| Discovery scope | Read-only public server requests |
| Wallet transaction performed | No |

## Endpoints checked

| Endpoint | HTTP status | Key result |
|---|---:|---|
| `GET /status` | 200 | Server status returned `OK` with checkpoint/time lag fields. |
| `GET /predicts/:predict_id/state` | 200 | Predict state returned DUSDC in `quote_assets`; `pricing`, `risk`, and `trading_paused` were nullable. |
| `GET /predicts/:predict_id/oracles` | 200 | Returned 2310 oracle records: 2305 settled, 5 active. |
| `GET /predicts/:predict_id/quote-assets` | 200 | Returned DUSDC only. |
| `GET /predicts/:predict_id/vault/summary` | 200 | Returned vault balance/value/liquidity/supply/utilization fields. |
| `GET /oracles/:oracle_id/state` | 200 | Selected oracle returned active BTC state with latest price and SVI. |
| `GET /oracles/:oracle_id/ask-bounds` | 200 | Returned `null` for selected oracle. |
| `GET /oracles/:oracle_id/prices/latest` | 200 | Returned latest spot/forward event record. |
| `GET /oracles/:oracle_id/svi/latest` | 200 | Returned latest SVI event record. |
| `GET /trades/:oracle_id` | 200 | Returned an empty array for selected oracle. |

## Active oracle snapshot

| Oracle ID | Underlying | Expiry | Status |
|---|---|---:|---|
| `0x7f6af68a95f01b1c2153edcb7c96475935e8b2d796a8c04f32d57e5d0a83289d` | BTC | `1778918400000` | active |
| `0xe66aabab334efda1e9650d0ad26557bcfb28fa6012e267ec3bf7cdc71ff59084` | BTC | `1779004800000` | active |
| `0xc746336e790db7e93a34b684fa3768f43a7c3171d0262d0f2c71dc0a2ab5fe22` | BTC | `1779436800000` | active |
| `0x57ab16e132ef0083085d1bdef7ed820892a4d574155f47a3cba168dcb43deb79` | BTC | `1780041600000` | active |
| `0xb79524498a9947307e192d8045772150dc47aade4f9e09bd4b6fe3236b9e3125` | BTC | `1780646400000` | active |

## Default oracle candidate

The default candidate selected by nearest active expiry during planning was:

`0x7f6af68a95f01b1c2153edcb7c96475935e8b2d796a8c04f32d57e5d0a83289d`

This is a runtime snapshot only. Do not put it in permanent static config.

## Market and strike findings

- Active markets observed in the snapshot were BTC markets.
- No active SUI market was observed in the snapshot.
- Oracle records expose `min_strike` and `tick_size`.
- Treat `min_strike` and `tick_size` as discovered metadata, not full strike-grid validation.
- Full strike grid validation remains `MUST CONFIRM BEFORE CODING` for the trading UI.

## Ask bounds finding

- The ask-bounds endpoint exists and returned HTTP 200.
- The selected oracle returned `null` ask bounds.
- Usable ask bounds remain `MUST CONFIRM AT RUNTIME` and `MUST CONFIRM BEFORE CODING` for mint eligibility.

## Still pending

- Whether `min_strike` plus `tick_size` fully defines the valid strike grid.
- Non-null ask bounds behavior for other active markets or timing windows.
- Oracle freshness threshold for mint eligibility.
- Quote preview response or devInspect strategy.
- PredictManager discovery.
- Portfolio readback.
- Exact generated PTB binding shapes.
- First real `mint_range<DUSDC>` validation.
